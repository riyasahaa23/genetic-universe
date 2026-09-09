"""16-point comprehensive automated test suite for authentic 1000 Genomes real-data integration.

Validates:
1. Pedigree loading integrity (3,202 samples, 602 complete trios)
2. Population diversity representation (EUR, AFR, EAS, AMR, SAS)
3. Bounded regional extraction & memory safety on authentic BGZF
4. Pedigree SHA-256 cryptographic verification
5. Family manifest schema parity with GIAB_AJ
6. FamilyStore native ingestion of 1000G manifests
7. Strict phenotype gate (phenotype_available=False, status='phenotype_not_available')
8. Phenotype leakage rejection
9. Mendelian homozygous alternate inheritance (0/1 + 0/1 -> 1/1 is ordinary Mendelian, NOT de novo)
10. De novo mutation discrimination (0/0 + 0/0 -> 0/1 is de novo candidate)
11. Recombination interval bounding & marker flanking rules
12. Candidate interval naming discipline (candidate switch, never exact breakpoint)
13. Counterfactual intervention safety & limitation reporting
14. Multi-trio cross-population pilot (10 trios across 5 continental groups)
15. Multi-trio expansion cohort (50 trios stability & throughput)
16. Scientific audit report boundaries (real_data=True, phenotype_model_available=False, causal_claim_supported=False)
"""
import copy
from pathlib import Path
import pytest

from app.datasets.thousand_genomes import (
    BoundedRegionalExtractor,
    PedigreeRegistry,
    RealDataUnavailableError,
    ThousandGenomesAdapter,
    TrioInfo,
    load_pedigree,
)
from app.datasets.thousand_genomes.extractor import compute_sha256
from app.trio.attribution import counterfactual, scientific_audit
from app.trio.ingestion import verify_pedigree
from app.trio.inheritance import infer_variant
from app.trio.models import (
    CounterfactualRequest,
    Family,
    Genotype,
    PhenotypeObservation,
    Region,
    SampleInput,
    Variant,
)
from app.trio.pipeline import FamilyStore
from app.trio.segments import build_segments


@pytest.fixture(scope="module")
def data_root():
    return Path("data").resolve()


@pytest.fixture(scope="module")
def registry(data_root):
    ped_path = data_root / "real" / "1000g" / "pedigree" / "20130606_g1k_3202_samples_ped_population.txt"
    return load_pedigree(ped_path)


@pytest.fixture(scope="module")
def adapter(data_root, registry):
    return ThousandGenomesAdapter(data_root=data_root, registry=registry)


@pytest.fixture(scope="module")
def sample_region():
    return Region(chromosome="1", start=10_000, end=20_000)


# -----------------------------------------------------------------------------
# Test 1: Pedigree loading integrity
# -----------------------------------------------------------------------------
def test_1000g_pedigree_loading_integrity(registry):
    summary = registry.summary()
    assert summary["total_samples"] == 3202, "Must contain exactly 3,202 high-coverage samples"
    assert summary["total_trios"] == 602, "Must contain exactly 602 complete parent-offspring trios"
    for trio in registry.trios:
        assert trio.father_id in registry.samples, f"Father {trio.father_id} missing from sample catalog"
        assert trio.mother_id in registry.samples, f"Mother {trio.mother_id} missing from sample catalog"
        assert trio.child_id in registry.samples, f"Child {trio.child_id} missing from sample catalog"
        assert trio.is_complete is True


# -----------------------------------------------------------------------------
# Test 2: Population diversity representation
# -----------------------------------------------------------------------------
def test_population_diversity_representation(registry):
    summary = registry.summary()
    superpops = summary["superpopulations"]
    required_superpops = {"EUR", "AFR", "EAS", "AMR", "SAS"}
    assert required_superpops.issubset(set(superpops.keys())), "All 5 continental superpopulations must be present"
    for sp in required_superpops:
        assert superpops[sp] >= 50, f"Superpopulation {sp} must have at least 50 complete trios (found {superpops[sp]})"
    assert summary["total_populations"] >= 15, "At least 15 distinct populations must be represented"


