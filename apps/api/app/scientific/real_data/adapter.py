"""Bridge prepared phased trio data into the common run contract.

The real-data path deliberately reuses the transport-free synthetic phenotype
and attribution interfaces after converting observed VCF evidence into an
internal, numeric representation. This is a method-validation mode:
genotypes, pedigree and phase are observed inputs; the phenotype is explicit
synthetic data and is disclosed as such in every snapshot.
"""

from __future__ import annotations

import re
from pathlib import Path

from app.schemas.common import BreakpointConfidence, DataDisclosure, SourceArtifactReference
from app.schemas.run import CreateRunRequest
from app.scientific.synthetic.phenotype import EpistaticPair, PhenotypeConfig, PhenotypeEngine
from app.scientific.synthetic.recombination import (
    Gamete,
    Locus,
    OffspringGenome,
    ParentGenome,
    SegmentProvenance,
    fertilize,
)
from app.scientific.synthetic.runner import SyntheticExecution

from .ingestion import RealDataUnavailableError
from .models import ChildState, Family, Region, Variant
from .pipeline import FamilyStore


class RealDataConfigurationError(ValueError):
    """Raised when a prepared real-data request is invalid."""


def available_families(data_root: Path) -> list[Family]:
    """List prepared family manifests without touching VCF payloads."""

    try:
        families = FamilyStore(data_root).families()
        if not families:
            raise RealDataUnavailableError("No prepared real-data manifest is available")
        return families
    except FileNotFoundError as exc:
        raise RealDataUnavailableError("No prepared real-data manifest is available") from exc
    except ValueError as exc:
        raise RealDataConfigurationError("A prepared real-data manifest is invalid") from exc


def _selected_family(request: CreateRunRequest, families: list[Family]) -> Family:
    family_id = request.options.family_id
    if family_id:
        matches = [family for family in families if family.family_id == family_id]
    elif any(family.family_id == request.dataset_id for family in families):
        matches = [family for family in families if family.family_id == request.dataset_id]
    else:
        # The dataset ID is a logical collection ID. A prepared collection may
        # contain multiple families; the first deterministic manifest is the
        # default while callers can select an explicit family_id.
        matches = families
    if not matches:
        raise RealDataConfigurationError("The requested prepared trio was not found")
    return sorted(matches, key=lambda family: family.family_id)[0]


def _requested_region(request: CreateRunRequest, family: Family) -> Region:
    if request.options.region_chromosome is None:
        return family.regions[0]
    assert request.options.region_start is not None
    assert request.options.region_end is not None
    return Region(
        chromosome=request.options.region_chromosome,
        start=request.options.region_start,
        end=request.options.region_end,
    )


def _binary_allele(value: str | None, alternate: str) -> int:
    return int(value == alternate)


def _usable_variant(variant: Variant) -> bool:
    return (
        variant.child_genotype.usable
        and variant.parent_a_genotype.usable
        and variant.parent_b_genotype.usable
        and len(variant.transmission_pairs) > 0
    )


def _transmitted_alleles(variant: Variant) -> tuple[str, str] | None:
    if not variant.transmission_pairs:
        return None
    pair = variant.transmission_pairs[0]
    if len(pair) != 2:
        return None
    return pair[0], pair[1]


def _homolog_for(variant: Variant, role: str, transmitted: str) -> str:
    evidence = variant.phase_evidence.get(role)
    prefix = "A" if role == "parent_A" else "B"
    if evidence and transmitted in evidence.alleles:
        # Phase labels are local to the source VCF. They are used as source
        # homolog identifiers, not as grandparent identities.
        return f"{prefix}{evidence.alleles.index(transmitted) + 1}"
    return f"{prefix}1"


def _make_segments(parent_id: str, homologs: list[str]) -> tuple[list[SegmentProvenance], list[int]]:
    if not homologs:
        raise RealDataConfigurationError("No transmitted loci are available for the prepared trio")
    segments: list[SegmentProvenance] = []
    crossovers: list[int] = []
    start = 0
    current = homologs[0]
    for index, homolog in enumerate(homologs[1:], start=1):
        if homolog == current:
            continue
        segments.append(SegmentProvenance(start=start, end=index, source_homolog=current, parent_id=parent_id))
        crossovers.append(index)
        start = index
        current = homolog
    segments.append(SegmentProvenance(start=start, end=len(homologs), source_homolog=current, parent_id=parent_id))
    return segments, crossovers


