"""Shared world-level evaluation. Ground truth enters only after screening/effects."""
import hashlib
import json
import random
import statistics

EPSILON = 0.1
BENCHMARK_VERSION = "scientific-hardening/2.0"
ABLATION_COMPONENTS = {
    "FULL_NOVELTY_TRACE": (),
    "NO_COUNTERFACTUAL": ("normalized_effect", "novelty_specificity", "synergy_bonus"),
    "NO_PROVENANCE": ("provenance",),
    "NO_RECOMBINATION": ("recombination_support",),
    "NO_STABILITY": ("stability",),
    "NO_PARSIMONY": ("complexity_penalty",),
}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def distribution(values, seed=193, replicates=2000):
    """Percentile bootstrap of world mean; SD describes between-world variation."""
    values = list(values)
    if not values:
        return {"N": 0, "mean": None, "median": None, "SD": None, "ci95": None}
    rng = random.Random(seed)
    n = len(values)
    means = sorted(sum(rng.choices(values, k=n)) / n for _ in range(replicates))
    return {"N": n, "mean": statistics.mean(values), "median": statistics.median(values),
            "SD": statistics.stdev(values) if n > 1 else 0.0,
            "ci95": [means[int(.025 * replicates)], means[min(replicates-1, int(.975 * replicates))]] if n > 1 else None,
            "unit": "independent world", "bootstrap_replicates": replicates}


def score_order(ids, truth, k):
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate candidate identities")
    top = ids[:k]
    hits = len(set(top) & set(truth))
    precision = hits / len(top) if top else 0.0
    recall = hits / len(truth) if truth else 1.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {"precision": precision, "recall": recall, "f1": f1,
            "top1": int(bool(top) and top[0] in truth), "top_ids": top}


def evaluate_tracer(tracer, truth, seed, k=3):
    """Freeze Stage A/B identities once; only ordering differs by method."""
    candidates = tracer.generate_candidates()
    results = [tracer.run_counterfactual(c) for c in candidates]
    tracer.search_accounting["stage_b_evaluated"] = len(results)
    ids = [c.id for c in candidates]
    tie_ids = sorted(ids)
    random.Random(seed).shuffle(tie_ids)
    tie = {cid: i for i, cid in enumerate(tie_ids)}
    by_id = {r.candidate_id: r for r in results}
    by_dict = {r.candidate_id: r.to_dict() for r in results}
    def ranked(score):
        return sorted(ids, key=lambda cid: (-score(cid), tie[cid]))
    ablations = {}
    for name, disabled in ABLATION_COMPONENTS.items():
        ablations[name] = ranked(lambda cid: max(0., sum(v for key, v in by_dict[cid]["score_components"].items() if key not in disabled)))
    ablations["COUNTERFACTUAL_ONLY"] = ranked(lambda cid: by_id[cid].absolute_effect)
    ablations["CANDIDATE_GEN_ONLY"] = list(ids)
    # Span is in synthetic marker coordinates, not physical base-pair distance.
    candidate_map = {c.id: c for c in candidates}
    dosage = {}
    for c in candidates:
        if c.candidate_type == "SEGMENT":
            lo, hi = c.details["start"], c.details["end"]
            alleles = tracer.offspring.maternal_gamete.alleles if c.details["parent"] == "A" else tracer.offspring.paternal_gamete.alleles
            dosage[c.id] = sum(alleles[lo:hi]) / max(1, hi-lo)
        else:
            dosage[c.id] = float(c.details["dosage"])
    baselines = {
        "random": tie_ids,
        "distance": sorted(ids, key=lambda cid: (candidate_map[cid].end-candidate_map[cid].start, tie[cid])),
        "transmission": ranked(lambda cid: dosage[cid]),
        "counterfactual_only": ablations["COUNTERFACTUAL_ONLY"],
        "novelty_trace": ablations["FULL_NOVELTY_TRACE"],
    }
    assert all(set(order) == set(ids) and len(order) == len(ids) for order in [*baselines.values(), *ablations.values()])
    causal = [r.absolute_effect for r in results if r.candidate_id in truth]
    # 'null' means non-target operation, and can include functionally active segment/variant interventions.
    null = [r.absolute_effect for r in results if r.candidate_id not in truth]
    mc = statistics.mean(causal) if causal else 0.0
    mn = statistics.mean(null) if null else 0.0
    full = baselines["novelty_trace"]
    return {
        "seed": seed, "K": tracer.candidate_limit, "top_k": k,
        "ground_truth": sorted(truth), "candidate_ids": ids,
        "candidate_pool_hash": digest(sorted(ids)),
        "phenotypes": {"parent_a": tracer.y_A, "parent_b": tracer.y_B, "offspring": tracer.y_O},
        "phenotypic_novelty": tracer.baseline_novelty.is_transgressive,
        "metrics": score_order(full, truth, k),
        "baselines": {name: score_order(order, truth, k) for name, order in baselines.items()},
        "ablations": {name: score_order(order, truth, k) for name, order in ablations.items()},
        "baseline_orders": baselines, "ablation_orders": ablations,
        "faithfulness": {"label": "benchmark-relative counterfactual separation", "epsilon": EPSILON,
                         "causal_mean_absolute_effect": mc, "null_mean_absolute_effect": mn,
                         "ratio": mc/(mn+EPSILON), "causal_screened": len(causal), "null_screened": len(null),
                         "null_definition": "all screened operations not listed in planted ground truth; not necessarily zero-effect"},
        "stage_a": {**tracer.search_accounting,
                    "recall": len(set(ids) & set(truth))/len(truth) if truth else None,
                    "causal_candidate_ranks": {cid: next(({"category": name, "rank": group.index(cid)+1,
                                                         "screened": cid in ids} for name, group in tracer.eligible_candidate_categories.items() if cid in group), None) for cid in truth}},
        "raw_ranking": [by_id[cid].to_dict() for cid in full],
        "parent_hash": digest([tracer.parent_a.to_dict(), tracer.parent_b.to_dict()]),
        "offspring_hash": digest(tracer.offspring.to_dict()),
        "world_hash": digest({"parent_a": tracer.parent_a.to_dict(), "parent_b": tracer.parent_b.to_dict(),
                              "offspring": tracer.offspring.to_dict(), "model": tracer.phenotype_engine.config.to_dict()}),
    }


