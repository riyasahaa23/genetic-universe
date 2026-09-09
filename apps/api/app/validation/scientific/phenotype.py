"""
Phenotype Engine
Evaluates quantitative phenotype models with additive, dominance, and epistatic terms.
Explicitly distinguishes between cis-haplotype interactions (created by meiotic recombination)
and diploid dosage effects.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional, Tuple
try:
    import numpy as np
except ImportError:
    np = None


@dataclass
class EpistaticPair:
    id: str
    locus_a: str
    locus_b: str
    locus_a_pos: int  # 1-indexed position
    locus_b_pos: int  # 1-indexed position
    coefficient: float
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "locus_a": self.locus_a,
            "locus_b": self.locus_b,
            "locus_a_pos": self.locus_a_pos,
            "locus_b_pos": self.locus_b_pos,
            "coefficient": self.coefficient,
            "description": self.description,
        }


@dataclass
class PhenotypeConfig:
    base_value: float = 0.0
    additive: Dict[str, float] = field(default_factory=dict)     # locus_id -> coefficient
    dominance: Dict[str, float] = field(default_factory=dict)    # locus_id -> coefficient
    recessive: Dict[str, float] = field(default_factory=dict)    # locus_id -> coefficient
    epistasis: List[EpistaticPair] = field(default_factory=list)
    mode: str = "cis_haplotype"  # "cis_haplotype" or "diploid"
    noise_sigma: float = 0.0
    noise_seed: Optional[int] = 42
    threshold: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "base_value": self.base_value,
            "additive": self.additive,
            "dominance": self.dominance,
            "recessive": self.recessive,
            "epistasis": [e.to_dict() for e in self.epistasis],
            "mode": self.mode,
            "noise_sigma": self.noise_sigma,
            "noise_seed": self.noise_seed,
            "threshold": self.threshold,
        }


@dataclass
class PhenotypeBreakdown:
    total: float
    base_value: float
    additive_component: float
    dominance_component: float
    epistatic_component: float
    noise_component: float
    additive_details: Dict[str, float]
    dominance_details: Dict[str, float]
    epistatic_details: Dict[str, float]
    formula_expression: str
    recessive_component: float = 0.0
    recessive_details: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total": round(self.total, 4),
            "base_value": round(self.base_value, 4),
            "additive_component": round(self.additive_component, 4),
            "dominance_component": round(self.dominance_component, 4),
            "recessive_component": round(self.recessive_component, 4),
            "epistatic_component": round(self.epistatic_component, 4),
            "noise_component": round(self.noise_component, 4),
            "additive_details": {k: round(v, 4) for k, v in self.additive_details.items()},
            "dominance_details": {k: round(v, 4) for k, v in self.dominance_details.items()},
            "recessive_details": {k: round(v, 4) for k, v in self.recessive_details.items()},
            "epistatic_details": {k: round(v, 4) for k, v in self.epistatic_details.items()},
            "formula_expression": self.formula_expression,
        }


class PhenotypeEngine:
    """
    Computes phenotypes for parental genomes and offspring genomes under synthetic ground-truth models.
    Supports counterfactual perturbation of variants, segments, and epistatic interactions.
    """

    def __init__(self, config: PhenotypeConfig):
        self.config = config

    def _get_locus_index(self, locus_id: str) -> int:
        """Converts L01 or L10 to 0-indexed integer (L01 -> 0, L10 -> 9)."""
        clean = locus_id.upper().replace("L", "")
        return int(clean) - 1

    def evaluate_diploid(
        self,
        h1: List[int],
        h2: List[int],
        broken_interactions: Optional[set] = None,
        broken_pairs: Optional[set] = None,
        overridden_alleles: Optional[Dict[int, int]] = None,
    ) -> PhenotypeBreakdown:
        """
        Evaluates phenotype for two homologous haplotypes (h1, h2).
        h1 and h2 can be parental homologs (A1, A2) or transmitted offspring gametes (gA, gB).
        broken_interactions: set of epistatic interaction IDs to silence.
        broken_pairs: set of (idx_a, idx_b) tuples to silence.
        overridden_alleles: {locus_idx: dosage_value} for counterfactual variant interventions.
        """
        if broken_interactions is None:
            broken_interactions = set()
        if broken_pairs is None:
            broken_pairs = set()

        locus_count = len(h1)
        h1_eff = list(h1)
        h2_eff = list(h2)

        # If overridden alleles is specified (e.g. reverting variant to 0)
        if overridden_alleles:
            for idx, val in overridden_alleles.items():
                if 0 <= idx < locus_count:
                    # Allocate overridden dosage across homologs
                    if val == 0:
                        h1_eff[idx] = 0
                        h2_eff[idx] = 0
                    elif val == 1:
                        h1_eff[idx] = 1
                        h2_eff[idx] = 0
                    else:
                        h1_eff[idx] = 1
                        h2_eff[idx] = 1

        dosage = [h1_eff[i] + h2_eff[i] for i in range(locus_count)]

        # 1. Base value
        base = self.config.base_value

        # 2. Additive effects
        additive_total = 0.0
        additive_details: Dict[str, float] = {}
        for locus_id, coef in self.config.additive.items():
            idx = self._get_locus_index(locus_id)
            if 0 <= idx < locus_count:
                val = dosage[idx] * coef
                additive_total += val
                if val != 0:
                    additive_details[locus_id] = val

        # 3. Dominance-like effects
        dominance_total = 0.0
        dominance_details: Dict[str, float] = {}
        for locus_id, coef in self.config.dominance.items():
            idx = self._get_locus_index(locus_id)
            if 0 <= idx < locus_count:
                is_het = 1.0 if dosage[idx] == 1 else 0.0
                val = is_het * coef
                dominance_total += val
                if val != 0:
                    dominance_details[locus_id] = val

        # 3b. Recessive-like effects (homozygous alternative: dosage == 2)
        recessive_total = 0.0
        recessive_details: Dict[str, float] = {}
        for locus_id, coef in self.config.recessive.items():
            idx = self._get_locus_index(locus_id)
            if 0 <= idx < locus_count:
                is_hom_alt = 1.0 if dosage[idx] == 2 else 0.0
                val = is_hom_alt * coef
                recessive_total += val
                if val != 0:
                    recessive_details[locus_id] = val

        # 4. Epistatic interactions
        epistatic_total = 0.0
        epistatic_details: Dict[str, float] = {}

        for pair in self.config.epistasis:
            if pair.id in broken_interactions:
                continue

            idx_a = pair.locus_a_pos - 1
            idx_b = pair.locus_b_pos - 1

            if not (0 <= idx_a < locus_count and 0 <= idx_b < locus_count):
                continue

            if broken_pairs and ((idx_a, idx_b) in broken_pairs or (idx_b, idx_a) in broken_pairs):
                continue

            if self.config.mode == "cis_haplotype":
                h1_active = 1 if (h1_eff[idx_a] == 1 and h1_eff[idx_b] == 1) else 0
                h2_active = 1 if (h2_eff[idx_a] == 1 and h2_eff[idx_b] == 1) else 0
                active_count = h1_active + h2_active
                val = active_count * pair.coefficient
            else:
                val = (dosage[idx_a] * dosage[idx_b]) * pair.coefficient

            epistatic_total += val
            if val != 0:
                epistatic_details[pair.id] = val

        # 5. Stochastic Environmental Noise
        noise_val = 0.0
        if self.config.noise_sigma > 0:
            import hashlib
            gt_repr = f"{self.config.noise_seed}:{h1_eff}:{h2_eff}".encode()
            hash_int = int(hashlib.sha256(gt_repr).hexdigest()[:8], 16)
            u = (hash_int / 0xFFFFFFFF)
            pseudo_normal = (u - 0.5) * 3.464  # Unit variance uniform-derived noise
            noise_val = pseudo_normal * self.config.noise_sigma

        total = base + additive_total + dominance_total + recessive_total + epistatic_total + noise_val

        if self.config.threshold is not None:
            total = float(total >= self.config.threshold)

        # Build formula string
        formula_parts = []
        if base != 0:
            formula_parts.append(f"{base}")
        for loc, coef in self.config.additive.items():
            formula_parts.append(f"{coef}*{loc}")
        for loc, coef in self.config.dominance.items():
            formula_parts.append(f"{coef}*Dom({loc})")
        for loc, coef in self.config.recessive.items():
            formula_parts.append(f"{coef}*Rec({loc})")
        for pair in self.config.epistasis:
            formula_parts.append(f"{pair.coefficient}*({pair.locus_a}Ã—{pair.locus_b})")
        if noise_val != 0:
            formula_parts.append(f"Noise({round(noise_val, 2)})")

        formula_str = "P = " + " + ".join(formula_parts) if formula_parts else "P = 0"

        if self.config.threshold is not None:
            formula_str = f"P = 1[latent >= {self.config.threshold}], latent: " + formula_str

        return PhenotypeBreakdown(
            total=total,
            base_value=base,
            additive_component=additive_total,
            dominance_component=dominance_total,
            recessive_component=recessive_total,
            epistatic_component=epistatic_total,
            noise_component=noise_val,
            additive_details=additive_details,
            dominance_details=dominance_details,
            recessive_details=recessive_details,
            epistatic_details=epistatic_details,
            formula_expression=formula_str,
        )


def get_default_demo_phenotype_config() -> PhenotypeConfig:
    """Returns the deterministic demo configuration matching the scientific proposal."""
    return PhenotypeConfig(
        base_value=0.0,
        additive={
            "L05": 2.0,
            "L10": 2.0,
            "L18": 1.0,
            "L25": 3.0,
            "L31": 3.0,
            "L42": 1.0,
        },
        dominance={
            "L15": 1.5,
            "L35": 2.0,
        },
        epistasis=[
            EpistaticPair(
                id="E_L10_L31",
                locus_a="L10",
                locus_b="L31",
                locus_a_pos=10,
                locus_b_pos=31,
                coefficient=16.0,
                description="Primary epistatic pair assembled via Parent A crossover",
            ),
            EpistaticPair(
                id="E_L18_L42",
                locus_a="L18",
                locus_b="L42",
                locus_a_pos=18,
                locus_b_pos=42,
                coefficient=4.2,
                description="Secondary epistatic pair",
            ),
        ],
        mode="cis_haplotype",
    )
