# Office Demo Plan

## Goal
Run the network optimizer on the office MacBook **without fresh downloads outside git**.

## Recommended packaging model
Do **not** use the regular source repo as-is for this. Create a dedicated demo bundle repo or branch that contains:

- the source code
- `network-optimizer/cache/`
- `osrm-data/`
- the required CSV/XLSX demo inputs

If your git host supports it, use **Git LFS** for:

- `osrm-data/**`
- `network-optimizer/cache/**`
- any large CSV inputs

That keeps clone behavior predictable without corrupting normal source history.

## Portable runtime assumptions
This repo is now set up so the office clone can run repo-local assets:

- OSRM data is expected at `./osrm-data`
- optimizer cache is already repo-local at `./network-optimizer/cache`
- the one-command launcher is:

```bash
chmod +x ./office_demo_start.sh
./office_demo_start.sh
```

- there is also a preflight checker:

```bash
chmod +x ./office_demo_verify.sh
./office_demo_verify.sh
```

## What must already exist on the office MacBook

1. Python 3
2. Either:
   - Docker Desktop with the OSRM image already available, or
   - native `osrm-routed`

If neither is available and the org machine blocks new installs, the safest path is to prepare that capability before demo day.

## Tonight's safest path

1. On the personal machine, prepare the bundle:

```bash
chmod +x ./prepare_office_demo_bundle.sh
./prepare_office_demo_bundle.sh
```

2. Commit to a **demo bundle repo/branch**
3. Prefer Git LFS for `osrm-data/` and `network-optimizer/cache/`
4. Clone that bundle on the office machine
5. Verify:

```bash
./office_demo_verify.sh
```

6. Run:

```bash
./office_demo_start.sh
```

## Cloud Code note

Cloud Code vs Codex does **not** change the runtime behavior of the app. The important thing is that the office machine has:

- the cloned bundle
- Python 3 plus required packages
- either Docker Desktop or native `osrm-routed`

## Important caution
This bundle is large. On the currently prepared machine it is roughly:

- repo total: ~20 GB
- optimizer cache: ~7.5 GB
- OSRM data: ~6.6 GB

So this is feasible through git only if your git host and policy support a large binary bundle, ideally with Git LFS.
