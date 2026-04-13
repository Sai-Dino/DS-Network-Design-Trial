# Cloud Code Handoff - 2026-04-13

## 1. What we are trying to do

Build a **leadership-demo-ready dark store network planning tool** for Bangalore that:

- compares **3 fixed-store worlds**:
  - `clean_slate` / `0 fixed`
  - `benchmark_103`
  - `uploaded_current` / `144 fixed`
- uses the **same business objective** across all three:
  1. reach `100%` if possible, otherwise at least `99.8-99.9%`
  2. stay inside a compact physical Standard frontier
  3. within that frontier, minimize avg last-mile cost
  4. then prefer fewer rescue Standards, fewer exception overrides, fewer spacing relaxations
- shows the answer in the **UI**, including:
  - fixed Standard count
  - new Standard count
  - rescue Standard count
  - exception override count
  - physical Standard total
  - cost / distance / coverage
  - maps and tables

The user wants this usable on an **office MacBook** via git + Git LFS + Cloud Code, without having to reconstruct caches or redownload the whole world outside the repo.

## 2. Branch / repo to use

- Repo: `https://github.com/Sai-Dino/DS-Network-Design-Trial.git`
- Branch: `office-demo-bundle`
- Use the current HEAD of `office-demo-bundle`

Use this branch. Do **not** start from `main`.

## 3. What is already done

### Solver / backend

The current code in `network-optimizer/server.py` already includes:

- bounded live meeting-mode branches
- compact frontier default enabled in meeting mode
- canonical meeting candidate cap logic
- clean-slate candidate-space fairness fixes
- meeting reference fixed-location injection into the candidate pool
- run-local cache checks / prewarm bypass for office-demo mode
- reference-site order estimation even if stores were loaded before orders finished

### Office portability

The repo already includes:

- `office_demo_start.sh`
- `office_demo_verify.sh`
- Git LFS rules in `.gitattributes`
- repo-local OSRM launcher support
- pushed cache artifacts on `office-demo-bundle`

### Important cache artifacts already pushed

These are especially important for the office machine:

- `network-optimizer/cache/exact_std_candidate_graph_05d7422e6ca96fa2191c18fac843d33286b1f6c5.pkl`
- `network-optimizer/cache/exact_std_candidates_30a4f8acbfb50ad9500d85e86c68e7fc7fb6d68d.pkl`
- `network-optimizer/cache/exact_std_candidates_f53a51a17b85b03732e01180909e3a94ed84f7cd.pkl`

The office branch also already contains the large order file via Git LFS:

- `feb_2026_distance_input.csv`

## 4. What has actually been validated

### Warm validated worlds

Earlier validated warm-path meeting outputs were:

- `benchmark_103`
  - around `99.89%` coverage
  - around `201` physical Standard
  - around `₹40.2-42.0` avg last-mile cost depending on packet/stage

- `uploaded_current / 144 fixed`
  - around `99.90%` coverage
  - around `213` physical Standard
  - around `₹40.2-42.0` avg last-mile cost depending on packet/stage

These are the only worlds that were stable enough for a **warmed scripted demo**.

### Latest clean-slate helper result

On the newest fairness-aware helper run, `clean_slate` landed at:

- `99.91%` coverage
- `290` physical Standard
- `261` rescue Standard
- `0` exception overrides
- `₹41.33` avg last-mile cost
- `1.368 km` avg distance

This proves:

- the **new clean-slate candidate graph path is real**
- the run is no longer stuck on the old wrong `5000` path
- the warm-start delta / repair path is working

But it **does not yet prove leadership safety** because the economics are still not obviously better than `103` / `144`, and the restarted live app path still has not reliably produced a quick decision-grade core packet for `0 fixed`.

## 5. What is still pending

This is the most important section.

### A. `0 fixed` is still not production-ready on correctness grounds

The problem is **not only time**.

The main unresolved concern is:

