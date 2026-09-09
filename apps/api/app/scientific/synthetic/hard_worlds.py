"""Controlled architecture stress worlds; planting is outside the attribution engine."""
import random

from .attribution import NoveltyTracer
from .phenotype import EpistaticPair, PhenotypeConfig, PhenotypeEngine
from .recombination import fertilize, generate_loci, generate_synthetic_parents, simulate_meiosis

FAMILIES = ("weak_epistasis", "antagonistic_epistasis", "dominance", "polygenic_background",
            "correlated_distractors", "multiple_causal_interactions", "causal_cross_homolog",
            "far_from_breakpoint", "phenotype_noise", "threshold", "similar_effect_mechanisms",
            "no_phenotypic_novelty", "additive", "dominant", "recessive", "synergistic_epistasis",
            "recombinant_cis")


def make_world(family, seed, candidate_limit=150, variable=False):
    if family not in FAMILIES:
        raise ValueError(family)
    rng = random.Random(seed)
    loci = generate_loci(50)
    pa, pb = generate_synthetic_parents(loci, seed=seed, stochastic=True)
    # Replace legacy target-enforced genotypes with independently drawn background.
    for parent in (pa, pb):
        parent.homolog_1[:] = [int(rng.random() < .35) for _ in loci]
        parent.homolog_2[:] = [int(rng.random() < .35) for _ in loci]
    a, b = sorted(rng.sample(range(50), 2))
    bp = rng.randint(a+1, b)
    if family == "far_from_breakpoint":
        a, b, bp = 20, 40, 2
    cross = family in ("causal_cross_homolog", "far_from_breakpoint") or (variable and seed % 2 == 1)
    magnitude = rng.uniform(.5, 30.) if variable else 24.
    if family == "weak_epistasis":
        magnitude = rng.uniform(.1, 1.)
    coefficient = -magnitude if family == "antagonistic_epistasis" or (variable and seed % 3 == 0) else magnitude
    pairs = []
    truth = set()
    additive = {}
    dominance = {}
    recessive = {}
    def plant(i, j, effect):
        # Set transmitted source according to the explicit meiosis below.
        if cross:
            pa.homolog_1[i] = int(i < bp); pa.homolog_2[i] = int(i >= bp)
            pa.homolog_1[j] = pa.homolog_2[j] = 0
            pb.homolog_1[i] = pb.homolog_2[i] = 0
            pb.homolog_1[j] = 1; pb.homolog_2[j] = 0
        else:
            pa.homolog_1[i] = 1; pa.homolog_2[i] = 0
            pa.homolog_1[j] = 0; pa.homolog_2[j] = 1
            pb.homolog_1[i] = pb.homolog_2[i] = 0
            pb.homolog_1[j] = pb.homolog_2[j] = 0
        identifier = f"E_{loci[i].id}_{loci[j].id}"
        # Ground-truth IDs are not provided to the tracer.
        pairs.append(EpistaticPair(identifier, loci[i].id, loci[j].id, i+1, j+1, effect))
        truth.add(identifier)
    plant(a, b, coefficient)
    if family in ("multiple_causal_interactions", "similar_effect_mechanisms"):
        left = [i for i in range(bp) if i not in (a,b)]
        right = [i for i in range(bp,50) if i not in (a,b)]
        if left and right:
            plant(rng.choice(left), rng.choice(right), coefficient * (.97 if family == "similar_effect_mechanisms" else .55))
        else:
            # Boundary worlds retain a second explicit additive mechanism, never silently drop it.
            q = next(i for i in range(50) if i not in (a,b))
            additive[loci[q].id] = abs(coefficient)/2
            truth.add("VAR_" + loci[q].id)
    if family == "additive":
        pairs = []; truth = {"VAR_" + loci[a].id}
        pa.homolog_1[a] = int(a < bp); pa.homolog_2[a] = int(a >= bp)
        pb.homolog_1[a] = 1; pb.homolog_2[a] = 0
        additive[loci[a].id] = magnitude
    if family == "dominant":
        pairs = []; truth = {"VAR_" + loci[a].id, "VAR_" + loci[b].id}
        pa.homolog_1[a] = int(a < bp); pa.homolog_2[a] = int(a >= bp)
        pa.homolog_1[b] = 0; pa.homolog_2[b] = 0
        pb.homolog_1[a] = 0; pb.homolog_2[a] = 0
        pb.homolog_1[b] = 1; pb.homolog_2[b] = 0
        dominance[loci[a].id] = magnitude
        dominance[loci[b].id] = magnitude
    elif family == "dominance":
        pairs = []; truth = {"VAR_"+loci[a].id}
        pa.homolog_1[a] = int(a<bp); pa.homolog_2[a] = int(a>=bp)
        pb.homolog_1[a] = 1; pb.homolog_2[a] = 0
        dominance[loci[a].id] = 18.
    if family == "recessive":
        pairs = []; truth = {"VAR_" + loci[a].id}
        pa.homolog_1[a] = int(a < bp); pa.homolog_2[a] = int(a >= bp)
        pb.homolog_1[a] = 1; pb.homolog_2[a] = 0
        recessive[loci[a].id] = magnitude
    if family == "recombinant_cis":
        cross = False
        pairs = []; truth = {f"E_{loci[a].id}_{loci[b].id}"}
        pa.homolog_1[a] = int(a < bp); pa.homolog_2[a] = int(a >= bp)
        pa.homolog_1[b] = int(b < bp); pa.homolog_2[b] = int(b >= bp)
        pb.homolog_1[a] = pb.homolog_2[a] = 0
        pb.homolog_1[b] = pb.homolog_2[b] = 0
        pairs.append(EpistaticPair(f"E_{loci[a].id}_{loci[b].id}", loci[a].id, loci[b].id, a+1, b+1, magnitude))
    if family == "synergistic_epistasis":
        pairs = []; truth = {f"E_{loci[a].id}_{loci[b].id}"}
        plant(a, b, magnitude)
    if family == "polygenic_background":
        additive = {loc.id: rng.uniform(-2,2) for loc in loci}
        # Ground truth explicitly includes the nonzero additive mechanisms.
        truth.update("VAR_"+loc for loc in additive)
    if family == "correlated_distractors":
        for i in rng.sample([i for i in range(50) if i not in (a,b)], 15):
            source = a if i<bp else b
            for parent in (pa,pb):
                parent.homolog_1[i] = parent.homolog_1[source]
                parent.homolog_2[i] = parent.homolog_2[source]
    if family == "no_phenotypic_novelty":
        pairs = []; truth = set(); additive = {}; dominance = {}; recessive = {}
    cfg = PhenotypeConfig(base_value=0., additive=additive, dominance=dominance, recessive=recessive, epistasis=pairs,
                          mode="diploid" if cross else "cis_haplotype",
                          noise_sigma=8. if family == "phenotype_noise" else 0., noise_seed=seed,
                          threshold=abs(coefficient)*.75 if family == "threshold" else None)
    ga = simulate_meiosis(pa.homolog_1,pa.homolog_2,"A",[bp])
    gb = simulate_meiosis(pb.homolog_1,pb.homolog_2,"B",[])
    tracer = NoveltyTracer(pa,pb,fertilize(ga,gb,loci),PhenotypeEngine(cfg),candidate_limit)
    metadata = {"family": family, "target_loci": [a+1,b+1], "effect": coefficient,
                "interaction_type": "cross_homolog_dosage_model" if cross else "cis_haplotype",
                "breakpoints": {"A": [bp], "B": []}, "locus_count": 50,
                "noise": "genotype-hash deterministic uniform, sigma=8" if cfg.noise_sigma else "none",
                "model": cfg.to_dict()}
    return tracer, truth, metadata