def _build_internal_state(state: ChildState) -> tuple[list[Locus], ParentGenome, ParentGenome, Gamete, Gamete, OffspringGenome, list[str]]:
    usable = sorted((variant for variant in state.variants if _usable_variant(variant)), key=lambda item: (item.position, item.id))
    if not usable:
        raise RealDataConfigurationError("The prepared region has no Mendelian-compatible, usable child variants")

    loci: list[Locus] = []
    parent_a_h1: list[int] = []
    parent_a_h2: list[int] = []
    parent_b_h1: list[int] = []
    parent_b_h2: list[int] = []
    gamete_a_alleles: list[int] = []
    gamete_b_alleles: list[int] = []
    homologs_a: list[str] = []
    homologs_b: list[str] = []
    source_ids: list[str] = []

    for index, variant in enumerate(usable, start=1):
        pair = _transmitted_alleles(variant)
        assert pair is not None
        source_ids.append(variant.id)
        loci.append(Locus(id=f"L{index:02d}", position=variant.position, chromosome=f"chr{variant.chromosome}"))
        parent_a_h1.append(_binary_allele(variant.parent_a_genotype.alleles[0], variant.alternate))
        parent_a_h2.append(_binary_allele(variant.parent_a_genotype.alleles[1], variant.alternate))
        parent_b_h1.append(_binary_allele(variant.parent_b_genotype.alleles[0], variant.alternate))
        parent_b_h2.append(_binary_allele(variant.parent_b_genotype.alleles[1], variant.alternate))
        gamete_a_alleles.append(_binary_allele(pair[0], variant.alternate))
        gamete_b_alleles.append(_binary_allele(pair[1], variant.alternate))
        homologs_a.append(_homolog_for(variant, "parent_A", pair[0]))
        homologs_b.append(_homolog_for(variant, "parent_B", pair[1]))

    parent_a = ParentGenome("A", parent_a_h1, parent_a_h2, loci)
    parent_b = ParentGenome("B", parent_b_h1, parent_b_h2, loci)
    segments_a, crossovers_a = _make_segments("A", homologs_a)
    segments_b, crossovers_b = _make_segments("B", homologs_b)
    gamete_a = Gamete("A", gamete_a_alleles, crossovers_a, segments_a)
    gamete_b = Gamete("B", gamete_b_alleles, crossovers_b, segments_b)
    offspring = fertilize(gamete_a, gamete_b, loci, offspring_id=state.child_id)
    return loci, parent_a, parent_b, gamete_a, gamete_b, offspring, source_ids


def _phenotype_config(request: CreateRunRequest, locus_count: int) -> PhenotypeConfig:
    # These coefficients are intentionally declared here as a synthetic model
    # for real-genome method validation. They do not represent a human trait.
    additive = {f"L{index:02d}": 1.0 for index in range(1, min(locus_count, 6) + 1)}
    pairs: list[EpistaticPair] = []
    if locus_count >= 2:
        pairs.append(EpistaticPair(
            id="real_synthetic_L01_L02",
            locus_a="L01",
            locus_b="L02",
            locus_a_pos=1,
            locus_b_pos=2,
            coefficient=2.0,
            description="Synthetic validation interaction over the first two usable loci",
        ))
    return PhenotypeConfig(
        model_id=request.phenotype_model_id,
        model_version="real-trio-synthetic-phenotype@1.0.0",
        disclosure="Synthetic phenotype applied to real phased genotypes for method validation; no clinical phenotype is inferred.",
        additive=additive,
        epistasis=pairs,
        mode="diploid",
        noise_sigma=0.0,
    )


