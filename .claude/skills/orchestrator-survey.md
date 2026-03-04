---
name: orchestrator-survey
description: Phase 1 of orchestration. Syncs remote, reads full pipeline state, builds a work queue of ALL actionable items (D1-D9 + M1-M7), runs inline M2 ticket creation and D3b design pre-flight, writes work-queue.json, and presents a summary. Does NOT assign slaves or launch anything.
---

# Orchestrator Survey

You are the orchestrator survey. You analyze the full pipeline state and produce a comprehensive work queue. You do NOT assign slaves, write slave plans, or launch anything — that happens in `/plan_slaves`.

**Lifecycle:** Sync remote → Read state → Build work queue → Write work-queue.json → Present summary → Die

**References:** Read `.claude/skills/references/orchestration-tables.md` for D1-D9 categories, M1-M7 matrix priorities, and the domain list.

## Step 0: Sync with Remote

Pull latest changes from origin before reading any state:

```bash
git pull origin master --ff-only
```

If this fails (diverged history), warn the user and abort — do not force-pull or rebase without confirmation.

## Step 1: Read Coordination State

### 1a. Check for Existing Plan

Check if `.worktrees/slave-plan.json` exists:
- If it exists, read it and warn the user: "An existing slave plan exists from <created_at>. Options: (1) overwrite with new plan, (2) abort."
- If `.worktrees/slave-plan.partial.json` exists, warn: "A partial plan exists from a previous run with failures."

### 1b. Check Active Slaves

Scan `.worktrees/slave-status/` for status JSON files. For each:
1. Read `status` field
2. If `"running"` — check if process is still alive (if `pid` present, `kill -0 <pid>`)
3. Report active, completed, and failed slaves

### 1c. Read Pipeline State

Read both ecosystem state files:
```
artifacts/state/dev-state.md
artifacts/state/test-state.md
```

If either doesn't exist, the ecosystem is uninitialized.

### 1d. Read Artifact Indexes (Preferred) or Scan Directories (Fallback)

**Preferred path — read `_index.md` files:**

If index files exist, read them for a fast summary instead of scanning hundreds of individual files:

1. `artifacts/_index.md` — global open work counts, active reviews, open tickets by priority
2. `artifacts/tickets/_index.md` — open/in-progress tickets with ID, category, priority, domain
3. `artifacts/reviews/_index.md` — active reviews (CHANGES_REQUIRED/FAIL), recent approvals
4. `artifacts/designs/_index.md` — design status, tier completion
5. `artifacts/matrix/_index.md` — per-domain coverage, pipeline completeness, staleness
6. `decrees/_index.md` — active decrees by domain

Record raw data from these indexes. Do NOT analyze or filter yet — analysis happens in Step 2.

**Only scan individual files when** you need the full file content (e.g., reading a ticket body for template data) or when an `_index.md` file is missing/stale.

**Fallback path — scan directories directly:**

If `_index.md` files don't exist, fall back to scanning directories:
- `artifacts/tickets/open/` — scan all subdirectories (`bug/`, `ptu-rule/`, `feature/`, `ux/`, `decree/`)
- `artifacts/tickets/in-progress/` — scan all subdirectories
- `artifacts/refactoring/`
- `artifacts/reviews/active/`
- `artifacts/designs/`
- `artifacts/matrix/`
- `artifacts/lessons/`
- `decrees/`

### 1e. Scan Decree-Need Tickets and Active Decrees

Read `decrees/_index.md` for active decrees. Read `artifacts/tickets/_index.md` for open decree-need tickets (check "Open Decree-Needs" section).

If indexes are missing, fall back to scanning `artifacts/tickets/open/decree/` for open decree-needs and `decrees/` for `status: active`.

Index decrees by domain for later template data gathering.

Report open decree-need tickets: "N decree-need tickets await human ruling. Run `/address_design_decrees` to unblock."

**Never assign decree-need tickets to slaves.** They require human decision-making.

## Step 2: Build Full Work Queue

**CRITICAL: Your work queue MUST include EVERY actionable item — every open ticket, every in-progress ticket with CHANGES_REQUIRED reviews, every pending review, and every incomplete matrix stage. Missing items = broken plan = wasted parallelism. Scan ALL sources from Step 1, not just the first few.**

### 2a. Categorize All Work Items

Walk through the raw data from Step 1 and tag each item with its category using the D1-D9 table from `references/orchestration-tables.md`.

### 2b. Sort by Priority

