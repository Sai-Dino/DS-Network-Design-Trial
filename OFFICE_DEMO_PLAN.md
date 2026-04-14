# Office Demo Plan

## Goal
Run the Bangalore `benchmark_103` optimizer on the office MacBook **without triggering a fresh candidate-graph rebuild**.

## Recommended packaging model
Use **git for code** and a **runtime bundle for heavy assets**.

Keep in git:
- source code
- launch / verify / restore scripts
- HTML artifacts
- Bangalore CSV inputs
- optional fixed-store metadata (`benchmark_103_store_metadata.csv`)

Keep out of normal git pulls:
- `network-optimizer/cache/`
- `osrm-data/`
- optional compressed runtime archives

Why:
- the office laptop can copy 10-15 GB of ready runtime assets in minutes
- the same laptop can spend many hours rebuilding candidate graphs from scratch
- Git/LFS is not the reliable transport for these assets in this workflow

## Portable runtime assumptions
This repo is now set up so the office clone can restore repo-local runtime assets from a side bundle:

- OSRM data is expected at `./osrm-data`
- optimizer cache is expected at `./network-optimizer/cache`
- the runtime bundle restore command is:

```bash
chmod +x ./restore_office_demo_runtime.sh
./restore_office_demo_runtime.sh
```

- the launcher is:

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
3. A copied runtime bundle folder produced by `./prepare_office_demo_bundle.sh`

If neither is available and the org machine blocks new installs, the safest path is to prepare that capability before demo day.

## Tonight's safest path

1. On the personal machine, prepare the bundle:

```bash
chmod +x ./prepare_office_demo_bundle.sh
./prepare_office_demo_bundle.sh
```

2. Copy the generated `office-runtime-bundle/bangalore-benchmark-103/` folder to the office machine
3. Clone/pull the code repo on the office machine
4. Restore the runtime assets:

```bash
export OFFICE_RUNTIME_BUNDLE_DIR=/path/to/office-runtime-bundle/bangalore-benchmark-103
./restore_office_demo_runtime.sh
```

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

- the cloned code repo
- the copied runtime bundle
- Python 3 plus required packages
- either Docker Desktop or native `osrm-routed`

## Important caution
The runtime bundle is still large. On the currently prepared machine it is roughly:

- optimizer cache: ~9.4 GB
- OSRM data: ~6.2 GB

But this is still much better than rebuilding the candidate graph on a fresh office laptop.

## How to reduce rebuild time further

1. Keep the run scoped to **Bangalore `benchmark_103` only**
2. Use the meeting-fast defaults already wired in:
   - target coverage `99.7`
   - candidate cap `3000`
   - graph max radius `6.0 km`
3. Restore a ready runtime bundle before launching
4. Do **not** delete repo-local cache between scenarios
5. Keep OSRM data local and warm on the office machine

If runtime assets are missing, the launcher now fails loudly instead of silently drifting into a multi-hour rebuild.
