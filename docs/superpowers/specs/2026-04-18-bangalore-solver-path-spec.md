# Bangalore Solver Path Spec

Date: 2026-04-18
Status: Active overnight implementation spec for the new Bangalore-first solver path
Scope: Bangalore only, `benchmark_103` brownfield world only, solver path only

## Objective Freeze

This overnight run builds a new Bangalore-first optimal solver path that becomes the primary optimization track for Bangalore decision work.

The solver objective ordering is fixed as:

1. Meet the honest hard coverage floor of `99.75%`.
2. Minimize last-mile cost subject to that floor.
3. Prevent store-count blow-up.
4. Preserve tier semantics exactly.

Coverage is a hard feasibility gate, not the thing to maximize without limit. A solution that reaches the floor only by opening an implausible number of stores is a failure.

## Business Semantics

These semantics are binding for this solver path:

- `Mini` is a dense-node cost layer for high-demand clusters with fastest-moving SKUs.
- `Standard` is the normal node for serving any customer with fast-moving SKUs.
- `Super` is a large-inventory node for serving any customer with fast-moving plus long-tail SKUs.
- `Mini` does not count toward the hard coverage floor.
- Existing stores are mostly fixed.
- Existing stores may be upgraded or reclassified to `Super` when eligible.
- Existing stores may not be downgraded to `Mini`.
- No closures.
- No split-fulfillment modeling in this first solver path.

For the overnight prototype, `Super` reuses the honest Bangalore office profile already present in the repo:

- `super_role = full_competitor`
- `super_ds_radius = 5.5 km`
- `super_fixed_penalty_per_order = 5.0`
- fixed-store upgrade eligibility comes from `benchmark_103_store_metadata.csv` plus the configured `fixed_super_min_sqft` threshold

## Bounded First Slice

The first solver slice is intentionally narrower than the full future architecture.

It will solve a Bangalore brownfield network with these decision families:

- open `Standard` at deterministic Bangalore candidate sites
- keep all fixed `benchmark_103` stores open
- upgrade eligible fixed `Standard` stores to `Super`
- open net-new `Super` only at candidate sites that are also valid Standard candidates
- assign each demand cluster to exactly one serving site/tier

`Mini` is represented in the result contract and semantic guards, but it is not optimized in the first slice. The first slice returns `mini_count = 0` and marks Mini optimization as out of scope for the prototype run.

This is the smallest acceptable assumption because:

- it preserves the hard rule that Mini does not affect hard coverage
- it keeps the first solver executable tonight
- it avoids silently mixing Mini cost behavior into the hard-coverage engine

The first slice also stays bounded by deterministic clustering and a capped candidate universe so the prototype remains runnable on the office-compatible local stack.

## Demand And Candidate Representation

The raw Bangalore demand input is too large for a naive single-source mixed-integer assignment model, so the solver path uses a deterministic bounded representation:

- load Bangalore demand from `daily_demand_aggregated.csv`
- aggregate to the repo’s existing demand-cell frame first
- collapse nearby demand cells into deterministic solver clusters for model execution
- keep total demand weight exactly conserved through aggregation
- generate deterministic candidate sites from:
  - fixed `benchmark_103` sites
  - weighted uncovered-demand seeds
  - bounded gap-fill seeds

Candidate generation must be:

- Bangalore only
- deterministic
- auditable
- bounded by config
- independent from `meeting_fast`

## Solver Formulation

The first solver path uses a bounded brownfield facility-location MILP.

Decision variables:

- `y_std_j` = open Standard at candidate site `j`
- `y_sup_j` = open or upgrade Super at candidate site `j`
- `a_i_j_t` = demand cluster `i` assigned to site `j` with tier `t`
- `u_i` = uncovered demand cluster indicator for hard-coverage gating

Tier/domain rules:

- a fixed site is always open as at least Standard
- a fixed site can be upgraded to Super only if metadata marks it eligible
- a candidate site cannot be both Mini and Standard because Mini is out of scope in slice 1
- `y_sup_j <= y_std_j` for net-new sites so a new Super implies a physical site that exists in the network
- for fixed eligible sites, `y_sup_j` means upgrade/reclassification, not an additional physical site

Hard constraints:

- every demand cluster is assigned to exactly one feasible site/tier or marked uncovered
- uncovered weighted demand must be less than or equal to the `0.25%` floor budget
- assignments are only allowed on feasible Bangalore edges within tier radius
- no closures of fixed stores
- fixed-store downgrades to Mini are forbidden
- future-safe store-count and budget constraints are parameter hooks, not active hard constraints in the default overnight run