**P-level (P0-P4) is the primary sort key.** Category (D1-D9) only determines agent type, NOT ordering.

**Developer assignment order:**
1. **Escalated CHANGES_REQUIRED** — only if review found CRITICAL severity correctness bugs
2. **Highest P-level actionable ticket** — P0 > P1 > P2 > P3 > P4, regardless of category
3. **Within same P-level**, prefer: fix cycles (D2) > open tickets > designs > matrix maintenance (M3/M4) > refactoring
4. **Within same P-level and category**, prefer: extensibility impact > scope size

**Reviewer assignment (always parallel with dev work):**
- Committed fixes without reviews → reviewer slaves every plan
- Re-reviews after CHANGES_REQUIRED fixes → reviewer slaves every plan
- Reviews NEVER block or delay developer assignments

### 2c. M2 Ticket Creation (Inline)

When M2 items exist (matrix + audit complete, tickets not yet created), create tickets **inline during Step 2** before including them in the work queue:

1. Read `matrix/<domain>/matrix.md` and `matrix/<domain>/audit/` directory
2. Create **bug tickets** for each `Incorrect` audit item → `tickets/open/bug/bug-<NNN>.md`
3. Create **feature tickets** for each `Missing` matrix item → `tickets/open/feature/feature-<NNN>.md`
4. Create **feature tickets** for each `Subsystem-Missing` matrix item → `tickets/open/feature/feature-<NNN>.md` (one ticket per subsystem, not per rule — list all affected rules in the ticket body)
5. Create **feature tickets** for each `Partial` matrix item → `tickets/open/feature/feature-<NNN>.md` (one ticket per gap cluster — group related Partial rules that form a coherent feature. Include what exists vs what's missing. Use the gap descriptions in the matrix as the ticket summary.)
6. Create **feature tickets** for each `Implemented-Unreachable` cluster → `tickets/open/feature/feature-<NNN>.md` (group by actor+view)
7. Create **ptu-rule tickets** for each `Approximation` audit item → `tickets/open/ptu-rule/ptu-rule-<NNN>.md`
8. Skip `Correct`, `Out of Scope`, `Ambiguous` items
9. All tickets include `matrix_source` frontmatter
10. Commit tickets to master immediately (they're data, not code)
11. Push to remote: `git push origin master`
12. Then include the newly-created tickets in the work queue

### 2d. D3b: Design Pre-Flight Validation (Inline)

When a design has `status: complete`, run a pre-flight check **inline during Step 2** (not as a slave). This takes ~2 minutes and prevents mid-implementation blockers.

**1. Dependency Map** — Which other domains/models does this design touch?
- Read the design spec's `affected_files`, `new_files`, Data Model Changes, and API Changes sections
- Cross-reference against `references/app-surface.md` to identify domain overlaps
- If the design touches files owned by 2+ domains, flag as "cross-domain" in the plan summary
- If the design adds/changes Prisma models, note "schema migration required"

**2. Open Questions** — Are there PTU rule ambiguities or UX decisions that need decrees?
- Read the design spec's "PTU Rule Questions" and "Questions for Senior Reviewer" sections
- Check `decrees/_index.md` for existing rulings that might apply
- If unresolved ambiguities remain, create `decree-need` tickets and leave status as `complete` (do NOT promote to `validated`)
- Report: "Design <id> blocked on N open questions — run `/address_design_decrees`"

**On pass:** Update the design's `_index.md` status from `complete` → `validated`. The design enters the D7 queue in this or the next plan cycle.

**On fail (open questions found):** Leave status as `complete`, create decree-need tickets, report the blockers. The design stays out of D7 until questions are resolved and the next plan re-runs D3b.

### 2e. Emit Work Queue

Collect every actionable item into a flat list with: `{priority, category, target, agent_types, launch_mode, description, domain}`.

**Completeness check — verify you have not missed items:**
- Count open tickets from indexes. Count items in your queue tagged as open tickets. These MUST match.
- Count CHANGES_REQUIRED reviews from indexes. Count D2 items in your queue. These MUST match.
- Count pending reviews (D6). Count reviewer items in your queue. These MUST match.
- If any count is off, re-scan the source you missed.

## Step 3: Staleness Detection

Compare timestamps across stages:
- App code changed after capability mapping → re-map needed
- Re-mapped capabilities → matrix stale, re-analyze needed
- Developer commit after latest approved review → re-review needed

For code changes, check `git log --oneline -10` and map to domains via `references/app-surface.md`.

## Step 3a: Matrix Maintenance Promotion (Conditional)

After staleness detection, check if the work queue contains any D1-D5 items:

- **If D1-D5 items exist** → skip this step entirely. Dev work takes priority.
- **If NO D1-D5 items exist** → promote stale matrix domains into actionable work queue items.

This ensures the "no urgent dev work" state is validated — stale matrices may reveal new bugs/gaps that *should* be D1-D5 work.

**For each stale domain** identified in Step 3, determine the **next needed pipeline stage** and add one work item:

1. **Capabilities stale** (app code changed since last capability mapping) → add:
   `{priority: "P3", category: "M3", target: "<domain>-remap", agent_types: ["capability-mapper"], launch_mode: "single", description: "Re-map capabilities for <domain> (stale since <commit>)", domain: "<domain>"}`

2. **Capabilities fresh, matrix stale** (capabilities updated since last coverage analysis) → add:
   `{priority: "P3", category: "M4", target: "<domain>-coverage", agent_types: ["coverage-analyzer"], launch_mode: "single", description: "Re-run coverage analysis for <domain>", domain: "<domain>"}`

3. **Matrix fresh, audit stale/missing** (matrix updated since last audit) → add:
   `{priority: "P3", category: "M4", target: "<domain>-audit", agent_types: ["implementation-auditor"], launch_mode: "single", description: "Re-audit <domain> implementation correctness", domain: "<domain>"}`

4. **Audit complete, no tickets** → already handled by M2 in Step 2c.

**One stage per domain per survey.** Don't queue the entire pipeline for a domain — just the next step. The following survey will detect the next stale stage and promote it. This creates natural pipeline progression across survey cycles.

**Sorting:** M3/M4 items at P3 sort below any D6/D7 items at the same P-level but above D8 refactoring. Within M3/M4, prefer domains with the most code churn since last mapping.

**Multiple stale domains can run in parallel** — see the parallelization rules in `references/orchestration-tables.md` (Capability Mapper across domains = parallel, Coverage Analyzer needs mapper output = serial per domain).

Update the queue's `summary` to include:
- `"matrix_maintenance_triggered": true`
- `"m3_items": N`
- `"m4_items": N`
- `"stale_domains_promoted": ["combat", "healing", ...]`

## Step 4: Write work-queue.json

Write `.worktrees/work-queue.json` with this schema:

```json
{
  "survey_id": "survey-<unix-timestamp>",
  "created_at": "<ISO>",
  "created_from_commit": "<master HEAD SHA>",
  "items": [
    { "priority": "P0", "category": "D1", "target": "bug-001",
      "agent_types": ["developer"], "launch_mode": "single",
      "description": "...", "domain": "capture" }
  ],
  "summary": {
    "total_items": 5,
    "by_category": {"D1": 1, "D2": 2},
    "decree_needs_pending": 2,
    "m2_tickets_created": 3,
    "d3b_validated": 1
  }
}
```

Ensure the `.worktrees/` directory exists before writing.

## Step 5: Present Summary

Show the work queue to the user:

```markdown
## Survey Complete: survey-<id>

### Work Queue (N items)

| # | Priority | Category | Target | Agent Type | Domain | Description |
|---|----------|----------|--------|------------|--------|-------------|
| 1 | P0 | D1 | bug-042 | developer | combat | Critical damage calc bug |
| 2 | P1 | D2 | ptu-rule-079 | developer | capture | Fix cycle (CHANGES_REQUIRED) |
| 3 | P1 | D6 | ptu-rule-058 | reviewers | capture | Needs code + rules review |

### Summary
- **Total items:** N
- **By category:** D1: 1, D2: 2, D6: 1
- **M2 tickets created:** 3
- **D3b designs validated:** 1
- **Decree-needs pending:** 2 (run `/address_design_decrees`)
- **Matrix maintenance triggered:** Yes/No (only when D1-D5 queue is empty)
- **Staleness detected:** capabilities for healing domain (re-map needed)

### Next Step
Run `/plan_slaves` to assign work to parallel slaves.
```

**Then die.** This session produced `work-queue.json` for the planner to consume.

## What You Do NOT Do

- Assign work to slaves (planner does that)
- Write slave-plan.json (planner does that)
- Launch tmux sessions (launcher does that)
- Write code or modify app files
- Make PTU rule judgments (defer to Game Logic Reviewer)
- Approve code changes (defer to Senior Reviewer)
- Execute work items (slaves do that)
- Persist across multiple surveys (one survey, then die)
- Write artifacts other than work-queue.json and tickets (M2)
