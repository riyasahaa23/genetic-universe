"""Synthetic ground truth is confined to tests; the integration test uses checked real GIAB data."""
import gzip
import itertools
import json
from collections import Counter
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.trio.attribution import counterfactual, evidence_graph, novelty_trace
from app.trio.ingestion import parse_gt, read_sample, sha256, verify_pedigree
from app.trio.inheritance import infer_variant
from app.trio.models import CounterfactualRequest, Family, Filters, Genotype, Region, SampleInput, PhaseEvidence
from app.trio.pipeline import FamilyStore
from app.trio.segments import build_segments

ROOT = Path(__file__).resolve().parents[2]


def gt(raw, sample, alleles=("G",), phased_set=None):
    parsed, phased = parse_gt(raw, "A", list(alleles))
    return Genotype(sample_id=sample, raw_gt=raw, alleles=parsed, phased=phased,
                    phase_set=phased_set, usable=len(parsed) == 2 and None not in parsed, status="validation")


def infer(a, b, c, position=100, phase_set=None):
    variant = infer_variant("1", position, "A", "G", gt(c, "C"), gt(a, "A", phased_set=phase_set),
                         gt(b, "B", phased_set=phase_set), "test-computation")
    for role, genotype in (("parent_A", variant.parent_a_genotype), ("parent_B", variant.parent_b_genotype)):
        if genotype.phased and genotype.phase_set and genotype.usable:
            variant.phase_evidence[role] = PhaseEvidence(sample_id=genotype.sample_id,
                raw_sample_id=genotype.sample_id, raw_gt=genotype.raw_gt, alleles=genotype.alleles,
                phase_set=genotype.phase_set, source_record=variant.id, source_artifact_id="validation-phase",
                method="synthetic_ground_truth", provenance=["test-computation", "validation-phase"])
    return variant


def structure(variants):
    return build_segments(variants, "test", Region(chromosome="1", start=1, end=1000),
                          {"parent_a": "A", "parent_b": "B", "child": "C"})


@pytest.mark.parametrize("raw,expected,phased", [
    ("0/1", ["A", "G"], False), ("1|2", ["G", "T"], True),
    ("./1", [None, "G"], False), (".", [None], False), ("0", ["A"], False)])
def test_genotype_parsing(raw, expected, phased):
    assert parse_gt(raw, "A", ["G", "T"]) == (expected, phased)


@pytest.mark.parametrize("raw", ["0/x", "0/3", "-1/0", "0|1/2", "", "0//1"])
def test_bad_genotypes_rejected(raw):
    with pytest.raises(ValueError):
        parse_gt(raw, "A", ["G", "T"])


@pytest.mark.parametrize("a,b,c,origin,status", [
    ("0/1", "0/0", "0/1", "parent_A", "unambiguous_alt_origin"),
    ("0/0", "0/1", "0/1", "parent_B", "unambiguous_alt_origin"),
    ("0/1", "0/1", "0/1", "both", "compatible_with_both"),
    ("0/1", "0/1", "1/1", "both", "inherited_from_both"),
    ("0/0", "0/0", "0/1", "de_novo_candidate", "mendelian_inconsistent_requires_validation"),
    ("1/1", "1/1", "0/1", "unknown", "mendelian_inconsistent"),
    ("./.", "0/0", "0/1", "unknown", "insufficient_or_filtered_genotypes"),
    ("0/1", "0/0", "./1", "unknown", "insufficient_or_filtered_genotypes")])
def test_origins(a, b, c, origin, status):
    result = infer(a, b, c)
    assert (result.origin, result.status) == (origin, status)
    assert result.confidence is None


def test_all_biallelic_transmissions_and_parent_swap():
    genotypes = ["0/0", "0/1", "1/1"]
    for a, b, c in itertools.product(genotypes, repeat=3):
        result = infer(a, b, c)
        pairs = [(x, y) for x in a.split("/") for y in b.split("/")
                 if sorted([x, y]) == sorted(c.split("/"))]
        assert bool(result.transmission_pairs) == bool(pairs)
        swapped = infer(b, a, c)
        assert swapped.origin == {"parent_A": "parent_B", "parent_B": "parent_A"}.get(result.origin, result.origin)


def test_multiallelic_alt_reordering():
    a = gt("0/2", "A", ("T", "G"))
    b = gt("0/2", "B", ("G", "T"))
    c = gt("1/2", "C", ("G", "T"))
    variant = infer_variant("1", 100, "A", "G", c, a, b, "test")
    assert variant.origin == "parent_A"
    assert variant.transmission_pairs == [["G", "T"]]


def test_segments_do_not_call_crossovers_from_parent_origin_changes():
    variants = [infer("0/1", "0/0", "0/1"), infer("0/0", "0/1", "0/1", 200)]
    markers, segments, events, _ = structure(variants)
    assert not events
    assert not segments
    assert len(markers) == 4
    assert all(s.start == s.end and s.kind == "point_marker" for s in markers)


