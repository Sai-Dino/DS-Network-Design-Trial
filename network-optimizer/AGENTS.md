# Network Optimizer Agent Guide

This subproject is the live Bangalore network-planning app and runner set that sits under `network-optimizer/`.

## Subproject structure

- `server.py`
  Main HTTP server and the core planning logic. This is where:
  - `/api/status`
  - `/api/result`
  - `/api/optimize`
  - `/api/optimize-constrained`
  - `/api/optimize-exact-benchmark`
  are implemented.
- `static/`
  Web UI served by `server.py`.
- `cache/`
  Reused planning artifacts and graph/cache files used to avoid rebuilding candidate graphs every run.
- `uploads/`
  Temporary upload storage.
- `start.sh`
  Starts the optimizer server locally.
- `start_osrm.sh`
  Starts or verifies OSRM for road-distance evaluation.
- `run_office_demo_fast.sh`
  Fast exact-benchmark helper flow.
- `run_office_meeting_fast.sh`
  Constrained Mini + Standard + Super helper flow.
- `run_old103_baseline_plus_rules.sh`
  Historical `benchmark_103` / `old_103_exact_locations` meeting-family runner used heavily in this thread.
- `run_feb_analysis.py`, `run_feb_analysis_quick.py`, `run_feb_month_target.py`
  Standalone analysis / smoke scripts.
- `geometry_core.py`
  Supporting geometry helpers.

## What this repo is and is not

This is **not** a conventional pytest-first repository based on the evidence in this subproject.

- There is no thread-proven pytest-based validation loop for the current network-planner work.
- Real validation here is done by:
  - running OSRM
  - running the server
  - loading real CSV inputs
  - triggering the HTTP optimization flows
  - checking `/api/status` and `/api/result`
  - optionally using the helper shell scripts

Treat this as a service-and-scenario validation repo, not as a unit-test-first codebase.

## Real execution flow

The normal local execution flow for this subproject is:

1. Start OSRM.
2. Start the optimizer server.
3. Load orders and stores, either manually via the UI/API or through one of the helper scripts.
4. Run the relevant optimization flow.
5. Validate through `/api/status` and `/api/result`, not by assuming the shell script output alone is enough.

## Main entrypoints and validation commands

### Start OSRM

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./start_osrm.sh
```

### Start server

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./start.sh
```

### Fast office demo / exact benchmark helper

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./run_office_demo_fast.sh
```

### Office meeting constrained helper

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
./run_office_meeting_fast.sh
```

### Quick February analysis smoke

```bash
cd /Users/thota/Downloads/DS-Network-Design-Trial-main/network-optimizer
python3 run_feb_analysis_quick.py
```

### Common direct status checks

```bash
curl -s http://127.0.0.1:5050/api/status | jq
curl -s http://127.0.0.1:5050/api/result | jq
```

## Service handling guidance

Long-running services should be started carefully.

- Prefer starting them with visible logs or redirected log files.
- Track PIDs when needed.
- Avoid silently stacking multiple server instances on the same port.
- Before restarting, verify what is listening on `5050` or OSRM ports first.

Examples:

```bash
lsof -iTCP:5050 -sTCP:LISTEN -n -P
lsof -iTCP:5000 -sTCP:LISTEN -n -P
lsof -iTCP:5001 -sTCP:LISTEN -n -P
```

## Change discipline

- Fixes should be the **smallest correct fixes**.
- Avoid unrelated refactors.
- Avoid “cleanups” that change behavior unless they are required to complete the task safely.
- When the bug is in result assembly or run-state wiring, prefer patching the exact seam rather than redesigning the planner.

## Expert Gate For Optimizer Prompts

For any Codex prompt or run that can change optimization behavior, search strategy, helper-script behavior, decision semantics, office-demo flow, or final reported business results, expert review is a hard gate before execution.

Required review dimensions:

1. **Domain-expert gate**
   - The prompt must be checked against the established expert guidance for:
     - honest tier semantics
     - coverage vs cost objective ordering
     - Standard / Super / Mini / rescue / Exception behavior
   - Required reviewers must return explicit `ALIGNMENT: YES` or `ALIGNMENT: NO`.
   - If any required reviewer is not aligned, the run is blocked until the prompt is corrected.

2. **Office-laptop gate**
   - The prompt must be checked against office-machine constraints:
     - Git checkout only
     - no new external downloads
     - no new hosted services
     - minimal manual setup
     - repeatable local demo behavior
   - If the proposed step would violate those constraints, the run is blocked.

3. **Final-path honesty gate**
   - `meeting_fast`, preview-only flows, stop-after-publish control flow, and rescue-handover heuristics must not be used as the final-decision path unless the user explicitly asks for preview behavior.
   - Preview metrics do not count as final success.
   - If a step improves provisional metrics but not decision-grade metrics, it does not count as a completed fix.

4. **Verification gate**
   - No success claim is allowed unless the final decision-grade result is verified from localhost `/api/status` and `/api/result`.
   - Logs alone are not sufficient evidence.

5. **Scope gate**
   - Prompts must stay narrowly scoped to the identified blocker whenever possible.
   - Changes must avoid unrelated refactors and should include regression coverage for the specific seam being fixed.

This gate is mandatory for every future optimizer-affecting prompt in this subproject.

## Definition of done

A task in this subproject is only done when all of the following are true:

1. Root cause identified.
2. Smallest correct fix implemented.
3. Relevant validation rerun.
4. Final summary includes:
   - files changed
   - commands run
   - what passed
   - what failed

If a run still finishes below the required target, that is **not** done even if the service ran cleanly.
