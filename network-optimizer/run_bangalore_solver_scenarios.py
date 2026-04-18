#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from bangalore_solver.scenario_runner import load_scenarios_from_file, run_bangalore_solver_scenarios


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Bangalore solver policy scenario set.")
    parser.add_argument("--output-dir", type=str, default=None)
    parser.add_argument("--mode", choices=["all", "exploratory", "constrained"], default="all")
    parser.add_argument("--scenario-file", type=str, default=None)
    args = parser.parse_args()

    scenarios = None
    if args.scenario_file:
        scenarios = load_scenarios_from_file(Path(args.scenario_file))
    payload = run_bangalore_solver_scenarios(
        scenarios=scenarios,
        output_dir=None if args.output_dir is None else Path(args.output_dir),
        mode=args.mode,
    )
    print(json.dumps(payload, indent=2, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
