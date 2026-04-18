# Codex Handoff: Network Optimizer

This handoff is specific to the current Bangalore network-optimizer work and the thread that led to it. It is not a generic repo summary.

## Current goal

The active goal is to make the constrained Bangalore planner produce a trustworthy final result for the `benchmark_103` / `old_103_exact_locations` family with the current business logic:

- final network = Standard + Super + Mini
- hard coverage should be driven by Standard + Super
- Mini is a cost layer and should not change hard coverage
- Super matters before rescue because it can reduce rescue / tail Standard needs
- rescue should only address the true remaining tail

The business requirement from the thread is strict:

- **99.6% hard coverage is the minimum acceptable result**
- a result below `99.6%` is not acceptable to leadership
- `100%` would be ideal, but `99.6%` is the negotiated floor
- interim API results should remain visible during the run
- **Mini must not even start unless coverage is already at or above the required floor**
- the user now specifically suspects missing rescue Standard and/or Exception Standard hubs are part of the remaining coverage shortfall

## Current state of the work

The work is no longer stuck at purely hidden runtime phases. Multiple visibility and packet-assembly issues were found and partially fixed. The planner can now:

- progress through Standard backbone
- expose provisional Super-relief status
- land a core packet
- enter deferred Mini / Super phases

However, the optimization outcome is still not meeting the required `99.6%` threshold, and the control-flow/packet logic required several bug fixes in this thread.

## Important files touched or likely involved

Primary:

- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/server.py`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/run_old103_baseline_plus_rules.sh`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/run_office_meeting_fast.sh`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/run_office_demo_fast.sh`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/start.sh`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/start_osrm.sh`

Reference / related:

- `/Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer/run_feb_analysis_quick.py`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/office_103_benchmark_view.html`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/ui-test-harness/artifacts/world-103-baseline/summary.json`
- `/Users/thota/Downloads/DS-Network-Design-Trial-main/optimization_results/latest_bangalore_103_decision_packet.json`

## Baseline model family in use

The work in this thread converged on:

- current order demand
- current 151-polygon scope
- old exact `103` fixed-store world
- fixed store mode `benchmark_103`
- fixed store source mode `old_103_exact_locations`

This was intentionally used as the anchor because earlier trusted benchmark-family results came from that world.

## Confirmed business logic from the thread

This is the agreed target logic:

1. Standard backbone first.
2. Decision-grade Super relief before rescue.
3. Rescue only for the true leftover tail.
4. Mini later for cost only.

Additional details:

- fixed 103 stores can become Super only if sqft-eligible
- new Standard stores can become Super
- Mini should not change hard coverage
- Mini should remain completely disabled below the hard-coverage floor
- rescue is still Standard-radius coverage, but with relaxed spacing when needed
- Exception Standard hubs are still meaningful and may need more search / budget if small uncovered pockets remain

## Progress already made in this thread

The following meaningful progress happened:

1. Multiple silent/stuck-looking phases were instrumented.
2. Provisional Super relief was exposed with heartbeat progress.
3. Rescue search was given heartbeat progress.
4. `/api/status` gained:
   - `optimization_progress_updated_at`
   - `optimization_progress_age_s`
   - `optimization_health`
5. The run-state now more clearly distinguishes:
   - running
   - core ready
   - deferred running
6. Packet validation was tightened so wrong packets fail loudly instead of silently shipping.
7. Several packet-consistency bugs were found because of those validators.
8. The final completion gate was tightened so a run should no longer mark `Complete` below the required target.
9. `/api/status` was patched to expose `decision_grade_result` counts via `result_summary` once a core packet exists.

## Bugs encountered in this thread

This list is intentionally complete enough for a fresh Codex run to understand the history.

### 1. New-standard count mismatch

- Observed symptom:
  - run failed with `Deferred enrichment error: New-standard count mismatch between decision packet and planning layers.`
- Suspected / confirmed root cause:
  - `new_standard_count` was inconsistently defined.
  - One path counted only `base + rescue`.
  - Another path included `gap_fill` too.
- Status:
  - **fixed**
- Fix summary:
  - normalized “new Standard” to mean `base + gap-fill + rescue`
  - updated validator and packet builders accordingly

### 2. Active-view Super count mismatch

- Observed symptom:
  - deferred finalize failed with `Active-view Super count mismatch.`
- Suspected / confirmed root cause:
  - active scenario view still held provisional Super while deferred planning layers had final Super count
- Status:
  - **fixed**
- Fix summary:
  - refreshed the active Standard+Super view using the final Super layer during deferred finalize

### 3. Active-view Mini count mismatch

- Observed symptom:
  - deferred finalize failed with `Active-view Mini count mismatch.`
- Suspected / confirmed root cause:
  - final packet claimed Mini from planning layers while selected active view still pointed at a non-`+Mini` view
  - additionally, view selection and active-view refresh ordering caused the selected view to drift
- Status:
  - **partially fixed / needs continued watching**
- Fix summary:
  - deferred result assembly was changed so Mini is only counted when the selected active view is actually a `+Mini` view
  - active-view selection was moved later in finalize logic so it chooses from the fully built scenario view set
- Why still watch it:
  - this bug appeared multiple times in slightly different forms; a fresh autonomous run should confirm it is really gone

### 4. Sub-target result incorrectly marked complete

- Observed symptom:
  - a full run completed cleanly with:
    - `175` physical Standard
    - `79` promoted Super within Standard
    - `48` Mini
    - `98.49%` hard coverage
    - `₹37.49` avg cost
  - but the required target was `99.6%`
  - the system still marked the run `Complete`
- Suspected / confirmed root cause:
  - `99.6%` was being used as a rescue / branch-stage handoff target
  - deferred final completion did not enforce that target as a hard final completion gate
