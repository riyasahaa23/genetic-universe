"""Native HTSlib integration tests; run on Linux CI, explicitly skipped without tooling."""
import importlib.util
import shutil
import subprocess

import pytest

from app.trio.ingestion import read_sample, sha256
from app.trio.models import Filters, Region, SampleInput

pytestmark = pytest.mark.skipif(
    importlib.util.find_spec("cyvcf2") is None or shutil.which("bcftools") is None,
    reason="Native indexed VCF/BCF tests require cyvcf2 and bcftools (Linux/WSL)")


@pytest.mark.parametrize("mode,suffix", [("z", ".vcf.gz"), ("b", ".bcf")])
def test_native_indexed_region(tmp_path, mode, suffix):
    source = tmp_path / "validation.vcf"
    source.write_text(
        "##fileformat=VCFv4.2\n"
        "##reference=GRCh38\n"
        "##contig=<ID=chr1,length=1000>\n"
        '##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">\n'
        "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tS\n"
        "chr1\t100\t.\tA\tG\t50\tPASS\t.\tGT\t0/1\n"
        "chr1\t200\t.\tA\tG\t50\tPASS\t.\tGT\t1/1\n")
    encoded = tmp_path / ("validation" + suffix)
    subprocess.run(["bcftools", "view", "-O" + mode, "-o", str(encoded), str(source)], check=True)
    subprocess.run(["bcftools", "index", str(encoded)], check=True)
    sample = SampleInput(sample_id="S", vcf=encoded.name, sha256=sha256(encoded), source_url="validation-fixture")
    sites, warnings = read_sample(sample, tmp_path, Region(chromosome="1", start=150, end=250), Filters(), "GRCh38")
    assert list(sites) == [("1", 200, "A")]
    assert next(iter(sites.values())).genotype.alleles == ["G", "G"]
