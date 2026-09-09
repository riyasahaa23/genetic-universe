"""Behavioral hardening tests; no minimum performance score is manufactured."""
import copy
from pathlib import Path
import pytest
from app.validation.scientific.attribution import NoveltyTracer, compute_search_space_accounting
from app.validation.scientific.benchmark import run_benchmark, run_variable_target_benchmark
from app.validation.scientific.evaluation import evaluate_tracer, distribution
from app.validation.scientific.hard_worlds import make_world, negative_controls, FAMILIES
from app.validation.scientific.phenotype import PhenotypeConfig, PhenotypeEngine
from app.validation.scientific.recombination import generate_loci, generate_synthetic_parents, simulate_meiosis, fertilize
from app.validation.services.counterfactual_service import counterfactual_service


def test_stage_a_trans_capacity():
    # Dense cis background cannot displace a category's guaranteed prefix.
    for seed in range(20):
        tracer,truth,_=make_world("causal_cross_homolog",seed)
        candidates=tracer.generate_candidates()
        ids={c.id for c in candidates}
        assert len(ids)==len(candidates)<=150
        for category,eligible in tracer.eligible_candidate_categories.items():
            quota=tracer.search_accounting["category_quotas"][category]
            assert set(eligible[:quota]) <= ids
            assert len([c for c in candidates if c.details["screening_category"]==category]) == quota
        assert sum(tracer.search_accounting["candidates_screened_by_category"].values())==len(ids)
    for k in (0,1,2,4,10,50):
        tracer.candidate_limit=k
        assert len(tracer.generate_candidates())<=k


def test_cross_homolog_enumeration():
    loci=generate_loci(8)
    pa,pb=generate_synthetic_parents(loci,seed=1)
    for p in (pa,pb): p.homolog_1[:]=[1]*8;p.homolog_2[:]=[1]*8
    off=fertilize(simulate_meiosis(pa.homolog_1,pa.homolog_2,"A",[4]),simulate_meiosis(pb.homolog_1,pb.homolog_2,"B",[4]),loci)
    tr=NoveltyTracer(pa,pb,off,PhenotypeEngine(PhenotypeConfig()),2000)
    cs=tr.generate_candidates(2000)
    pairs=[c for c in cs if c.candidate_type=="INTERACTION"]
    assert len(pairs)==28
    assert all(c.details["is_cross_homolog"] and c.details["maternal_cis"] for c in pairs)
    assert all(c.details["locus_a_pos"]<c.details["locus_b_pos"] for c in pairs)
    assert len(cs)==compute_search_space_accounting(8,4)["defined_operation_space"]


def test_search_space_accounting():
    a=compute_search_space_accounting(50,4)
    assert a["cross_homolog_distinct_allele_assignments"]==2450
    assert a["same_locus_interaction_operations"]==0
    assert a["defined_operation_space"]==a["variant_space"]+a["cis_interaction_space"]+a["cross_homolog_space"]-a["interaction_overlap_space"]+a["segment_space"]==1279


def test_ablation_candidate_pool_invariance():
    for seed in range(5):
        b=run_benchmark(seed=seed)
        w=evaluate_tracer(b["raw_tracer"],set(b["planted_ids"]),seed)
        for order in [*w["ablation_orders"].values(),*w["baseline_orders"].values()]:
            assert sorted(order)==sorted(w["candidate_ids"])
        assert all(len(m["top_ids"])==3 for m in w["baselines"].values())
        rows={r["candidate_id"]:r for r in w["raw_ranking"]}
        for name,component in (("NO_PROVENANCE","provenance"),("NO_STABILITY","stability"),("NO_RECOMBINATION","recombination_support"),("NO_PARSIMONY","complexity_penalty")):
            scores=[max(0,sum(v for k,v in rows[cid]["score_components"].items() if k!=component)) for cid in w["ablation_orders"][name]]
            assert scores==sorted(scores,reverse=True)


def test_baseline_fairness():
    tr,truth,_=make_world("correlated_distractors",7)
    a=evaluate_tracer(tr,truth,7);b=evaluate_tracer(tr,truth,7)
    assert a["baseline_orders"]==b["baseline_orders"]
    assert a["candidate_pool_hash"]==b["candidate_pool_hash"]
    assert a["ground_truth"]==b["ground_truth"]


def test_variable_target_benchmark():
    worlds=[make_world("weak_epistasis",s,variable=True) for s in range(30)]
    assert len({tuple(m["target_loci"]) for _,_,m in worlds})>20
    assert len({m["effect"] for _,_,m in worlds})>20
    assert len({m["interaction_type"] for _,_,m in worlds})==2
    assert any(m["effect"]<0 for _,_,m in worlds)


def test_negative_controls():
    result=negative_controls()
    assert result["all_negative_controls_passed"]
    for case in result["cases"].values():
        assert case["is_transgressive"]==case["expected_phenotypic_novelty"]
        assert bool(case["candidates_emitted"])==case["expected_phenotypic_novelty"]
    assert result["cases"]["G"]["is_transgressive"]


def test_counterfactual_model_relative_label():
    tr,_,_=make_world("dominance",5)
    before=copy.deepcopy(tr.offspring.to_dict())
    for c in tr.generate_candidates()[:10]:
        r=tr.run_counterfactual(c).to_dict()
        assert r["label"]=="MODEL-RELATIVE COMPUTATIONAL COUNTERFACTUAL"
        assert r["phenotype_change"]==pytest.approx(r["counterfactual_phenotype"]-r["original_phenotype"],abs=1e-4)
        assert all(key in r for key in ("target","original_state","altered_state","model_used","interpretation"))
    assert tr.offspring.to_dict()==before