- Status:
  - **fixed in code, needs validation rerun**
- Fix summary:
  - added final deferred completion guard:
    - if final decision-grade hard coverage is below the required target, the run should raise and not mark `Complete`

### 5. Status endpoint did not show live decision-grade counts

- Observed symptom:
  - `/api/status` gave only generic run health while counts and metrics were hidden under `/api/result`
- Suspected / confirmed root cause:
  - `/api/status` did not surface `decision_grade_result`
- Status:
  - **fixed in code, needs normal rerun confirmation**
- Fix summary:
  - patched `/api/status` and `/api/bootstrap-state` to include `result_summary` pulled from `decision_grade_result`

### 6. Long silent post-backbone phases caused false “hung” suspicion

- Observed symptom:
  - run appeared stuck for long periods after backbone summary
- Suspected / confirmed root cause:
  - hidden provisional Super-relief and rescue-ranking phases had little or no progress reporting
- Status:
  - **improved, but still worth monitoring**
- Fix summary:
  - added progress callbacks and heartbeat messages for:
    - provisional Super relief
    - rescue ranking
    - post-backbone branch steps

### 7. Metric mismatch between provisional coverage and decision-grade coverage

- Observed symptom:
  - provisional/effective coverage during Super relief often looked higher than final decision-grade hard coverage
  - e.g. provisional `98%+` followed by decision-grade `97.14%`
- Suspected / confirmed root cause:
  - different coverage notions still exist in the pipeline:
    - provisional Super-relief estimate
    - raw rescue-band threshold
    - final decision-grade hard coverage
- Status:
  - **still open conceptually**
- Why it matters:
  - it causes false optimism mid-run and confuses the user

### 8. Branch quality still too weak before Mini

- Observed symptom:
  - core branch snapshots are still topping out around `98.4%` even before Mini is involved
  - one recent visible core packet showed:
    - `selected_view: rescue_first_standard_100`
    - `hard_coverage_pct: 98.42`
    - `fixed_standard_count: 103`
    - `new_standard_count: 72`
    - `gap_fill_standard_count: 40`
    - `rescue_standard_count: 32`
    - `exception_count: 0`
    - `super_count: 26`
    - `mini_count: 0`
    - `total_physical_standard_count: 175`
    - `avg_cost: 42.27`
    - `avg_dist: 1.422`
- Suspected / confirmed root cause:
  - the active Standard/Super/Rescue/Exception branch is underperforming before Mini, not because Mini is running too early
  - `exception_count: 0` at only `98.42%` is suspicious and consistent with the user's concern that rescue and/or Exception Standard hubs may be underused
- Status:
  - **open**

## Latest known run / status context

Before writing this handoff, the current server was restarted and a fresh run was launched on the stricter final gate and patched status shape.

Latest known live state from this thread before the handoff write:

- run was active
- status showed:
  - `Standard cache prep`
  - then Standard gap fill
  - then provisional Super relief
  - then core/deferred transitions depending on the run
- after patching `/api/status`, `result_summary` should appear once a core packet lands

The most recent completed clean-but-unacceptable run from this thread was:

- active view: `rescue_first_standard_100_plus_mini`
- fixed Standard: `103`
- new Standard: `72`
- total physical Standard: `175`
- mini: `48`
- super: `79`
- hard coverage: `98.49%`
- avg cost: `₹37.49`
- avg dist: `1.293 km`

That run is **not acceptable** because it is below the `99.6%` requirement.

## Validation flows to use for future fixes

### 1. Required environment

Start OSRM first:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./start_osrm.sh
```

Then start the server:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./start.sh
```

Or directly:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
python3 server.py
```

### 2. Main validation flow for this thread

Use:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./run_old103_baseline_plus_rules.sh
```

This is the most important runner for continuing this thread’s work.

### 3. Live status and result checks

```bash
curl -s http://127.0.0.1:5050/api/status | jq
curl -s http://127.0.0.1:5050/api/result | jq
```

Watch especially:

- `optimization_running`
- `optimization_core_ready`
- `optimization_deferred_running`
- `optimization_progress`
- `optimization_progress_age_s`
- `optimization_health`
- `result_summary`
- `decision_grade_result`

### 4. Other helper flows

Fast benchmark helper:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./run_office_demo_fast.sh
```

Constrained office meeting helper:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./run_office_meeting_fast.sh
```

Quick smoke:

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
python3 run_feb_analysis_quick.py
```

## What a fresh autonomous Codex run should do next

1. Start from the patched `server.py`.
2. Run the old-103 baseline-plus-rules flow again.
3. Confirm:
   - no packet-consistency validator crash
   - `/api/status` shows `result_summary` once core lands
   - no final `Complete` is emitted below `99.6%`
4. If the run finishes below `99.6%`, treat that as a **failing result**, not success.
5. If needed after packet consistency is proven, continue on the still-open metric-alignment issue between provisional and decision-grade coverage.
6. Only after a trustworthy local run should the office-laptop mimic be revisited.

## Blockers / assumptions / warnings

- OSRM is required for meaningful evaluation.
- Port conflicts on `5050`, `5000`, or `5001` can confuse status and timing.
- This repo has long-running services; avoid stacking multiple optimizer servers.
- The user was clear that they should **not** have to babysit the run.
- The user was also clear that `99.6%` is a hard floor, not a soft target.

## Key caution for any future autonomous run

Do **not** call a run successful merely because:

- the server stayed alive
- deferred finalize completed
- the packet validated structurally

The run is only acceptable if the final decision-grade hard coverage is at least the required threshold. In this thread that means:

- **`99.6%` minimum**

Anything below that should be reported as below target, even if all plumbing is otherwise clean.