def _crossover_coordinates(state: ChildState, parent_key: str, gamete: Gamete, loci: list[Locus]) -> list[tuple[int, int, int]]:
    """Map internal transition indexes to marker-bounded genomic intervals."""

    sample_id = state.samples[parent_key]
    events = sorted(
        (event for event in state.recombination_events if event.parent_sample == sample_id),
        key=lambda event: (event.start, event.end, event.id),
    )
    coordinates: list[tuple[int, int, int]] = []
    for boundary in gamete.crossovers:
        left_position = loci[max(0, boundary - 1)].position
        right_position = loci[min(len(loci) - 1, boundary)].position
        event = next(
            (
                candidate
                for candidate in events
                if candidate.start <= right_position and candidate.end >= left_position
            ),
            None,
        )
        if event is None:
            coordinates.append((right_position, left_position, right_position))
        else:
            coordinates.append(((event.start + event.end) // 2, event.start, event.end))
    return coordinates


def _source_artifacts(state: ChildState) -> list[SourceArtifactReference]:
    result: list[SourceArtifactReference] = []
    seen: set[tuple[str, str]] = set()
    for index, item in enumerate(state.provenance.inputs):
        if not isinstance(item, dict):
            continue
        checksum = item.get("sha256")
        if not isinstance(checksum, str) or not re.fullmatch(r"[a-f0-9]{64}", checksum):
            continue
        source = item.get("source_url") or item.get("source") or "local://prepared-artifact"
        sample_id = item.get("sample_id")
        role = f"sample:{sample_id}" if sample_id else "metadata"
        key = (role, checksum)
        if key in seen:
            continue
        seen.add(key)
        result.append(SourceArtifactReference(
            artifact_id=f"input_{index:03d}",
            sha256=checksum,
            source_url=str(source),
            role=role,
            reference_build=state.reference_build,
        ))
    return result


def execute_real(request: CreateRunRequest, data_root: Path) -> SyntheticExecution:
    families = available_families(data_root)
    family = _selected_family(request, families)
    region = _requested_region(request, family)
    try:
        state = FamilyStore(data_root).state(family.family_id, region)
    except FileNotFoundError as exc:
        raise RealDataUnavailableError("Prepared real-data inputs are unavailable") from exc
    except ValueError as exc:
        raise RealDataConfigurationError("The prepared trio or requested region is invalid") from exc

    loci, parent_a, parent_b, gamete_a, gamete_b, offspring, source_ids = _build_internal_state(state)
    config = _phenotype_config(request, len(loci))
    engine = PhenotypeEngine(config)
    # NoveltyTracer only consumes observable internal states and never reads
    # the planted config to generate candidates.
    from app.scientific.synthetic.attribution import NoveltyTracer

    tracer = NoveltyTracer(parent_a, parent_b, offspring, engine, candidate_limit=request.options.max_candidates)
    ranked = tracer.rank_candidates()
    warnings = sorted({warning.message for warning in state.warnings})
    disclosure = DataDisclosure(
        dataset_kind="real_trio_synthetic_phenotype",
        genotype_source="Observed phased public trio genotypes and pedigree, checksum verified.",
        phenotype_source=config.disclosure,
        causal_interpretation="Attribution is computational evidence relative to the synthetic phenotype model; it is not biological causality.",
    )
    synthetic_request = request.model_copy(update={"dataset_id": family.family_id})
    return SyntheticExecution(
        request=synthetic_request,
        loci=loci,
        parent_a=parent_a,
        parent_b=parent_b,
        gamete_a=gamete_a,
        gamete_b=gamete_b,
        offspring=offspring,
        phenotype_config=config,
        phenotype_engine=engine,
        tracer=tracer,
        ranked_results=ranked,
        locus_source_ids=source_ids,
        source_artifacts=_source_artifacts(state),
        warnings=warnings,
        data_disclosure=disclosure,
        crossover_confidence=BreakpointConfidence.INFERRED_INTERVAL,
        crossover_coordinates_a=_crossover_coordinates(state, "parent_a", gamete_a, loci),
        crossover_coordinates_b=_crossover_coordinates(state, "parent_b", gamete_b, loci),
    )
