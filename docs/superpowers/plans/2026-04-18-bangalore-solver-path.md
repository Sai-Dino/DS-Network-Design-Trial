# Bangalore Solver Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first bounded Bangalore-only solver path for the `benchmark_103` brownfield world, with truthful cost/coverage/store-count outputs and at least one prototype run.

**Architecture:** Add a new `network-optimizer/bangalore_solver/` package that owns Bangalore-only data loading, deterministic candidate generation, business semantics, and a bounded MILP runner. Reuse only the minimum stable helpers from `server.py` for local scope resolution, fixed-store metadata, and OSRM-backed distance graph construction where that avoids duplicating critical logic. Keep solver outputs on a separate artifact and endpoint lane so they cannot be confused with the old heuristic `/api/result`.

**Tech Stack:** Python 3, pandas, numpy, scipy MILP, optional native HiGHS, local OSRM, unittest

---

## File Structure

- Create: `network-optimizer/bangalore_solver/__init__.py`
- Create: `network-optimizer/bangalore_solver/config.py`
- Create: `network-optimizer/bangalore_solver/contracts.py`
- Create: `network-optimizer/bangalore_solver/data.py`
- Create: `network-optimizer/bangalore_solver/candidates.py`
- Create: `network-optimizer/bangalore_solver/semantics.py`
- Create: `network-optimizer/bangalore_solver/model.py`
- Create: `network-optimizer/bangalore_solver/runner.py`
- Create: `network-optimizer/bangalore_solver/README.md`
- Create: `network-optimizer/run_bangalore_solver.py`
- Create: `network-optimizer/tests/test_bangalore_solver_candidates.py`
- Create: `network-optimizer/tests/test_bangalore_solver_semantics.py`
- Create: `network-optimizer/tests/test_bangalore_solver_model.py`
- Modify minimally if needed: `network-optimizer/server.py`

## Task 1: Freeze Config And Contract

- [ ] Write the Bangalore solver config dataclass with Bangalore-only defaults, candidate caps, clustering radius, tier radii, hard floor, and future constraint hooks.
- [ ] Freeze the overnight `Super` defaults in config from repo evidence:
  - `super_role = full_competitor`
  - `super_ds_radius = 5.5`
  - `super_fixed_penalty_per_order = 5.0`
  - `fixed_super_min_sqft = 4000`
- [ ] Write the result-contract helpers for `bangalore_solver_v1`, including truthful status, counts, notes, and unmet-requirements fields.
- [ ] Add tests for config normalization and contract assembly.

## Task 2: Build Bangalore Data Loader

- [ ] Implement Bangalore-only data loading that reads:
  - `daily_demand_aggregated.csv`
  - `Store details - 151 polygons with stores.csv`
  - `Store details - 103 old stores.csv`
  - `benchmark_103_store_metadata.csv`
- [ ] Reuse repo loading logic where it is already canonical, but return a solver-specific immutable data bundle instead of mutating planner state all over the new path.
- [ ] Implement deterministic demand clustering for the model slice and preserve total demand weight.
- [ ] Add tests that verify row counts, benchmark-103 fixed-world loading, and demand-weight conservation through clustering.

## Task 3: Implement Deterministic Candidate Generation

- [ ] Implement bounded candidate generation from:
  - fixed `benchmark_103` sites
  - weighted demand seeds
  - bounded gap-fill seeds
- [ ] Make candidate generation deterministic and auditable with clear counts by source.
- [ ] Expose candidate summary fields in the output contract.
- [ ] Add tests for deterministic ordering, cap enforcement, and source labeling.

## Task 4: Implement Business Semantics Layer

- [ ] Encode the hard coverage floor rule at `99.75%`.
- [ ] Encode `Mini` exclusion from hard coverage.
- [ ] Encode no-closure behavior for fixed stores.
- [ ] Encode fixed-store Super upgrade eligibility from metadata.
- [ ] Encode “no downgrade to Mini” and truthful physical store counting.
- [ ] Add tests that fail if a fixed store is dropped, if an ineligible fixed store is upgraded to Super, or if Mini changes hard coverage.

## Task 5: Implement First Solver Model Slice

- [ ] Build a bounded MILP with:
  - open Standard variables
  - Super upgrade/open variables
  - single-source assignment variables
  - uncovered-demand variables
- [ ] Restrict assignments to feasible OSRM-backed or repo-approved distance edges within tier radius.
- [ ] Solve with objective ordering:
  - meet hard floor
  - minimize last-mile cost
  - minimize new physical stores
  - minimize Super count
- [ ] Extract truthful counts, assignments, cost, coverage, and reuse/upgrade details into the result contract.
- [ ] Add model tests for objective ordering, hard-floor enforcement, and store counting.

## Task 6: Add Bangalore-Only Runner And Inspection Hooks

- [ ] Add a Bangalore-only CLI runner that executes the new path and writes a result artifact under `optimization_results/`.
- [ ] Add a solver-path README that explains scope, boundaries, and output fields.
- [ ] If minimal server integration is safe, add a clearly separate read-only hook so solver outputs cannot be confused with the old heuristic planner.

## Task 7: Prototype Execution And Verification

- [ ] Run unit tests for the new solver-path package.
- [ ] Run syntax/import verification for all new files.
- [ ] Attempt at least one Bangalore-only prototype run of the new solver runner.
- [ ] Capture the exact command, outcome, and blocker if the solve does not finish or does not meet the floor.

## Task 8: Overnight Report

- [ ] Write a final overnight report that separates:
  - completed
  - partially completed
  - blocked
  - not started
- [ ] Include assumptions, files changed, tests run, exact commands, prototype outcome, next prompt, and `Unproven Claims`.

## Policy-Driven Follow-On

- [ ] Extend the solver-lane config into an explicit policy surface rather than ad hoc config branching.
- [ ] Add regression protection for the locked Bangalore anchor point before policy refactoring.
- [ ] Add a Bangalore-only scenario runner that emits both JSON and readable summary output for requested what-if cases.
- [ ] Keep any Super-core-city work bounded to solver-owned hooks; if geometry input is missing, block explicitly rather than borrowing legacy planner logic.
