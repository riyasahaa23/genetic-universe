"""Candidate Pairwise Genetic Interaction & Epistasis Layer.

Formulates candidate epistatic interactions among child variants and configurations.
All generated interactions are strictly labeled with evidence_status = "hypothesis",
clearly distinguished from observed genotypes and inferred haplotype blocks.

Mathematical formulation:
  Phenotypic expectation under epistasis:
    E[Y] = mu + sum_i beta_i x_i + sum_{i < j} gamma_{ij} x_i x_j
  where:
    x_i is the allele dosage (0, 1, 2) of variant i in the child
    beta_i is the marginal additive effect of variant i
    gamma_{ij} is the pairwise epistatic coefficient between loci i and j

Interaction candidate categories:
  1. inter_homolog_biparental_pair: One variant inherited from Parent A and one from Parent B,
     forming a diploid genotype combination not present in either parent alone.
  2. intra_block_cis_pair: Two variants inherited on the same parental haplotype block,
     co-transmitted as an intact haplotype segment.
  3. recombination_adjacent_pair: Variant pair flanking or spanning a candidate meiotic switch interval.
  4. general_candidate_pair: Other pairs forming child-specific genotype combinations.
"""
from typing import Literal

from .models import (
    ChildState,
    EpistaticInteractionCandidate,
    InteractionResponse,
    Warning,
)

INTERACTION_LIMITATIONS = [
    "Candidate genetic interactions are structural and transmission hypotheses; biological epistasis requires wet-lab validation",
    "Ranking scores are evidence-prioritization heuristics, not calibrated thermodynamic or biochemical affinities",
    "Presence of an inter-homolog pair does not demonstrate functional synergy or phenotypic consequence",
    "Pairwise discovery is bounded to observed child variants within the query region",
]


