# Dark Store Network Optimizer — Engineering Handoff

> **Owner**: Kotapothula Sai Dinesh (kotapothula.sai@flipkart.com)
> **Date**: April 9, 2026
> **Status**: Functional prototype — needs algorithm fix + UI integration + production hardening

---

## 1. WHAT WE'RE BUILDING

A **constraint-driven dark store network optimizer** for Flipkart's hyperlocal delivery. Given real order data (for reference - 3.38M orders/month, 120K orders/day across 103 existing hubs), the engine recommends optimal placement of Mini and Standard dark stores to minimize last-mile delivery cost.

**Business goal**: Reduce avg last-mile cost by a few rupees by optimizing hub placement. Lets say Current network has 103 hubs; and we want a proposed network which targets ~200 hubs with maximum order coverage.

**Core design principles**:
- PRIMARY GOAL: Always maximize order coverage within constraints
- Two optional constraints (at least one required): target max hub count AND/OR target last-mile cost
- Uncovered demand is reported honestly (3km pockets with lat/lon + order count) — no satellite backfill
- 100% OSRM road distances — absolutely no Haversine/straight-line fallbacks
- Mini DS (1.5km radius, ₹20+6d) and Standard DS (3km radius, ₹29+9d) overlap on the full grid
- No Super DS for now

---

## 2. REPOSITORY STRUCTURE

```
DS_Network_Design_Trial/
├── network-optimizer/
│   ├── server.py              # Core engine + HTTP API (2828 LOC)
│   ├── geometry_core.py       # Point-in-polygon helpers for Super DS GeoJSON
│   ├── static/
│   │   ├── index.html         # Web UI (Leaflet maps, controls)
│   │   └── vendor/            # JS libraries
│   ├── start.sh               # Launch optimizer server (port 5050)
│   ├── start_osrm.sh          # Launch OSRM Docker container (port 5000)
│   ├── requirements.txt       # pandas, numpy, openpyxl
│   └── uploads/               # Runtime file uploads
├── run_optimization_test.py   # CLI test runner (674 LOC)
├── feb_2026_distance_input.csv       # 287.8 MB, 3.38M rows order data
├── store_to_points_matrix.csv        # 103 stores with polygon edges
└── optimization_results/
    ├── constrained_optimization_results.json
    ├── constrained_proposed_hubs.csv
    ├── uncovered_pockets.csv
    └── current_hubs.csv
```

---

## 3. DATA SPECIFICATIONS

### Order Data (`feb_2026_distance_input.csv`)
| Column | Type | Description |
|--------|------|-------------|
| Date | string | DD-MM-YYYY |
| Order_ID | string | Unique order identifier |
| Hub_Code | string | Current assigned hub (e.g., BEN_003_WH_HL_01) |
| Store_Lat | float | Current hub latitude |
| Store_Lon | float | Current hub longitude |
| Order_Lat | float | Customer delivery latitude |
| Order_Lon | float | Customer delivery longitude |

- 3,380,153 rows, 28 unique dates, 120,719 orders/day
- Auto-detected column mapping in `detect_columns()` (server.py line 352)

### Store Data (`store_to_points_matrix.csv`)
| Column | Type | Description |
|--------|------|-------------|
| store code | string | Hub identifier (lowercase, e.g., ben_120_wh_hl_01) |
| Store Latitude | float | Hub latitude |
| Store Longitude | float | Hub longitude |
| polygon edge | string | Edge point label |
| Point Latitude | float | Polygon edge latitude |
| Point Longitude | float | Polygon edge longitude |

- 103 unique stores, 8,762 polygon edge points
- Store matching with order data uses lowercased Hub_Code

### Grid Aggregation
- Orders aggregated into ~200m grid cells: `cell_lat = round(lat * 500) / 500`
- 17,726 unique grid cells from 3.38M orders
- Each cell stores: cell_lat, cell_lon, order_count, orders_per_day, avg_cust_lat/lon, avg_store_lat/lon

---

## 4. TIER SPECIFICATIONS

| Tier | SKUs | Radius | Cost Model | Min Orders/day | Delivery |
|------|------|--------|------------|----------------|----------|
| Mini DS | ~4K | 1.5 km | ₹20 + ₹6 × distance_km | 300 | Cycle |
| Standard DS | ~15K | 3.0 km | ₹29 + ₹9 × distance_km | 300 | Bike |
| Super DS | ~30K | 4.0 km | ₹29 + ₹9 × distance_km | N/A | Disabled |