Objective:

Primary solved objective for the overnight slice:

- minimize total last-mile assignment cost

Tie-break objectives:

- minimize net-new physical store count
- minimize total Super count

The tie-break structure is there to keep store growth controlled without replacing the primary cost objective.

## Cost Semantics

The last-mile cost objective is computed from:

- tier base cost per order
- tier distance-variable cost per order

The first slice does not model:

- split-fulfillment cost
- long-tail inventory penalties
- inventory stockout probabilities
- multi-order batching effects

For `Super`, the first slice uses the existing repo economics:

- base cost = Standard base cost + `super_fixed_penalty_per_order`
- distance variable rate = `super_variable_rate`
- coverage radius = `super_ds_radius`

Those are explicitly future extensions, not hidden assumptions.

## Output Contract

Solver outputs must be clearly distinct from the old heuristic planner.

The solver result contract must include:

- `result_contract = bangalore_solver_v1`
- `solver_path = bangalore_first_milp`
- `city = Bangalore`
- `fixed_store_mode = benchmark_103`
- `hard_coverage_pct`
- `hard_coverage_floor_pct`
- `avg_last_mile_cost`
- `total_last_mile_cost_per_day`
- `store_counts`
- `reuse_counts`
- `upgrade_counts`
- `candidate_summary`
- `demand_summary`
- `config_snapshot`
- `prototype_notes`
- `unmet_requirements`

Solver artifacts must be written to a separate Bangalore-solver file path and, if exposed through the HTTP server, must use a separate endpoint from `/api/result`.

Store counts must be split at least into:

- fixed_standard_count
- new_standard_count
- upgraded_super_count
- new_super_count
- mini_count
- total_unique_physical_store_count

## Future Extension Hooks

The path must be designed so later modes can add:

- fixed total store count
- fixed total budget
- explicit cap on total new physical stores
- explicit cap on Super upgrades
- Mini optimization as a second-stage cost layer
- split-fulfillment modeling

These hooks belong in config and formulation plumbing now, even if not activated tonight.

## Policy-Driven Extension

The next bounded step keeps the solver math stable while moving business rules into an explicit policy surface.

At minimum the solver path must support:

- `min_total_physical_sites`
- `max_total_physical_sites`
- `target_total_physical_sites_exact`
- `avg_last_mile_cost_cap`
- `mini_density_radius_km`
- `mini_density_min_orders_per_day`
- `mini_prefer_existing_physical_site_radius_km`
- `require_super_core_city_coverage`
- `prefer_eligible_fixed_store_upgrades_to_super`
- city-specific policy overrides

If a policy is off, the solver must still solve correctly. If a policy is on, the solver must either enforce it inside the solver lane or block explicitly with a truthful missing-input reason.

The code boundaries should remain explicit:

- core solver math
- business semantics
- policy resolution and constraints
- scenario execution and reporting

## Out Of Scope Tonight

These are intentionally out of scope for this overnight run:

- improving the old heuristic planner
- `meeting_fast`
- fallback planner repair
- deferred-finalize repair on the old planner
- packet-validator-driven old planner repair
- Pan-India support
- non-Bangalore cities
- broad UI polish
- broad repo migration away from `server.py`
- full Mini optimization
- split-fulfillment optimization

## Assumptions

The smallest explicit assumptions for tonight are:

1. Bangalore demand clustering for the solver can use deterministic geographic aggregation so long as total demand weight is preserved.
2. Net-new Super openings can share the Standard candidate universe in slice 1.
3. Fixed-store Super eligibility is driven by `benchmark_103_store_metadata.csv`.
4. The overnight default `fixed_super_min_sqft` will follow the current honest meeting profile (`4000`) while still falling back to `super_eligible_fixed` when size data is missing.
5. Mini remains a semantic placeholder and truthful zero-count layer in the first slice.
6. Local OSRM remains the routing source for feasible-edge construction and cost distances.

## Success Criteria For This Overnight Run

This overnight run counts as meaningful progress only if it leaves behind durable Bangalore solver-path assets including:

- a frozen spec
- an implementation plan
- a bounded Bangalore solver module
- deterministic Bangalore data and candidate plumbing
- business-semantics guards
- tests
- a runnable Bangalore solver entry point
- a truthful result contract
- at least one prototype run result or an exact blocker