def test_phased_switch_interval_and_phase_set_boundary():
    variants = [infer("0|1", "0/0", "0/1", 100, "block1"),
                infer("0|1", "0/0", "0/1", 200, "block1"),
                infer("1|0", "0/0", "0/1", 300, "block1"),
                infer("1|0", "0/0", "0/1", 400, "block1"),
                infer("0|1", "0/0", "0/1", 500, "block2"),
                infer("0|1", "0/0", "0/1", 600, "block2")]
    markers, segments, events, _ = structure(variants)
    assert len(events) == 1
    assert (events[0].start, events[0].end) == (200, 300)
    assert events[0].left_origin == "parent_A:homolog_1"
    assert events[0].right_origin == "parent_A:homolog_0"
    assert segments[0].start == 100 and segments[0].end == 200
    assert variants[2].recombination_event_ids == [events[0].id]


def test_phasing_without_ps_and_missing_transmission_cannot_bridge():
    variants = [infer("0|1", "0/0", "0/1", 100), infer("1|0", "0/0", "0/1", 200)]
    assert not structure(variants)[2]
    variants = [infer("0|1", "0/0", "0/1", 100, "1"),
                infer("./.", "0/0", "0/1", 150, "1"),
                infer("1|0", "0/0", "0/1", 200, "1")]
    assert not structure(variants)[2]


@pytest.fixture
def validation_data(tmp_path):
    root = tmp_path / "validation"
    (root / "metadata").mkdir(parents=True)
    path = root / "trio.vcf"
    path.write_text(
        "##fileformat=VCFv4.2\n"
        "##contig=<ID=chr1,length=1000000>\n"
        "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tA\tB\tC\n"
        "chr1\t100\t.\tA\tG\t50\tPASS\t.\tGT:GQ:DP\t0/1:40:20\t0/0:40:20\t0/1:40:20\n"
        "chr1\t200\t.\tA\tG,T\t50\tPASS\t.\tGT:GQ:DP\t0/1:40:20\t0/2:40:20\t1/2:40:20\n"
        "chr1\t300\t.\tA\tG\t50\tPASS\t.\tGT:GQ:DP\t./.:.:.\t0/0:40:20\t0/1:40:20\n"
        "chr1\t400\t.\tA\tG\t2\tPASS\t.\tGT:GQ:DP\t0/1:40:20\t0/0:40:20\t0/1:40:20\n"
        "chr1\t500\t.\tA\tG\t50\tPASS\t.\tGT:GQ:DP\t0/1:40:20\t0/0:40:20\t./1:40:20\n")
    ped = root / "trio.ped"
    ped.write_text("V C A B 0 -9\n")
    family = Family(family_id="V", dataset_kind="synthetic_validation", reference_build="GRCh38",
                    parent_a=SampleInput(sample_id="A", vcf="trio.vcf", sha256=sha256(path), source_url="validation-fixture"),
                    parent_b=SampleInput(sample_id="B", vcf="trio.vcf", sha256=sha256(path), source_url="validation-fixture"),
                    child=SampleInput(sample_id="C", vcf="trio.vcf", sha256=sha256(path), source_url="validation-fixture"),
                    pedigree="trio.ped", pedigree_sha256=sha256(ped), pedigree_source="validation-fixture",
                    regions=[Region(chromosome="1", start=1, end=1000)])
    (root / "metadata/V.family.json").write_text(family.model_dump_json())
    return root, family


def test_ingestion_filters_missing_and_child_state(validation_data):
    root, family = validation_data
    state = FamilyStore(root, allow_validation=True).state("V")
    assert len(state.variants) == 6
    assert Counter(v.origin for v in state.variants) == {"parent_A": 2, "parent_B": 1, "unknown": 3}
    assert state.phenotype_status == "phenotype_not_available" and not state.phenotype_available
    assert {w.code for w in state.warnings} >= {"MISSING_GT", "LOW_QUALITY"}
    assert all(v.provenance == [state.provenance.computation_id] for v in state.variants)
    verify_pedigree(family, root)


def test_sample_pedigree_integrity_and_production_guard(validation_data):
    root, family = validation_data
    with pytest.raises(ValueError, match="Synthetic"):
        FamilyStore(root).families()
    bad = family.parent_a.model_copy(update={"sample_id": "absent"})
    with pytest.raises(ValueError, match="missing or duplicated"):
        read_sample(bad, root, family.regions[0], family.filters)
    (root / "trio.vcf").write_text("changed")
    with pytest.raises(ValueError, match="checksum"):
        read_sample(family.child, root, family.regions[0], family.filters)
    (root / "trio.ped").write_text("V C A A 0 -9\n")
    with pytest.raises(ValueError, match="checksum"):
        verify_pedigree(family, root)
    family.pedigree_sha256 = sha256(root / "trio.ped")
    with pytest.raises(ValueError, match="PED"):
        verify_pedigree(family, root)