# -----------------------------------------------------------------------------
# Test 3: Bounded regional extraction memory safety
# -----------------------------------------------------------------------------
def test_bounded_regional_extraction_memory_safety(adapter, sample_region):
    extractor = adapter.extractor
    trio = adapter.registry.trios[0]
    records = extractor.extract_trio_records(
        child_id=trio.child_id,
        father_id=trio.father_id,
        mother_id=trio.mother_id,
        region=sample_region,
    )
    assert len(records) > 0, "Should extract authentic variants in the requested region"
    for r in records:
        assert sample_region.start <= r.pos <= sample_region.end, (
            f"Variant position {r.pos} outside bounded region {sample_region.start}-{sample_region.end}"
        )


# -----------------------------------------------------------------------------
# Test 4: Pedigree SHA-256 verification
# -----------------------------------------------------------------------------
def test_pedigree_sha256_verification(adapter, sample_region):
    trio = adapter.registry.trios[0]
    fam = adapter.prepare_trio(trio, sample_region)
    ped_path = adapter.data_root / fam.pedigree
    assert ped_path.exists()
    assert compute_sha256(ped_path) == fam.pedigree_sha256

    # Test tampering detection
    corrupted_fam = fam.model_copy(deep=True)
    corrupted_fam.pedigree_sha256 = "0000000000000000000000000000000000000000000000000000000000000000"
    with pytest.raises(ValueError, match="Pedigree checksum mismatch"):
        verify_pedigree(corrupted_fam, adapter.data_root)


# -----------------------------------------------------------------------------
# Test 5: Family manifest schema parity with GIAB_AJ
# -----------------------------------------------------------------------------
def test_family_manifest_schema_parity(adapter, sample_region):
    trio = adapter.registry.trios[0]
    fam = adapter.prepare_trio(trio, sample_region)
    assert isinstance(fam, Family)
    assert fam.dataset_kind == "real"
    assert fam.reference_build == "GRCh38"
    assert fam.parent_a.sample_id == trio.father_id
    assert fam.parent_b.sample_id == trio.mother_id
    assert fam.child.sample_id == trio.child_id
    assert len(fam.phase_inputs) == 3
    assert fam.phenotype_evidence == []


# -----------------------------------------------------------------------------
# Test 6: Native FamilyStore ingestion of 1000G
# -----------------------------------------------------------------------------
def test_familystore_ingestion_1000g(adapter, sample_region):
    trio = adapter.registry.trios[1]
    adapter.prepare_trio(trio, sample_region)
    state = adapter.store.state(trio.trio_id, sample_region)
    assert state.family_id == trio.trio_id
    assert state.child_id == trio.child_id
    assert len(state.variants) > 0


# -----------------------------------------------------------------------------
# Test 7: Strict phenotype gate on real data
# -----------------------------------------------------------------------------
def test_strict_phenotype_gate_real_data(adapter, sample_region):
    trio = adapter.registry.trios[2]
    adapter.prepare_trio(trio, sample_region)
    state = adapter.run_pipeline(trio.trio_id, sample_region)
    assert state.phenotype_available is False, "Real 1000G trio must not claim phenotype availability"
    assert state.phenotype_status == "phenotype_not_available"
    assert len(state.phenotype_observations) == 0


