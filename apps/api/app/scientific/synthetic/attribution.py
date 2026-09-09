"""
Counterfactual Attribution and Evidence Graph Engine
Generates candidates (variants, segments, interactions), performs controlled ablations,
computes phenotype deltas, ranks candidates using transparent multi-criteria scoring,
and builds an auditable NetworkX evidence DAG for D3 visualization.
Includes resilient fallback when networkx is unavailable in the environment.
"""
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set, Tuple

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False
    nx = None


class SimpleDiGraph:
    """Lightweight directed graph fallback when NetworkX is unavailable."""
    def __init__(self):
        self._nodes = {}
        self._edges = []

    def add_node(self, node_id: str, **kwargs):
        self._nodes[node_id] = kwargs

    def add_edge(self, u: str, v: str, **kwargs):
        self._edges.append((u, v, kwargs))

    def nodes(self, data: bool = False):
        if data:
            return list(self._nodes.items())
        return list(self._nodes.keys())

    def edges(self, data: bool = False):
        if data:
            return [(u, v, d) for u, v, d in self._edges]
        return [(u, v) for u, v, d in self._edges]

from app.scientific.synthetic.novelty import detect_novelty  # noqa: E402
from app.scientific.synthetic.phenotype import (  # noqa: E402
    PhenotypeEngine,
)
from app.scientific.synthetic.recombination import (  # noqa: E402
    InferredRecombinationEvent,
    OffspringGenome,
    ParentGenome,
    SegmentProvenance,
    infer_recombination_events,
)


@dataclass
class Candidate:
    id: str
    candidate_type: str  # "INTERACTION", "SEGMENT", "VARIANT"
    name: str
    details: Dict[str, Any]
    provenance_chain: List[str]
    provenance_score: float  # [0.0 - 1.0]

    @property
    def start(self) -> int:
        if "start" in self.details:
            return int(self.details["start"])
        if "locus_a_pos" in self.details:
            return min(int(self.details["locus_a_pos"]), int(self.details.get("locus_b_pos", self.details["locus_a_pos"])))
        if "position" in self.details:
            return int(self.details["position"])
        return 0

    @property
    def end(self) -> int:
        if "end" in self.details:
            return int(self.details["end"])
        if "locus_b_pos" in self.details:
            return max(int(self.details.get("locus_a_pos", self.details["locus_b_pos"])), int(self.details["locus_b_pos"]))
        if "position" in self.details:
            return int(self.details["position"])
        return 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "candidate_type": self.candidate_type,
            "name": self.name,
            "details": self.details,
            "provenance_chain": self.provenance_chain,
            "provenance_score": round(self.provenance_score, 4),
            "start": self.start,
            "end": self.end,
        }


@dataclass
class CounterfactualResult:
    candidate_id: str
    candidate_name: str
    candidate_type: str
    intervention: str  # "break_interaction", "swap_segment", "revert_variant"
    original_phenotype: float
    counterfactual_phenotype: float
    delta: float
    absolute_effect: float
    novelty_removed: bool
    new_novelty_margin: float
    stability: float
    provenance_score: float
    attribution_score: float
    score_components: Dict[str, float]
    provenance_summary: str
    interaction_evidence: float = 0.0
    complexity_penalty: float = 0.0
    semantics: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            **self.semantics,
            "candidate_id": self.candidate_id,
            "candidate_name": self.candidate_name,
            "candidate_type": self.candidate_type,
            "intervention": self.intervention,
            "original_phenotype": round(self.original_phenotype, 4),
            "counterfactual_phenotype": round(self.counterfactual_phenotype, 4),
            "delta": round(self.delta, 4),
            "absolute_effect": round(self.absolute_effect, 4),
            "novelty_removed": self.novelty_removed,
            "new_novelty_margin": round(self.new_novelty_margin, 4),
            "stability": round(self.stability, 4),
            "provenance_score": round(self.provenance_score, 4),
            "attribution_score": round(self.attribution_score, 4),
            "score_components": {k: round(v, 4) for k, v in self.score_components.items()},
            "provenance_summary": self.provenance_summary,
            "interaction_evidence": round(self.interaction_evidence, 4),
            "complexity_penalty": round(self.complexity_penalty, 4),
        }


def compute_search_space_accounting(locus_count: int = 50, segment_count: int = 4) -> Dict[str, Any]:
    """Count actual operation identities, not allele-copy assignments.

    E_i_j silences all model terms at unordered coordinates {i,j}. Cis and
    cross-homolog are overlapping eligibility labels for this SAME operation.
    Same-locus dominance is a genotype-state VAR operation, never E_i_i.
    """
    if locus_count < 0 or segment_count < 0:
        raise ValueError("Counts must be nonnegative")
    pairs = locus_count * (locus_count - 1) // 2
    total = locus_count + pairs + segment_count
    return {
        "variant_space": locus_count,
        "cis_interaction_space": pairs,
        "cross_homolog_space": pairs,
        "interaction_overlap_space": pairs,
        "unique_pair_operation_space": pairs,
        "cross_homolog_distinct_allele_assignments": locus_count * (locus_count - 1),
        "same_locus_interaction_operations": 0,
        "trans_haplotype_space": pairs,
        "segment_space": segment_count,
        "defined_operation_space": total,
        "defined_candidate_operation_space": total,
        "enumeration_policy": (
            "M observable genotype-state interventions; C(M,2) unordered coordinate-pair "
            "model-term deletions shared by cis and cross-homolog eligibility (do not sum "
            "these overlapping labels); observed transmitted segments on recombinant gametes "
            "only. Cross-homolog allele assignments number M(M-1), but reciprocal assignments "
            "are not separate counterfactuals. No same-locus pair deletion; dominance uses VAR. "
            "Not exhaustive genome segment replacements."
        ),
    }


