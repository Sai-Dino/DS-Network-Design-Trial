# Claude Code Prompt For City Data Extraction

Use this prompt on the office laptop where the raw next-city files live.

The purpose is to make Claude Code extract and normalize city inputs into the exact bundle required by the current solver family.

Do not let Claude Code guess missing data or invent geometry.

## Prompt

```text
You are preparing city onboarding input bundles for an existing solver family.

Read and follow this contract exactly:
- /Users/thota/Downloads/DS-Network-Design-Trial-main/docs/city-onboarding-input-contract.md

Your job is NOT to redesign the solver.
Your job is NOT to infer missing geometry by intuition.
Your job is to extract, normalize, and document city inputs into the required bundle format.

I will point you at one city’s messy raw files.
Those raw files may be spread across multiple spreadsheets/CSVs and may use inconsistent column names.

For each city, produce a bundle in this structure:

city_inputs/<city_slug>/
  daily_demand.csv
  scope_polygons.csv
  fixed_stores.csv
  fixed_store_metadata.csv
  city_manifest.json

Follow these rules strictly:

1. Normalize raw inputs into the canonical output files and canonical column names described in the contract.
2. Do not invent missing lat/lon values.
3. Do not invent polygon geometry.
4. Do not silently merge ambiguous rows.
5. Do not silently drop unresolved conflicts.
6. If a required field is missing or ambiguous, record it in `city_manifest.json` under `blockers`.
7. If a field can be normalized safely from an alias, do so and record the mapping in `city_manifest.json`.
8. If multiple raw files contribute to one output file, list all of them in `source_files`.
9. Preserve stable site/store IDs wherever possible.
10. If `super_eligible_fixed` is not directly available, only derive it if the source files provide a defensible `store_sqft` field or an explicit business rule. Otherwise mark that as a blocker.

For each city, your output must include:

- the normalized files
- a manifest showing:
  - city
  - city_slug
  - generated_at
  - source_files
  - output_files
  - field_mapping
  - blockers
  - warnings
  - assumptions

Before you say a city is ready, verify:
- demand rows have usable coordinates and positive demand
- scope polygons can be reconstructed
- fixed stores have stable IDs and coordinates
- metadata joins cleanly to fixed stores
- blockers are empty, or clearly listed if not

At the end, report one of these statuses for the city:
- READY
- NEEDS CLEANUP
- BLOCKED

And include a short reason.

Important:
- The desired output is a clean city bundle, not a prose summary only.
- If you are blocked, leave partial normalized outputs when useful, but do not pretend the city is ready.
```

## How to use it

1. Put the messy raw files for one city in a working folder on the office laptop.
2. Open Claude Code in that repo or a workspace that can see both:
   - the raw files
   - this contract doc
3. Paste the prompt above.
4. Add the city-specific raw file locations underneath it.

Example add-on:

```text
Use these raw files for Hyderabad:
- /path/to/raw/hyderabad_orders_april.csv
- /path/to/raw/hyd_scope_polygons.xlsx
- /path/to/raw/hyd_fixed_stores.csv
- /path/to/raw/hyd_store_sizes.xlsx

Write outputs under:
- /path/to/work/city_inputs/hyderabad/
```

## Expected outcome

If Claude Code succeeds, you should get:
- a normalized per-city bundle
- a manifest documenting every mapping and every blocker

If Claude Code cannot succeed cleanly, you should still get:
- partial normalized files where possible
- a manifest telling you exactly what is missing or ambiguous

That is still useful. The important thing is that Claude Code must not guess.

## Review checklist after Claude Code runs

Before bringing a city bundle back into the main solver workflow, check:

1. the output directory exists
2. all five required files exist
3. `city_manifest.json` names every source file it used
4. blockers are either empty or explicitly understood
5. the CSV headers match the canonical contract

If those are true, the city is ready for the next onboarding step in this repo.
