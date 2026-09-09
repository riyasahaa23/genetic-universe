"""Scientific claim guards, source linkage, and transformations on real GIAB evidence."""
import json
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.trio.attribution import counterfactual, evidence_graph, novelty_trace, scientific_audit
from app.trio.evidence_inputs import attach_reference_knowledge, phenotype_observations, verified_artifacts
from app.trio.models import CounterfactualRequest, Marker, RecombinationEvent, Region, Segment
from app.trio.pipeline import FamilyStore

DATA = Path(__file__).resolve().parents[2] / "data"


@pytest.fixture(scope="module")
def real_state():
    return FamilyStore(DATA).state("GIAB_AJ")


def test_real_marker_and_block_types_cannot_be_confused(real_state):
    assert len(real_state.markers) == 610
    assert all(m.kind == "point_marker" and m.start == m.end for m in real_state.markers)
    assert len(real_state.segments) == 2
    assert [(b.start, b.end, b.homolog, len(b.marker_variant_ids)) for b in real_state.segments] == [
        (813885, 967865, 1, 37), (814033, 995634, 0, 135)]
    assert all(b.kind == "inferred_haplotype_block" and b.evidence_status == "inferred" for b in real_state.segments)
    bad_block = real_state.segments[0].model_dump()
    bad_block["end"] = bad_block["start"]
    with pytest.raises(ValidationError):
        Segment(**bad_block)
    bad_marker = real_state.markers[0].model_dump()
    bad_marker["end"] += 1
    with pytest.raises(ValidationError):
        Marker(**bad_marker)


@pytest.mark.parametrize("bad_field,bad_value", [
    ("end", 100), ("right_homolog", 0), ("left_marker_ids", ["m1"]),
    ("right_marker_ids", ["m3", "m3"]), ("source_artifact_ids", []),
    ("right_marker_ids", ["m2", "m3"]),
    ("evidence_status", "observed"), ("provenance", [])])
def test_unsupported_crossover_claims_rejected(bad_field, bad_value):
    # Synthetic model-validation fixture; no event is attached to the real family.
    event = dict(id="validation", chromosome="1", start=100, end=200, parent_sample="P",
        left_origin="parent_A:homolog_0", right_origin="parent_A:homolog_1", phase_set="PS1",
        left_homolog=0, right_homolog=1, left_marker_ids=["m1", "m2"], right_marker_ids=["m3", "m4"],
        source_artifact_ids=["validation-source"], provenance=["validation-computation"])
    with pytest.raises(ValidationError):
        RecombinationEvent(**{**event, bad_field: bad_value})


def test_real_phase_concordance_and_conflicts(real_state):
    config = next(v for v in real_state.variants if v.id == "1:814309:T:G")
    assert config.child_genotype.raw_gt == "1/1"
    assert config.parent_a_genotype.raw_gt == "0/1"  # benchmark call preserved
    assert config.phase_evidence["parent_A"].raw_gt == "0|1"
    assert config.phase_evidence["parent_A"].raw_sample_id == "63048"
    assert config.phase_evidence["parent_B"].raw_gt == "1|0"
    assert config.phase_evidence["parent_B"].raw_sample_id == "63049"
    conflicts = [w for w in real_state.warnings if w.code == "PHASE_GENOTYPE_CONFLICT"]
    assert len(conflicts) == 2
    for warning in conflicts:
        role = "parent_A" if warning.sample_id == "HG003" else "parent_B"
        chrom, pos, ref, alt = warning.record.split(":")
        matches = [v for v in real_state.variants if v.position == int(pos) and v.reference == ref]
        assert all(role not in v.phase_evidence for v in matches)