def test_gzip_vcf_and_region_bounds(validation_data):
    root, family = validation_data
    path = root / "trio.vcf.gz"
    path.write_bytes(gzip.compress((root / "trio.vcf").read_bytes()))
    sample = family.child.model_copy(update={"vcf": path.name, "sha256": sha256(path)})
    sites, _ = read_sample(sample, root, Region(chromosome="chr1", start=200, end=300), family.filters)
    assert set(key[1] for key in sites) == {200, 300}
    with pytest.raises(ValueError, match="outside"):
        FamilyStore(root, True).state("V", Region(chromosome="1", start=1000, end=1001))
    for region in ({"chromosome": "X", "start": 1, "end": 100},
                   {"chromosome": "1", "start": 2, "end": 1},
                   {"chromosome": "1", "start": 1, "end": 5_000_001}):
        with pytest.raises(ValidationError):
            Region(**region)


def test_trace_graph_and_immutable_intervention(validation_data):
    root, _ = validation_data
    state = FamilyStore(root, True).state("V")
    before = state.model_dump_json()
    trace = novelty_trace(state)
    assert trace.score is None and not trace.novelty_trace_ready
    assert trace.total_candidates == 1
    assert trace.ranked_candidates[0].configuration.variant_ids == ["1:200:A:G", "1:200:A:T"]
    request = CounterfactualRequest(family_id="V", intervention="REMOVE_VARIANT", target_id="1:200:A:G")
    result = counterfactual(state, request)
    assert (result.original_score, result.counterfactual_score, result.delta) == (None, None, None)
    changed_site = [v for v in result.counterfactual_state.variants if v.position == 200]
    assert all(v.child_genotype.alleles == ["A", "T"] for v in changed_site)
    assert {v.id: v.inherited_alt_copies for v in changed_site} == {"1:200:A:G": 0, "1:200:A:T": 1}
    assert state.model_dump_json() == before
    assert counterfactual(state, request) == result
    graph = evidence_graph(state)
    ids = {n.id for n in graph.nodes}
    assert all(e.source in ids and e.target in ids and e.provenance for e in graph.links)
    assert all(n.provenance for n in graph.nodes)
    assert all(n.type not in {"phenotype_evidence", "recombination_candidate"} for n in graph.nodes)


def test_api_and_errors(validation_data):
    root, _ = validation_data
    with TestClient(create_app(root, allow_validation=True)) as client:
        for url in ("/health", "/api/families", "/api/families/V", "/api/families/V/genome",
                    "/api/families/V/segments", "/api/families/V/recombination", "/api/families/V/child-state", "/api/evidence/V"):
            assert client.get(url).status_code == 200
        assert client.get("/api/families/absent").status_code == 404
        assert client.get("/api/families/V/genome?chromosome=1").status_code == 422
        assert client.get("/api/families/V/genome?chromosome=1&start=200&end=100").status_code == 422
        assert client.post("/api/novelty-trace", json={"family_id": "V"}).json()["score"] is None
        payload = {"family_id": "V", "intervention": "REMOVE_VARIANT", "target_id": "1:100:A:G"}
        assert client.post("/api/counterfactual", json=payload).json()["delta"] is None
        assert client.post("/api/counterfactual", json={**payload, "target_id": "absent"}).status_code == 404
        assert client.post("/api/counterfactual", json={**payload, "intervention": "BREAK_INTERACTION"}).status_code == 422
        # The canonical app serves the legacy experiment adapter and the
        # real-trio adapter together. The extracted real-only app returned
        # 404 here, but that assertion is intentionally obsolete after the
        # single-runtime migration.
        assert client.post("/api/experiments/demo/run").status_code == 200
        assert client.get("/openapi.json").json()["paths"]["/api/counterfactual"]["post"]["responses"]["200"]["content"]["application/json"]["schema"]["$ref"].endswith("CounterfactualResult")


def test_real_giab_vertical_slice():
    store = FamilyStore(ROOT / "data")
    state = store.state("GIAB_AJ")
    assert state.samples == {"parent_a": "HG003", "parent_b": "HG004", "child": "HG002"}
    assert len(state.variants) == 347
    assert state.provenance.dataset_kind == "real"
    assert not state.phenotype_evidence
    assert not state.recombination_events
    trace = novelty_trace(state)
    assert trace.total_candidates == 22 and trace.score is None
    assert len(state.markers) == 610 and len(state.segments) == 2
    assert state.phenotype_available and len(state.phenotype_observations) == 2
    cf = counterfactual(state, CounterfactualRequest(family_id="GIAB_AJ", intervention="REPLACE_WITH_PARENTAL_GENOTYPE", target_id=trace.ranked_candidates[0].configuration.variant_ids[0]))
    assert cf.counterfactual_score is None and cf.delta is None
    assert len(cf.counterfactual_state.configurations) == 21
    assert state.model_dump() == store.state("GIAB_AJ").model_dump()
    with TestClient(create_app(ROOT / "data")) as client:
        assert client.get("/api/families/GIAB_AJ/child-state").json() == state.model_dump(mode="json")


def test_default_app_finds_real_data_from_another_working_directory(monkeypatch, tmp_path):
    monkeypatch.delenv("GENETIC_DATA_ROOT", raising=False)
    monkeypatch.chdir(tmp_path)
    with TestClient(create_app()) as client:
        response = client.get("/api/families/GIAB_AJ/child-state")
        assert response.status_code == 200
        assert len(response.json()["variants"]) == 347
