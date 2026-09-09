"""
Novelty Detection Engine
Determines whether an offspring phenotype is transgressive (exceeds parental range),
calculating margin, direction, and significance relative to parental phenotypes.
"""
from dataclasses import dataclass
from typing import Any, Dict, Optional


@dataclass
class NoveltyAssessment:
    parent_a: float
    parent_b: float
    offspring: float
    parental_min: float
    parental_max: float
    is_transgressive: bool
    novelty_margin: float
    direction: str  # "above_range", "below_range", or "within_range"
    percent_transgression: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "parent_a": round(self.parent_a, 4),
            "parent_b": round(self.parent_b, 4),
            "offspring": round(self.offspring, 4),
            "parental_min": round(self.parental_min, 4),
            "parental_max": round(self.parental_max, 4),
            "is_transgressive": self.is_transgressive,
            "novelty_margin": round(self.novelty_margin, 4),
            "direction": self.direction,
            "percent_transgression": round(self.percent_transgression, 2),
        }


def detect_novelty(
    parent_a_phenotype: float,
    parent_b_phenotype: float,
    offspring_phenotype: float,
    tolerance: float = 1e-6,
) -> NoveltyAssessment:
    """
    Evaluates transgressive segregation for scalar quantitative traits.
    Parental range = [min(y_A, y_B), max(y_A, y_B)].
    Novelty occurs when y_O lies strictly outside this interval.
    """
    p_min = min(parent_a_phenotype, parent_b_phenotype)
    p_max = max(parent_a_phenotype, parent_b_phenotype)
    p_range = p_max - p_min if (p_max - p_min) > 0 else 1.0

    if offspring_phenotype > (p_max + tolerance):
        is_trans = True
        margin = offspring_phenotype - p_max
        direction = "above_range"
        pct = (margin / p_range) * 100.0
    elif offspring_phenotype < (p_min - tolerance):
        is_trans = True
        margin = p_min - offspring_phenotype
        direction = "below_range"
        pct = (margin / p_range) * 100.0
    else:
        is_trans = False
        margin = 0.0
        direction = "within_range"
        pct = 0.0

    return NoveltyAssessment(
        parent_a=parent_a_phenotype,
        parent_b=parent_b_phenotype,
        offspring=offspring_phenotype,
        parental_min=p_min,
        parental_max=p_max,
        is_transgressive=is_trans,
        novelty_margin=margin,
        direction=direction,
        percent_transgression=pct,
    )


@dataclass
class ComprehensiveNoveltyReport:
    """
    Formally decouples 4 independent levels of biological novelty:
    1. Genotypic Novelty: Child diploid genotype not observed in either parent (e.g. homozygous recessive).
    2. Haplotypic Novelty: New combination of inherited parental segments across chromosomes.
    3. Recombination-Supported Novelty: Configuration bounded by an inferred homolog-switch interval.
    4. Phenotypic Novelty: Offspring quantitative trait outside defined parental phenotype range.
    """
    genotypic_novelty: bool
    haplotypic_novelty: bool
    recombination_supported_novelty: bool
    phenotypic_novelty: bool
    genotypic_novelty_count: int
    haplotypic_novelty_count: int
    phenotypic_assessment: Optional[NoveltyAssessment]
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "genotypic_novelty": self.genotypic_novelty,
            "haplotypic_novelty": self.haplotypic_novelty,
            "recombination_supported_novelty": self.recombination_supported_novelty,
            "phenotypic_novelty": self.phenotypic_novelty,
            "genotypic_novelty_count": self.genotypic_novelty_count,
            "haplotypic_novelty_count": self.haplotypic_novelty_count,
            "phenotypic_assessment": self.phenotypic_assessment.to_dict() if self.phenotypic_assessment else None,
            "summary": self.summary,
        }


def classify_multitype_novelty(
    child_specific_genotypes_count: int,
    recombination_intervals_count: int,
    haplotypic_segments_count: int,
    parent_a_phenotype: Optional[float] = None,
    parent_b_phenotype: Optional[float] = None,
    offspring_phenotype: Optional[float] = None,
) -> ComprehensiveNoveltyReport:
    """Classify multitype novelty ensuring real genotypic novelty is never falsely equated with phenotypic novelty."""
    has_genotypic = child_specific_genotypes_count > 0
    has_recomb = recombination_intervals_count > 0
    has_haplotypic = haplotypic_segments_count > 1

    pheno_assess = None
    has_phenotypic = False

    if parent_a_phenotype is not None and parent_b_phenotype is not None and offspring_phenotype is not None:
        pheno_assess = detect_novelty(parent_a_phenotype, parent_b_phenotype, offspring_phenotype)
        has_phenotypic = pheno_assess.is_transgressive

    summary_parts = []
    if has_genotypic:
        summary_parts.append(f"{child_specific_genotypes_count} child-specific genotypic configurations (Mendelian recessives)")
    if has_haplotypic:
        summary_parts.append(f"{haplotypic_segments_count} transmitted segments")
    if has_recomb:
        summary_parts.append(f"{recombination_intervals_count} candidate switch intervals")
    if has_phenotypic and pheno_assess:
        summary_parts.append(f"Phenotypic transgression (+{round(pheno_assess.novelty_margin, 2)})")
    elif pheno_assess:
        summary_parts.append("Phenotype within parental range (No phenotypic novelty)")
    else:
        summary_parts.append("Phenotype data NULL_REAL (Phenotypic novelty unavailable)")

    return ComprehensiveNoveltyReport(
        genotypic_novelty=has_genotypic,
        haplotypic_novelty=has_haplotypic,
        recombination_supported_novelty=has_recomb,
        phenotypic_novelty=has_phenotypic,
        genotypic_novelty_count=child_specific_genotypes_count,
        haplotypic_novelty_count=haplotypic_segments_count,
        phenotypic_assessment=pheno_assess,
        summary="; ".join(summary_parts),
    )
