# Curated Skills Pack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a repo-specific curated skills pack that improves future Codex work on this Bangalore network optimizer without importing entire third-party agent systems.

**Architecture:** Add one root operating guide, a human-readable `docs/skills/` library, and a repo-local `.codex/skills/` prompt template library. Adapt useful ideas from selected external repos into this repo’s reality: optimizer verification, service-area truthfulness, Super sanity, UI/UX review, office-demo readiness, and startup/recovery discipline.

**Tech Stack:** Markdown, repo-local documentation, repo-local prompt templates

---

### Task 1: Create the root operating guide

**Files:**
- Create: `SKILLS.md`

- [ ] **Step 1: Write the root guide**

Include sections for:
- purpose and scope
- top priorities for this repo
- when to use the docs vs prompt templates
- non-goals (do not import whole external systems)
- links to `docs/skills/` and `.codex/skills/`

- [ ] **Step 2: Verify the file exists and is readable**

Run: `sed -n '1,220p' SKILLS.md`
Expected: root guide renders cleanly and references the correct local paths

### Task 2: Add curated human-readable guidance

**Files:**
- Create: `docs/skills/optimization-verification.md`
- Create: `docs/skills/super-placement-sanity.md`
- Create: `docs/skills/service-area-truthfulness.md`
- Create: `docs/skills/ui-ux-review.md`
- Create: `docs/skills/office-demo-runbook.md`
- Create: `docs/skills/startup-and-recovery.md`

- [ ] **Step 1: Write the optimizer verification guide**

Cover:
- verify-before-claiming-done
- required live checks (`/api/status`, `/api/result`)
- saved-packet verification
- threshold / trustworthiness reminders

- [ ] **Step 2: Write the Super placement sanity guide**

Cover:
- anti-clustering expectations
- overlap/cannibalization concerns
- spacing and edge-hugging checks
- what counts as materially improved vs still provisional

- [ ] **Step 3: Write the service-area truthfulness guide**

Cover:
- truthful polygons vs fallback rings
- live endpoint expectations
- required loaded-input conditions
- completion criteria for calling service areas done

- [ ] **Step 4: Write the UI/UX review guide**

Cover:
- leadership-demo quality bar
- map readability
- active-branch clarity
- warnings about overstating model certainty

- [ ] **Step 5: Write the office-demo runbook**

Cover:
- startup order
- restore latest packet
- expected live result
- what to do if ports or state drift

- [ ] **Step 6: Write the startup-and-recovery guide**

Cover:
- port checks
- duplicate-process avoidance
- OSRM/app restart flow
- restore flow and verification commands

- [ ] **Step 7: Verify the new docs tree**

Run: `find docs/skills -maxdepth 1 -type f | sort`
Expected: all six guidance files are present

### Task 3: Add repo-local Codex prompt templates

**Files:**
- Create: `.codex/skills/verify-optimizer.md`
- Create: `.codex/skills/finish-service-area.md`
- Create: `.codex/skills/fix-super-placement.md`
- Create: `.codex/skills/ui-leadership-review.md`
- Create: `.codex/skills/office-demo-prepare.md`
- Create: `.codex/skills/run-bangalore-audit.md`

- [ ] **Step 1: Write the optimizer verification prompt**

Include:
- environment bring-up
- packet restore expectations
- live validation commands
- exact final response structure

- [ ] **Step 2: Write the service-area completion prompt**

Include:
- don’t stop until service-area is truly usable or a concrete blocker is proven
- required endpoint/UI/live validation

- [ ] **Step 3: Write the Super placement prompt**

Include:
- anti-overlap, spacing, edge-hugging, and exclusivity-aware requirements
- live validation expectations

- [ ] **Step 4: Write the UI/UX leadership review prompt**

Include:
- world-class review criteria
- map/readability focus
- emphasis on truthful representation

- [ ] **Step 5: Write the office-demo preparation prompt**

Include:
- startup, restore, verification, and fast recovery instructions

- [ ] **Step 6: Write the Bangalore audit prompt**

Include:
- overall audit shape
- done/partial/not-done classification rules
- expectation to verify rather than trust old claims

- [ ] **Step 7: Verify the prompt-template tree**

Run: `find .codex/skills -maxdepth 1 -type f | sort`
Expected: all six prompt templates are present

### Task 4: Add source attribution and adaptation notes

**Files:**
- Create: `docs/skills/source-attribution.md`

- [ ] **Step 1: Write source attribution**

Document:
- which external repos influenced this pack
- what was adapted conceptually
- what was intentionally excluded
- why this repo uses a selective pack instead of wholesale adoption

- [ ] **Step 2: Cross-link attribution from `SKILLS.md`**

Ensure the root guide points to `docs/skills/source-attribution.md`

### Task 5: Verify coherence of the pack

**Files:**
- Modify: `SKILLS.md` (if link fixes are needed)

- [ ] **Step 1: Run a structure check**

Run: `find docs/skills .codex/skills -maxdepth 1 -type f | sort`
Expected: all intended files appear once, in the correct directories

- [ ] **Step 2: Run a quick content check**

Run: `sed -n '1,220p' SKILLS.md`
Expected: the root guide references the exact created filenames

- [ ] **Step 3: Summarize completion**

Report:
- files created
- how the pack is organized
- what external sources influenced it
- what was intentionally left out

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-17-curated-skills-pack.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Defaulting to Inline Execution here because the user explicitly asked to avoid repeated back-and-forth and this is a tightly scoped repo-local pack.**
