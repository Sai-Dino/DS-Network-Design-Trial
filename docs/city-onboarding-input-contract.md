# City Onboarding Input Contract

This document defines the minimum data package required to onboard a new city into the current solver family without changing solver semantics.

The goal is to make the upstream extraction step deterministic:
- Claude Code should know exactly which files are mandatory
- which columns are mandatory
- which fields may be derived or normalized
- and which missing items are blockers that must be reported instead of guessed

This contract is intentionally based on the current Bangalore solver lane and its existing file loaders in `network-optimizer/bangalore_solver/data.py`.

## Scope

This contract is for preparing a city input bundle that can be reviewed and then wired into the existing solver family.

It is not:
- a new solver design
- a permission to invent missing geometry
- a permission to silently merge ambiguous rows
- a permission to fill missing coordinates by intuition

If required data is missing, the correct output is a documented blocker, not a guessed value.

## Required city bundle

Each city should be prepared into a dedicated directory, for example:

```text
city_inputs/<city_slug>/
```

Minimum required files:

1. `daily_demand.csv`
2. `scope_polygons.csv`
3. `fixed_stores.csv`
4. `fixed_store_metadata.csv`
5. `city_manifest.json`

Recommended example:

```text
city_inputs/hyderabad/
  daily_demand.csv
  scope_polygons.csv
  fixed_stores.csv
  fixed_store_metadata.csv
  city_manifest.json
```

## Canonical output files

### 1. `daily_demand.csv`

Purpose:
- demand-bearing points/cells used to create clustered solver demand

Canonical columns:
- `date`
- `customer_lat`
- `customer_lon`
- `orders_per_day`
- `order_type`

Column rules:
- `customer_lat` and `customer_lon` must be numeric
- `orders_per_day` must be numeric and strictly positive
- `date` may be repeated across rows
- `order_type` may be blank if unavailable, but the column should still exist

Notes:
- Current Bangalore raw file uses headers like:
  - `Date`
  - `Order_Lat`
  - `Order_Lon`
  - `Order_Count`
  - `Order_Type`
- Claude Code should normalize those into the canonical columns above

### 2. `scope_polygons.csv`

Purpose:
- defines the in-scope business polygons / service regions for the city

Canonical columns:
- `store_code`
- `site_id`
- `store_lat`
- `store_lon`
- `polygon_edge`
- `point_lat`
- `point_lon`
- `store_status`

Column rules:
- rows may repeat the same `site_id` / `store_code` across polygon vertices
- each polygon must be reconstructible from `point_lat`, `point_lon`, and `polygon_edge`
- `site_id` or `store_code` must provide a stable polygon grouping key
- `store_lat` and `store_lon` should represent the corresponding store/site anchor for that polygon

Notes:
- Current Bangalore raw file uses headers like:
  - `store_code`
  - `Site ID`
  - `Store Latitude`
  - `Store Longitude`
  - `polygon_edge`
  - `Point Latitude`
  - `Point Longitude`
  - `Store Status`

Blocker:
- if polygon grouping cannot be reconstructed reliably, this file is not valid

### 3. `fixed_stores.csv`

Purpose:
- current fixed stores that remain open in the brownfield world

Canonical columns:
- `store_code`
- `site_id`
- `store_lat`
- `store_lon`
- `polygon_edge`
- `point_lat`
- `point_lon`

Column rules:
- `site_id`, `store_lat`, and `store_lon` are mandatory
- polygon columns are strongly preferred because they support richer diagnostics and region semantics
- if polygon rows are repeated, they must group cleanly by `site_id`

Notes:
- Current Bangalore raw file uses headers like:
  - `store code`
  - `Store Latitude`
  - `Store Longitude`
  - `polygon edge`
  - `Point Latitude`
  - `Point Longitude`
  - `site_ID`

Blocker:
- if `site_id`, `store_lat`, or `store_lon` are missing or unreliable, this file is not valid

### 4. `fixed_store_metadata.csv`

Purpose:
- metadata needed to evaluate store-specific rules, especially Super upgrade eligibility

Canonical columns:
- `site_id`
- `store_sqft`
- `super_eligible_fixed`

Column rules:
- `site_id` is mandatory
- `store_sqft` is strongly preferred and should be numeric
- `super_eligible_fixed` may be provided directly, or derived from `store_sqft` if the business rule is known

Notes:
- Current Bangalore raw file uses:
  - `site_id`
  - `store_sqft`
  - `super_eligible_fixed`

