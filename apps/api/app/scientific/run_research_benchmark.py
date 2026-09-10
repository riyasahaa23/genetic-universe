"""CLI for the ground-truth-blind multi-seed validation benchmark."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Sequence

from app.scientific.evaluation.research_benchmark import (
    DEFAULT_BOOTSTRAP_REPLICATES,
    DEFAULT_BOOTSTRAP_SEED,
    DEFAULT_N_SEEDS,
    DEFAULT_NULL_SIMULATIONS,
    run_research_benchmark,
    run_research_benchmark_suite,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the ground-truth-blind multi-seed attribution validation benchmark."
    )
    parser.add_argument("--seeds", type=int, default=DEFAULT_N_SEEDS, dest="n_seeds")
    parser.add_argument("--difficulty", choices=["easy", "medium", "hard", "all"], default="all")
    parser.add_argument("--seed-start", type=int, default=0)
    parser.add_argument("--bootstrap-seed", type=int, default=DEFAULT_BOOTSTRAP_SEED)
    parser.add_argument("--bootstrap-replicates", type=int, default=DEFAULT_BOOTSTRAP_REPLICATES)
    parser.add_argument(
        "--null-simulations",
        type=int,
        default=DEFAULT_NULL_SIMULATIONS,
        help="Use 0 to disable same-parent null simulations.",
    )
    parser.add_argument("--output", type=Path, default=Path("research_benchmark.json"))
    parser.add_argument("--verbose", action="store_true", help="Include per-seed metrics.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    common_kwargs = {
        "n_seeds": args.n_seeds,
        "seed_start": args.seed_start,
        "bootstrap_seed": args.bootstrap_seed,
        "bootstrap_replicates": args.bootstrap_replicates,
        "null_simulations": None if args.null_simulations == 0 else args.null_simulations,
        "include_per_seed": args.verbose,
    }
    report = (
        run_research_benchmark_suite(**common_kwargs)
        if args.difficulty == "all"
        else run_research_benchmark(difficulty=args.difficulty, **common_kwargs)
    )
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(f"Wrote research benchmark report to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
