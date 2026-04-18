# Nodes OR Formulation Brief

Date: 2026-04-17
Source: `/Users/thota/Downloads/Nodes.docx`
Status: Candidate target formulation for expert review, not yet an approved implementation plan

## Purpose

This brief translates the "Nodes Draft V1" note into a structured formulation that can be compared against the current Bangalore network-optimizer approach.

The goal is to evaluate whether this model should become the next target architecture for Flipkart Minutes network design under the repo's current hard gates:

- honest cost and coverage semantics
- office-laptop reproducibility
- no new external downloads or hosted services
- minimal manual setup after Git checkout

## Problem Framing

Determine the optimal placement and type of Flipkart Minutes facilities in a metro region such as Bengaluru or Delhi, for both:

- brownfield scenarios with existing stores/polygons
- greenfield scenarios with net-new facilities

The solution should optimize network design under:

- a total cost-per-order objective
- explicit facility capacities
- explicit serviceability and distance constraints
- optional limits on total store count and split sourcing

Expected outputs:

- CSV of selected facilities by type and location
- UI visualization of the network
- UI-based recalculation / simulation

## Proposed Facility Model

The draft defines three facility types:

- `S` (Small)
- `M` (Medium)
- `L` (Large)

Illustrative planning attributes from the note:

| Tier | SKUs | Capacity Mid (orders/day) | Capacity Min | Capacity Max | Fixed Cost / Order |
| --- | ---: | ---: | ---: | ---: | ---: |
| S | 4,000 | 1,150 | 800 | 1,500 | 40 INR |
| M | 15,000 | 1,800 | 1,200 | 2,400 | 45 INR |
| L | 30,000 | 3,200 | 2,400 | 4,000 | 55 INR |

The note also proposes fulfillment-rate assumptions:

| Tier | Fulfillment Rate |
| --- | ---: |
| S | 0.85 |
| M | 0.98 |
| L | 1.00 |

This introduces a principled way to model split-sourcing risk and category-complexity effects instead of treating all facilities as equivalent.

## Proposed Objective

The OR note points toward a global optimization objective over assignment and opening decisions.

For an order or demand point `i` served by facility `j` of type `T`, the conceptual cost is:

- facility-type fixed cost per order
- plus distance-driven variable cost
- plus a split penalty when fulfillment must come from more than one source

In words:

`Total Cost = tier fixed cost + baseline variable cost + distance cost + expected split penalty`

This is directionally stronger than the current heuristic path because:

- cost and coverage tradeoffs are explicit
- split sourcing is priced instead of hand-waved
- tier semantics are first-class
- brownfield and greenfield can be modeled in the same framework

## Proposed Constraints

The note suggests these families of constraints:

- maximum total stores
- maximum split sources per order
- maximum delivery radius
- serviceability threshold
- capacity bounds by facility type

Illustrative examples from the note:

- `MAX_STORES_TOTAL = 200`
- `MAX_SPLIT_SOURCES = 2`
- `MAX_DELIVERY_RADIUS_KM = 7`

These are compatible with a mixed-integer facility-location / assignment model, provided the assignment graph is pruned aggressively enough for local execution.

## Data Inputs Implied By The Note

The proposal assumes:

- stores polygon master CSV
- hex9 demand and order-frequency CSV
- Minutes order history CSV
- road-distance data from OSM/Google/MapMyIndia-style routing sources

Within this repo, the practical office-laptop-compatible interpretation should be:

- use existing local demand/store CSV flows already supported by `network-optimizer/server.py`
- use the repo's existing local OSRM-backed distance workflow
- avoid introducing any new hosted routing dependency

## Candidate Generation Idea

The note proposes:

- density-based candidate seeding (for example HDBSCAN)
- grid-fill candidates for large uncovered gaps

This is an important practical detail. If the candidate pool is weak, even an elegant solver will optimize the wrong search space.

The office-compatible interpretation should be:

- deterministic candidate generation
- bounded candidate count
- cache-friendly distance graph reuse
- no new heavyweight preprocessing services

## Why This Is Attractive Compared To The Current Heuristic Path

Compared to the current Bangalore planner family, this draft is attractive because it:

1. treats facility types as real decision variables rather than role labels attached later
2. makes split fulfillment an explicit economic tradeoff
3. gives a single optimization story instead of rescue/exception/preview stitching
4. is more auditable for business stakeholders
5. can support both greenfield and brownfield scenarios with one conceptual model

## Major Gaps That Must Be Closed Before Implementation

The note is a strong direction, but it is not implementation-ready yet.

Open items:

1. **Coverage definition**
   - The note talks about serviceability and max radius, but it does not define the exact hard-coverage metric that leadership will accept.
   - This must be aligned with the current repo's honest decision-grade coverage rules.

2. **Split-cost formulation**
   - `Costsplit` is named but not fully defined.
   - Need exact math for:
     - expected split cost
     - whether split probability is deterministic or expected-value-based
     - whether split fulfillment counts against hard coverage or only cost

3. **Demand aggregation and assignment unit**
   - The note references hex9 / H3-style aggregation, but the exact assignment unit and resolution policy need to be fixed.
   - The repo currently uses real grid/cell-based assignment logic and OSRM-backed distances.

4. **Brownfield rules**
   - The draft does not yet specify:
     - how existing facilities are frozen vs mutable
     - whether existing stores can change tier
     - how brownfield opening/closing/upgrade penalties should work

5. **Tier semantics vs current business**
   - The S/M/L tiers in the note are not automatically identical to the current Standard / Mini / Super semantics in this repo.
   - We need an explicit mapping or a decision to pivot terminology/model structure.

6. **Solver tractability**
   - A fully explicit assignment MILP with split sourcing can become too large for locked-down office laptops.
   - The formulation must degrade gracefully with:
     - candidate pruning
     - sparse assignment graph construction
     - local caching
     - deterministic bounded solve settings

7. **Local reproducibility**
   - The office-laptop rule requires:
     - Git checkout runnable
     - no new downloads or hosted services
     - deterministic local reruns
   - Any implementation that requires new map APIs or new binary installers is out of scope.

## Office-Laptop Acceptance Conditions

This proposal is only acceptable for this repo if all of the following stay true:

- no new external downloads or hosted services
- existing local OSRM assumptions remain sufficient
- candidate generation is deterministic and bounded
- runtime and memory remain office-laptop compatible
- outputs can be verified locally via `/api/status` and `/api/result`
- regression tests cover the critical decision semantics

## Recommended Expert Questions

Before committing to implementation, the expert panel should answer:

1. Should this become the target architecture, or only a longer-term redesign candidate?
2. How should `S/M/L` map to the repo's current `Mini/Standard/Super` semantics, if at all?
3. What exact hard-coverage definition should govern this model?
4. What is the correct split-cost formulation for Minutes orders?
5. What candidate-generation and solver-bounding strategy would keep this office-laptop viable?

## Current Recommendation

Use this OR note as a **candidate target formulation** and expert-review artifact.

Do not treat it as implementation-ready yet.

The immediate value of this brief is:

- clearer comparison against the current heuristic path
- structured expert review
- a path toward deciding whether the repo should continue patching the current planner or begin pivoting toward a more explicit facility-location model
