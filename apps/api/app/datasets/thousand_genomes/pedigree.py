"""1000 Genomes Project pedigree and population metadata parsing.

Authoritative source:
EBI 1000 Genomes 30x High Coverage Dataset (3,202 samples, GRCh38).
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

POPULATION_NAMES: dict[str, str] = {
    # EUR (European)
    "CEU": "Utah Residents (CEPH) with Northern and Western European Ancestry",
    "TSI": "Toscani in Italia",
    "FIN": "Finnish in Finland",
    "GBR": "British in England and Scotland",
    "IBS": "Iberian Population in Spain",
    # AFR (African)
    "YRI": "Yoruba in Ibadan, Nigeria",
    "LWK": "Luhya in Webuye, Kenya",
    "GWD": "Gambian in Western Divisions in The Gambia",
    "MSL": "Mende in Sierra Leone",
    "ESN": "Esan in Nigeria",
    "ASW": "Americans of African Ancestry in SW USA",
    "ACB": "African Caribbeans in Barbados",
    # EAS (East Asian)
    "CHB": "Han Chinese in Beijing, China",
    "JPT": "Japanese in Tokyo, Japan",
    "CHS": "Southern Han Chinese",
    "CDX": "Chinese Dai in Xishuangbanna, China",
    "KHV": "Kinh in Ho Chi Minh City, Vietnam",
    # AMR (Admixed American)
    "MXL": "Mexican Ancestry from Los Angeles USA",
    "PUR": "Puerto Ricans from Puerto Rico",
    "CLM": "Colombians in Medellin, Colombia",
    "PEL": "Peruvians from Lima, Peru",
    # SAS (South Asian)
    "GIH": "Gujarati Indian in Houston, Texas",
    "PJL": "Punjabi in Lahore, Pakistan",
    "BEB": "Bengali from Bangladesh",
    "STU": "Sri Lankan Tamil from the UK",
    "ITU": "Indian Telugu from the UK",
}

SUPERPOPULATION_NAMES: dict[str, str] = {
    "EUR": "European",
    "AFR": "African",
    "EAS": "East Asian",
    "AMR": "Admixed American",
    "SAS": "South Asian",
}


@dataclass(frozen=True)
class SampleRecord:
    sample_id: str
    family_id: str
    father_id: str
    mother_id: str
    sex: str  # "1" = male, "2" = female, "0" = unknown
    population: str
    superpopulation: str

    @property
    def is_child(self) -> bool:
        return self.father_id != "0" and self.mother_id != "0"

    @property
    def gender_label(self) -> str:
        if self.sex == "1":
            return "male"
        elif self.sex == "2":
            return "female"
        return "unknown"


@dataclass(frozen=True)
class TrioInfo:
    trio_id: str
    child_id: str
    father_id: str
    mother_id: str
    child_sex: str  # "male" | "female" | "unknown"
    population: str
    superpopulation: str
    family_id: str
    is_complete: bool = True

    def to_ped_row(self) -> str:
        """Format as standard 6-column PED row: FamID IndID DadID MomID Sex Phenotype."""
        sex_num = "1" if self.child_sex == "male" else ("2" if self.child_sex == "female" else "0")
        return f"{self.trio_id}	{self.child_id}	{self.father_id}	{self.mother_id}	{sex_num}	0"

    def to_full_ped_rows(self) -> list[str]:
        """Format 3 rows for complete trio: Father, Mother, Child."""
        sex_child = "1" if self.child_sex == "male" else ("2" if self.child_sex == "female" else "0")
        return [
            f"{self.trio_id}	{self.father_id}	0	0	1	0",
            f"{self.trio_id}	{self.mother_id}	0	0	2	0",
            f"{self.trio_id}	{self.child_id}	{self.father_id}	{self.mother_id}	{sex_child}	0",
        ]


class PedigreeRegistry:
    """In-memory registry of 1000 Genomes samples, populations, and trios."""

    def __init__(self, samples: dict[str, SampleRecord], trios: list[TrioInfo]):
        self._samples = samples
        self._trios = trios
        self._trios_by_child = {t.child_id: t for t in trios}
        self._trios_by_id = {t.trio_id: t for t in trios}

    @property
    def samples(self) -> dict[str, SampleRecord]:
        return self._samples

    @property
    def trios(self) -> list[TrioInfo]:
        return self._trios

    def get_trio(self, identifier: str) -> Optional[TrioInfo]:
        """Look up trio by child_id or trio_id."""
        return self._trios_by_child.get(identifier) or self._trios_by_id.get(identifier)

    def filter_trios(
        self,
        superpopulations: Optional[list[str]] = None,
        populations: Optional[list[str]] = None,
        sex: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> list[TrioInfo]:
        """Filter trios by demographic and population criteria."""
        res = self._trios
        if superpopulations:
            target_sup = set(s.upper() for s in superpopulations)
            res = [t for t in res if t.superpopulation.upper() in target_sup]
        if populations:
            target_pop = set(p.upper() for p in populations)
            res = [t for t in res if t.population.upper() in target_pop]
        if sex:
            target_sex = sex.lower()
            res = [t for t in res if t.child_sex.lower() == target_sex]
        if limit is not None:
            res = res[:limit]
        return res

    def get_representative_pilot(self, n_per_superpop: int = 2) -> list[TrioInfo]:
        """Select balanced representative trios across all 5 continental superpopulations."""
        pilot: list[TrioInfo] = []
        for superpop in ["EUR", "AFR", "EAS", "AMR", "SAS"]:
            matches = self.filter_trios(superpopulations=[superpop])
            pilot.extend(matches[:n_per_superpop])
        return pilot

    def summary(self) -> dict:
        """Return dataset breakdown statistics."""
        superpop_counts: dict[str, int] = {}
        pop_counts: dict[str, int] = {}
        sex_counts: dict[str, int] = {"male": 0, "female": 0, "unknown": 0}

        for t in self._trios:
            superpop_counts[t.superpopulation] = superpop_counts.get(t.superpopulation, 0) + 1
            pop_counts[t.population] = pop_counts.get(t.population, 0) + 1
            sex_counts[t.child_sex] = sex_counts.get(t.child_sex, 0) + 1

        return {
            "total_samples": len(self._samples),
            "total_trios": len(self._trios),
            "superpopulations": superpop_counts,
            "populations": pop_counts,
            "child_sex": sex_counts,
            "total_populations": len(pop_counts),
        }


def load_pedigree(ped_file: Optional[Path] = None) -> PedigreeRegistry:
    """Load the official 1000 Genomes pedigree file.

    Defaults to data/real/1000g/pedigree/20130606_g1k_3202_samples_ped_population.txt
    or falls back to 1kGP.3202_samples.pedigree_info.txt.
    """
    candidates = []
    if ped_file:
        candidates.append(ped_file)
    default_root = Path("data/real/1000g/pedigree")
    candidates.extend([
        default_root / "20130606_g1k_3202_samples_ped_population.txt",
        default_root / "1kGP.3202_samples.pedigree_info.txt",
    ])

    resolved_path: Optional[Path] = None
    for cand in candidates:
        if cand.exists() and cand.is_file():
            resolved_path = cand
            break

    if not resolved_path:
        raise FileNotFoundError(f"1000 Genomes pedigree file not found in candidates: {candidates}")

    lines = resolved_path.read_text(encoding="utf-8").strip().splitlines()
    if not lines:
        raise ValueError(f"Empty pedigree file: {resolved_path}")

    header = lines[0].split()
    samples: dict[str, SampleRecord] = {}

    has_population_cols = len(header) >= 7 and "Population" in header[5]

    for line in lines[1:]:
        parts = line.split()
        if len(parts) < 4:
            continue
        if has_population_cols:
            fam_id, samp_id, dad_id, mom_id, sex, pop, superpop = parts[:7]
        else:
            samp_id, dad_id, mom_id, sex = parts[:4]
            fam_id = samp_id
            pop = "UNKNOWN"
            superpop = "UNKNOWN"

        rec = SampleRecord(
            sample_id=samp_id,
            family_id=fam_id,
            father_id=dad_id,
            mother_id=mom_id,
            sex=sex,
            population=pop,
            superpopulation=superpop,
        )
        samples[samp_id] = rec

    trios: list[TrioInfo] = []
    for samp_id, rec in samples.items():
        if rec.is_child:
            # Verify complete trio (parents in sample catalog)
            dad_present = rec.father_id in samples
            mom_present = rec.mother_id in samples
            if dad_present and mom_present:
                trio_id = f"1000G_{rec.population}_{samp_id}" if rec.population != "UNKNOWN" else f"1000G_{samp_id}"
                trio = TrioInfo(
                    trio_id=trio_id,
                    child_id=samp_id,
                    father_id=rec.father_id,
                    mother_id=rec.mother_id,
                    child_sex=rec.gender_label,
                    population=rec.population,
                    superpopulation=rec.superpopulation,
                    family_id=rec.family_id,
                    is_complete=True,
                )
                trios.append(trio)

    logger.info("Loaded 1kGP pedigree: %d samples, %d complete trios from %s", len(samples), len(trios), resolved_path)
    return PedigreeRegistry(samples=samples, trios=trios)