- Mini and Standard overlap on the full grid (a cell can be served by both)
- During evaluation, Mini takes priority (cheaper) — if a cell is within Mini radius, it gets Mini cost
- Super DS is disabled (`super_ds_max: 0, min_orders: 999999`)

---

## 5. OSRM INTEGRATION

All road distances use the OSRM Table API. No Haversine fallbacks anywhere.

### Setup
```bash
# OSRM runs on localhost:5000 via Docker
# India map data in ~/osrm-data/india-latest.osrm
./start_osrm.sh
```

### Key Configuration (server.py)
```python
OSRM_BASE_URL = 'http://localhost:5000'
OSRM_WORKERS = 16          # Concurrent HTTP requests
OSRM_BATCH_SIZE = 100      # Coords per OSRM table call (max ~100)
OSRM_TIMEOUT = 30          # Seconds
```

### Connection Pooling
Uses `urllib3.PoolManager` with persistent TCP connections, 3 retries with 0.3s backoff. Critical for performance — eliminates per-request TCP handshake during thousands of table calls.

### Key OSRM Functions
| Function | Purpose |
|----------|---------|
| `_osrm_table_batch(src, dst)` | Single OSRM Table API call → distance matrix (km) |
| `osrm_one_to_many(src_lat, src_lon, dst_lats, dst_lons)` | Road distances from one point to many (parallel batches) |
| `osrm_min_distances_parallel(pts, hubs)` | Min road distance per point to any hub |
| `osrm_min_distances_and_argmin(pts, hubs)` | Min distance + index of nearest hub |
| `osrm_pairwise_distances_parallel(custs, stores)` | 1:1 customer→store road distances |

### Known OSRM Issues
- **TooBig error**: Batch size > 100 causes OSRM to reject. Keep OSRM_BATCH_SIZE ≤ 100.
- **Server overload**: 48+ concurrent workers overwhelm OSRM → empty responses, ConnectionResetError. 16 workers is stable.
- **Retry logic**: 3 attempts with backoff for empty responses and JSONDecodeError.

---

## 6. CURRENT ALGORITHM: `optimize_with_constraints()`

Located in server.py (line ~1649). Uses **unified greedy** — places one hub at a time, stops at constraint limit.

### How It Works

```
1. UNIFIED GREEDY LOOP (one hub per iteration until hub_count == target_max_hubs):
   a. Try to form a Mini candidate from highest-demand remaining cell
      - OSRM ball within 1.5km, cluster orders must be in [300, 10000]
   b. Try to form a Standard candidate from highest-demand remaining cell
      - OSRM ball within 3.0km, cluster orders must be in [300, 15000]
   c. Pick whichever candidate covers more *currently-uncovered* demand
   d. Place that hub, mark covered cells, remove consumed cells from that tier's pool
   e. Repeat

2. FINAL METRICS (OSRM):
   - Current network: pairwise road distances customer→assigned store
   - Proposed network: min road distance to nearest Mini/Standard hub per cell
   - Cost: tier-specific base + rate × distance
   - Uncovered cells keep current network cost

3. UNCOVERED POCKET GROUPING:
   - Group uncovered cells into 3km pockets using greedy OSRM clustering
   - Output: {lat, lon, orders_per_day, num_cells} per pocket
```

### Helper: `_try_greedy_hub()`
For each candidate, does TWO OSRM calls:
1. `osrm_one_to_many` from seed → tier's remaining grid (to form cluster)
2. `osrm_one_to_many` from hub centroid → ALL grid cells (to compute new coverage)

The second call is what differentiates this from the old algorithm — it measures how much *new uncovered demand* the hub would capture, not just its cluster size.

---

## 7. WHAT'S BEEN RUN — RESULTS SO FAR

### Run 1: Old algorithm (place-all-then-trim to 200)
- 130 Mini + 70 Standard = 200 hubs
- Coverage: 89.3% (107,829 orders/day covered)
- Uncovered: 12,891 orders/day across 268 pockets
- Cost: ₹46.01 → ₹34.63 (24.7% reduction)
- **Problem**: Koramangala pocket had 481 orders/day (above 300 threshold) but no hub — because the trim phase dropped a hub that covered it

### Run 2: New unified greedy (just deployed, NOT yet run)
- Should fix the Koramangala problem since hubs are never removed
- Needs to be run and verified

### Run 3 (old, unconstrained, 420 hubs):
- 120 Mini + 300 Standard = 420 hubs
- Coverage: 99.7%
- Cost: ₹46.01 → ₹35.19 (23.5% reduction)
- 118 satellite hubs added by force-coverage — user rejected this approach entirely

