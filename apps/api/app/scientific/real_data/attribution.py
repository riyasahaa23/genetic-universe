"""Evidence paths and state interventions; unsupported phenotype effects stay null."""
import hashlib
import json

import networkx as nx

from .configurations import investigate_configurations
from .inheritance import infer_variant
from .models import (
    Candidate,
    ChildState,
    CounterfactualRequest,
    CounterfactualResult,
    EvidenceGraph,
    GraphEdge,
    GraphNode,
    LineageAttribution,
    ScientificAudit,
    TraceResult,
    Warning,
)
from .segments import build_segments

MODEL_LIMITATIONS = [
    "No source-supported variant/configuration-to-phenotype model is available for this family and region",
    "Reported phenotype history does not establish a molecular explanation",
    "A homolog transmission block does not prove a crossover generated a child-specific genotype",
    "Allele-copy counts are inventory metrics and are never phenotype or novelty scores",
    "Phenotype history retained in a hypothetical state is source history, not a predicted post-intervention outcome",
    "Computational interventions do not establish biological causality"]


def scientific_audit(state: ChildState) -> ScientificAudit:
    from .interaction import find_candidate_interactions
    candidate_interactions = find_candidate_interactions(state, max_candidates=100)
    obs_count = len(state.variants) + len(state.phenotype_observations) + 3
    inf_count = len(state.markers) + len(state.segments) + len(state.configurations)
    hyp_count = len(candidate_interactions) + (len(state.variants) if state.state_status == "hypothetical" else 0)
    unres_count = len(state.unresolved_regions)

    return ScientificAudit(
        family_id=state.family_id,
        real_data=state.provenance.dataset_kind == "real",
        phenotype_available=state.phenotype_available,
        phenotype_status=state.phenotype_status,
        phenotype_model_available=False,
        recombination_evidence_available=bool(state.recombination_events or state.segments),
        candidate_interactions_count=len(candidate_interactions),
        recombination_evidence="source_supported_candidate_recombination_intervals" if state.recombination_events else (
            "source_supported_phased_transmission_blocks" if state.segments else "point_markers_only_or_unresolved"),
        point_markers=len(state.markers),
        inferred_haplotype_blocks=len(state.segments),
        resolved_crossover_events=0,
        inferred_crossover_events=len(state.recombination_events),
        candidate_recombination_intervals=len(state.recombination_events),
        candidate_interval_ids=[e.id for e in state.recombination_events],
        recombination_algorithm="parental-transmission-switch/1.0.0",
        unresolved_regions=len(state.unresolved_regions),
        child_specific_configurations=len(state.configurations),
        phenotype_linked_configurations=0,
        novelty_trace_ready=False,
        counterfactual_ready=False,
        causal_claim_supported=False,
        audit_summary={
            "observed": obs_count,
            "inferred": inf_count,
            "hypothesis": hyp_count,
            "unresolved": unres_count,
        },
        limitations=MODEL_LIMITATIONS,
        provenance=state.provenance,
    )