def negative_controls(seed=42):
    results = {}
    # A, B, C, D and F use actual genotype/haplotype states and phenotype evaluations.
    for letter, family in (("A", "no_phenotypic_novelty"), ("B", "no_phenotypic_novelty"),
                           ("C", "no_phenotypic_novelty"), ("D", "no_phenotypic_novelty"),
                           ("E", "antagonistic_epistasis"), ("F", "no_phenotypic_novelty"),
                           ("G", "multiple_causal_interactions")):
        tracer, truth, meta = make_world(family, seed+ord(letter))
        pa,pb = tracer.parent_a,tracer.parent_b
        if letter in ("A","F"):
            pa.homolog_1[:] = [1]*50; pa.homolog_2[:] = [0]*50
            pb.homolog_1[:] = [1]*50; pb.homolog_2[:] = [0]*50
            ga = simulate_meiosis(pa.homolog_1,pa.homolog_2,"A",[])
            gb = simulate_meiosis(pb.homolog_1,pb.homolog_2,"B",[],start_homolog=1)
            cfg = PhenotypeConfig(additive={f"L{i:02d}": (1. if letter=="A" else .01) for i in range(1,51)})
        elif letter == "B":
            pa.homolog_1[:] = [1]*50; pa.homolog_2[:] = [0]*50
            pb.homolog_1[:] = [1]*50; pb.homolog_2[:] = [0]*50
            ga = simulate_meiosis(pa.homolog_1,pa.homolog_2,"A",[])
            gb = simulate_meiosis(pb.homolog_1,pb.homolog_2,"B",[])
            cfg = PhenotypeConfig(base_value=10.)
        elif letter == "E":
            # Exact antagonistic cancellation within parental range, evaluated below.
            a,b = meta["target_loci"]
            tracer.phenotype_engine.config.additive = {f"L{a:02d}": 24.}
            ga,gb,cfg = tracer.offspring.maternal_gamete,tracer.offspring.paternal_gamete,tracer.phenotype_engine.config
        else:
            ga,gb,cfg = tracer.offspring.maternal_gamete,tracer.offspring.paternal_gamete,tracer.phenotype_engine.config
        tracer = NoveltyTracer(pa,pb,fertilize(ga,gb,pa.loci),PhenotypeEngine(cfg))
        gt_novel = any(ga.alleles[i]+gb.alleles[i] not in (pa.homolog_1[i]+pa.homolog_2[i],pb.homolog_1[i]+pb.homolog_2[i]) for i in range(50))
        hap_novel = ga.alleles not in (pa.homolog_1,pa.homolog_2) or gb.alleles not in (pb.homolog_1,pb.homolog_2)
        novel = tracer.baseline_novelty.is_transgressive
        ranked = tracer.rank_candidates()
        expected = letter == "G"
        results[letter] = {"expected_phenotypic_novelty": expected, "is_transgressive": novel,
                           "non_parental_genotype_state": gt_novel, "haplotypic_novelty": hap_novel,
                           "recombination_supported_configuration": bool(ga.crossovers or gb.crossovers),
                           "candidates_emitted": len(ranked),
                           "phenotypes": [tracer.y_A,tracer.y_B,tracer.y_O],
                           "status": "PHENOTYPIC NOVELTY" if novel else ("NON-PARENTAL GENOTYPE STATE WITHOUT PHENOTYPIC NOVELTY" if gt_novel else "NO PHENOTYPIC NOVELTY"),
                           "verified_clean": novel == expected and (bool(ranked) if expected else not ranked)}
    return {"seed":seed,"all_negative_controls_passed":all(c["verified_clean"] for c in results.values()),"cases":results}


