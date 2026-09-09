"""Cryptographic and scientific firewall verification for 1000 Genomes real-data pipeline.

Enforces:
1. Real-data provenance: Official EBI BGZF slice, verified SHA-256 and size.
2. Strict NO-FALLBACK: Raises RealDataUnavailableError if authentic VCF is absent.
3. Inheritance taxonomy: 0/1 + 0/1 -> 1/1 is ordinary Mendelian, never de novo.
4. Phenotype boundary: phenotype_available=False, observations strictly empty.
5. Zero synthetic proxy generators: Production modules contain zero fake data generators.
"""
import inspect
from pathlib import Path
import pytest

from app.datasets.thousand_genomes import (
    BoundedRegionalExtractor,
    PedigreeRegistry,
    RealDataUnavailableError,
    ThousandGenomesAdapter,
    load_pedigree,
)
from app.datasets.thousand_genomes.extractor import compute_sha256
import app.datasets.thousand_genomes.adapter as adapter_module
import app.datasets.thousand_genomes.extractor as extractor_module
from app.trio.attribution import scientific_audit
from app.trio.inheritance import infer_variant
from app.trio.models import Genotype, Region


@pytest.fixture(scope="module")
def data_root():
    return Path("data").resolve()


@pytest.fixture(scope="module")
def pedigree(data_root):
    ped_path = data_root / "real" / "1000g" / "pedigree" / "20130606_g1k_3202_samples_ped_population.txt"
    return load_pedigree(ped_path)


# -----------------------------------------------------------------------------
# Test 1: Real-Data Provenance & Cryptographic Verification
# -----------------------------------------------------------------------------
def test_1000g_real_data_provenance(data_root, pedigree):
    raw_vcf = data_root / "real" / "1000g" / "raw" / "1kGP_high_coverage_Illumina.chr1.filtered.SNV_INDEL_SV_phased_panel.slice.bgz"
    assert raw_vcf.exists(), "Official 1000 Genomes BGZF slice must exist on disk"
    assert raw_vcf.stat().st_size == 100001, f"Expected 100,001 bytes, found {raw_vcf.stat().st_size}"

    sha = compute_sha256(raw_vcf)
    expected_sha = "236fe11c619f8e0152a8c2e4d433bba39411c3983ac1658c30f0d10737175fdf"
    assert sha == expected_sha, f"SHA-256 mismatch! Got {sha}, expected {expected_sha}"

    # Extract records and verify they match authentic multi-sample genotypes
    extractor = BoundedRegionalExtractor(data_root=data_root, raw_vcf_path=raw_vcf)
    trio = pedigree.trios[0]  # 1000G_CHS_HG00405
    region = Region(chromosome="1", start=10000, end=20000)
    records = extractor.extract_trio_records(trio.child_id, trio.father_id, trio.mother_id, region)

    assert len(records) > 0, "Must extract genuine records from the authentic slice"
    positions = [r.pos for r in records]
    assert 13868 in positions, "Locus 13868 (real 1000G variant) must be present"
    assert 17365 in positions, "Locus 17365 (real 1000G variant) must be present"

    rec_13868 = next(r for r in records if r.pos == 13868)
    assert rec_13868.ref == "A"
    assert rec_13868.alt == "G"
    assert rec_13868.genotypes[trio.child_id].startswith("1|0:")
    assert rec_13868.genotypes[trio.father_id].startswith("0|1:")
    assert rec_13868.genotypes[trio.mother_id].startswith("0|1:")


# -----------------------------------------------------------------------------
# Test 2: Strict Real-Data NO-FALLBACK Guarantee
# -----------------------------------------------------------------------------
def test_1000g_no_synthetic_fallback(data_root, pedigree):
    non_existent_path = data_root / "real" / "1000g" / "raw" / "non_existent_missing_file.bgz"
    bad_extractor = BoundedRegionalExtractor(data_root=data_root, raw_vcf_path=non_existent_path)
    trio = pedigree.trios[0]
    region = Region(chromosome="1", start=10000, end=20000)

    with pytest.raises(RealDataUnavailableError) as exc_info:
        bad_extractor.extract_trio_records(trio.child_id, trio.father_id, trio.mother_id, region)

    assert "Strict real-data policy enforced: synthetic fallback is prohibited" in str(exc_info.value)

    bad_adapter = ThousandGenomesAdapter(data_root=data_root, registry=pedigree, raw_vcf_path=non_existent_path)
    with pytest.raises(RealDataUnavailableError):
        bad_adapter.prepare_trio(trio, region)