def evidence_graph(state: ChildState) -> EvidenceGraph:
    graph = nx.DiGraph()
    provenance = [state.provenance.computation_id]
    derived = "hypothesis" if state.state_status == "hypothetical" else "inferred"

    def node(identifier, kind, label, status, sources=None):
        graph.add_node(identifier, type=kind, label=label, evidence_status=status, provenance=sources or provenance)

    def edge(source, target, relation, status, sources=None):
        graph.add_edge(source, target, relation=relation, evidence_status=status, provenance=sources or provenance)

    child_node = f"child:{state.child_id}"
    node(child_node, "child_state", state.child_id, "hypothesis" if state.state_status == "hypothetical" else "observed")
    for role in ("parent_a", "parent_b"):
        identifier = f"parent:{state.samples[role]}"
        node(identifier, "parent", state.samples[role], "observed")
        edge(identifier, child_node, "documented_pedigree_parent", "observed")
    for marker in state.markers:
        node(marker.id, "point_marker", f"{marker.origin} at {marker.chromosome}:{marker.start}", derived, marker.provenance)
        edge(marker.id, f"parent:{marker.parent_sample}", "marker_transmission_assignment", derived, marker.provenance)
    for block in state.segments:
        node(block.id, "inferred_haplotype_block", f"{block.origin} homolog {block.homolog}, PS {block.phase_set}", derived, block.provenance)
        edge(block.id, f"parent:{block.parent_sample}", "assigned_parental_homolog", derived, block.provenance)
    for event in state.recombination_events:
        node(event.id, "candidate_crossover_interval", event.status, derived, event.provenance)
        edge(event.id, f"parent:{event.parent_sample}", "candidate_parental_homolog_switch", derived, event.provenance)
        for block in state.segments:
            if block.parent_sample == event.parent_sample and block.phase_set == event.phase_set and (block.end == event.start or block.start == event.end):
                edge(block.id, event.id, "flanks_candidate_switch_interval", derived, event.provenance)
    for variant in state.variants:
        node(variant.id, "variant_call", variant.id, variant.evidence_status, variant.provenance)
        edge(child_node, variant.id, "contains_variant_call", variant.evidence_status, variant.provenance)
        for marker_id in variant.marker_ids:
            edge(variant.id, marker_id, "supports_transmission_marker", derived, variant.provenance)
    for configuration in state.configurations:
        node(configuration.id, "child_specific_genotype", configuration.classification, derived, configuration.provenance)
        for variant_id in configuration.variant_ids:
            edge(variant_id, configuration.id, "forms_genotype_configuration", derived, configuration.provenance)
        for block_id in configuration.block_ids:
            edge(configuration.id, block_id, "transmission_supported_within_block", derived, configuration.provenance)
    for observation in state.phenotype_observations:
        sources = provenance + [observation.source_artifact_id, observation.linkage_artifact_id, observation.ontology_artifact_id]
        node(observation.id, "reported_phenotype", observation.label, "observed", sources)
        edge(child_node, observation.id, "same_individual_reported_history", "observed", sources)
        # No phenotype->variant edge is created without actual linked evidence.
    return EvidenceGraph(nodes=[GraphNode(id=key, **data) for key, data in graph.nodes(data=True)],
        links=[GraphEdge(source=a, target=b, **data) for a, b, data in graph.edges(data=True)], provenance=state.provenance)


