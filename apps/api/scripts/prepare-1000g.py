#!/usr/bin/env python3
"""Prepare one bounded 1000 Genomes trio for Genetic Universe.

Example:

    python scripts/prepare-1000g.py \
      --data-root data \
      --vcf data/raw/1kGP_high_coverage_Illumina.chr22...vcf.gz \
      --pedigree data/raw/1kGP.3202_samples.pedigree_info.txt \
      --child HG00405 --chromosome 22 --start 10500000 --end 10600000 \
      --source-url https://ftp.1000genomes.ebi.ac.uk/...

The source VCF must have a matching `.tbi` or `.csi` index. No synthetic
fallback is used when an input is missing.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.scientific.real_data.models import Region
from app.scientific.real_data.preparation import prepare_1000g_trio


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--data-root", type=Path, required=True)
    result.add_argument("--vcf", type=Path, required=True)
    result.add_argument("--pedigree", type=Path, required=True)
    result.add_argument("--child", required=True)
    result.add_argument("--chromosome", required=True)
    result.add_argument("--start", type=int, required=True)
    result.add_argument("--end", type=int, required=True)
    result.add_argument("--source-url", required=True)
    return result


def main() -> int:
    args = parser().parse_args()
    family = prepare_1000g_trio(
        root=args.data_root.resolve(),
        raw_vcf=args.vcf.resolve(),
        pedigree_path=args.pedigree.resolve(),
        child_id=args.child,
        region=Region(chromosome=args.chromosome, start=args.start, end=args.end),
        source_url=args.source_url,
    )
    print(f"prepared_family={family.family_id}")
    print(f"reference_build={family.reference_build}")
    print(f"region={family.regions[0].chromosome}:{family.regions[0].start}-{family.regions[0].end}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