# -----------------------------------------------------------------------------
# Test 3: Inheritance Taxonomy (Ordinary Mendelian vs De Novo)
# -----------------------------------------------------------------------------
def test_1000g_inheritance_taxonomy():
    # 0/1 + 0/1 -> 1/1 is ordinary Mendelian combination, NEVER de novo
    dad_het = Genotype(sample_id="DAD", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")
    mom_het = Genotype(sample_id="MOM", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")
    child_hom_alt = Genotype(sample_id="CHILD", raw_gt="1/1", alleles=["G", "G"], phased=False, usable=True, status="observed")

    v_ord = infer_variant("1", 100050, "A", "G", child_hom_alt, dad_het, mom_het, "taxonomy_check")
    assert v_ord.origin == "both"
    assert v_ord.status == "inherited_from_both"
    assert v_ord.origin != "de_novo_candidate", "0/1 + 0/1 -> 1/1 must NEVER be labeled de novo"

    # True de novo mutation: 0/0 + 0/0 -> 0/1
    dad_ref = Genotype(sample_id="DAD", raw_gt="0/0", alleles=["A", "A"], phased=False, usable=True, status="observed")
    mom_ref = Genotype(sample_id="MOM", raw_gt="0/0", alleles=["A", "A"], phased=False, usable=True, status="observed")
    child_het = Genotype(sample_id="CHILD", raw_gt="0/1", alleles=["A", "G"], phased=False, usable=True, status="observed")

    v_denovo = infer_variant("1", 100060, "A", "G", child_het, dad_ref, mom_ref, "taxonomy_check")
    assert v_denovo.origin == "de_novo_candidate"
    assert v_denovo.status == "mendelian_inconsistent_requires_validation"


# -----------------------------------------------------------------------------
# Test 4: Phenotype Absence & Boundary Enforcement
# -----------------------------------------------------------------------------
def test_1000g_phenotype_absence(data_root, pedigree):
    adapter = ThousandGenomesAdapter(data_root=data_root, registry=pedigree)
    trio = pedigree.trios[0]
    region = Region(chromosome="1", start=10000, end=20000)

    adapter.prepare_trio(trio, region)
    state = adapter.run_pipeline(trio.trio_id, region)

    assert state.phenotype_available is False, "phenotype_available must be False on real 1000G trios"
    assert state.phenotype_status == "phenotype_not_available"
    assert len(state.phenotype_observations) == 0, "phenotype_observations must be empty"

    audit = scientific_audit(state)
    assert audit.real_data is True
    assert audit.phenotype_available is False
    assert audit.phenotype_model_available is False
    assert audit.causal_claim_supported is False
    assert audit.counterfactual_ready is False
    assert any("No source-supported variant/configuration-to-phenotype model" in l for l in audit.limitations)


# -----------------------------------------------------------------------------
# Test 5: Production Codebase Zero-Synthetic-Generator Audit
# -----------------------------------------------------------------------------
def test_zero_synthetic_generators_in_production():
    banned_names = [
        "generate_coherent_trio_slice",
        "plant_crossover",
        "plant_biparental_het",
        "plant_denovo",
    ]

    extractor_src = inspect.getsource(extractor_module)
    adapter_src = inspect.getsource(adapter_module)

    for banned in banned_names:
        assert banned not in extractor_src, f"Banned synthetic generator '{banned}' found in extractor.py!"
        assert banned not in adapter_src, f"Banned synthetic generator '{banned}' found in adapter.py!"
        assert not hasattr(extractor_module, banned), f"Attribute '{banned}' exists in extractor_module!"
        assert not hasattr(adapter_module, banned), f"Attribute '{banned}' exists in adapter_module!"
        assert not hasattr(BoundedRegionalExtractor, banned), f"Method '{banned}' exists on BoundedRegionalExtractor!"
        assert not hasattr(ThousandGenomesAdapter, banned), f"Method '{banned}' exists on ThousandGenomesAdapter!"