---

## 8. CRITICAL BUG TO VERIFY

The unified greedy algorithm was just deployed but **has not been run yet**. The fix addresses:

**Bug**: Old algorithm placed all valid hubs (237), then trimmed to 200 by dropping lowest-coverage ones. When a hub was dropped, its covered cells became orphaned — they weren't reassigned. High-demand pockets like Koramangala (481 orders/day, well above the 300 minimum) ended up uncovered.

**Fix**: Unified greedy places one hub at a time. Each iteration, both a Mini and Standard candidate are evaluated. The one covering more *currently-uncovered* demand wins. No hub is ever removed.

**Potential concern**: `_try_greedy_hub()` makes 2 OSRM calls per candidate per iteration (one for cluster formation, one for full-grid coverage calculation). With 200 iterations × 2 candidates × 2 calls = ~800 OSRM one-to-many calls. Each scans up to 17,726 cells. This may be slow (~30-60 min). Consider optimizing with incremental coverage tracking instead of full-grid rescans.

**To verify**: Run `run_optimization_test.py`, check that:
1. No pocket with ≥ 300 orders/day appears in uncovered_pockets.csv
2. Coverage % is higher than 89.3%
3. All 200 hub slots are used

---

## 9. NEXT STEPS (PRIORITIZED)

### P0: Must Do
1. **Run and verify the unified greedy** — `cd network-optimizer && python3 ../run_optimization_test.py`
2. **Performance optimization** — The `_try_greedy_hub()` function does a full-grid OSRM scan for every candidate. Maintain an incremental `covered` bitmask and a pre-computed distance cache to avoid redundant OSRM calls.
3. **Wire the API endpoint** — `POST /api/optimize-constrained` exists in server.py but the web UI (`static/index.html`) doesn't have a form for it yet. Add constraint input fields (max hubs, target cost) and a results panel showing uncovered pockets on the map.

### P1: Should Do
4. **Uncovered pockets map layer** — Show uncovered pockets as red circles on the Leaflet map, sized by orders/day. The data is already in the API response (`uncovered_pockets` array).
5. **Interactive constraint tuning** — Let users adjust hub count with a slider and see coverage % update in real-time (pre-compute a coverage curve from the ranked hub list).
6. **Cost constraint implementation** — Currently only hub-count constraint is fully functional. The cost constraint (`target_last_mile_cost`) needs logic to determine optimal hub count that achieves the target cost. Approach: binary search on hub count, evaluating cost at each level.
7. **Export to operational format** — Generate a CSV/Excel with hub locations + assigned polygon boundaries that ops teams can use for actual hub deployment.

### P2: Nice to Have
8. **Re-enable Super DS** — When the team is ready for 3-tier, set `super_ds_max > 0` and tune `super_ds_min_orders_per_day` for Bangalore density.
9. **Multi-city support** — Parameterize city bounds, OSRM data source, and store files.
10. **Benchmark against current network** — Side-by-side map comparing current 103 hubs vs proposed 200 hubs with cost heatmaps.

---

## 10. API REFERENCE

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload-orders` | Upload order CSV (multipart) |
| POST | `/api/upload-stores` | Upload store XLSX/CSV (multipart) |
| POST | `/api/load-local-orders` | Load from local path `{filepath}` |
| POST | `/api/load-local-stores` | Load from local path `{filepath}` |
| GET | `/api/status` | Poll load/optimization progress |
| GET | `/api/data` | Get heatmap + store data |
| GET | `/api/result` | Get optimization result |
| GET | `/api/check-osrm` | Verify OSRM connectivity |
| POST | `/api/optimize` | Run unconstrained 3-tier optimization |
| POST | `/api/optimize-constrained` | **NEW** — Constraint-driven optimization |
| POST | `/api/optimize-target` | Target-cost search (old approach) |
| POST | `/api/reset` | Clear all state |

### `/api/optimize-constrained` Request Body
```json
{
  "target_max_hubs": 200,
  "target_last_mile_cost": null,
  "mini_ds_radius": 1.5,
  "mini_ds_min_orders_per_day": 300,
  "mini_ds_max_orders_per_day": 10000,
  "mini_ds_max": 300,
  "mini_base_cost": 20,
  "mini_variable_rate": 6,
  "standard_ds_radius": 3.0,
  "standard_ds_min_orders_per_day": 300,
  "standard_ds_max_orders_per_day": 15000,
  "standard_ds_max": 500,
  "standard_base_cost": 29,
  "standard_variable_rate": 9,
  "base_cost": 29,
  "variable_rate": 9,
  "use_tiered_costs": true
}
```

### Response (via `/api/result`)
```json
{
  "success": true,
  "mini_ds": [{"lat": 12.93, "lon": 77.61, "orders_per_day": 1500, "radius_km": 1.5, "type": "mini", "cells": 25}],
  "standard_ds": [...],
  "super_ds": [],
  "metrics": {
    "current_avg_cost": 46.01,
    "proposed_avg_cost": 34.63,
    "coverage_pct": 89.32,
    "uncovered_orders_per_day": 12891,
    "daily_savings": 1373911,
    "distance_histogram": {...}
  },
  "uncovered_pockets": [
    {"lat": 12.9319, "lon": 77.6853, "orders_per_day": 481, "num_cells": 78}
  ]
}
```

---

## 11. HOW TO RUN

### Prerequisites
- Python 3.9+ with `pandas`, `numpy`, `openpyxl`, `urllib3`
- OSRM server running at `localhost:5000` with India map data
- Docker Desktop (for OSRM container)

### Quick Start
```bash
# Terminal 1: Start OSRM
cd DS_Network_Design_Trial/network-optimizer
./start_osrm.sh