def run_task4_negative_controls(seed: int = 42) -> dict:
    """
    Executes the 6 rigorous negative controls required by Task 4:
    NC1: Child genotype differs from parents but phenotype remains within parental range.
    NC2: Recombination occurs but has no phenotype contribution.
    NC3: Phenotype is caused by a single variant while an unrelated crossover exists.
    NC4: Antagonistic interaction with signed effect.
    NC5: Null/no-causal-contributor phenotype model.
    NC6: Identical parental homologs / no informative markers.
    """
    from .recombination import infer_recombination_events

    results = {}
    loci = generate_loci(50)

    # NC1: Non-parental genotype within parental phenotype range
    pa, pb = generate_synthetic_parents(loci, seed=seed)
    pa.homolog_1[:] = [1]*50; pa.homolog_2[:] = [1]*50
    pb.homolog_1[:] = [0]*50; pb.homolog_2[:] = [0]*50
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", [])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", [])
    child = fertilize(ga, gb, loci)
    cfg1 = PhenotypeConfig(additive={"L01": 10.0, "L02": 10.0})
    tr1 = NoveltyTracer(pa, pb, child, PhenotypeEngine(cfg1))
    nc1_passed = not tr1.baseline_novelty.is_transgressive and tr1.baseline_novelty.novelty_margin == 0.0
    results["NC1"] = {
        "name": "Non-parental genotype within parental phenotype range",
        "expected_transgressive": False,
        "is_transgressive": tr1.baseline_novelty.is_transgressive,
        "phenotypes": {"parent_a": tr1.y_A, "parent_b": tr1.y_B, "offspring": tr1.y_O},
        "passed": nc1_passed,
    }

    # NC2: Recombination occurs but has no phenotype contribution
    pa, pb = generate_synthetic_parents(loci, seed=seed+1, stochastic=True)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", [25])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", [])
    child = fertilize(ga, gb, loci)
    cfg2 = PhenotypeConfig(base_value=15.0)
    tr2 = NoveltyTracer(pa, pb, child, PhenotypeEngine(cfg2))
    cands2 = tr2.generate_candidates()
    seg_cands2 = [c for c in cands2 if c.candidate_type == "SEGMENT"]
    seg_effects = [tr2.run_counterfactual(c).absolute_effect for c in seg_cands2]
    nc2_passed = all(eff == 0.0 for eff in seg_effects) and not tr2.baseline_novelty.is_transgressive
    results["NC2"] = {
        "name": "Recombination without phenotype contribution",
        "recombination_occurred": True,
        "segment_candidates_count": len(seg_cands2),
        "max_segment_effect": max(seg_effects) if seg_effects else 0.0,
        "passed": nc2_passed,
    }

    # NC3: Phenotype caused by single variant, unrelated crossover exists
    pa, pb = generate_synthetic_parents(loci, seed=seed+2, stochastic=True)
    pa.homolog_1[4] = 1; pa.homolog_2[4] = 0
    pb.homolog_1[4] = 1; pb.homolog_2[4] = 0
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", [35])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", [])
    child = fertilize(ga, gb, loci)
    cfg3 = PhenotypeConfig(additive={"L05": 24.0})
    tr3 = NoveltyTracer(pa, pb, child, PhenotypeEngine(cfg3))
    ranked3 = tr3.rank_candidates()
    top1_id = ranked3[0].candidate_id if ranked3 else ""
    seg_cands3 = [r for r in ranked3 if r.candidate_type == "SEGMENT"]
    max_seg_effect = max([r.absolute_effect for r in seg_cands3]) if seg_cands3 else 0.0
    nc3_passed = (top1_id == "VAR_L05") and (max_seg_effect == 0.0)
    results["NC3"] = {
        "name": "Causal single variant with unrelated crossover",
        "top1_candidate": top1_id,
        "is_variant_top1": top1_id == "VAR_L05",
        "recombination_false_attribution": any(r.candidate_id.startswith("SEG") and r.absolute_effect > 0 for r in ranked3[:3]),
        "passed": nc3_passed,
    }

    # NC4: Antagonistic interaction preserves signed effect
    tr4, truth4, meta4 = make_world("antagonistic_epistasis", seed=seed+3)
    target = list(truth4)[0]
    cand4 = next(c for c in tr4.generate_candidates() if c.id == target)
    res4 = tr4.run_counterfactual(cand4)
    nc4_passed = res4.delta < 0 and res4.absolute_effect > 0
    results["NC4"] = {
        "name": "Antagonistic interaction with signed effect",
        "delta": res4.delta,
        "absolute_effect": res4.absolute_effect,
        "is_negative_delta": res4.delta < 0,
        "passed": nc4_passed,
    }

    # NC5: Null phenotype model (no causal contributors)
    pa, pb = generate_synthetic_parents(loci, seed=seed+4, stochastic=True)
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", [])
    gb = simulate_meiosis(pb.homolog_1, pb.homolog_2, "B", [])
    child = fertilize(ga, gb, loci)
    cfg5 = PhenotypeConfig(base_value=10.0)
    tr5 = NoveltyTracer(pa, pb, child, PhenotypeEngine(cfg5))
    cands5 = tr5.generate_candidates()
    effects5 = [tr5.run_counterfactual(c).absolute_effect for c in cands5]
    nc5_passed = not tr5.baseline_novelty.is_transgressive and all(eff == 0.0 for eff in effects5)
    results["NC5"] = {
        "name": "Null phenotype model",
        "is_transgressive": tr5.baseline_novelty.is_transgressive,
        "max_candidate_effect": max(effects5) if effects5 else 0.0,
        "passed": nc5_passed,
    }

    # NC6: Identical parental homologs / no informative markers
    pa, pb = generate_synthetic_parents(loci, seed=seed+5)
    pa.homolog_1[:] = [1]*50; pa.homolog_2[:] = [1]*50
    pb.homolog_1[:] = [1]*50; pb.homolog_2[:] = [1]*50
    ga = simulate_meiosis(pa.homolog_1, pa.homolog_2, "A", [])
    inferred_segs, inferred_events = infer_recombination_events(pa.homolog_1, pa.homolog_2, ga.alleles, "A")
    nc6_passed = len(inferred_events) == 0 and len(inferred_segs) == 1
    results["NC6"] = {
        "name": "Homozygous parents without informative markers",
        "inferred_events_count": len(inferred_events),
        "inferred_segments_count": len(inferred_segs),
        "fabricated_recombination": len(inferred_events) > 0,
        "passed": nc6_passed,
    }

    all_passed = all(c["passed"] for c in results.values())
    return {
        "all_passed": all_passed,
        "results": results,
    }