def novelty_trace(state: ChildState, limit: int = 50) -> TraceResult:
    """Return computational attribution of offspring genomic configurations with lineage evidence."""
    ranked = sorted(state.configurations, key=lambda c: (-len(c.parental_homologs), -len(c.block_ids),
        next((v.position for v in state.variants if v.id in c.variant_ids), 0), c.id))

    candidates = []
    for i, c in enumerate(ranked[:limit], 1):
        target_v = next((v for v in state.variants if v.id in c.variant_ids), None)
        pos = target_v.position if target_v else 0
        chrom = target_v.chromosome if target_v else state.region.chromosome

        # Extract exact parental evidence
        p_a_gt = target_v.parent_a_genotype if target_v else None
        p_b_gt = target_v.parent_b_genotype if target_v else None

        parent_a_ev = {
            "sample_id": state.samples.get("parent_a", "Parent_A"),
            "genotype": p_a_gt.alleles if p_a_gt else c.parent_a_genotype,
            "status": p_a_gt.status if p_a_gt else "unresolved",
            "phase_set": p_a_gt.phase_set if p_a_gt else None,
        }
        parent_b_ev = {
            "sample_id": state.samples.get("parent_b", "Parent_B"),
            "genotype": p_b_gt.alleles if p_b_gt else c.parent_b_genotype,
            "status": p_b_gt.status if p_b_gt else "unresolved",
            "phase_set": p_b_gt.phase_set if p_b_gt else None,
        }

        # Determine biological mechanism
        child_alleles = [str(x) for x in c.child_genotype if x is not None]
        p_a_alleles = [str(x) for x in c.parent_a_genotype if x is not None]
        p_b_alleles = [str(x) for x in c.parent_b_genotype if x is not None]

        if len(set(child_alleles)) > 1 and len(set(p_a_alleles)) == 1 and len(set(p_b_alleles)) == 1 and p_a_alleles != p_b_alleles:
            mechanism = "Biparental heterozygous assembly: inherited distinct alternate and reference alleles from discordant homozygous parents"
            trans_type = "heterozygous_syngamy_from_discordant_homozygotes"
        elif c.recombination_event_ids:
            mechanism = "Recombination-adjacent configuration: assembled directly adjacent to candidate homolog switch boundary"
            trans_type = "recombination_flanking_configuration"
        else:
            mechanism = "Diploid inheritance: unique allelic combination emerging from maternal and paternal gametic transmission"
            trans_type = "biparental_transmission"

        # Recombination context
        nearest_event = None
        min_dist = None
        for ev in state.recombination_events:
            d = min(abs(pos - ev.start), abs(pos - ev.end))
            if min_dist is None or d < min_dist:
                min_dist = d
                nearest_event = ev.id

        recomb_ctx = {
            "nearest_recombination_event_id": nearest_event,
            "distance_to_nearest_candidate_switch_bp": min_dist,
            "associated_recombination_events": c.recombination_event_ids,
        }

        rec_counterfactual = {
            "intervention": "REVERT_RECOMBINATION_CONFIGURATION",
            "target_id": c.id,
            "parent_role": "parent_A",
            "description": f"Revert configuration {c.id} to pure parental transmission origin",
        }

        narrative = (
            f"Locus {chrom}:{pos} manifests child genotype {'/'.join(child_alleles)} which differs from both "
            f"Parent A ({'/'.join(p_a_alleles)}) and Parent B ({'/'.join(p_b_alleles)}). "
            f"Attributed to {mechanism}, supported by {len(c.block_ids)} haplotype block(s) "
            f"and {len(c.parental_homologs)} homolog assignment(s)."
        )

        lineage = LineageAttribution(
            parent_a_origin_evidence=parent_a_ev,
            parent_b_origin_evidence=parent_b_ev,
            transmission_type=trans_type,
            candidate_mechanism=mechanism,
            supported_homologs=c.parental_homologs,
            recombination_context=recomb_ctx,
            recommended_counterfactual=rec_counterfactual,
            attribution_narrative=narrative,
        )

        candidates.append(Candidate(
            rank=i,
            configuration=c,
            status=c.classification,
            evidence_status=c.evidence_status,
            ranking_evidence={
                "supported_parental_homologs": len(c.parental_homologs),
                "associated_haplotype_blocks": len(c.block_ids),
                "recombination_event_count": len(c.recombination_event_ids),
            },
            lineage_attribution=lineage,
            missing_links=["phenotype_signal_to_variant_configuration", "validated_phenotype_model"],
            provenance=c.provenance,
        ))

    return TraceResult(
        family_id=state.family_id,
        mode="lineage_attributed_configuration_evidence",
        phenotype_status=state.phenotype_status,
        phenotype_available=state.phenotype_available,
        novelty_trace_ready=bool(state.phenotype_available),
        score=None,
        score_model=None,
        ranking_definition="Descending number of source-supported parental homologs, then block associations, then coordinate; provenance-aware lineage attribution",
        total_candidates=len(ranked),
        ranked_candidates=candidates,
        graph=evidence_graph(state),
        warnings=state.warnings,
        provenance=state.provenance,
        limitations=MODEL_LIMITATIONS,
    )