# -----------------------------------------------------------------------------
# Test 8: Phenotype leakage rejection
# -----------------------------------------------------------------------------
def test_phenotype_leakage_rejection(adapter, sample_region):
    trio = adapter.registry.trios[3]
    fam = adapter.prepare_trio(trio, sample_region)

    # Injected fake phenotype observation without linkage artifact must be rejected
    hacked_manifest = adapter.data_root / "metadata" / f"{trio.trio_id}.family.json"
    data = fam.model_dump()
    data["phenotype_observations"] = [{
        "id": "fake_obs",
        "sample_id": trio.child_id,
        "label": "Fake Phenotype",
        "hpo_id": "HP:0000001",
        "source_artifact_id": "fake_source",
        "source_locator": "fake_locator",
        "linkage_artifact_id": "fake_linkage",
        "external_individual_id": "fake_individual",
        "ontology_artifact_id": "fake_ontology",
        "limitations": ["fake_limitation"],
    }]
    hacked_manifest.write_text(Family.model_validate(data).model_dump_json(indent=2), encoding="utf-8")

    store = FamilyStore(adapter.data_root)
    with pytest.raises(ValueError, match="Missing phenotype evidence artifact"):
        store.state(trio.trio_id, sample_region)

    # Restore clean manifest
    adapter.prepare_trio(trio, sample_region)


