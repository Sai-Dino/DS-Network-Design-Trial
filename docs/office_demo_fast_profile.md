# Office Demo Fast Profile

This runbook uses the new `demo_fast` exact benchmark profile to keep the
shared `10 km` graph while reducing the live solve size.

## What It Changes

- Reuses the shared `exact_graph_max_radius_km=10.0` graph
- Caps the raw exact candidate shortlist to `1200` by default
- Caps the modeled solver shortlist to `600` by default after spacing reduction
- Solves only the near-full strict scenario (`99.7%`)
- Skips Mini overlay during the benchmark run
- Skips local refinement / extra diagnostics during the benchmark run
- Disables tie-break MILPs for the fast profile

This is meant to be the **interactive demo** path, not the full overnight exact deck.

## Office Laptop Sequence

Start OSRM first, then the optimizer server:

```bash
cd ~/Downloads/DS_Network_Design_Trial_clean
OSRM_DATA_DIR=~/osrm-data OSRM_ROUTED_FILE=india-latest.osrm ./network-optimizer/start_osrm.sh
```

```bash
cd ~/Downloads/DS_Network_Design_Trial_clean
OSRM_URL=http://127.0.0.1:5000 ./network-optimizer/start.sh
```

Load orders and stores:

```bash
curl -s http://127.0.0.1:5050/api/load-local-orders \
  -H 'Content-Type: application/json' \
  -d '{"filepath":"/Users/kotapothula.sai/Downloads/DS_Network_Design_Trial_clean/daily_demand_aggregated.csv"}'
```

```bash
curl -s http://127.0.0.1:5050/api/load-local-stores \
  -H 'Content-Type: application/json' \
  -d '{"filepath":"/Users/kotapothula.sai/Downloads/DS_Network_Design_Trial_clean/Store details - 151 polygons with stores.csv"}'
```

Run the fast profile:

```bash
curl -s http://127.0.0.1:5050/api/optimize-exact-benchmark \
  -H 'Content-Type: application/json' \
  -d '{
    "exact_benchmark_profile":"demo_fast",
    "fixed_store_mode":"benchmark_103",
    "exact_graph_max_radius_km":10.0,
    "mini_ds_radius":1.0,
    "standard_ds_radius":3.0,
    "standard_exception_radius_km":5.0,
    "super_ds_radius":5.5,
    "benchmark_near_full_coverage_pct":99.7
  }'
```

Optional: override the candidate shortlist cap:

```bash
curl -s http://127.0.0.1:5050/api/optimize-exact-benchmark \
  -H 'Content-Type: application/json' \
  -d '{
    "exact_benchmark_profile":"demo_fast",
    "fixed_store_mode":"benchmark_103",
    "exact_graph_max_radius_km":10.0,
    "exact_candidate_cap":800,
    "mini_ds_radius":1.0,
    "standard_ds_radius":3.0,
    "standard_exception_radius_km":5.0,
    "super_ds_radius":5.5,
    "benchmark_near_full_coverage_pct":99.7
  }'
```

Optional: keep a larger solver shortlist if you need a little more quality room:

```bash
curl -s http://127.0.0.1:5050/api/optimize-exact-benchmark \
  -H 'Content-Type: application/json' \
  -d '{
    "exact_benchmark_profile":"demo_fast",
    "fixed_store_mode":"benchmark_103",
    "exact_graph_max_radius_km":10.0,
    "exact_candidate_cap":1000,
    "exact_model_candidate_cap":750,
    "mini_ds_radius":1.0,
    "standard_ds_radius":3.0,
    "standard_exception_radius_km":5.0,
    "super_ds_radius":5.5,
    "benchmark_near_full_coverage_pct":99.7
  }'
```

## Notes

- This profile is intentionally not the full exact scenario deck.
- It is designed to preserve the shared graph architecture while shrinking the live solver problem.
- If this still proves too slow, the next step is stronger offline shortlist generation before the exact solve.
