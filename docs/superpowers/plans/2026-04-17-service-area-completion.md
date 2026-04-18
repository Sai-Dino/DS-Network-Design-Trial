# Service Area Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/api/service-area-polygons` practically usable on the live Bangalore packet by removing avoidable heavy work and returning a lighter territory payload.

**Architecture:** Keep the existing demand-cell assignment logic, but stop depending on the giant all-demand candidate graph for service-area derivation. Build service-area distances from the much smaller fixed/result-site graphs, then batch per-tier polygons so the server and UI no longer handle tens of thousands of territory feature objects.

**Tech Stack:** Python 3.9 server, NumPy/Pandas, unittest, existing Leaflet UI.

---

### Task 1: Add Regression Tests

**Files:**
- Modify: `network-optimizer/tests/test_service_areas.py`

- [ ] **Step 1: Write failing tests**

Add coverage for:
- service-area polygon batching returning one feature per tier with `polygons`
- service-area payload generation using per-site distance arrays rather than the heavy candidate-context fallback seam

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest network-optimizer/tests/test_service_areas.py`
Expected: FAIL on the new service-area batching expectations.

### Task 2: Implement Minimal Backend Fix

**Files:**
- Modify: `network-optimizer/server.py`

- [ ] **Step 1: Update service-area distance derivation**

Use `_service_area_site_distance_arrays(...)` with the fixed-site context to build per-site distance arrays directly for service-area derivation, avoiding the all-demand candidate context path.

- [ ] **Step 2: Batch polygons by tier**

Adjust `_build_service_area_polygons_from_assignments(...)` to:
- keep existing summaries
- compute component membership in linear time
- return one feature per tier with a `polygons` array instead of one feature per connected component

- [ ] **Step 3: Run targeted tests**

Run: `python3 -m unittest network-optimizer/tests/test_service_areas.py`
Expected: PASS

### Task 3: Minimal UI Compatibility

**Files:**
- Modify: `network-optimizer/static/index.html`

- [ ] **Step 1: Update the territory renderer**

Render `feature.polygons` when present, otherwise fall back to the legacy single `feature.polygon` path.

- [ ] **Step 2: Re-run targeted tests / smoke validation**

Run:
- `python3 -m unittest network-optimizer/tests/test_service_areas.py`
- `curl -s -w '\nHTTP %{http_code} total=%{time_total}s size=%{size_download}\n' http://127.0.0.1:5050/api/service-area-polygons > /tmp/service-area-before-final.json`

Expected:
- unit tests pass
- live endpoint returns in practical time with HTTP 200

### Task 4: Final Live Verification

**Files:**
- None

- [ ] **Step 1: Run fresh live verification**

Run:
- `lsof -nP -iTCP:5001 -sTCP:LISTEN`
- `lsof -nP -iTCP:5050 -sTCP:LISTEN`
- `curl -s http://127.0.0.1:5050/api/status | jq`
- `curl -s -w '\nHTTP %{http_code} total=%{time_total}s size=%{size_download}\n' http://127.0.0.1:5050/api/service-area-polygons | tail -n 5`

- [ ] **Step 2: Record actual status**

Classify the service-area item as `DONE`, `PARTIAL`, or `NOT DONE` based on the fresh live evidence.