def aggregate(worlds):
    evaluated_worlds = worlds
    worlds = [w for w in worlds if w["ground_truth"]]
    metrics = {name: distribution(w["metrics"][name] for w in worlds) for name in ("precision", "recall", "f1", "top1")}
    ratios = [w["faithfulness"]["ratio"] for w in worlds]
    metrics["faithfulness"] = distribution(ratios)
    max_share = max(ratios)/sum(ratios) if ratios and sum(ratios) else 0.0
    smallest = min(worlds, key=lambda w: w["faithfulness"]["null_mean_absolute_effect"]) if worlds else None
    metrics["denominator_sensitivity"] = {
        "maximum_world_share_of_ratio_sum": max_share,
        "dominated_by_one_world": max_share > .5,
        "mean_excluding_smallest_denominator_world": statistics.mean(w["faithfulness"]["ratio"] for w in worlds if w is not smallest) if len(worlds)>1 else None,
        "smallest_denominator_seed": smallest["seed"] if smallest else None,
    }
    return {"worlds": len(evaluated_worlds), "recovery_worlds": len(worlds), "metrics": metrics,
            "metric_scope": "Recovery metrics exclude worlds with empty causal ground truth; use novelty specificity for those controls",
            "no_novelty_specificity": sum(not w["phenotypic_novelty"] for w in evaluated_worlds if not w["ground_truth"])/sum(not w["ground_truth"] for w in evaluated_worlds) if any(not w["ground_truth"] for w in evaluated_worlds) else None,
            "baselines": {name: {m: distribution(w["baselines"][name][m] for w in worlds) for m in ("precision", "recall", "f1", "top1")} for name in ("random", "distance", "transmission", "counterfactual_only", "novelty_trace")},
            "paired_comparisons": {name: distribution(w["baselines"]["novelty_trace"]["f1"]-w["baselines"][name]["f1"] for w in worlds) for name in ("random", "distance", "transmission", "counterfactual_only")},
            "ablations": {name: distribution(w["ablations"][name]["f1"] for w in worlds) for name in (*ABLATION_COMPONENTS, "COUNTERFACTUAL_ONLY", "CANDIDATE_GEN_ONLY")},
            "per_world": evaluated_worlds}