def test_all_22_real_configurations_are_segregation_not_phenotype_claims(real_state):
    assert len(real_state.configurations) == 22
    for config in real_state.configurations:
        assert sorted(config.child_genotype) != sorted(config.parent_a_genotype)
        assert sorted(config.child_genotype) != sorted(config.parent_b_genotype)
        assert config.classification == "ordinary_mendelian_combination"
        assert config.mendelian_compatible
        assert config.parental_homologs == {"parent_A": 1, "parent_B": 0}
        assert len(config.block_ids) == 2
        assert config.recombination_generated is None and config.novel_phenotype is None
        assert config.phenotype_link_status == "unresolved"
        assert config.reference_evidence
        assert all(e["match_status"] == "no_exact_allele_record_in_bounded_snapshot" for e in config.reference_evidence)
        assert all(e["scope"] == "external_variant_knowledge_not_subject_observation" for e in config.reference_evidence)


def test_clinvar_lookup_does_not_claim_absence_outside_snapshot(real_state):
    family = FamilyStore(DATA).family("GIAB_AJ")
    variant = real_state.variants[0].model_copy(deep=True)
    variant.position = 2_000_000
    variant.id = f"1:{variant.position}:{variant.reference}:{variant.alternate}"
    attach_reference_knowledge([variant], family, DATA, "validation")
    assert variant.reference_evidence[0]["evidence_status"] == "unresolved"
    assert variant.reference_evidence[0]["match_status"] == "unresolved_outside_declared_snapshot_coverage"
    source = next(a for a in family.evidence_artifacts if a.id == "annotation:ClinVar:region")
    source.reference_build = "GRCh37"
    with pytest.raises(ValueError, match="reference build"):
        attach_reference_knowledge([variant], family, DATA, "validation")


def test_matched_phenotypes_do_not_enable_prediction(real_state):
    assert real_state.phenotype_status == "phenotype_available"
    assert {(p.sample_id, p.external_individual_id, p.hpo_id) for p in real_state.phenotype_observations} == {
        ("HG002", "NA24385", "HP:0002077"), ("HG002", "NA24385", "HP:0001028")}
    audit = scientific_audit(real_state)
    assert audit.real_data and audit.phenotype_available
    assert audit.resolved_crossover_events == audit.inferred_crossover_events == 0
    assert audit.unresolved_regions == 4
    assert not audit.novelty_trace_ready and not audit.counterfactual_ready and not audit.causal_claim_supported
    trace = novelty_trace(real_state)
    assert trace.score is None and trace.score_model is None
    assert "total_score" not in trace.model_dump()
    assert all(c.phenotype_score is None and c.missing_links for c in trace.ranked_candidates)


def test_unrelated_individual_and_unbacked_hpo_are_rejected():
    family = FamilyStore(DATA).family("GIAB_AJ")
    other = family.model_copy(deep=True)
    other.phenotype_observations[0].sample_id = "HG004"
    with pytest.raises(ValueError, match="different individual"):
        phenotype_observations(other, DATA)
    other = family.model_copy(deep=True)
    other.phenotype_observations[0].external_individual_id = "unrelated"
    with pytest.raises(ValueError, match="linkage"):
        phenotype_observations(other, DATA)
    other = family.model_copy(deep=True)
    other.phenotype_observations[0].hpo_id = "HP:0000001"
    with pytest.raises(ValueError, match="HPO mapping"):
        phenotype_observations(other, DATA)


def test_evidence_tampering_fails_closed(tmp_path):
    family = FamilyStore(DATA).family("GIAB_AJ")
    for artifact in [*family.evidence_artifacts, *(p.artifact for p in family.phase_inputs)]:
        path = tmp_path / artifact.path
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DATA / artifact.path, path)
    (tmp_path / family.evidence_artifacts[0].path).write_text("changed")
    with pytest.raises(ValueError, match="Evidence checksum mismatch"):
        verified_artifacts(family, tmp_path)