# Terminal 2: Run optimization test
cd DS_Network_Design_Trial/network-optimizer
python3 ../run_optimization_test.py

# Or: Start the web server
./start.sh
# Open http://localhost:5050
```

### Adjusting Constraints
Edit `run_optimization_test.py`, lines near the bottom:
```python
TARGET_MAX_HUBS = 200          # Set to None to disable
TARGET_LAST_MILE_COST = None   # Set to e.g. 42.0 for ₹42/order
```

---

## 12. KEY FUNCTIONS REFERENCE (server.py)

| Line | Function | Purpose |
|------|----------|---------|
| 114 | `check_osrm()` | Verify OSRM is up |
| 133 | `_osrm_table_batch()` | Single OSRM table call with retries |
| 179 | `osrm_min_distances_parallel()` | Min road dist per point to any hub |
| 225 | `osrm_min_distances_and_argmin()` | Min dist + nearest hub index |
| 272 | `osrm_one_to_many()` | One-to-many road distances |
| 352 | `detect_columns()` | Auto-detect CSV column mapping |
| 371 | `load_order_csv()` | Load + grid aggregation |
| 564 | `_tier_min_max_orders()` | Get (min, max) orders per tier |
| 623 | `normalize_placement_params()` | Validate/coerce parameters |
| 653 | `find_mini_ds()` | Greedy Mini placement (standalone) |
| 832 | `find_standard_ds()` | Greedy Standard placement (standalone) |
| 1032 | `ensure_full_network_coverage()` | Satellite backfill (OLD, don't use) |
| 1226 | `place_overlapping_tier_hubs()` | Full 3-tier placement (OLD approach) |
| 1331 | `evaluate_network()` | Current vs proposed metrics |
| 1494 | `generate_heatmap()` | Grid data for map visualization |
| ~1649 | `optimize_with_constraints()` | **NEW** Unified greedy constraint optimizer |
| ~1880 | `_try_greedy_hub()` | **NEW** Form one greedy hub candidate |
| ~1940 | `_group_uncovered_pockets()` | **NEW** Group uncovered cells into 3km pockets |

---

## 13. MASTER CODEX PROMPT

Below is a modular prompt you can feed to Codex or any AI coding agent. Each section can be used independently.

---

### SECTION A: Context

```
You are working on a Flipkart dark store network optimizer for hyperlocal delivery
in Bangalore. The codebase is in DS_Network_Design_Trial/. The core engine is
network-optimizer/server.py (2828 LOC Python). It uses OSRM Table API for all
road distances (localhost:5000, India map, no Haversine fallbacks ever).

The data: 3.38M orders/month (120K/day) across 103 existing hubs in Bangalore,
aggregated into 17,726 grid cells at 200m resolution.

Two hub tiers: Mini DS (1.5km radius, cycle, ₹20+6d) and Standard DS (3km radius,
bike, ₹29+9d). They overlap — both placed on the full grid independently.

The optimizer takes a hub count constraint (e.g., max 200 hubs) and places hubs
to maximize order coverage. Uncovered demand is reported as 3km pockets.
```

### SECTION B: Current Bug / First Task

```
TASK: Verify the unified greedy algorithm works correctly.