# -----------------------------------------------------------------------------
# Test 9: Mendelian homozygous alt inheritance (0/1 + 0/1 -> 1/1)
# -----------------------------------------------------------------------------
def test_mendelian_homozygous_alt_inheritance():
    """Verify 0/1 + 0/1 -> 1/1 is ordinary Mendelian, NOT de novo."""
    gt_dad = Genotype(sample_id="DAD", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")
    gt_mom = Genotype(sample_id="MOM", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")
    gt_child = Genotype(sample_id="CHILD", raw_gt="1/1", alleles=["G", "G"], phased=False, usable=True, status="observed")

    variant = infer_variant("1", 100050, "A", "G", gt_child, gt_dad, gt_mom, "comp_test")
    assert variant.origin == "both", "Origin must be both parents"
    assert variant.status == "inherited_from_both", "Status must be inherited_from_both"
    assert variant.inherited_alt_copies == 2
    assert variant.child_specific_genotype is True, "Homozygous alt child differs from heterozygous parents"
    assert variant.origin != "de_novo_candidate", "Must NEVER be called de novo candidate"


# -----------------------------------------------------------------------------
# Test 10: De novo mutation discrimination (0/0 + 0/0 -> 0/1)
# -----------------------------------------------------------------------------
def test_de_novo_mutation_discrimination():
    """Verify true de novo mutation (0/0 + 0/0 -> 0/1) is identified."""
    gt_dad = Genotype(sample_id="DAD", raw_gt="0/0", alleles=["A", "A"], phased=False, usable=True, status="observed")
    gt_mom = Genotype(sample_id="MOM", raw_gt="0/0", alleles=["A", "A"], phased=False, usable=True, status="observed")
    gt_child = Genotype(sample_id="CHILD", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")

    variant = infer_variant("1", 100060, "A", "G", gt_child, gt_dad, gt_mom, "comp_test")
    assert variant.origin == "de_novo_candidate"
    assert variant.status == "mendelian_inconsistent_requires_validation"


# -----------------------------------------------------------------------------
# Test 11: Recombination interval inference & marker flanking rules
# -----------------------------------------------------------------------------
def test_recombination_interval_inference_rules():
    """Verify candidate switch logic requires >=2 markers per flank and span <= 50kb."""
    from types import SimpleNamespace
    from app.trio.switch_rules import rejection_reasons, MAX_MARKER_GAP, MIN_FLANK_MARKERS
    assert MAX_MARKER_GAP == 50_000
    assert MIN_FLANK_MARKERS == 2

    m1 = SimpleNamespace(chromosome="chr1", phase_set="PS1", homolog=0, start=1000)
    m2 = SimpleNamespace(chromosome="chr1", phase_set="PS1", homolog=0, start=2000)
    m3 = SimpleNamespace(chromosome="chr1", phase_set="PS1", homolog=1, start=5000)
    m4 = SimpleNamespace(chromosome="chr1", phase_set="PS1", homolog=1, start=6000)

    # Flank too small (1 marker on left)
    assert "insufficient_flank_markers" in rejection_reasons([m2], [m3, m4])

    # Gap too large (>50kb)
    m_far = SimpleNamespace(chromosome="chr1", phase_set="PS1", homolog=1, start=70000)
    assert "nonpositive_or_excessive_marker_gap" in rejection_reasons([m1, m2], [m_far, m4])

    # Valid candidate switch
    assert rejection_reasons([m1, m2], [m3, m4]) == []


# -----------------------------------------------------------------------------
# Test 12: Candidate interval naming discipline
# -----------------------------------------------------------------------------
def test_candidate_interval_naming_discipline(adapter, sample_region):
    trio = adapter.registry.trios[5]
    adapter.prepare_trio(trio, sample_region)
    state = adapter.run_pipeline(trio.trio_id, sample_region)
    for event in state.recombination_events:
        assert "switch:" in event.id or "candidate" in event.id.lower()
        # Must not claim exact single-base breakpoint
        assert event.start != event.end, "Interval must have distinct bounding marker coordinates"


# -----------------------------------------------------------------------------
# Test 13: Counterfactual intervention safety & limitation reporting
# -----------------------------------------------------------------------------
def test_counterfactual_intervention_gated(adapter, sample_region):
    trio = adapter.registry.trios[0]
    adapter.prepare_trio(trio, sample_region)
    state = adapter.run_pipeline(trio.trio_id, sample_region)
    assert len(state.variants) > 0
    target_var = state.variants[0]

    req = CounterfactualRequest(
        family_id=trio.trio_id,
        region=sample_region,
        intervention="REMOVE_VARIANT",
        target_id=target_var.id,
    )
    result = counterfactual(state, req)
    assert result.family_id == trio.trio_id
    assert len(result.limitations) > 0
    assert any("No source-supported variant/configuration-to-phenotype model" in l for l in result.limitations)
    assert any("Computational interventions do not establish biological causality" in l for l in result.limitations)
    assert any(w.code == "HYPOTHETICAL_STATE" for w in result.counterfactual_state.warnings)


# -----------------------------------------------------------------------------
# Test 14: Multi-trio cross-population pilot (10 trios)
# -----------------------------------------------------------------------------
def test_multi_trio_cross_population_pilot(adapter, sample_region):
    pilot = adapter.registry.get_representative_pilot(2)
    assert len(pilot) == 10
    superpops_seen = set()
    for trio in pilot:
        adapter.prepare_trio(trio, sample_region)
        state = adapter.run_pipeline(trio.trio_id, sample_region)
        assert state.phenotype_available is False
        assert len(state.variants) > 0
        superpops_seen.add(trio.superpopulation)
    assert superpops_seen == {"EUR", "AFR", "EAS", "AMR", "SAS"}


# -----------------------------------------------------------------------------
# Test 15: Multi-trio expansion cohort (50 trios)
# -----------------------------------------------------------------------------
def test_multi_trio_expansion_50(adapter, sample_region):
    expansion = []
    for sp in ["EUR", "AFR", "EAS", "AMR", "SAS"]:
        expansion.extend(adapter.registry.filter_trios(superpopulations=[sp])[:10])
    assert len(expansion) == 50
    summary = adapter.evaluate_cohort(expansion, sample_region)
    assert summary["total_trios_evaluated"] == 50
    assert summary["phenotype_leakage_detected"] is False
    assert summary["phenotype_model_status_unavailable_pct"] == 100.0
    assert summary["mean_execution_ms_per_trio"] < 1000.0, "Execution should be fast and bounded"


# -----------------------------------------------------------------------------
# Test 16: Scientific audit real-data report boundaries
# -----------------------------------------------------------------------------
def test_scientific_audit_real_data(adapter, sample_region):
    trio = adapter.registry.trios[7]
    adapter.prepare_trio(trio, sample_region)
    state = adapter.run_pipeline(trio.trio_id, sample_region)
    audit = scientific_audit(state)
    assert audit.real_data is True
    assert audit.phenotype_available is False
    assert audit.phenotype_model_available is False
    assert audit.causal_claim_supported is False
    assert audit.counterfactual_ready is False
    assert "No source-supported variant/configuration-to-phenotype model" in audit.limitations[0]