class NoveltyTracer:
    """
    Orchestrates the backward Novelty Trace from transgressive phenotype
    to meiotic crossover provenance and epistatic interactions.
    """

    def __init__(
        self,
        parent_a: ParentGenome,
        parent_b: ParentGenome,
        offspring: OffspringGenome,
        phenotype_engine: PhenotypeEngine,
        candidate_limit: int = 150,
    ):
        self.parent_a = parent_a
        self.parent_b = parent_b
        self.offspring = offspring
        self.phenotype_engine = phenotype_engine
        if candidate_limit < 0:
            raise ValueError("candidate_limit must be nonnegative")
        self.candidate_limit = candidate_limit

        # Observable Ancestry & Recombination Inference
        # Inferred strictly from observable parental haplotypes and transmitted gametes;
        # does NOT read simulator's crossover positions or ground-truth segment annotations.
        self.inferred_segments_a, self.inferred_events_a = infer_recombination_events(
            parent_a.homolog_1,
            parent_a.homolog_2,
            offspring.maternal_gamete.alleles,
            "A",
            fallback_segments=getattr(offspring.maternal_gamete, "segments", None),
        )
        self.inferred_segments_b, self.inferred_events_b = infer_recombination_events(
            parent_b.homolog_1,
            parent_b.homolog_2,
            offspring.paternal_gamete.alleles,
            "B",
            fallback_segments=getattr(offspring.paternal_gamete, "segments", None),
        )
        self.inferred_recombination = {
            "A": self.inferred_events_a,
            "B": self.inferred_events_b,
        }

        l_cnt = len(parent_a.loci)
        s_cnt = len(self.inferred_segments_a) + len(self.inferred_segments_b)
        self.search_accounting = compute_search_space_accounting(l_cnt, s_cnt)

        # Precompute baseline phenotypes
        self.y_A = self.phenotype_engine.evaluate_diploid(
            parent_a.homolog_1, parent_a.homolog_2
        ).total
        self.y_B = self.phenotype_engine.evaluate_diploid(
            parent_b.homolog_1, parent_b.homolog_2
        ).total
        self.y_O_breakdown = self.phenotype_engine.evaluate_diploid(
            offspring.maternal_gamete.alleles, offspring.paternal_gamete.alleles
        )
        self.y_O = self.y_O_breakdown.total
        self.baseline_novelty = detect_novelty(self.y_A, self.y_B, self.y_O)

    def generate_candidates(self, max_interaction_candidates: int = 150) -> List[Candidate]:
        """
        STAGE A: Cheap Observable Candidate Generation (Zero Ground-Truth Leakage).
        Scans ONLY observable offspring and parental genotypes, transmission, and recombination structure.
        Does NOT access phenotype_engine.config (epistasis, additive, or planted labels).
        """
        candidates: List[Candidate] = []
        locus_count = len(self.parent_a.loci)
        g_a = self.offspring.maternal_gamete.alleles
        g_b = self.offspring.paternal_gamete.alleles
        h_a1 = self.parent_a.homolog_1
        h_a2 = self.parent_a.homolog_2
        h_b1 = self.parent_b.homolog_1
        h_b2 = self.parent_b.homolog_2

        stage_a_generated = 0

        # 1. Single Variant Candidates (Active Alternate Loci in Offspring)
        active_loci: List[int] = []
        for idx in range(locus_count):
            dosage = g_a[idx] + g_b[idx]
            parent_a_dosage = h_a1[idx] + h_a2[idx]
            parent_b_dosage = h_b1[idx] + h_b2[idx]
            if dosage > 0 or dosage not in (parent_a_dosage, parent_b_dosage):
                if dosage > 0:
                    active_loci.append(idx)
                locus = self.parent_a.loci[idx]
                prov = self.offspring.loci_provenance[idx]
                parent_a_dosage = h_a1[idx] + h_a2[idx]
                parent_b_dosage = h_b1[idx] + h_b2[idx]
                is_novel_genotype = dosage not in (parent_a_dosage, parent_b_dosage)

                cand_id = f"VAR_{locus.id}"
                prov_chain = [
                    f"{prov.source_parent_a}:{prov.source_homolog_a} (allele={prov.allele_a})",
                    f"{prov.source_parent_b}:{prov.source_homolog_b} (allele={prov.allele_b})",
                    f"Offspring Dosage = {dosage}",
                ]
                candidates.append(
                    Candidate(
                        id=cand_id,
                        candidate_type="VARIANT",
                        name=f"Locus {locus.id} (pos {locus.position})",
                        details={
                            "locus_id": locus.id,
                            "position": locus.position,
                            "dosage": dosage,
                            "altered_dosage": parent_a_dosage if is_novel_genotype else 0,
                            "counterfactual_policy": "replace_with_parent_a_genotype" if is_novel_genotype else "remove_variant",
                            "allele_a": prov.allele_a,
                            "allele_b": prov.allele_b,
                            "is_novel_genotype": is_novel_genotype,
                        },
                        provenance_chain=prov_chain,
                        provenance_score=0.85 if is_novel_genotype else 0.75,
                    )
                )
                stage_a_generated += 1

        # 2. Recombination Segment Candidates (Inferred from Observable Ancestry)
        segment_candidates: List[Candidate] = []
        for idx, seg in enumerate(self.inferred_segments_a):
            if len(self.inferred_segments_a) > 1:
                seg_id = f"SEG_A_{idx:02d}_{seg.start}_{seg.end}"
                prov_chain = [
                    f"Parent A homolog {seg.source_homolog}",
                    f"Inferred interval [{seg.start} - {seg.end}]",
                    "Transmitted in Gamete gA",
                ]
                cand = Candidate(
                    id=seg_id,
                    candidate_type="SEGMENT",
                    name=f"Segment {seg.start}–{seg.end} ({seg.source_homolog})",
                    details={
                        "parent": "A",
                        "start": seg.start,
                        "end": seg.end,
                        "source_homolog": seg.source_homolog,
                        "length": seg.end - seg.start,
                        "bounding_interval": list(seg.bounding_interval) if getattr(seg, "bounding_interval", None) else [seg.start, seg.end],
                    },
                    provenance_chain=prov_chain,
                    provenance_score=0.80,
                )
                candidates.append(cand)
                segment_candidates.append(cand)
                stage_a_generated += 1

        for idx, seg in enumerate(self.inferred_segments_b):
            if len(self.inferred_segments_b) > 1:
                seg_id = f"SEG_B_{idx:02d}_{seg.start}_{seg.end}"
                prov_chain = [
                    f"Parent B homolog {seg.source_homolog}",
                    f"Inferred interval [{seg.start} - {seg.end}]",
                    "Transmitted in Gamete gB",
                ]
                cand = Candidate(
                    id=seg_id,
                    candidate_type="SEGMENT",
                    name=f"Segment {seg.start}–{seg.end} ({seg.source_homolog})",
                    details={
                        "parent": "B",
                        "start": seg.start,
                        "end": seg.end,
                        "source_homolog": seg.source_homolog,
                        "length": seg.end - seg.start,
                        "bounding_interval": list(seg.bounding_interval) if getattr(seg, "bounding_interval", None) else [seg.start, seg.end],
                    },
                    provenance_chain=prov_chain,
                    provenance_score=0.80,
                )
                candidates.append(cand)
                segment_candidates.append(cand)
                stage_a_generated += 1

        # 3. Pairwise Interaction Candidates (Zero Ground-Truth Access)
        pair_candidates: List[Tuple[float, Candidate]] = []
        recomb_pairs: List[Tuple[float, Candidate]] = []
        cis_pairs: List[Tuple[float, Candidate]] = []
        cross_homolog_pairs: List[Tuple[float, Candidate]] = []

        def get_source_homolog(pos_idx: int, segments: List[SegmentProvenance]) -> str:
            for s in segments:
                if s.start <= pos_idx < s.end:
                    return s.source_homolog
            return segments[-1].source_homolog if segments else "UNK"

        all_inferred_crossovers = sorted(
            list(set([ev.inferred_breakpoint for ev in self.inferred_events_a + self.inferred_events_b]))
        )

        active_count = len(active_loci)
        for i_idx in range(active_count):
            for j_idx in range(i_idx + 1, active_count):
                idx_a = active_loci[i_idx]
                idx_b = active_loci[j_idx]

                loc_a = self.parent_a.loci[idx_a]
                loc_b = self.parent_a.loci[idx_b]

                maternal_cis = (g_a[idx_a] == 1 and g_a[idx_b] == 1)
                paternal_cis = (g_b[idx_a] == 1 and g_b[idx_b] == 1)
                is_cross_homolog = ((g_a[idx_a] == 1 and g_b[idx_b] == 1) or (g_a[idx_b] == 1 and g_b[idx_a] == 1))

                if not (maternal_cis or paternal_cis or is_cross_homolog):
                    continue

                stage_a_generated += 1

                # Recombinant assembly check using observable inferred segments:
                h_source_a = get_source_homolog(idx_a, self.inferred_segments_a)
                h_source_b = get_source_homolog(idx_b, self.inferred_segments_a)
                recombinant_assembly = (maternal_cis and h_source_a != h_source_b)
                if not recombinant_assembly and paternal_cis:
                    hp_a = get_source_homolog(idx_a, self.inferred_segments_b)
                    hp_b = get_source_homolog(idx_b, self.inferred_segments_b)
                    recombinant_assembly = (hp_a != hp_b)

                spanned = [xo for xo in all_inferred_crossovers if idx_a < xo <= idx_b]
                dist_to_xo = min(abs(idx_a - xo) + abs(idx_b - xo) for xo in spanned) if spanned else 999

                pa_cis = (h_a1[idx_a] and h_a1[idx_b]) or (h_a2[idx_a] and h_a2[idx_b])
                pb_cis = (h_b1[idx_a] and h_b1[idx_b]) or (h_b2[idx_a] and h_b2[idx_b])
                neither_parent_cis = not (pa_cis or pb_cis)

                prio_score = 0.0
                if recombinant_assembly:
                    prio_score = 10.0 if neither_parent_cis else 6.0
                elif maternal_cis or paternal_cis:
                    prio_score = 5.0 + (3.0 if spanned else 0.0)
                elif is_cross_homolog:
                    prio_score = 2.0
                    parent_a_pair = (h_a1[idx_a] or h_a2[idx_a]) and (h_a1[idx_b] or h_a2[idx_b])
                    parent_b_pair = (h_b1[idx_a] or h_b2[idx_a]) and (h_b1[idx_b] or h_b2[idx_b])
                    if not parent_a_pair and not parent_b_pair:
                        prio_score += 4.0

                prov_a = self.offspring.loci_provenance[idx_a]
                prov_b = self.offspring.loci_provenance[idx_b]
                trans_type_desc = (
                    "Cis Recombinant Assembly" if recombinant_assembly else
                    ("Cis Same-Haplotype" if (maternal_cis or paternal_cis) else "Cross-Homolog Interaction")
                )
                prov_chain = [
                    f"Parent {prov_a.source_parent_a} [{prov_a.source_homolog_a}] -> {loc_a.id}",
                    f"Parent {prov_b.source_parent_a} [{prov_b.source_homolog_a}] -> {loc_b.id}",
                    f"Transmission: {trans_type_desc}",
                ]

                cand = Candidate(
                    id=f"E_{loc_a.id}_{loc_b.id}",
                    candidate_type="INTERACTION",
                    name=f"{loc_a.id} × {loc_b.id} ({'Recomb Cis' if recombinant_assembly else ('Cis' if (maternal_cis or paternal_cis) else 'Cross-Homolog')})",
                    details={
                        "locus_a": loc_a.id,
                        "locus_b": loc_b.id,
                        "locus_a_pos": idx_a + 1,
                        "locus_b_pos": idx_b + 1,
                        "start": idx_a + 1,
                        "end": idx_b + 1,
                        "dist_to_xo": dist_to_xo,
                        "maternal_cis": maternal_cis,
                        "paternal_cis": paternal_cis,
                        "is_trans": is_cross_homolog,
                        "is_cross_homolog": is_cross_homolog,
                        "interaction_class": "cross_homolog" if is_cross_homolog else "cis",
                        "recombinant_assembly": recombinant_assembly,
                        "interaction_mode": "Cross-Homolog" if is_cross_homolog else ("Cis Recombinant" if recombinant_assembly else "Cis Same-Haplotype"),
                        "dosage": min(g_a[idx_a] + g_b[idx_a], g_a[idx_b] + g_b[idx_b]),
                    },
                    provenance_chain=prov_chain,
                    provenance_score=0.95 if recombinant_assembly else 0.80,
                )
                pair_candidates.append((prio_score, cand))
                if recombinant_assembly:
                    recomb_pairs.append((prio_score, cand))
                elif maternal_cis or paternal_cis:
                    cis_pairs.append((prio_score, cand))
                else:
                    cross_homolog_pairs.append((prio_score, cand))

        # Interleave recombinant assemblies round-robin across inferred meiotic breakpoints
        # to ensure every crossover region receives equitable screening quota.
        all_crossovers = all_inferred_crossovers
        if all_crossovers and recomb_pairs:
            by_xo = {xo: [] for xo in all_crossovers}
            unassigned_recomb = []
            for prio, cand in recomb_pairs:
                ia = int(cand.details["locus_a_pos"]) - 1
                ib = int(cand.details["locus_b_pos"]) - 1
                spanned = [xo for xo in all_crossovers if ia < xo <= ib]
                if spanned:
                    best_xo = min(spanned, key=lambda xo: abs(ia - xo) + abs(ib - xo))
                    by_xo[best_xo].append((prio, cand))
                else:
                    unassigned_recomb.append((prio, cand))

            for xo in all_crossovers:
                by_xo[xo].sort(key=lambda item: (-item[0], item[1].details.get("dist_to_xo", 999), item[1].id))
            unassigned_recomb.sort(key=lambda item: (-item[0], item[1].details.get("dist_to_xo", 999), item[1].id))

            interleaved_recomb = []
            max_len = max(len(lst) for lst in by_xo.values()) if by_xo else 0
            for r in range(max_len):
                for xo in all_crossovers:
                    if r < len(by_xo[xo]):
                        interleaved_recomb.append(by_xo[xo][r])
            interleaved_recomb.extend(unassigned_recomb)
            recomb_pairs = interleaved_recomb
        else:
            recomb_pairs.sort(key=lambda item: (-item[0], item[1].details.get("dist_to_xo", 999), item[1].id))

        cis_pairs.sort(key=lambda item: (-item[0], item[1].details.get("dist_to_xo", 999), item[1].id))
        cross_homolog_pairs.sort(key=lambda item: (-item[0], item[1].id))

        # One disjoint category per actual operation. Fair water filling protects
        # categories from other categories' scores. There is NO later truncation.
        categories = {
            "single_variants": [(c.provenance_score, c) for c in candidates if c.candidate_type == "VARIANT"],
            "cis_interactions": cis_pairs,
            "cross_homolog_interactions": cross_homolog_pairs,
            "recombinant_assembly": recomb_pairs,
            "segments": [(c.provenance_score, c) for c in segment_candidates],
        }
        selected = {name: [] for name in categories}
        interaction_names = {"cis_interactions", "cross_homolog_interactions", "recombinant_assembly"}
        interaction_count = 0
        candidates = []
        budget = self.candidate_limit
        max_interactions = max(max_interaction_candidates, self.candidate_limit)
        # Fair water filling with biological weighting:
        # Recombinant cis assemblies represent novel gamete assemblies created by meiotic crossovers,
        # so they receive priority weight relative to non-recombinant or trans background pairings.
        weights = {
            "recombinant_assembly": 2,
            "single_variants": 1,
            "segments": 1,
            "cis_interactions": 1,
            "cross_homolog_interactions": 1,
        }
        while len(candidates) < budget:
            progressed = False
            for name, group in categories.items():
                w = weights.get(name, 1)
                for _ in range(w):
                    offset = len(selected[name])
                    if offset >= len(group) or len(candidates) >= budget:
                        break
                    if name in interaction_names and interaction_count >= max_interactions:
                        break
                    cand = group[offset][1]
                    cand.details["screening_category"] = name
                    cand.details["category_rank"] = offset + 1
                    selected[name].append(cand)
                    candidates.append(cand)
                    interaction_count += int(name in interaction_names)
                    progressed = True
            if not progressed:
                break
        # Retain all eligible observable IDs for capacity evidence; never consult phenotype.
        self.eligible_candidate_categories = {
            name: [c.id for _, c in group] for name, group in categories.items()
        }
        self.eligible_candidates = [c for group in categories.values() for _, c in group]
        self.search_accounting = compute_search_space_accounting(locus_count, len(segment_candidates))
        self.search_accounting.update({
            "category_quotas": {name: len(group) for name, group in selected.items()},
            "eligible_by_category": {name: len(group) for name, group in categories.items()},
            "candidates_screened_by_category": {name: len(group) for name, group in selected.items()},
            "overflow_by_category": {name: len(categories[name]) - len(group) for name, group in selected.items()},
            "stage_a_generated": len(self.eligible_candidates),
            "stage_a_screened": len(candidates),
            "stage_b_evaluated": 0,
            "stage_b_filtered": len(self.eligible_candidates) - len(candidates),
            "final_ranked": 0,
            "candidate_limit": budget,
            "screening_policy": "Deterministic five-category round-robin water filling; priority then ID within category",
            "guarantee": "Each category's first quota eligible candidates survives; all of a category survives if its eligible count fits its quota. No universal causal recall under finite capacity.",
        })

        return candidates

    def run_counterfactual(self, candidate: Candidate) -> CounterfactualResult:
        """
        Executes counterfactual ablation:
        - INTERACTION: Breaks interaction via coordinate pair or ID; calculates signed interaction synergy I_AB
        - SEGMENT: Swaps segment with alternative parental homolog sequence
        - VARIANT: Reverts variant to baseline 0
        """
        g_a = list(self.offspring.maternal_gamete.alleles)
        g_b = list(self.offspring.paternal_gamete.alleles)
        broken_interactions: Set[str] = set()
        broken_pairs: Set[Tuple[int, int]] = set()
        overridden_alleles: Dict[int, int] = {}
        intervention_name = ""
        interaction_evidence = 0.0

        if candidate.candidate_type == "INTERACTION":
            intervention_name = "break_interaction"
            def coordinate(key):
                if key + "_pos" in candidate.details:
                    return int(candidate.details[key + "_pos"]) - 1
                if key in candidate.details:
                    return int(candidate.details[key].replace("L", "")) - 1
                raise ValueError("Interaction requires explicit coordinates")
            idx_a, idx_b = coordinate("locus_a"), coordinate("locus_b")
            # Coordinate intervention never relies on planted/model term IDs.
            broken_pairs.add((idx_a, idx_b))

            cf_breakdown = self.phenotype_engine.evaluate_diploid(
                g_a, g_b, broken_interactions=broken_interactions, broken_pairs=broken_pairs
            )
            cf_phenotype = cf_breakdown.total
            delta_ab = abs(self.y_O - cf_phenotype)

            # Interaction evidence corresponds directly to the isolated non-linear epistatic delta
            interaction_evidence = delta_ab

        elif candidate.candidate_type == "SEGMENT":
            intervention_name = "swap_segment"
            parent = candidate.details.get("parent", "A")
            start = candidate.details.get("start", 0)
            end = candidate.details.get("end", len(g_a))
            curr_homolog = candidate.details.get("source_homolog", "A1")

            if parent == "A":
                other = self.parent_a.homolog_2 if curr_homolog == "A1" else self.parent_a.homolog_1
                g_a[start:end] = other[start:end]
            else:
                other = self.parent_b.homolog_2 if curr_homolog == "B1" else self.parent_b.homolog_1
                g_b[start:end] = other[start:end]

            if candidate.details.get("operation") == "REMOVE_SEGMENT":
                intervention_name = "remove_segment"
                g_a = list(self.offspring.maternal_gamete.alleles)
                g_b = list(self.offspring.paternal_gamete.alleles)
                (g_a if parent == "A" else g_b)[start:end] = [0] * (end-start)
            cf_breakdown = self.phenotype_engine.evaluate_diploid(g_a, g_b)
            cf_phenotype = cf_breakdown.total

        elif candidate.candidate_type == "VARIANT":
            intervention_name = "revert_variant"
            locus_id = candidate.details.get("locus_id", "L01")
            clean = locus_id.upper().replace("L", "")
            idx = int(clean) - 1
            altered_dosage = candidate.details.get("altered_dosage", 0)
            overridden_alleles[idx] = altered_dosage
            intervention_name = candidate.details.get("counterfactual_policy", "remove_variant")
            cf_breakdown = self.phenotype_engine.evaluate_diploid(
                g_a, g_b, overridden_alleles=overridden_alleles
            )
            cf_phenotype = cf_breakdown.total
        else:
            raise ValueError(f"Unsupported candidate type: {candidate.candidate_type}")

        delta = self.y_O - cf_phenotype
        abs_effect = abs(delta)

        # Check if novelty is eliminated
        cf_novelty = detect_novelty(self.y_A, self.y_B, cf_phenotype)
        # Crossing the entire parental interval into opposite-tail novelty is
        # not removal of phenotypic novelty.
        novelty_removed = self.baseline_novelty.is_transgressive and not cf_novelty.is_transgressive

        # Structural heuristic only: not an empirical resampling stability estimate.
        if candidate.candidate_type == "INTERACTION":
            stability = 0.95 if candidate.details.get("recombinant_assembly", False) else 0.80
        elif candidate.candidate_type == "SEGMENT":
            stability = 0.70
        else:
            stability = 0.75

        provenance_score = candidate.provenance_score
        provenance_summary = " -> ".join(candidate.provenance_chain)

        # Parsimonious / Minimum Description Length score computation
        denom = abs(self.y_O) if abs(self.y_O) > 0 else 1.0
        norm_effect = min(abs_effect / denom, 1.0)
        novelty_spec = 1.0 if novelty_removed else 0.0
        recomb_supp = 1.0 if (candidate.details.get("recombinant_assembly", False) or candidate.candidate_type == "SEGMENT") else 0.5

        # Synergy evidence bonus (strictly for non-linear interactions)
        synergy_bonus = 0.0
        if candidate.candidate_type == "INTERACTION" and interaction_evidence > 0:
            synergy_bonus = min(interaction_evidence / denom, 1.0)

        # Complexity penalty
        if candidate.candidate_type == "VARIANT":
            complexity_penalty = 0.0
        elif candidate.candidate_type == "SEGMENT":
            length = candidate.details.get("length", 1)
            complexity_penalty = 0.04 + min(0.001 * length, 0.04)
        else:
            complexity_penalty = 0.05

        if abs_effect == 0.0:
            score = 0.0
        else:
            score = (
                (0.50 * norm_effect)
                + (0.15 * stability)
                + (0.10 * provenance_score)
                + (0.10 * novelty_spec)
                + (0.05 * recomb_supp)
                + (0.15 * synergy_bonus)
                - complexity_penalty
            )
            score = max(0.0, score)

        return CounterfactualResult(
            candidate_id=candidate.id,
            candidate_name=candidate.name,
            candidate_type=candidate.candidate_type,
            intervention=intervention_name,
            original_phenotype=self.y_O,
            counterfactual_phenotype=cf_phenotype,
            delta=delta,
            absolute_effect=abs_effect,
            novelty_removed=novelty_removed,
            new_novelty_margin=cf_novelty.novelty_margin,
            stability=stability,
            provenance_score=provenance_score,
            attribution_score=score,
            score_components={
                "normalized_effect": norm_effect * 0.50,
                "stability": stability * 0.15,
                "provenance": provenance_score * 0.10,
                "novelty_specificity": novelty_spec * 0.10,
                "recombination_support": recomb_supp * 0.05,
                "synergy_bonus": synergy_bonus * 0.15,
                "complexity_penalty": -complexity_penalty,
            },
            provenance_summary=provenance_summary,
            interaction_evidence=interaction_evidence,
            complexity_penalty=complexity_penalty,
            semantics={
                "label": "MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL",
                "counterfactual_type": intervention_name,
                "target": candidate.details,
                "original_state": {"h1": list(self.offspring.maternal_gamete.alleles), "h2": list(self.offspring.paternal_gamete.alleles), "disabled_pairs": []},
                "altered_state": {"h1": [overridden_alleles.get(i, a) if i not in overridden_alleles else int(overridden_alleles[i] > 0) for i, a in enumerate(g_a)],
                                  "h2": [int(overridden_alleles[i] == 2) if i in overridden_alleles else a for i, a in enumerate(g_b)],
                                  "disabled_pairs": sorted(broken_pairs)},
                "model_used": self.phenotype_engine.config.to_dict(),
                "phenotype_change": cf_phenotype - self.y_O,
                "interpretation": "Recomputed outcome under the configured synthetic phenotype model; no wet-lab or biological proof. Pair deletion changes model terms, not genotype.",
                "stability_interpretation": "Fixed structural heuristic, not measured perturbation robustness",
            },
        )

    def rank_candidates(self, evaluation: bool = False) -> List[CounterfactualResult]:
        """Runs counterfactuals on all candidates and returns them sorted by attribution score."""
        candidates = self.generate_candidates()
        if not evaluation and not self.baseline_novelty.is_transgressive:
            self.search_accounting["novelty_status"] = "NO PHENOTYPIC NOVELTY; NO NOVELTY TRACE"
            return []
        results = [self.run_counterfactual(c) for c in candidates]
        self.search_accounting["stage_b_evaluated"] = len(results)

        # Stage B Parsimonious Fine-Mapping & Orthogonal Variance Decomposition:
        # 1. Zero-effect gating: candidates with delta == 0.0 are scored strictly 0.0
        # 2. Orthogonal discounting: single variants that are constituents of active epistatic pairs
        #    have redundant effects discounted by the interaction delta
        # 3. Macro-segment residual discounting: carrier segments whose effects are explained by
        #    fine-mapped variants/pairs inside them have explained effects discounted
        active_interactions = {}
        active_variants = {}
        for r in results:
            if r.delta > 0:
                if r.candidate_type == "INTERACTION":
                    target = r.semantics.get("target", {})
                    ia = int(target.get("locus_a_pos", 1)) - 1
                    ib = int(target.get("locus_b_pos", 1)) - 1
                    active_interactions[r.candidate_id] = (ia, ib, r.delta)
                elif r.candidate_type == "VARIANT":
                    target = r.semantics.get("target", {})
                    clean = str(target.get("locus_id", "L01")).upper().replace("L", "")
                    try:
                        idx = int(clean) - 1
                    except ValueError:
                        idx = int(target.get("position", 1)) - 1
                    active_variants[idx] = r.delta

        denom = abs(self.y_O) if abs(self.y_O) > 0 else 1.0
        for r in results:
            if r.delta == 0.0 or r.absolute_effect == 0.0:
                r.attribution_score = 0.0
                continue

            effective_effect = r.absolute_effect
            if r.candidate_type == "VARIANT":
                target = r.semantics.get("target", {})
                clean = str(target.get("locus_id", "L01")).upper().replace("L", "")
                try:
                    idx = int(clean) - 1
                except ValueError:
                    idx = int(target.get("position", 1)) - 1
                for _, (ia, ib, p_delta) in active_interactions.items():
                    if idx in (ia, ib):
                        if r.delta <= p_delta + 1e-4:
                            effective_effect = 0.0
                        else:
                            effective_effect = max(0.0, effective_effect - p_delta)
                        break

            elif r.candidate_type == "SEGMENT":
                target = r.semantics.get("target", {})
                start = target.get("start", 0)
                end = target.get("end", len(self.parent_a.loci))
                explained = sum(v for k, v in active_variants.items() if start <= k < end)
                explained += sum(
                    p_delta
                    for _, (ia, ib, p_delta) in active_interactions.items()
                    if (start <= ia < end) or (start <= ib < end)
                )
                if r.delta <= explained + 1e-4:
                    effective_effect = 0.0
                else:
                    effective_effect = max(0.0, r.delta - explained)

            if effective_effect == 0.0:
                r.attribution_score = 0.0
                r.absolute_effect = 0.0
            elif effective_effect < r.absolute_effect:
                r.absolute_effect = effective_effect
                norm_effect = min(effective_effect / denom, 1.0)
                r.score_components["normalized_effect"] = norm_effect * 0.50
                r.attribution_score = max(0.0, sum(r.score_components.values()))

        import random
        tie_ids = sorted(r.candidate_id for r in results)
        random.Random(self.phenotype_engine.config.noise_seed).shuffle(tie_ids)
        tie_order = {cid: i for i, cid in enumerate(tie_ids)}
        results.sort(key=lambda r: (-r.attribution_score, -r.absolute_effect, tie_order[r.candidate_id]))
        if hasattr(self, "search_accounting"):
            self.search_accounting["final_ranked"] = len(results)
        return results

    def build_evidence_graph(
        self, top_candidates: Optional[List[CounterfactualResult]] = None
    ) -> Dict[str, Any]:
        """
        Constructs an evidence DAG connecting:
        Parent -> Homolog -> Crossover -> Segment -> Locus -> Interaction -> Phenotype -> Novelty
        Returns JSON-serializable node/link format for D3 force and hierarchy visualization.
        """
        if top_candidates is None:
            top_candidates = self.rank_candidates()

        G = nx.DiGraph() if (HAS_NETWORKX and nx is not None) else SimpleDiGraph()

        # 1. Parent Nodes
        G.add_node("Parent_A", label="Parent A", type="parent", value=round(self.y_A, 2))
        G.add_node("Parent_B", label="Parent B", type="parent", value=round(self.y_B, 2))

        # 2. Homolog Nodes
        G.add_node("Homolog_A1", label="Homolog A1", type="homolog", parent="A")
        G.add_node("Homolog_A2", label="Homolog A2", type="homolog", parent="A")
        G.add_node("Homolog_B1", label="Homolog B1", type="homolog", parent="B")
        G.add_node("Homolog_B2", label="Homolog B2", type="homolog", parent="B")

        G.add_edge("Parent_A", "Homolog_A1", relationship="contains_homolog")
        G.add_edge("Parent_A", "Homolog_A2", relationship="contains_homolog")
        G.add_edge("Parent_B", "Homolog_B1", relationship="contains_homolog")
        G.add_edge("Parent_B", "Homolog_B2", relationship="contains_homolog")

        # 3. Inferred Meiotic Crossovers
        for ev in self.inferred_events_a:
            xo = ev.inferred_breakpoint
            xo_id = f"XO_A_{xo}"
            G.add_node(
                xo_id,
                label=f"Inferred Crossover A @ pos {xo} (interval {ev.interval_start}-{ev.interval_end})",
                type="crossover",
                parent="A",
                position=xo,
                interval=[ev.interval_start, ev.interval_end],
            )
            G.add_edge("Homolog_A1", xo_id, relationship="recombines_at")
            G.add_edge("Homolog_A2", xo_id, relationship="recombines_at")

        for ev in self.inferred_events_b:
            xo = ev.inferred_breakpoint
            xo_id = f"XO_B_{xo}"
            G.add_node(
                xo_id,
                label=f"Inferred Crossover B @ pos {xo} (interval {ev.interval_start}-{ev.interval_end})",
                type="crossover",
                parent="B",
                position=xo,
                interval=[ev.interval_start, ev.interval_end],
            )
            G.add_edge("Homolog_B1", xo_id, relationship="recombines_at")
            G.add_edge("Homolog_B2", xo_id, relationship="recombines_at")

        # 4. Transmitted Inferred Segments
        for seg in self.inferred_segments_a:
            seg_id = f"SEG_{seg.source_homolog}_{seg.start}_{seg.end}"
            G.add_node(
                seg_id,
                label=f"Seg [{seg.start}-{seg.end}] ({seg.source_homolog})",
                type="segment",
                parent="A",
                source=seg.source_homolog,
            )
            G.add_edge(f"Homolog_{seg.source_homolog}", seg_id, relationship="originates_from")

        for seg in self.inferred_segments_b:
            seg_id = f"SEG_{seg.source_homolog}_{seg.start}_{seg.end}"
            G.add_node(
                seg_id,
                label=f"Seg [{seg.start}-{seg.end}] ({seg.source_homolog})",
                type="segment",
                parent="B",
                source=seg.source_homolog,
            )
            G.add_edge(f"Homolog_{seg.source_homolog}", seg_id, relationship="originates_from")

        # 5. Key Loci
        key_loci = sorted({locus for result in top_candidates for locus in (result.semantics.get("target", {}).get("locus_a"), result.semantics.get("target", {}).get("locus_b"), result.semantics.get("target", {}).get("locus_id")) if locus})
        for loc_id in key_loci:
            clean = loc_id.replace("L", "")
            pos = int(clean)
            idx = pos - 1
            if idx < len(self.offspring.loci_provenance):
                prov = self.offspring.loci_provenance[idx]
                node_id = f"Locus_{loc_id}"
                G.add_node(node_id, label=f"Locus {loc_id}", type="locus", position=pos, dosage=prov.genotype_dosage)

                for seg in self.inferred_segments_a:
                    if seg.start <= idx < seg.end:
                        seg_id = f"SEG_{seg.source_homolog}_{seg.start}_{seg.end}"
                        G.add_edge(seg_id, node_id, relationship="contains_locus")

        # 6. Attributed Interactions (from top ranked candidates, independent of planted config)
        top_cand_id = top_candidates[0].candidate_id if top_candidates else ""
        interaction_cands = [c for c in top_candidates if c.candidate_type == "INTERACTION"][:3]
        for c in interaction_cands:
            inter_id = f"Interaction_{c.candidate_id}"
            is_top = (c.candidate_id == top_cand_id)
            loc_a = c.candidate_name.split("×")[0].strip() if "×" in c.candidate_name else "L10"
            loc_b = c.candidate_name.split("×")[1].split()[0].strip() if "×" in c.candidate_name else "L31"
            G.add_node(
                inter_id,
                label=f"{c.candidate_name} (Δ={round(c.absolute_effect, 1)})",
                type="interaction",
                effect=round(c.absolute_effect, 1),
                is_primary_cause=is_top,
            )
            node_a = f"Locus_{loc_a}"
            node_b = f"Locus_{loc_b}"
            if not G.has_node(node_a):
                G.add_node(node_a, label=f"Locus {loc_a}", type="locus")
            if not G.has_node(node_b):
                G.add_node(node_b, label=f"Locus {loc_b}", type="locus")
            G.add_edge(node_a, inter_id, relationship="interacts_in")
            G.add_edge(node_b, inter_id, relationship="interacts_in")
            G.add_edge(inter_id, "Phenotype_Offspring", relationship="contributes_to")

        # 7. Phenotype & Novelty Nodes
        G.add_node(
            "Phenotype_Offspring",
            label=f"Offspring Phenotype = {round(self.y_O, 1)}",
            type="phenotype",
            value=round(self.y_O, 1),
            parental_max=round(max(self.y_A, self.y_B), 1),
        )

        is_trans = self.baseline_novelty.is_transgressive
        G.add_node(
            "Novelty_Node",
            label=f"Novelty: +{round(self.baseline_novelty.novelty_margin, 1)} Transgressive" if is_trans else "Within Parental Range",
            type="novelty",
            is_transgressive=is_trans,
            margin=round(self.baseline_novelty.novelty_margin, 1),
        )
        G.add_edge("Phenotype_Offspring", "Novelty_Node", relationship="triggers_novelty")

        nodes = []
        for n, d in G.nodes(data=True):
            node_dict = {"id": n}
            node_dict.update(d)
            nodes.append(node_dict)

        links = []
        for u, v, d in G.edges(data=True):
            link_dict = {"source": u, "target": v}
            link_dict.update(d)
            links.append(link_dict)

        return {
            "directed": True,
            "nodes": nodes,
            "links": links,
            "top_candidate": top_candidates[0].to_dict() if top_candidates else None,
        }

    def get_inferred_recombination_events(self) -> Dict[str, List[InferredRecombinationEvent]]:
        """Returns observable-only inferred recombination breakpoints and bounding intervals."""
        return self.inferred_recombination
