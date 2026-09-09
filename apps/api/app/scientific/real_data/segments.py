"""Separate point markers from source-supported parental haplotype spans."""
from .models import Marker, RecombinationEvent, Region, Segment, SwitchMarkerEvidence, UnresolvedRegion, Variant
from .switch_rules import partition_runs, rejection_reasons


def build_segments(variants: list[Variant], computation_id: str, region: Region, samples: dict[str, str], sources=None):
    """Infer same-PS runs from informative parental heterozygotes only.

    Homozygotes supply transmission markers but no homolog information. Spans
    interpolate between informative markers with <=50 kb gaps; they do not prove
    absence of unobserved crossovers. Switch candidates need >=2 markers per flank.
    """
    markers, blocks, events, unresolved = [], [], [], []
    loci = {}
    for variant in sorted(variants, key=lambda v: (v.chromosome, v.position, v.id)):
        variant.marker_ids, variant.segment_ids, variant.recombination_event_ids = [], [], []
        loci.setdefault((variant.chromosome, variant.position, variant.reference), []).append(variant)
    for index, role in enumerate(("parent_A", "parent_B")):
        parent_sample = samples["parent_a" if index == 0 else "parent_b"]
        informative = []
        for siblings in loci.values():
            variant = siblings[0]
            if not variant.transmission_pairs:
                continue
            transmitted = {pair[index] for pair in variant.transmission_pairs}
            if len(transmitted) != 1:
                continue
            phase = variant.phase_evidence.get(role)
            original = variant.parent_a_genotype if index == 0 else variant.parent_b_genotype
            if phase and (not original.usable or not phase.phase_set or "|" not in phase.raw_gt
                          or sorted(phase.alleles) != sorted(original.alleles)):
                phase = None
            homolog = phase.alleles.index(next(iter(transmitted))) if phase and len(set(phase.alleles)) == 2 else None
            source_ids = [phase.source_artifact_id] if phase else []
            marker = Marker(id=f"marker:{role}:{variant.id}", chromosome=variant.chromosome,
                start=variant.position, end=variant.position, origin=role, parent_sample=parent_sample,
                homolog=homolog, phase_set=phase.phase_set if homolog is not None else None,
                status="phased_informative_marker" if homolog is not None else "unphased_marker_only",
                variant_ids=[v.id for v in siblings], provenance=[computation_id, *source_ids])
            markers.append(marker)
            for sibling in siblings:
                sibling.marker_ids.append(marker.id)
            if homolog is not None:
                informative.append((marker, phase))
        runs = partition_runs(informative, point=lambda item: item[0])
        parent_blocks = []
        for run in runs:
            if len(run) < 2:
                continue
            first, last = run[0][0], run[-1][0]
            block = Segment(id=f"block:{role}:{first.phase_set}:{first.start}-{last.end}", chromosome=region.chromosome,
                start=first.start, end=last.end, origin=role, parent_sample=parent_sample,
                homolog=first.homolog, phase_set=first.phase_set,
                marker_variant_ids=[m.variant_ids[0] for m, _ in run],
                variant_ids=[v.id for v in variants if first.start <= v.position <= last.end and v.transmission_pairs],
                source_artifact_ids=sorted({p.source_artifact_id for _, p in run}),
                provenance=[computation_id, *sorted({p.source_artifact_id for _, p in run})])
            blocks.append(block)
            parent_blocks.append(block)
        # Only adjacent supported runs may delimit a candidate. Do not bridge a
        # discarded singleton switch or reset of the source phase set.
        for left_run, right_run in zip(runs, runs[1:]):
            if rejection_reasons(left_run, right_run, point=lambda item: item[0]):
                continue
            left, right = left_run[-1][0], right_run[0][0]
            phase_sources = sorted({p.source_artifact_id for _, p in left_run + right_run})
            by_id = {v.id: v for v in variants}
            def flank(marker):
                variant = by_id[marker.variant_ids[0]]
                return SwitchMarkerEvidence(variant_id=variant.id, chromosome=variant.chromosome,
                    position=variant.position, genotypes={g.sample_id: g for g in
                        (variant.parent_a_genotype, variant.parent_b_genotype, variant.child_genotype)},
                    parental_phase=variant.phase_evidence[role], child_phase=variant.phase_evidence.get("child"),
                    parent_sample=parent_sample, transmitted_allele=variant.transmission_pairs[0][index],
                    transmitted_homolog=marker.homolog, evidence_status="hypothesis" if variant.evidence_status == "hypothesis" else "inferred",
                    provenance=[computation_id, *phase_sources])
            event = RecombinationEvent(id=f"switch:{region.chromosome}:{parent_sample}:{left.end}-{right.start}", chromosome=region.chromosome,
                start=left.end, end=right.start, parent_sample=parent_sample,
                left_origin=f"{role}:homolog_{left.homolog}", right_origin=f"{role}:homolog_{right.homolog}",
                left_homolog=left.homolog, right_homolog=right.homolog, phase_set=left.phase_set,
                left_marker_ids=[m.variant_ids[0] for m, _ in left_run],
                right_marker_ids=[m.variant_ids[0] for m, _ in right_run], source_artifact_ids=phase_sources,
                left_flanking_markers=[flank(m) for m, _ in left_run[-2:]],
                right_flanking_markers=[flank(m) for m, _ in right_run[:2]], sources=sources or [],
                provenance=[computation_id, *phase_sources, left.id, right.id])
            events.append(event)
        cursor = region.start
        for block in sorted(parent_blocks, key=lambda b: b.start):
            if cursor < block.start:
                unresolved.append(UnresolvedRegion(chromosome=region.chromosome, start=cursor, end=block.start-1,
                    parent_sample=parent_sample, reason="No supported multi-marker homolog span", provenance=[computation_id]))
            cursor = block.end + 1
        if cursor <= region.end:
            unresolved.append(UnresolvedRegion(chromosome=region.chromosome, start=cursor, end=region.end,
                parent_sample=parent_sample, reason="No supported multi-marker homolog span", provenance=[computation_id]))
    for variant in variants:
        variant.segment_ids = [b.id for b in blocks if variant.id in b.variant_ids]
        variant.recombination_event_ids = [e.id for e in events if e.start <= variant.position <= e.end]
    return markers, blocks, events, unresolved