def counterfactual(state: ChildState, request: CounterfactualRequest) -> CounterfactualResult:
    """Change allele-level child state, rerun inference and rebuild dependent objects.

    No phenotype score is manufactured. Until an applicable scientific phenotype
    model exists, this exposes a genomic state intervention with null score/delta.
    """
    valid_interventions = {
        "REMOVE_VARIANT",
        "REPLACE_WITH_PARENTAL_GENOTYPE",
        "REMOVE_SEGMENT",
        "REPLACE_SEGMENT",
        "REVERT_RECOMBINATION_CONFIGURATION",
    }
    if request.intervention not in valid_interventions:
        raise NotImplementedError("This intervention lacks supported segment/interaction state semantics in the current model")

    modified = state.model_copy(deep=True)
    changed = []

    if request.intervention in {"REMOVE_VARIANT", "REPLACE_WITH_PARENTAL_GENOTYPE"}:
        target = next((v for v in state.variants if v.id == request.target_id), None)
        if target is None:
            raise KeyError("Target variant not found in requested family/region")
        if not target.child_genotype.usable:
            raise ValueError("Cannot intervene on an unusable child genotype")
        if request.intervention == "REMOVE_VARIANT":
            alleles = [target.reference if a == target.alternate else a for a in target.child_genotype.alleles]
            operation = "Replace each selected ALT allele with this record's REF allele in the hypothetical child genotype"
        else:
            parent = target.parent_a_genotype if request.parent_role == "parent_A" else target.parent_b_genotype
            if not parent.usable:
                raise ValueError("Selected parental genotype is unavailable")
            alleles = list(parent.alleles)
            operation = f"Replace the child's full site genotype with the observed {request.parent_role} genotype"
        if sorted(alleles) == sorted(target.child_genotype.alleles):
            raise ValueError("Requested intervention would not change the child genotype")
        transformation = {"operation": request.intervention, "target_id": target.id, "parent_role": request.parent_role,
                          "before_alleles": target.child_genotype.alleles, "after_alleles": alleles,
                          "evidence_status": "hypothesis"}
        intervention_id = hashlib.sha256(json.dumps({"original": state.provenance.computation_id,
            "transformation": transformation}, sort_keys=True).encode()).hexdigest()
        modified.state_status = "hypothetical"
        modified.provenance.computation_id = intervention_id
        modified.provenance.parent_computation_id = state.provenance.computation_id
        modified.provenance.transformation = transformation
        for index, variant in enumerate(modified.variants):
            if (variant.chromosome, variant.position, variant.reference) != (target.chromosome, target.position, target.reference):
                variant.provenance = [state.provenance.computation_id, intervention_id]
                continue
            genotype = variant.child_genotype.model_copy(deep=True)
            genotype.alleles, genotype.raw_gt, genotype.phased, genotype.phase_set = alleles, None, False, None
            genotype.qual, genotype.gq, genotype.dp, genotype.filter = None, None, None, None
            genotype.status, genotype.source_record, genotype.evidence_status = "computational_intervention", None, "hypothesis"
            recomputed = infer_variant(variant.chromosome, variant.position, variant.reference, variant.alternate,
                genotype, variant.parent_a_genotype, variant.parent_b_genotype, intervention_id)
            recomputed.evidence_status = "hypothesis"
            recomputed.origin_evidence_status = "hypothesis"
            recomputed.phase_evidence = {role: phase for role, phase in variant.phase_evidence.items() if role != "child"}
            recomputed.annotations, recomputed.source_annotations = variant.annotations, variant.source_annotations
            recomputed.reference_evidence = variant.reference_evidence
            recomputed.provenance = [state.provenance.computation_id, intervention_id]
            modified.variants[index] = recomputed
            changed.append(variant.id)
        evidence_list = [state.provenance.computation_id, *target.provenance,
                         *sorted({p.source_artifact_id for p in target.phase_evidence.values()})]

    elif request.intervention in {"REMOVE_SEGMENT", "REPLACE_SEGMENT"}:
        target_segment = next((s for s in state.segments if s.id == request.target_id), None)
        if target_segment is None:
            target_segment = next((s for s in state.segments if request.target_id in s.variant_ids), None)
        if target_segment is None:
            raise KeyError(f"Target segment {request.target_id} not found")
        affected_variants: dict[str, list[str | None]] = {}
        for v_id in target_segment.variant_ids:
            v = next((var for var in state.variants if var.id == v_id), None)
            if not v or not v.child_genotype.usable:
                continue
            if request.intervention == "REMOVE_SEGMENT":
                alleles = [v.reference for _ in v.child_genotype.alleles]
            else:
                p_gt = v.parent_a_genotype if request.parent_role == "parent_A" else v.parent_b_genotype
                alleles = list(p_gt.alleles) if p_gt.usable else [v.reference for _ in v.child_genotype.alleles]
            if sorted(alleles) != sorted(v.child_genotype.alleles):
                affected_variants[v.id] = alleles
        if not affected_variants:
            raise ValueError("Requested segment intervention would not change any child variant in the segment")
        operation = f"{request.intervention} across segment {target_segment.id}"
        transformation = {"operation": request.intervention, "target_id": target_segment.id, "parent_role": request.parent_role,
                          "variants_modified": len(affected_variants), "evidence_status": "hypothesis"}
        evidence_list = [state.provenance.computation_id, *target_segment.provenance, *target_segment.source_artifact_ids]
        intervention_id = hashlib.sha256(json.dumps({"original": state.provenance.computation_id,
            "transformation": transformation}, sort_keys=True).encode()).hexdigest()
        modified.state_status = "hypothetical"
        modified.provenance.computation_id = intervention_id
        modified.provenance.parent_computation_id = state.provenance.computation_id
        modified.provenance.transformation = transformation
        for index, variant in enumerate(modified.variants):
            if variant.id not in affected_variants:
                variant.provenance = [state.provenance.computation_id, intervention_id]
                continue
            new_alleles = affected_variants[variant.id]
            genotype = variant.child_genotype.model_copy(deep=True)
            genotype.alleles, genotype.raw_gt, genotype.phased, genotype.phase_set = new_alleles, None, False, None
            genotype.qual, genotype.gq, genotype.dp, genotype.filter = None, None, None, None
            genotype.status, genotype.source_record, genotype.evidence_status = "computational_intervention", None, "hypothesis"
            recomputed = infer_variant(variant.chromosome, variant.position, variant.reference, variant.alternate,
                genotype, variant.parent_a_genotype, variant.parent_b_genotype, intervention_id)
            recomputed.evidence_status = "hypothesis"
            recomputed.origin_evidence_status = "hypothesis"
            recomputed.phase_evidence = {role: phase for role, phase in variant.phase_evidence.items() if role != "child"}
            recomputed.annotations, recomputed.source_annotations = variant.annotations, variant.source_annotations
            recomputed.reference_evidence = variant.reference_evidence
            recomputed.provenance = [state.provenance.computation_id, intervention_id]
            modified.variants[index] = recomputed
            changed.append(variant.id)

    elif request.intervention == "REVERT_RECOMBINATION_CONFIGURATION":
        target_event = next((e for e in state.recombination_events if e.id == request.target_id), None)
        affected_variants = {}
        if target_event is not None:
            for m in target_event.right_flanking_markers:
                v = next((var for var in state.variants if var.id == m.variant_id), None)
                if not v or not v.child_genotype.usable:
                    continue
                if m.parental_phase and len(m.parental_phase.alleles) > target_event.left_homolog:
                    alt_allele = m.parental_phase.alleles[target_event.left_homolog]
                    alleles = [alt_allele if a == m.transmitted_allele else a for a in v.child_genotype.alleles]
                else:
                    alleles = [v.reference for _ in v.child_genotype.alleles]
                if sorted(alleles) != sorted(v.child_genotype.alleles):
                    affected_variants[v.id] = alleles
            operation = f"Revert recombination event {target_event.id}"
            transformation = {"operation": request.intervention, "target_id": target_event.id, "parent_role": request.parent_role,
                              "variants_modified": len(affected_variants), "evidence_status": "hypothesis"}
            evidence_list = [state.provenance.computation_id, *target_event.provenance]
        else:
            target_cfg = next((c for c in state.configurations if c.id == request.target_id), None)
            if target_cfg is None:
                raise KeyError(f"Target recombination event or configuration {request.target_id} not found")
            for v_id in target_cfg.variant_ids:
                v = next((var for var in state.variants if var.id == v_id), None)
                if not v or not v.child_genotype.usable:
                    continue
                p_gt = v.parent_a_genotype if request.parent_role == "parent_A" else v.parent_b_genotype
                alleles = list(p_gt.alleles) if p_gt.usable else [v.reference for _ in v.child_genotype.alleles]
                if sorted(alleles) != sorted(v.child_genotype.alleles):
                    affected_variants[v.id] = alleles
            operation = f"Revert configuration {target_cfg.id}"
            transformation = {"operation": request.intervention, "target_id": target_cfg.id, "parent_role": request.parent_role,
                              "variants_modified": len(affected_variants), "evidence_status": "hypothesis"}
            evidence_list = [state.provenance.computation_id, *target_cfg.provenance]
        if not affected_variants:
            raise ValueError("Requested recombination revert would not change any variant")
        intervention_id = hashlib.sha256(json.dumps({"original": state.provenance.computation_id,
            "transformation": transformation}, sort_keys=True).encode()).hexdigest()
        modified.state_status = "hypothetical"
        modified.provenance.computation_id = intervention_id
        modified.provenance.parent_computation_id = state.provenance.computation_id
        modified.provenance.transformation = transformation
        for index, variant in enumerate(modified.variants):
            if variant.id not in affected_variants:
                variant.provenance = [state.provenance.computation_id, intervention_id]
                continue
            new_alleles = affected_variants[variant.id]
            genotype = variant.child_genotype.model_copy(deep=True)
            genotype.alleles, genotype.raw_gt, genotype.phased, genotype.phase_set = new_alleles, None, False, None
            genotype.qual, genotype.gq, genotype.dp, genotype.filter = None, None, None, None
            genotype.status, genotype.source_record, genotype.evidence_status = "computational_intervention", None, "hypothesis"
            recomputed = infer_variant(variant.chromosome, variant.position, variant.reference, variant.alternate,
                genotype, variant.parent_a_genotype, variant.parent_b_genotype, intervention_id)
            recomputed.evidence_status = "hypothesis"
            recomputed.origin_evidence_status = "hypothesis"
            recomputed.phase_evidence = {role: phase for role, phase in variant.phase_evidence.items() if role != "child"}
            recomputed.annotations, recomputed.source_annotations = variant.annotations, variant.source_annotations
            recomputed.reference_evidence = variant.reference_evidence
            recomputed.provenance = [state.provenance.computation_id, intervention_id]
            modified.variants[index] = recomputed
            changed.append(variant.id)
    modified.markers, modified.segments, modified.recombination_events, modified.unresolved_regions = build_segments(
        modified.variants, intervention_id, modified.region, modified.samples)
    for item in [*modified.markers, *modified.segments, *modified.recombination_events]:
        item.evidence_status = "hypothesis"
        item.provenance.insert(0, state.provenance.computation_id)
    for region in modified.unresolved_regions:
        region.provenance.insert(0, state.provenance.computation_id)
    modified.configurations = investigate_configurations(modified.variants, intervention_id)
    for configuration in modified.configurations:
        configuration.evidence_status = "hypothesis"
        configuration.provenance.insert(0, state.provenance.computation_id)
    modified.inventory_metrics = {"child_alt_features": sum(v.alternate in v.child_genotype.alleles for v in modified.variants),
        "mendelian_compatible_alt_copies": sum(v.inherited_alt_copies for v in modified.variants)}
    modified.warnings = [w for w in modified.warnings if w.code not in {"CROSSOVERS_UNRESOLVED"}]
    modified.warnings.append(Warning(code="HYPOTHETICAL_STATE", message="Child genotype changed computationally; no phenotype prediction model available"))

    # Compute structural impact consequences
    changed_variants = [v for v in modified.variants if v.id in changed]
    changed_intervals = []
    if changed_variants:
        chrom = changed_variants[0].chromosome
        min_pos = min(v.position for v in changed_variants)
        max_pos = max(v.position for v in changed_variants)
        changed_intervals = [{"chromosome": chrom, "start": min_pos, "end": max_pos, "span_bp": max_pos - min_pos + 1}]

    orig_child_alt = sum(v.child_genotype.alleles.count(v.alternate) for v in state.variants if v.id in changed and v.child_genotype.usable)
    new_child_alt = sum(v.child_genotype.alleles.count(v.alternate) for v in modified.variants if v.id in changed and v.child_genotype.usable)
    parental_consequences = {
        "original_child_alt_dosage": orig_child_alt,
        "post_intervention_child_alt_dosage": new_child_alt,
        "dosage_delta": new_child_alt - orig_child_alt,
        "target_parent_role": request.parent_role,
    }
    downstream_impact = {
        "markers_recomputed": len(modified.markers),
        "segments_recomputed": len(modified.segments),
        "configurations_recomputed": len(modified.configurations),
        "unresolved_regions": len(modified.unresolved_regions),
    }
    rep_hash = hashlib.sha256(f"{intervention_id}:{sorted(changed)}:{len(modified.variants)}".encode()).hexdigest()

    return CounterfactualResult(
        family_id=state.family_id,
        intervention=request.intervention,
        target_id=request.target_id,
        original_state=state,
        counterfactual_state=modified,
        explanation=operation + "; recomputed transmission pairs, homolog markers, inferred blocks, and child-specific configurations",
        changed_variant_ids=changed,
        changed_genomic_intervals=changed_intervals,
        parental_origin_consequences=parental_consequences,
        downstream_structures_affected=downstream_impact,
        reproducibility_hash=rep_hash,
        provenance=modified.provenance,
        intervention_id=intervention_id,
        evidence=evidence_list,
        limitations=MODEL_LIMITATIONS,
    )