def test_phase_and_phenotype_absence_are_explicit(tmp_path):
    family = FamilyStore(DATA).family("GIAB_AJ")
    family.phase_inputs = []
    family.evidence_artifacts = []
    family.phenotype_observations = []
    for relative in [family.parent_a.vcf, family.parent_b.vcf, family.child.vcf, family.pedigree]:
        path = tmp_path / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(DATA / relative, path)
    (tmp_path / "metadata").mkdir()
    (tmp_path / "metadata/GIAB_AJ.family.json").write_text(family.model_dump_json())
    with TestClient(create_app(tmp_path)) as client:
        response = client.get("/api/families/GIAB_AJ/scientific-audit")
        assert response.status_code == 200
        audit = response.json()
        assert audit["phenotype_status"] == "phenotype_not_available" and not audit["phenotype_available"]
        assert audit["inferred_haplotype_blocks"] == 0 and audit["point_markers"] == 610
        assert not audit["novelty_trace_ready"] and not audit["counterfactual_ready"]


def test_state_intervention_recomputes_and_preserves_source_lineage(real_state):
    original = real_state.model_dump_json()
    request = CounterfactualRequest(family_id="GIAB_AJ", intervention="REPLACE_WITH_PARENTAL_GENOTYPE",
        target_id="1:814309:T:G", parent_role="parent_A")
    result = counterfactual(real_state, request)
    before = next(v for v in result.original_state.variants if v.id == request.target_id)
    after = next(v for v in result.counterfactual_state.variants if v.id == request.target_id)
    assert before.child_genotype.alleles == ["G", "G"]
    assert after.child_genotype.alleles == ["T", "G"]
    assert len(before.transmission_pairs) == 1 and len(after.transmission_pairs) == 2
    assert after.child_genotype.evidence_status == "hypothesis" and after.child_genotype.gq is None
    assert not after.child_specific_genotype
    assert len(result.original_state.configurations) == 22 and len(result.counterfactual_state.configurations) == 21
    assert len(result.original_state.markers) == 610 and len(result.counterfactual_state.markers) == 608
    assert result.original_score is result.counterfactual_score is result.delta is None
    assert result.counterfactual_state.provenance.parent_computation_id == real_state.provenance.computation_id
    assert result.counterfactual_state.provenance.inputs == real_state.provenance.inputs
    assert after.provenance == [real_state.provenance.computation_id, result.intervention_id]
    assert real_state.model_dump_json() == original
    assert result == counterfactual(real_state, request)
    graph = evidence_graph(result.counterfactual_state)
    assert any(n.id == request.target_id and n.evidence_status == "hypothesis" for n in graph.nodes)
    assert any(e.evidence_status == "hypothesis" for e in graph.links)
    assert all(e.provenance for e in graph.links)


def test_graph_statuses_and_no_invented_phenotype_links(real_state):
    graph = evidence_graph(real_state)
    ids = {n.id for n in graph.nodes}
    phenotype_ids = {n.id for n in graph.nodes if n.type == "reported_phenotype"}
    assert {n.evidence_status for n in graph.nodes} == {"observed", "inferred"}
    assert {e.evidence_status for e in graph.links} == {"observed", "inferred"}
    assert all(e.source in ids and e.target in ids for e in graph.links)
    assert not any(e.source in phenotype_ids for e in graph.links)
    assert all(n.provenance for n in graph.nodes)


def test_scientific_api_contract(real_state):
    with TestClient(create_app(DATA)) as client:
        audit = client.get("/api/families/GIAB_AJ/scientific-audit")
        assert audit.status_code == 200
        assert audit.json() == scientific_audit(real_state).model_dump(mode="json")
        segments = client.get("/api/families/GIAB_AJ/segments").json()
        assert len(segments["markers"]) == 610 and len(segments["segments"]) == 2
        request = {"family_id": "GIAB_AJ", "intervention": "REPLACE_WITH_PARENTAL_GENOTYPE", "target_id": "1:814309:T:G"}
        result = client.post("/api/counterfactual", json=request)
        assert result.status_code == 200
        assert result.json()["delta"] is None and not result.json()["counterfactual_ready"]
        assert result.json()["counterfactual_state"]["state_status"] == "hypothetical"