Blocker:
- if no reliable path exists to determine fixed-store Super eligibility, this must be called out in the manifest

### 5. `city_manifest.json`

Purpose:
- records provenance, field mapping, gaps, and extraction choices

Required keys:
- `city`
- `city_slug`
- `bundle_version`
- `generated_at`
- `source_files`
- `output_files`
- `field_mapping`
- `blockers`
- `warnings`
- `assumptions`

Recommended structure:

```json
{
  "city": "Hyderabad",
  "city_slug": "hyderabad",
  "bundle_version": "v1",
  "generated_at": "2026-04-18T18:30:00Z",
  "source_files": [
    {"path": "...", "purpose": "raw demand"},
    {"path": "...", "purpose": "raw scope polygons"}
  ],
  "output_files": [
    "daily_demand.csv",
    "scope_polygons.csv",
    "fixed_stores.csv",
    "fixed_store_metadata.csv"
  ],
  "field_mapping": {
    "daily_demand.csv": {
      "Order_Lat": "customer_lat",
      "Order_Lon": "customer_lon",
      "Order_Count": "orders_per_day"
    }
  },
  "blockers": [],
  "warnings": [],
  "assumptions": []
}
```

## Raw-to-canonical alias guidance

Claude Code should expect messy column names and normalize them into the canonical outputs.

Typical aliases:

### Demand
- `Date` -> `date`
- `Order_Lat` / `customer_lat` / `Customer Latitude` -> `customer_lat`
- `Order_Lon` / `customer_lon` / `Customer Longitude` -> `customer_lon`
- `Order_Count` / `orders_per_day` / `Orders` -> `orders_per_day`
- `Order_Type` / `order_type` -> `order_type`

### Scope / polygons
- `Site ID` / `site_ID` / `site_id` -> `site_id`
- `store_code` / `store code` -> `store_code`
- `Store Latitude` / `latitude` / `lat` -> `store_lat`
- `Store Longitude` / `longitude` / `lon` -> `store_lon`
- `Point Latitude` -> `point_lat`
- `Point Longitude` -> `point_lon`
- `polygon_edge` / `polygon edge` / `edge` -> `polygon_edge`
- `Store Status` / `store_status` -> `store_status`

### Fixed-store metadata
- `site_id` / `site ID` -> `site_id`
- `store_sqft` / `sqft` / `store_size_sqft` -> `store_sqft`
- `super_eligible_fixed` -> `super_eligible_fixed`

## Normalization rules

Claude Code should:
- preserve all rows that can be normalized reliably
- trim column names and string values
- convert numeric fields to numeric where applicable
- lowercase or canonicalize IDs only when safe and documented
- preserve stable identifiers across files

Claude Code must not:
- invent missing coordinates
- invent polygon geometry
- silently deduplicate conflicting rows
- silently drop rows with ambiguous IDs
- derive `super_eligible_fixed` by guesswork if no business rule is available

## Required blocker behavior

Claude Code must stop short of claiming success if any of these are true:

1. scope polygons cannot be reconstructed reliably
2. fixed stores are missing stable IDs or coordinates
3. demand rows are missing usable coordinates or orders/day
4. metadata cannot support fixed-store Super eligibility
5. multiple raw files disagree on identity or coordinates and cannot be reconciled safely

In those cases:
- keep the partial normalized outputs if useful
- record the issue in `city_manifest.json`
- clearly label the city bundle as blocked

## City-specific vs reusable

Reusable from Bangalore:
- canonical output filenames
- canonical column names
- manifest format
- validation rules
- solver-family expectations

Must be city-specific:
- scope polygons
- fixed stores
- store metadata
- demand file
- any documented city-specific assumptions

## Validation checklist before using a city bundle

Before a city bundle is accepted for solver onboarding, verify:

1. `daily_demand.csv` loads with nonzero positive demand rows
2. `scope_polygons.csv` reconstructs valid polygons
3. `fixed_stores.csv` produces a stable fixed-store list with lat/lon
4. `fixed_store_metadata.csv` joins reliably on `site_id`
5. `city_manifest.json` records all source files and known gaps
6. no required field was guessed silently

## Acceptance standard

A city bundle is “ready for solver onboarding” only when:
- the four canonical CSVs exist
- the manifest exists
- required columns are present
- blockers are empty, or explicitly understood and accepted

Anything less should be treated as:
- `needs cleanup`
- or `blocked`

not “ready.”