def test_dominance_state_counterfactual():
    tr,truth,_=make_world("dominance",42)
    candidate=next(c for c in tr.generate_candidates() if c.id in truth)
    idx=int(candidate.details["locus_id"].replace("L", ""))-1
    r=tr.run_counterfactual(candidate)
    assert r.absolute_effect==18
    assert r.semantics["original_state"]["h1"][idx]+r.semantics["original_state"]["h2"][idx]==2
    assert r.semantics["altered_state"]["h1"][idx]+r.semantics["altered_state"]["h2"][idx]==1


def test_same_seed_reproducibility():
    a,truth,_=make_world("phenotype_noise",99);b,_,_=make_world("phenotype_noise",99)
    assert evaluate_tracer(a,truth,99)==evaluate_tracer(b,truth,99)


def test_different_seed_diversity():
    hashes=[]
    for seed in range(5):
        tr,truth,_=make_world("weak_epistasis",seed)
        hashes.append(evaluate_tracer(tr,truth,seed)["world_hash"])
    assert len(set(hashes))==5


def test_no_ground_truth_leakage():
    tr,_,_=make_world("weak_epistasis",12)
    ids=[c.to_dict() for c in tr.generate_candidates()]
    class ForbiddenModel:
        @property
        def config(self): raise AssertionError("Stage A read model configuration")
    tr.phenotype_engine=ForbiddenModel()
    assert ids==[c.to_dict() for c in tr.generate_candidates()]


def test_counterfactual_all_operations_and_invariance():
    tr=run_benchmark(seed=42)["raw_tracer"]
    cs=tr.generate_candidates()
    for typ,ops in (("VARIANT",("REMOVE_VARIANT","REPLACE_WITH_PARENTAL_GENOTYPE")),("SEGMENT",("REMOVE_SEGMENT","REVERT_RECOMBINATION_CONFIGURATION")),("INTERACTION",("BREAK_INTERACTION",))):
        c=next(c for c in cs if c.candidate_type==typ)
        for op in ops:
            before=copy.deepcopy(tr.offspring.to_dict())
            r=counterfactual_service.run_intervention(tr,c.id,op)
            assert tr.offspring.to_dict()==before
            assert r.semantics["original_state"] != r.semantics["altered_state"] or r.absolute_effect==0
    with pytest.raises(KeyError): counterfactual_service.run_intervention(tr,"MISSING","REMOVE_VARIANT")


def test_world_bootstrap_not_single_observation():
    assert distribution([1])["ci95"] is None
    r=distribution([0,1]*15)
    assert 0<r["ci95"][0]<r["mean"]<r["ci95"][1]<1


def test_real_giab_phenotype_null():
    from app.trio.pipeline import FamilyStore
    from app.trio.phenotype_engine import categorize_phenotypes
    state=FamilyStore(Path(__file__).resolve().parents[2]/"data").state("GIAB_AJ")
    assert categorize_phenotypes(state).predicted_phenotype is None


def test_candidate_switch_terminology():
    from app.trio.pipeline import FamilyStore
    from app.trio.models import Region
    state=FamilyStore(Path(__file__).resolve().parents[2]/"data").state("GIAB_AJ",Region(chromosome="1",start=91700000,end=91760000))
    for event in state.recombination_events:
        assert "candidate" in event.status
        assert event.end>event.start
        assert len(event.left_marker_ids)>=2 and len(event.right_marker_ids)>=2
        assert event.uncertainty


def test_difficulty_api_respects_selected_level():
    from app.trio.benchmark_suite import execute_benchmark
    from app.trio.models import BenchmarkParams
    results=[execute_benchmark(BenchmarkParams(level=level)) for level in range(1,9)]
    assert len({str(r.genetic_state["phenotype_model"])+str(r.parameters.level) for r in results})==8
    assert results[2].genetic_state["phenotype_model"]["dominance"]
    assert results[6].genetic_state["parent_a"]["locus_count"]==200


def test_opposite_tail_novelty_is_not_removed():
    from app.validation.scientific.novelty import detect_novelty
    tr,truth,_=make_world("antagonistic_epistasis",11)
    for candidate in tr.generate_candidates():
        result=tr.run_counterfactual(candidate)
        expected=tr.baseline_novelty.is_transgressive and not detect_novelty(tr.y_A,tr.y_B,result.counterfactual_phenotype).is_transgressive
        assert result.novelty_removed==expected


def test_reference_homozygote_dominance_intervention():
    tr,_,meta=make_world("dominance",42)
    idx=meta["target_loci"][0]-1
    tr.parent_a.homolog_1[idx]=0;tr.parent_a.homolog_2[idx]=1
    tr.parent_b.homolog_1[idx]=0;tr.parent_b.homolog_2[idx]=1
    ga=simulate_meiosis(tr.parent_a.homolog_1,tr.parent_a.homolog_2,"A",[])
    gb=simulate_meiosis(tr.parent_b.homolog_1,tr.parent_b.homolog_2,"B",[])
    tr=NoveltyTracer(tr.parent_a,tr.parent_b,fertilize(ga,gb,tr.parent_a.loci),tr.phenotype_engine)
    c=next(c for c in tr.generate_candidates() if c.id==f"VAR_L{idx+1:02d}")
    assert c.details["dosage"]==0
    assert tr.run_counterfactual(c).absolute_effect==18


def test_empty_truth_metrics_are_not_recovery_claims():
    from app.validation.scientific.evaluation import aggregate
    tr,truth,_=make_world("no_phenotypic_novelty",33)
    summary=aggregate([evaluate_tracer(tr,truth,33)])
    assert summary["worlds"]==1 and summary["recovery_worlds"]==0
    assert summary["metrics"]["f1"]["mean"] is None
    assert summary["no_novelty_specificity"]==1