def find_candidate_interactions(
    state: ChildState,
    max_distance_bp: int = 500_000,
    max_candidates: int = 50,
) -> list[EpistaticInteractionCandidate]:
    """Discover candidate pairwise interactions from child variants and configurations."""
    candidates: list[EpistaticInteractionCandidate] = []
    variants = sorted(state.variants, key=lambda v: v.position)
    computation_id = state.provenance.computation_id

    # Index recombination intervals and segments
    recomb_events = state.recombination_events

    # Identify child-specific configuration variant IDs
    config_variant_ids = set()
    for cfg in state.configurations:
        config_variant_ids.update(cfg.variant_ids)

    n_vars = len(variants)
    for i in range(n_vars):
        v_a = variants[i]
        for j in range(i + 1, n_vars):
            v_b = variants[j]
            dist = abs(v_b.position - v_a.position)
            if dist > max_distance_bp:
                continue

            # Classify interaction type
            int_type: Literal[
                "inter_homolog_biparental_pair",
                "intra_block_cis_pair",
                "recombination_adjacent_pair",
                "general_candidate_pair"
            ] = "general_candidate_pair"
            recomb_id = None
            involved_blocks = sorted(list(set(v_a.segment_ids + v_b.segment_ids)))
            rationale_parts = []

            # Check if pair flanks or spans a recombination candidate
            for ev in recomb_events:
                if (v_a.position <= ev.start and v_b.position >= ev.end) or \
                   (ev.start <= v_a.position <= ev.end) or (ev.start <= v_b.position <= ev.end):
                    int_type = "recombination_adjacent_pair"
                    recomb_id = ev.id
                    rationale_parts.append(f"Pair flanks/spans candidate switch interval {ev.id}")
                    break

            # Check if inter-homolog biparental pair
            if int_type != "recombination_adjacent_pair":
                if (v_a.origin == "parent_A" and v_b.origin == "parent_B") or \
                   (v_a.origin == "parent_B" and v_b.origin == "parent_A"):
                    int_type = "inter_homolog_biparental_pair"
                    rationale_parts.append(f"Biparental combination: {v_a.id} ({v_a.origin}) + {v_b.id} ({v_b.origin})")
                elif set(v_a.segment_ids) & set(v_b.segment_ids) and v_a.segment_ids:
                    int_type = "intra_block_cis_pair"
                    common_block = next(iter(set(v_a.segment_ids) & set(v_b.segment_ids)))
                    rationale_parts.append(f"Intra-block cis pair co-transmitted on haplotype block {common_block}")
                elif v_a.id in config_variant_ids or v_b.id in config_variant_ids:
                    rationale_parts.append("Involves variant in child-specific genotype configuration")
                else:
                    rationale_parts.append(f"Syntenic pair within {dist} bp on chromosome {v_a.chromosome}")

            # Heuristic ranking score
            type_base_scores = {
                "recombination_adjacent_pair": 10.0,
                "inter_homolog_biparental_pair": 8.0,
                "intra_block_cis_pair": 6.0,
                "general_candidate_pair": 4.0,
            }
            base = type_base_scores[int_type]
            # Proximity bonus (up to +4.0 for very close markers)
            prox_bonus = max(0.0, 4.0 * (1.0 - (dist / max_distance_bp)))
            # Configuration bonus
            cfg_bonus = 2.0 if (v_a.id in config_variant_ids and v_b.id in config_variant_ids) else (
                1.0 if (v_a.id in config_variant_ids or v_b.id in config_variant_ids) else 0.0
            )
            ranking_score = round(base + prox_bonus + cfg_bonus, 3)

            cand_id = f"epi:{v_a.chromosome}:{v_a.position}_{v_b.position}"
            formula = f"gamma_({v_a.id}x{v_b.id}) * (dosage_{v_a.id} * dosage_{v_b.id})"

            candidates.append(
                EpistaticInteractionCandidate(
                    id=cand_id,
                    variant_a_id=v_a.id,
                    variant_b_id=v_b.id,
                    variant_a_pos=v_a.position,
                    variant_b_pos=v_b.position,
                    variant_a_origin=v_a.origin,
                    variant_b_origin=v_b.origin,
                    interaction_type=int_type,
                    genomic_distance_bp=dist,
                    child_genotypes={
                        v_a.id: v_a.child_genotype.alleles,
                        v_b.id: v_b.child_genotype.alleles,
                    },
                    parental_sources={
                        v_a.id: v_a.origin,
                        v_b.id: v_b.origin,
                    },
                    evidence_status="hypothesis",
                    formula_component=formula,
                    ranking_score=ranking_score,
                    recombination_event_id=recomb_id,
                    block_ids=involved_blocks,
                    biological_rationale="; ".join(rationale_parts),
                    provenance=[computation_id, *v_a.provenance, *v_b.provenance],
                )
            )

    # Sort descending by ranking_score
    candidates.sort(key=lambda c: (-c.ranking_score, c.genomic_distance_bp, c.id))
    return candidates[:max_candidates]


def build_interaction_response(
    state: ChildState,
    max_distance_bp: int = 500_000,
    max_candidates: int = 50,
) -> InteractionResponse:
    """Generate structured interaction response for API consumption."""
    candidates = find_candidate_interactions(state, max_distance_bp=max_distance_bp, max_candidates=max_candidates)

    counts: dict[str, int] = {}
    for c in candidates:
        counts[c.interaction_type] = counts.get(c.interaction_type, 0) + 1

    warnings = list(state.warnings)
    warnings.append(
        Warning(
            code="HYPOTHETICAL_INTERACTION_CANDIDATES",
            message=(
                "All candidate interactions are computational hypotheses. "
                "Functional epistasis requires empirical molecular or cellular validation."
            ),
        )
    )

    return InteractionResponse(
        family_id=state.family_id,
        total_candidates=len(candidates),
        interaction_type_counts=counts,
        candidates=candidates,
        warnings=warnings,
        provenance=state.provenance,
        limitations=INTERACTION_LIMITATIONS,
    )