The function optimize_with_constraints() in server.py was just rewritten from a
"place-all-then-trim" approach to a "unified greedy" approach. The old version
placed 237 hubs then trimmed to 200 — this orphaned high-demand areas like
Koramangala (481 orders/day, above the 300 minimum threshold) because the hub
covering it got dropped during trimming.

The new unified greedy places one hub at a time. Each iteration:
1. Form a Mini candidate (highest-demand remaining cell, 1.5km OSRM ball)
2. Form a Standard candidate (highest-demand remaining cell, 3km OSRM ball)
3. Pick whichever covers more currently-uncovered demand
4. Stop at 200 hubs

Run: cd network-optimizer && python3 ../run_optimization_test.py

Verify:
- No pocket with ≥300 orders/day in uncovered_pockets.csv
- Coverage > 89.3% (the old algorithm's number)
- All 200 hub slots used
- Koramangala area (12.93, 77.69) is covered

If there's a performance issue (the new approach does 2 OSRM calls per candidate
per iteration ≈ 800 calls), optimize by maintaining an incremental coverage mask
and caching the full-grid distance from each hub centroid.
```

### SECTION C: Performance Optimization

```
TASK: Optimize _try_greedy_hub() to reduce OSRM calls.

Current: Each candidate does osrm_one_to_many from hub centroid to ALL 17,726
grid cells to compute new_coverage. With ~200 iterations × 2 candidates = ~400
full-grid scans.

Better approach:
1. Pre-compute nothing — but cache the distance vector from each placed hub
2. Maintain a running "min_dist_to_any_hub" array (shape: n_cells)
3. When a new hub is placed, compute its distance vector once, then update
   min_dist_to_any_hub = np.minimum(current, new_hub_dists)
4. For candidate evaluation, you still need the candidate's distance vector,
   but you can estimate new_coverage from the candidate's cluster (cells in
   the remaining grid within radius) intersected with (min_dist > radius)
   instead of scanning all cells

This should reduce OSRM calls by ~50% and wall time from ~45min to ~20min.
```

### SECTION D: UI Integration

```
TASK: Add constraint-driven optimization to the web UI.

The API endpoint POST /api/optimize-constrained already exists in server.py.
The web UI is in network-optimizer/static/index.html (Leaflet maps).

Add:
1. Input fields in the sidebar: "Max Hubs" (number), "Target Cost/Order" (number)
   with validation that at least one is set
2. "Optimize (Constrained)" button that POSTs to /api/optimize-constrained
3. Results panel showing:
   - Hub count breakdown (Mini/Standard)
   - Coverage % with uncovered orders/day
   - Cost comparison (current vs proposed)
   - Savings (daily/monthly)
4. Map layers:
   - Blue circles: Mini hubs (1.5km radius)
   - Green circles: Standard hubs (3km radius)
   - Red circles: Uncovered pockets (sized by orders/day)
   - Heatmap: order density
5. Uncovered pockets table: sortable by orders/day, clickable to pan map
```

### SECTION E: Cost Constraint Logic

```
TASK: Implement the cost constraint (target_last_mile_cost).

Currently only hub-count constraint works. When target_last_mile_cost is set:

Approach: Binary search on hub count.
1. Start with hub_count = 50 (lower bound) and hub_count = 500 (upper bound)
2. Run optimize_with_constraints with mid = (lo + hi) / 2 as target_max_hubs
3. Check resulting proposed_avg_cost against target
4. If cost > target: need more hubs (lo = mid)
5. If cost <= target: can try fewer hubs (hi = mid)
6. Converge when |proposed_avg_cost - target| < ₹0.50 or |hi - lo| <= 5

This reuses the existing unified greedy — just wraps it in a binary search.
Note: More hubs = lower cost (more demand served at tier rates vs current rates).

When BOTH constraints are set: use the hub-count constraint as a hard limit,
and report whether the cost target was also met.
```

### SECTION F: Export & Operations

```
TASK: Generate operational deployment files.

After optimization, generate:
1. proposed_hubs.xlsx — Hub ID, Tier, Lat, Lon, Orders/day, Radius,
   with conditional formatting (Mini=blue, Standard=green)
2. coverage_map.html — Standalone Leaflet HTML file showing:
   - All proposed hubs with service radius circles
   - All uncovered pockets as red markers
   - Order density heatmap
   - Legend and summary stats
3. uncovered_analysis.xlsx — Pockets sorted by orders/day with columns:
   Pocket ID, Centroid Lat, Centroid Lon, Orders/day, Num Cells,
   Nearest Proposed Hub, Distance to Nearest Hub
```
