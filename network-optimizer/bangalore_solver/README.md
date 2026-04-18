# Bangalore Solver Path

This package is the new Bangalore-only solver lane for the overnight brownfield prototype.

Scope:

- Bangalore only
- `benchmark_103` fixed-store world only
- honest hard coverage floor = `99.75%`
- hard coverage comes from `Standard + Super` only
- `Mini` is excluded from hard coverage and remains a solver-lane cost layer only

Current slice:

- deterministic Bangalore demand clustering
- deterministic candidate generation from demand seeds and gap-fill seeds
- bounded MILP over fixed stores, new Standard sites, and Super upgrades/opens
- explicit solver policy surface for store-count bounds, exact total-site targets, Mini density rules, last-mile cost caps, and bounded Super policy hooks
- separate scenario runner for Bangalore what-if analysis
- separate result contract: `bangalore_solver_v1`

Policy layers:

- `config.py`: raw Bangalore solver configuration and CLI-facing inputs
- `policy.py`: resolved business-policy surface and city override handling
- `model.py`: core solver math plus policy-backed constraints and policy feasibility evaluation
- `scenario_runner.py`: Bangalore scenario execution and readable summary artifacts

Runner:

```bash
python3 run_bangalore_solver.py
```

Scenario runner:

```bash
python3 run_bangalore_solver_scenarios.py
```

Artifacts:

- `optimization_results/latest_bangalore_solver_v1.json`
- `optimization_results/bangalore_solver_v1_<timestamp>.json`
- `optimization_results/policy_scenarios/latest_bangalore_solver_policy_scenarios.json`
- `optimization_results/policy_scenarios/latest_bangalore_solver_policy_scenarios.md`