- `0 fixed` should logically be at least as economically good as, or better than, constrained worlds like `103` / `144` when coverage target and store-count freedom are comparable
- but the latest clean-slate helper result is still:
  - **store-hungry**
  - not clearly cheaper than the validated warm fixed-store worlds

So before calling it production-ready, we still need to explain one of these:

1. why `0 fixed` genuinely needs ~`290` Standards at `99.9%` under the current exact geometry and spacing logic, **or**
2. what remaining asymmetry/logic issue is still inflating it

### B. The restarted live app path is still not proven for `0 fixed`

Even after the recent patches:

- the live server no longer waits behind shared prewarm in the same bad way
- but after restart, the `0 fixed` run still spent too long in:
  - `Bangalore planner reset: building strict Standard base network...`

So the **real UI/server path** is still not proven to land a quick core packet for `0 fixed`.

### C. The status/progress messaging is still not trustworthy enough

We observed cases where:

- CPU was fully busy
- progress stayed stuck on a stale label

That makes debugging and demo confidence worse.

## 6. What the experts said

Latest expert read:

- **Leadership tonight as live interactive tool:** no-go
- **Production tonight:** no-go
- **Safe narrow scope:** warmed scripted demo only, especially `103` and `144`

Why:

1. `0 fixed` still not proven economically correct enough
2. `0 fixed` cold/live packet timing still not proven
3. office bundle is materially ready, but the solver result is not yet reliable enough for open live exploration

## 7. Direct answers to likely questions

### Did we check all 3 worlds?

Not on the **final latest patch set** in a clean, end-to-end, equal-quality way.

What we do have is:

- strong earlier validation on `103` and `144`
- latest helper validation on `0 fixed`
- but **not** a final apples-to-apples rerun of all 3 worlds on the exact same latest patched live app path

### Did laptop sleep affect runtime?

Possibly yes for some earlier long runs.

But the latest blockers are **not explained only by sleep**. We observed active high-CPU live runs while the machine was awake and still did not get a fast enough `0 fixed` core packet.

## 8. What not to redo

Do **not** start over from scratch.

Do **not** redo these already-settled pieces:

- the old `5000`-candidate explanation for clean slate
- broad “rebuild everything” candidate graph logic
- office bundle / Git LFS setup from zero
- old stale-partial-cache logic

Assume the current branch is the starting point.

## 9. Recommended next debugging path

If a new Cloud Code agent picks this up, the next best path is:

1. **Compare `0 / 103 / 144` on the same latest code path**
   - same radii
   - same coverage target
   - same compact-frontier settings
   - same candidate-cap rules

2. **Explain the economics gap**
   - why is `0 fixed` still at `₹41.33` with `290` stores?
   - is that genuinely correct, or still a search/path asymmetry?

3. **Focus on strict-base runtime visibility**
   - instrument where time is really going inside the live `0 fixed` strict-base stage
   - separate true compute from stale progress labels

4. **Only after that, rerun leadership gate**
   - live server restart
   - `0 fixed`
   - `103`
   - `144`
   - then go/no-go

## 10. Office laptop usage plan

On the office Mac:

```bash
git clone --branch office-demo-bundle https://github.com/Sai-Dino/DS-Network-Design-Trial.git
cd DS-Network-Design-Trial
git lfs pull
./office_demo_verify.sh
./office_demo_start.sh
```

Important:

- this assumes Python is available
- and either Docker/native OSRM is already available

Do **not** promise full live scenario exploration on the office machine unless `0 fixed` has been revalidated there or beforehand.

## 11. Suggested immediate ask for the next agent

Ask the next Cloud Code agent:

> “Start from the current HEAD of branch `office-demo-bundle`. Do not rebuild the world. Use the existing pushed cache artifacts. Your main task is to determine why `clean_slate / 0 fixed` is still coming out at `99.91% / 290 Standards / ₹41.33`, while validated `103/144` warm runs are cheaper. Tell me whether that is truly correct under the business objective or whether one final asymmetry still exists. Then prove the live app path for `0 / 103 / 144` on the same latest build.”
