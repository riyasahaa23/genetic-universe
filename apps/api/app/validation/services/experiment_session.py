"""
Experiment Session Manager
Orchestrates end-to-end experiment lifecycle, manages active in-memory scientific state,
records audit history in the database repository, and emits WebSocket events for real-time UI animation.
"""
import uuid
import time
from typing import Dict, Any, Optional, List, Callable
import numpy as np

from app.validation.scientific.recombination import (
    generate_loci,
    generate_synthetic_parents,
    simulate_meiosis,
    fertilize,
    ParentGenome,
    Gamete,
    OffspringGenome,
    Locus,
)
from app.validation.scientific.phenotype import (
    PhenotypeEngine,
    PhenotypeConfig,
    PhenotypeBreakdown,
    get_default_demo_phenotype_config,
)
from app.validation.scientific.novelty import detect_novelty, NoveltyAssessment
from app.validation.scientific.attribution import NoveltyTracer, CounterfactualResult
from app.validation.db.repository import ExperimentRepository


class ExperimentState:
    def __init__(self, experiment_id: str, seed: int, locus_count: int):
        self.experiment_id = experiment_id
        self.seed = seed
        self.locus_count = locus_count
        self.status = "CREATED"
        self.loci: List[Locus] = generate_loci(locus_count)
        self.parent_a: Optional[ParentGenome] = None
        self.parent_b: Optional[ParentGenome] = None
        self.gamete_a: Optional[Gamete] = None
        self.gamete_b: Optional[Gamete] = None
        self.offspring: Optional[OffspringGenome] = None
        self.phenotype_config: PhenotypeConfig = get_default_demo_phenotype_config()
        self.phenotype_engine: PhenotypeEngine = PhenotypeEngine(self.phenotype_config)
        self.parent_a_phenotype: Optional[PhenotypeBreakdown] = None
        self.parent_b_phenotype: Optional[PhenotypeBreakdown] = None
        self.offspring_phenotype: Optional[PhenotypeBreakdown] = None
        self.novelty_assessment: Optional[NoveltyAssessment] = None
        self.tracer: Optional[NoveltyTracer] = None
        self.ranked_candidates: Optional[List[CounterfactualResult]] = None
        self.evidence_graph: Optional[Dict[str, Any]] = None


class ExperimentManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ExperimentManager, cls).__new__(cls)
            cls._instance.experiments = {}
            cls._instance.ws_subscribers = {}
        return cls._instance

    async def broadcast_event(self, experiment_id: str, event_type: str, data: Dict[str, Any]):
        """Broadcasts WebSocket events to listening frontend clients."""
        listeners = self.ws_subscribers.get(experiment_id, set())
        message = {"event": event_type, "experiment_id": experiment_id, "data": data, "timestamp": time.time()}
        for send_fn in list(listeners):
            try:
                await send_fn(message)
            except Exception:
                listeners.discard(send_fn)

    def create_experiment(self, seed: int = 42, locus_count: int = 50, repo: Optional[ExperimentRepository] = None) -> ExperimentState:
        exp_id = f"exp_{uuid.uuid4().hex[:8]}"
        state = ExperimentState(exp_id, seed, locus_count)
        self.experiments[exp_id] = state

        if repo:
            repo.create_experiment(exp_id, seed, locus_count)

        return state

    def get_experiment(self, experiment_id: str) -> Optional[ExperimentState]:
        return self.experiments.get(experiment_id)

    async def setup_genomes(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> ExperimentState:
        state = self.get_experiment(experiment_id)
        if not state:
            raise KeyError(f"Experiment {experiment_id} not found.")

        p_a, p_b = generate_synthetic_parents(state.loci, seed=state.seed)
        state.parent_a = p_a
        state.parent_b = p_b
        state.status = "GENOMES_CREATED"

        if repo:
            repo.update_status(experiment_id, state.status)
            repo.save_parent_genomes(experiment_id, "A", p_a.homolog_1, p_a.homolog_2)
            repo.save_parent_genomes(experiment_id, "B", p_b.homolog_1, p_b.homolog_2)

        await self.broadcast_event(experiment_id, "experiment_started", {
            "locus_count": state.locus_count,
            "seed": state.seed
        })
        return state

    async def run_meiosis(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> ExperimentState:
        state = self.get_experiment(experiment_id)
        if not state or not state.parent_a or not state.parent_b:
            raise ValueError("Genomes must be generated before meiotic simulation.")

        await self.broadcast_event(experiment_id, "meiosis_started", {})

        # Deterministic meiosis: Parent A crossovers bringing L10 and L31 together
        rng_a = np.random.default_rng(state.seed + 101)
        rng_b = np.random.default_rng(state.seed + 202)

        # For 50 loci demo: crossover at pos 20
        crossovers_a = [20] if state.locus_count >= 35 else [state.locus_count // 2]
        crossovers_b = [15] if state.locus_count >= 30 else [state.locus_count // 3]

        gamete_a = simulate_meiosis(
            state.parent_a.homolog_1,
            state.parent_a.homolog_2,
            "A",
            crossover_positions=crossovers_a,
            start_homolog=0,
            rng=rng_a,
        )

        gamete_b = simulate_meiosis(
            state.parent_b.homolog_1,
            state.parent_b.homolog_2,
            "B",
            crossover_positions=crossovers_b,
            start_homolog=0,
            rng=rng_b,
        )

        state.gamete_a = gamete_a
        state.gamete_b = gamete_b
        state.status = "MEIOSIS_COMPLETED"

        for xo in gamete_a.crossovers:
            await self.broadcast_event(experiment_id, "crossover_created", {
                "parent": "A",
                "position": xo,
                "homolog_from": "A1",
                "homolog_to": "A2",
            })

        for xo in gamete_b.crossovers:
            await self.broadcast_event(experiment_id, "crossover_created", {
                "parent": "B",
                "position": xo,
                "homolog_from": "B1",
                "homolog_to": "B2",
            })

        await self.broadcast_event(experiment_id, "gamete_created", {
            "gamete_a_crossovers": gamete_a.crossovers,
            "gamete_b_crossovers": gamete_b.crossovers,
        })

        if repo:
            repo.update_status(experiment_id, state.status)
            for xo in gamete_a.crossovers:
                repo.save_crossover(experiment_id, "A", xo, "A1", "A2")
            for xo in gamete_b.crossovers:
                repo.save_crossover(experiment_id, "B", xo, "B1", "B2")
            repo.save_gamete(experiment_id, "A", gamete_a.alleles, [s.to_dict() for s in gamete_a.segments])
            repo.save_gamete(experiment_id, "B", gamete_b.alleles, [s.to_dict() for s in gamete_b.segments])

        return state

    async def generate_offspring(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> ExperimentState:
        state = self.get_experiment(experiment_id)
        if not state or not state.gamete_a or not state.gamete_b:
            raise ValueError("Gametes must be generated before fertilization.")

        await self.broadcast_event(experiment_id, "fertilization_started", {})

        offspring = fertilize(state.gamete_a, state.gamete_b, state.loci)
        state.offspring = offspring
        state.status = "OFFSPRING_CREATED"

        await self.broadcast_event(experiment_id, "offspring_created", {
            "offspring_id": offspring.offspring_id,
            "dosage": offspring.get_dosage(),
        })

        if repo:
            repo.update_status(experiment_id, state.status)
            repo.save_offspring(
                experiment_id,
                offspring.get_dosage(),
                [p.to_dict() for p in offspring.loci_provenance],
            )

        return state

    async def calculate_phenotypes(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> ExperimentState:
        state = self.get_experiment(experiment_id)
        if not state or not state.offspring or not state.parent_a or not state.parent_b:
            raise ValueError("Genomes and offspring required for phenotype evaluation.")

        bd_a = state.phenotype_engine.evaluate_diploid(state.parent_a.homolog_1, state.parent_a.homolog_2)
        bd_b = state.phenotype_engine.evaluate_diploid(state.parent_b.homolog_1, state.parent_b.homolog_2)
        bd_o = state.phenotype_engine.evaluate_diploid(
            state.offspring.maternal_gamete.alleles, state.offspring.paternal_gamete.alleles
        )

        state.parent_a_phenotype = bd_a
        state.parent_b_phenotype = bd_b
        state.offspring_phenotype = bd_o
        state.status = "PHENOTYPE_CALCULATED"

        await self.broadcast_event(experiment_id, "phenotype_calculated", {
            "parent_a": bd_a.total,
            "parent_b": bd_b.total,
            "offspring": bd_o.total,
        })

        if repo:
            repo.update_status(experiment_id, state.status)
            repo.save_phenotype_result(experiment_id, "Parent A", bd_a.total)
            repo.save_phenotype_result(experiment_id, "Parent B", bd_b.total)
            repo.save_phenotype_result(experiment_id, "Offspring", bd_o.total)

        return state

    async def detect_novelty(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> NoveltyAssessment:
        state = self.get_experiment(experiment_id)
        if not state or state.offspring_phenotype is None:
            raise ValueError("Phenotypes must be calculated before novelty detection.")

        assessment = detect_novelty(
            state.parent_a_phenotype.total,
            state.parent_b_phenotype.total,
            state.offspring_phenotype.total,
        )
        state.novelty_assessment = assessment

        await self.broadcast_event(experiment_id, "novelty_detected", assessment.to_dict())
        return assessment

    async def run_trace(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> List[CounterfactualResult]:
        state = self.get_experiment(experiment_id)
        if not state or not state.offspring:
            raise ValueError("Offspring required for Novelty Trace.")

        await self.broadcast_event(experiment_id, "trace_started", {})

        tracer = NoveltyTracer(state.parent_a, state.parent_b, state.offspring, state.phenotype_engine)
        state.tracer = tracer
        ranked = tracer.rank_candidates()
        state.ranked_candidates = ranked
        state.status = "TRACE_COMPLETED"

        for cand in ranked[:3]:
            await self.broadcast_event(experiment_id, "candidate_found", cand.to_dict())

        if repo:
            repo.update_status(experiment_id, state.status)
            repo.save_candidates(experiment_id, [r.to_dict() for r in ranked])

        return ranked

    async def run_counterfactual(
        self, experiment_id: str, candidate_id: str, intervention: str, repo: Optional[ExperimentRepository] = None
    ) -> CounterfactualResult:
        state = self.get_experiment(experiment_id)
        if not state or not state.tracer:
            await self.run_trace(experiment_id, repo=repo)

        await self.broadcast_event(experiment_id, "counterfactual_started", {
            "candidate_id": candidate_id,
            "intervention": intervention,
        })

        from app.validation.services.counterfactual_service import counterfactual_service
        result = counterfactual_service.run_intervention(state.tracer, candidate_id, intervention)

        await self.broadcast_event(experiment_id, "counterfactual_completed", result.to_dict())

        if repo:
            repo.save_counterfactual_result(
                experiment_id,
                candidate_id,
                intervention,
                result.original_phenotype,
                result.counterfactual_phenotype,
                result.delta,
            )

        return result

    async def get_evidence_graph(self, experiment_id: str, repo: Optional[ExperimentRepository] = None) -> Dict[str, Any]:
        state = self.get_experiment(experiment_id)
        if not state or not state.tracer:
            await self.run_trace(experiment_id, repo=repo)

        graph_data = state.tracer.build_evidence_graph(top_candidates=state.ranked_candidates)
        state.evidence_graph = graph_data
        state.status = "COMPLETED"

        await self.broadcast_event(experiment_id, "evidence_graph_ready", {})
        await self.broadcast_event(experiment_id, "experiment_completed", {})

        if repo:
            repo.update_status(experiment_id, "COMPLETED")
            repo.save_evidence_edges(experiment_id, graph_data.get("links", []))

        return graph_data


experiment_manager = ExperimentManager()
