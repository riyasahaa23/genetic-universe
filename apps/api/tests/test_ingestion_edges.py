"""Regression cases preventing silent or overconfident scientific interpretation."""
import pytest

from app.trio.ingestion import parse_record, read_sample, sha256
from app.trio.models import Filters, Region, SampleInput


def row(gt="0/1:40:10", alt="G", filt="PASS", qual="50"):
    return f"chr1\t100\t.\tA\t{alt}\t{qual}\t{filt}\t.\tGT:GQ:DP\t{gt}\n"


@pytest.mark.parametrize("record,code", [
    (row(gt="0/1:2:10"), "LOW_QUALITY"),
    (row(gt="0/1:40:1"), "LOW_QUALITY"),
    (row(filt="."), "FILTERED"),
    (row(alt="<DEL>"), "UNSUPPORTED_ALLELE"),
    (row(gt="1:40:10"), "UNSUPPORTED_PLOIDY")])
def test_unusable_calls_are_retained_with_warning(record, code):
    site, warnings = parse_record(record, 9, "sample", Filters())
    assert not site.genotype.usable
    assert code in {w.code for w in warnings}


def test_missing_quality_is_explicit_and_configurable():
    site, warnings = parse_record(row(gt="0/1:.:.", qual="."), 9, "sample", Filters())
    assert site.genotype.usable
    assert {w.code for w in warnings} == {"QUALITY_UNAVAILABLE"}
    site, warnings = parse_record(row(gt="0/1:.:.", qual="."), 9, "sample", Filters(require_quality_fields=True))
    assert not site.genotype.usable


@pytest.mark.parametrize("quality", ["NaN", "inf", "-1"])
def test_nonfinite_and_negative_quality_rejected(quality):
    with pytest.raises(ValueError):
        parse_record(row(qual=quality), 9, "sample", Filters())


def test_duplicate_records_and_build_conflicts(tmp_path):
    path = tmp_path / "input.vcf"
    path.write_text("##fileformat=VCFv4.2\n##reference=GRCh38\n"
                    "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tsample\n" + row() + row(alt="T"))
    sample = SampleInput(sample_id="sample", vcf=path.name, sha256=sha256(path), source_url="validation-fixture")
    sites, warnings = read_sample(sample, tmp_path, Region(chromosome="1", start=1, end=1000), Filters(), "GRCh38")
    assert not next(iter(sites.values())).genotype.usable
    assert any(w.code == "DUPLICATE_SITE" for w in warnings)
    with pytest.raises(ValueError, match="assembly conflicts"):
        read_sample(sample, tmp_path, Region(chromosome="1", start=1, end=1000), Filters(), "GRCh37")


def test_absent_parent_records_are_not_reference():
    from pathlib import Path
    from app.trio.pipeline import FamilyStore
    state = FamilyStore(Path(__file__).resolve().parents[2] / "data").state("GIAB_AJ")
    absent = [v for v in state.variants if any(g.status == "record_absent_not_reference"
              for g in (v.parent_a_genotype, v.parent_b_genotype))]
    assert absent
    assert all(v.origin == "unknown" and v.inherited_alt_copies == 0 for v in absent)
