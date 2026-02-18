# PTU Skills Ecosystem — Specification

## 1. Purpose

The PTU Session Helper app must accurately replicate PTU 1.05 gameplay. Code correctness alone is insufficient — the app must be validated against actual gameplay scenarios derived from the rulebooks. This ecosystem exists to automate that validation loop.

**Core principle:** The playtest loop drives the dev loop. Gameplay defines correctness.

## 2. Architecture

### 2.1 Two Ecosystems, One Orchestrator

The ecosystem is split into two logically separate halves:

- **Dev Ecosystem:** Developer, Senior Reviewer, Game Logic Reviewer, Code Health Auditor
- **Test Ecosystem:** Gameplay Loop Synthesizer, Scenario Crafter, Scenario Verifier, Playtester, Result Verifier

Bridge skills (Feature Designer, Retrospective Analyst) serve both. A single Orchestrator reads both state files and gives parallel recommendations.

### 2.2 Separate Terminals

Each skill runs in its own Claude Code terminal (session). Skills never share context windows. The user acts as liaison between terminals, copy-pasting context summaries and following the Orchestrator's guidance on which terminal to use next.

**Why separate terminals:**
- Each skill has a distinct role and knowledge set — mixing them bloats context
- Terminal crashes or context clears don't cascade
- Skills can run concurrently (e.g., Dev fixing bug A while Scenario Crafter writes scenarios for domain B)
- Matches the real-world model: QA team members don't share a single brain

### 2.3 Artifact-Based Communication

All inter-skill communication happens through persistent files on disk. No skill assumes knowledge of another skill's context.

**Cross-ecosystem communication** uses tickets:
```
app/tests/e2e/artifacts/tickets/
├── bug/               # Test → Dev (APP_BUG)
├── ptu-rule/          # Either → Dev (rule violations)
├── feature/           # Test → Dev (FEATURE_GAP)
├── ux/                # Test → Dev (UX_GAP)
└── retest/            # Dev → Test (after both reviews approve)
```

**Ecosystem-internal artifacts:**
```
app/tests/e2e/artifacts/
├── loops/              # Test: Synthesizer writes → Crafter reads
├── scenarios/          # Test: Crafter writes → Verifier reads
├── verifications/      # Test: Verifier writes → Playtester reads
├── results/            # Test: Playtester writes → Result Verifier reads
├── reports/            # Test: Result Verifier writes (internal reports)
├── designs/            # Shared: Feature Designer writes → Developer reads
├── refactoring/        # Dev: Code Health Auditor writes → Developer reads
├── reviews/            # Dev: Reviewers write → Orchestrator/Developer read
├── lessons/            # Shared: Retrospective Analyst writes → all read
├── dev-state.md        # Orchestrator writes → Dev skills read
└── test-state.md       # Orchestrator writes → Test skills read
```

Playwright spec files live separately:
```
app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts
```

### 2.4 Ticket System

Tickets are the **sole cross-ecosystem communication mechanism**. Reports stay internal to the Test ecosystem. Only actionable work items cross the boundary.

| Type | Prefix | Direction | Producer | Consumer |
|------|--------|-----------|----------|----------|
| bug | `bug-NNN` | Test → Dev | Result Verifier | Developer |
| ptu-rule | `ptu-rule-NNN` | Either → Dev | Game Logic Reviewer / Scenario Verifier | Developer |
| feature | `feature-NNN` | Test → Dev | Result Verifier / Feature Designer | Developer |
| ux | `ux-NNN` | Test → Dev | Result Verifier / Feature Designer | Developer |
| retest | `retest-NNN` | Dev → Test | Orchestrator | Playtester |
| refactoring | `refactoring-NNN` | Dev internal | Code Health Auditor | Developer |

**Ticket vs Report Boundary:**
- Result Verifier writes **both** a report (internal) AND a ticket (cross-ecosystem) for APP_BUG, FEATURE_GAP, UX_GAP
- SCENARIO_BUG, TEST_BUG, AMBIGUOUS are testing-internal — reports only, no tickets
- Tickets are slimmer than reports — just the actionable info plus a `source_report` link

### 2.5 State Files

The Orchestrator is the **sole writer** of both state files:
- `dev-state.md` — tracks open tickets, active Developer work, review status, refactoring queue
- `test-state.md` — tracks active domain, pipeline stage progress, pending retests, internal issues

No other skill writes to state files. Skills report completions via their artifacts; the Orchestrator reads artifacts and updates state.

### 2.6 Pipeline Flow

```
                    ┌──────────────────────┐
                    │     Orchestrator     │ ← reads both state files
                    │  (advises on BOTH    │   + all ticket dirs
                    │   ecosystems)        │
                    └──────────┬───────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                       │
       DEV ECOSYSTEM     TICKET BOUNDARY      TEST ECOSYSTEM
            │                  │                       │
       Developer          ← bug tickets ←         Synthesizer
       Senior Reviewer    ← feature tickets ←         ↓
       Game Logic Rev     ← ux tickets ←          Crafter
       Code Health Aud    ← ptu-rule tickets ←        ↓
                          → retest tickets →      Verifier
                                                      ↓
                                                  Playtester
                                                      ↓
                                                  Result Verifier
                                                  ├── APP_BUG → bug ticket → Dev
                                                  ├── FEATURE_GAP → feature ticket → Dev
                                                  ├── UX_GAP → ux ticket → Dev
                                                  ├── SCENARIO_BUG → correction (internal)
                                                  ├── TEST_BUG → test-fix (internal)
                                                  └── AMBIGUOUS → escalation (internal)
```

## 3. Skills

### 3.1 Orchestrator

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/orchestrator.md` |
| **Trigger** | Ask Claude to load the orchestrator skill |
| **Input** | `dev-state.md`, `test-state.md`, all ticket directories, artifact directories |
| **Output** | `dev-state.md`, `test-state.md`, `tickets/retest/` tickets, parallel recommendations |
| **Terminal** | Persistent — keep open throughout a testing session |

**Responsibilities:**
- Scan both ecosystems to determine pipeline position
- Apply D1-D10 priority tree to Dev Ecosystem
- Apply T1-T8 priority tree to Test Ecosystem
- Give parallel recommendations when both ecosystems have work
- Create retest tickets (D8) after both reviews approve a fix
- Sole writer of both state files
- Detect stale artifacts and open tickets

**Does NOT:**
- Write code
- Write artifacts other than state files and retest tickets
- Make PTU rule judgments
- Approve code or plans

### 3.2 Gameplay Loop Synthesizer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/gameplay-loop-synthesizer.md` |
| **Trigger** | Ask Claude to load the gameplay-loop-synthesizer skill |
| **Input** | PTU rulebook chapters, app feature map |
| **Output** | `app/tests/e2e/artifacts/loops/<domain>.md` |
| **Terminal** | Spin up per domain, can close after loops written |

**Responsibilities:**
- Read PTU rulebook chapters relevant to a domain
- Map rules to app features that implement them
- Produce structured gameplay loop documents
- Identify edge cases and sub-loops (e.g., capture with status effect, capture at 0 HP)

**Domains:** combat, capture, character-lifecycle, pokemon-lifecycle, healing, encounter-tables, scenes, vtt-grid

**Persistence:** Loops are written once and reused across cycles. Only regenerate when:
- New app features are added to a domain
- A PTU rule interpretation is corrected
- The Orchestrator flags a loop as stale

### 3.3 Scenario Crafter

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/scenario-crafter.md` |
| **Trigger** | Ask Claude to load the scenario-crafter skill |
| **Input** | `app/tests/e2e/artifacts/loops/<domain>.md` |
| **Output** | `app/tests/e2e/artifacts/scenarios/<scenario-id>.md` |
| **Terminal** | Spin up per batch, can close after scenarios written |

**Responsibilities:**
- Turn abstract gameplay loops into concrete, testable scenarios
- Use real Pokemon species with looked-up base stats (reads pokedex files)
- Calculate exact expected values with shown math
- Map game actions to UI actions (page routes, form fields, buttons)
- Write API-based setup and teardown steps
- Assign priority (P0 = core mechanic, P1 = important, P2 = edge case)

**Key constraint:** Every assertion must show its derivation. Not "HP should be 40" but "HP = level(15) + (baseHp(5) * 3) + 10 = 40". This lets the Scenario Verifier and Result Verifier independently validate the math.

### 3.4 Scenario Verifier

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/scenario-verifier.md` |
| **Trigger** | Ask Claude to load the scenario-verifier skill |
| **Input** | `app/tests/e2e/artifacts/scenarios/<scenario-id>.md` |
| **Output** | `app/tests/e2e/artifacts/verifications/<scenario-id>.verified.md` |
| **Terminal** | Spin up per verification batch |

**Responsibilities:**
- Validate scenario data against PTU 1.05 rules independently
- Check species exist with correct base stats
- Check moves are learnable by the species at the given level
- Re-derive every assertion's expected value from scratch
- Check scenario completeness against its source gameplay loop
- Apply errata corrections
- Mark each assertion: `CORRECT` / `INCORRECT` (with fix) / `AMBIGUOUS`

**Escalation:** `AMBIGUOUS` items → user should consult Game Logic Reviewer terminal.

### 3.5 Playtester

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/playtester.md` |
| **Trigger** | Ask Claude to load the playtester skill |
| **Input** | `app/tests/e2e/artifacts/verifications/<scenario-id>.verified.md` |
| **Output** | `app/tests/e2e/scenarios/<domain>/<id>.spec.ts` + `app/tests/e2e/artifacts/results/<scenario-id>.result.md` |
| **Terminal** | Persistent during testing phases — needs running dev server |

**Responsibilities:**
- Translate verified scenarios into Playwright `.spec.ts` files
- Execute tests against the running dev server
- Use API-based setup via `request` fixture (faster, more reliable than UI setup)
- Capture screenshots on failure
- Parse Playwright output into structured Test Result documents

**Self-correction loop:**
1. On selector/timing failure → adjust selector or add wait → retry (max 2 retries)
2. If still failing after 2 retries → classify as TEST_BUG in result
3. On assertion failure (expected ≠ actual) → never self-correct, always report

**Prerequisites:**
- Dev server running on port 3001 (`cd app && npm run dev`)
- Playwright browsers installed (`npx playwright install chromium`)
- Database seeded (`npx prisma db seed`)

### 3.6 Result Verifier

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/result-verifier.md` |
| **Trigger** | Ask Claude to load the result-verifier skill |
| **Input** | `app/tests/e2e/artifacts/results/<scenario-id>.result.md` |
| **Output** | `app/tests/e2e/artifacts/reports/<report-id>.md` |
| **Terminal** | Spin up per results batch |

**Responsibilities:**
- Analyze test results from Playtester
- Triage every failure into exactly one category
- Produce actionable reports for the appropriate terminal

**Failure triage:**

| Category | Meaning | Report goes to |
|----------|---------|---------------|
| `APP_BUG` | App code produces wrong result, PTU rule is clear | Developer terminal (Bug Report) |
| `SCENARIO_BUG` | Scenario assertion was wrong | Scenario Crafter terminal (Correction) |
| `TEST_BUG` | Playwright issue (after Playtester exhausted 2 retries) | Playtester terminal (Fix Notes) |
| `AMBIGUOUS` | PTU rule unclear, can't determine correct behavior | Game Logic Reviewer terminal (Escalation) |
| `FEATURE_GAP` | App lacks the capability entirely (no backend) | Feature Designer terminal (Feature Gap Report) |
| `UX_GAP` | Backend works but no UI exposes the action | Feature Designer terminal (UX Gap Report) |

**Key rule:** A single test failure gets exactly one category. No "it might be X or Y" — commit to a diagnosis. If genuinely uncertain between APP_BUG and SCENARIO_BUG, lean toward SCENARIO_BUG (cheaper to re-verify a scenario than to change code).

### 3.7 Developer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-dev.md` |
| **Trigger** | Load at session start |
| **Input** | Bug reports from `app/tests/e2e/artifacts/reports/`, reviewer feedback |
| **Output** | Code changes, committed to git |
| **Terminal** | Persistent — primary implementation terminal |

**Ecosystem additions (to existing skill):**
- Read bug reports from `app/tests/e2e/artifacts/reports/`
- After fixing, annotate the bug report file with fix details (file changed, commit hash)
- Follow the Orchestrator's guidance on which bug to fix next

### 3.8 Senior Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/ptu-session-helper-senior-reviewer.md` |
| **Trigger** | Load at session start, after Dev produces changes |
| **Input** | Dev's code changes (git diff), bug reports being addressed |
| **Output** | `app/tests/e2e/artifacts/reviews/code-review-<NNN>.md` |
| **Terminal** | Persistent — review terminal |

**Ecosystem additions (to existing skill):**
- Check fixes against the original test failure assertions in the bug report
- When approving a fix, note which scenarios should be re-run (for Orchestrator)
- Code quality and architecture review remain primary responsibilities

### 3.9 Game Logic Reviewer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/game-logic-reviewer.md` |
| **Trigger** | Ask Claude to load the game-logic-reviewer skill |
| **Input** | Code changes, scenario verifications, escalations from other skills |
| **Output** | `app/tests/e2e/artifacts/reviews/rules-review-<NNN>.md` |
| **Terminal** | Spin up when needed for PTU rule questions |

**Evolved from:** `verify-ptu.md` (deleted after evolution)

**Responsibilities:**
- Verify code changes implement PTU 1.05 rules correctly
- Resolve `AMBIGUOUS` escalations from Scenario Verifier and Result Verifier
- Review Dev output for game logic correctness (complements Senior Reviewer's code quality review)
- Provide definitive PTU rule interpretations when skills disagree

**Authority:** On PTU game logic, this skill's judgment overrides all others. On code quality and architecture, Senior Reviewer overrides.

### 3.10 Feature Designer

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/feature-designer.md` |
| **Trigger** | When Result Verifier classifies a failure as FEATURE_GAP or UX_GAP, when Orchestrator routes a gap report, or when Synthesizer feasibility check flags missing capabilities |
| **Input** | `app/tests/e2e/artifacts/reports/feature-gap-*.md` or `ux-gap-*.md` |
| **Output** | `app/tests/e2e/artifacts/designs/design-<NNN>.md` |
| **Terminal** | Spin up per gap report |

**Responsibilities:**
- Read gap reports and understand what workflow triggered the failure
- Analyze current app surface area (server-side for FEATURE_GAP, client-side for UX_GAP)
- Read PTU rules for FEATURE_GAP designs that involve game mechanics
- Design the feature: data model, API, services, components, stores, user flows
- Flag ambiguous PTU rules for Game Logic Reviewer
- Flag architectural questions for Senior Reviewer
- Write design specs with `status: complete` for Developer implementation

**Does NOT:**
- Write code (that's Developer)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Judge code architecture quality (that's Senior Reviewer)
- Write test scenarios (that's Scenario Crafter)
- Run tests (that's Playtester)
- Triage test failures (that's Result Verifier)

### 3.11 Retrospective Analyst

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/retrospective-analyst.md` |
| **Trigger** | After a domain completes a full cycle (results triaged, bugs fixed, re-runs pass) OR on-demand by user request |
| **Input** | `app/tests/e2e/artifacts/verifications/`, `results/`, `reports/`, `pipeline-state.md`, git history |
| **Output** | `app/tests/e2e/artifacts/lessons/<skill-name>.lessons.md`, `retrospective-summary.md` |
| **Terminal** | Spin up after cycles complete or on user request |

**Responsibilities:**
- Scan artifact trail and git history for error patterns across completed pipeline cycles
- Classify errors into 11 categories with clear boundary definitions
- Track recurrence (observed → recurring → systemic)
- Deduplicate against existing lessons before writing
- Write per-skill lesson files with evidence and recommendations
- Write cross-cutting retrospective summary
- Update pipeline-state.md with lessons metrics

**Does NOT:**
- Fix app code (that's Developer)
- Rewrite scenarios (that's Scenario Crafter)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Triage individual failures (that's Result Verifier)
- Modify any skill's process steps (recommends changes only)
- Write to any artifact directory other than `artifacts/lessons/` and `pipeline-state.md`

### 3.12 Code Health Auditor

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/code-health-auditor.md` |
| **Trigger** | On-demand, after a domain completes a full pipeline cycle, or after Developer implements a FULL-scope design spec |
| **Input** | Source code files under `app/`, `app-surface.md`, lesson files, git log |
| **Output** | `app/tests/e2e/artifacts/refactoring/refactoring-<NNN>.md`, `audit-summary.md` |
| **Terminal** | Spin up per audit |

**Responsibilities:**
- Scan production source code for structural issues that hinder LLM agent correctness
- Categorize findings into 12 categories (7 LLM-friendliness + 5 extensibility)
- Cross-reference Retrospective Analyst lessons to boost priority of flagged files
- Detect hot files via git change frequency
- Write prioritized refactoring tickets (max 10 per audit)
- Write audit summary with metrics and hotspots
- Update `## Code Health` section of pipeline-state.md

**Authority boundary:** Decides *what* needs fixing and its priority. Senior Reviewer decides *how* the refactoring is implemented.

**Does NOT:**
- Modify source code (that's Developer)
- Review code changes (that's Senior Reviewer)
- Fix bugs or implement features (that's Developer)
- Make PTU rule judgments (that's Game Logic Reviewer)
- Scan test files or artifacts — only production code under `app/`
- Write to any artifact directory other than `artifacts/refactoring/`

## 4. Artifact Formats

All artifacts use markdown with YAML frontmatter. Full schemas in `.claude/skills/references/skill-interfaces.md`.

### 4.1 Gameplay Loop

```markdown
---
loop_id: combat-basic-damage
domain: combat
ptu_refs:
  - core/07-combat.md#damage-roll
app_features:
  - composables/useCombat.ts
  - server/services/combatant.service.ts
---

## Preconditions
- Active encounter with at least 2 combatants

## Steps
1. Trainer selects attack move
2. System calculates damage
3. Damage applied to target
4. Target HP updated

## PTU Rules Applied
- Damage = Attack Stat + Move DB + STAB + Effectiveness - Defense Stat
- [exact formula with rulebook quote]

## Expected Outcomes
- Target HP reduced by calculated damage
- Move logged in combat history
```

### 4.2 Scenario

```markdown
---
scenario_id: combat-basic-damage-001
loop_id: combat-basic-damage
priority: P0
ptu_assertions: 3
---

## Setup (API)
POST /api/encounters { ... }
POST /api/pokemon { species: "Bulbasaur", level: 15, ... }

## Actions (UI)
1. Navigate to /gm/encounters/:id
2. Click "Attack" on Bulbasaur's turn
3. Select "Tackle" (Normal, 2d6+8, Physical)
4. Select target: Charmander
5. Enter damage roll: 18

## Assertions
1. Charmander HP before: level(15) + (baseHp(4) * 3) + 10 = 37
   Damage: 18 (rolled) + attack(12) - defense(8) = 22
   Charmander HP after: 37 - 22 = 15
   **Assert: Charmander HP displays "15"**

2. Combat log shows "Bulbasaur used Tackle on Charmander for 22 damage"

3. Turn advances to next combatant in initiative order

## Teardown
DELETE /api/encounters/:id
```

### 4.3 Test Result

```markdown
---
scenario_id: combat-basic-damage-001
run_id: 2026-02-15-001
status: FAIL
---

## Assertion Results

| # | Expected | Actual | Status |
|---|----------|--------|--------|
| 1 | HP = 15 | HP = 19 | FAIL |
| 2 | Log shows "22 damage" | Log shows "18 damage" | FAIL |
| 3 | Turn advances | Turn advances | PASS |

## Errors
Assertion 1 failed: Expected HP "15", got "19"
Assertion 2 failed: Expected "22 damage", got "18 damage"

## Screenshots
- screenshots/combat-basic-damage-001-fail-1.png
```

### 4.4 Bug Report

```markdown
---
bug_id: bug-001
severity: CRITICAL
category: APP_BUG
scenario_id: combat-basic-damage-001
affected_files:
  - app/composables/useCombat.ts
  - app/server/services/combatant.service.ts
---

## What Happened
Damage calculation does not subtract defense stat. Target takes raw rolled damage instead of (rolled + attack - defense).

## Root Cause Analysis
In `useCombat.ts:calculateDamage()`, the defense parameter is accepted but never subtracted from the total.

## PTU Rule Reference
core/07-combat.md: "Damage = Attack Roll + Attack Stat - Defense Stat"

## Suggested Fix
In calculateDamage(), subtract the target's relevant defense stat from the damage total before applying.

## Fix Log
<!-- Dev fills this in after fixing -->
- [ ] Fixed in commit: ___
- [ ] Files changed: ___
- [ ] Re-run scenario: combat-basic-damage-001
```

### 4.5 State Files

The Orchestrator maintains two state files (sole writer):

**dev-state.md** — Dev Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Dev Ecosystem State

## Open Tickets
### Bug Tickets (`tickets/bug/`)
### PTU Rule Tickets (`tickets/ptu-rule/`)
### Feature Tickets (`tickets/feature/`)
### UX Tickets (`tickets/ux/`)

## Active Developer Work
## Review Status
## Retest Tickets Created
## Refactoring Tickets (`refactoring/`)
## Code Health
```

**test-state.md** — Test Ecosystem state:
```markdown
---
last_updated: <ISO timestamp>
updated_by: orchestrator
---

# Test Ecosystem State

## Active Domain
## Domain Progress
| Domain | Loops | Scenarios | Verifications | Tests | Triage | Status |
## Pending Retests from Dev
## Internal Issues
### Scenario Corrections
### Test Bugs
## Lessons
## Recommended Next Step
```

### 4.5b Pipeline State (Legacy)

The original `pipeline-state.md` has been archived as `pipeline-state.legacy.md`. It contains the full historical record from the combat and capture domain cycles. New state tracking uses the two state files above.

### 4.6 Lesson File

```markdown
---
skill: <skill-name>
last_analyzed: <ISO timestamp>
analyzed_by: retrospective-analyst
total_lessons: <count>
domains_covered:
  - <domain>
  - ...
---

# Lessons: <Skill Display Name>

## Summary
<2-3 sentences summarizing the key patterns found for this skill>

---

## Lesson 1: <imperative title>

- **Category:** math-error | data-lookup | missing-check | process-gap | triage-error | selector-issue | routing-error | rule-ambiguity | fix-pattern
- **Severity:** high | medium | low
- **Domain:** combat | capture | healing | pokemon-lifecycle | character-lifecycle | encounter-tables | scenes | vtt-grid | cross-cutting
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with references to specific artifacts>

### Evidence
- `artifacts/verifications/<id>.verified.md`: <what was found>
- `artifacts/results/<id>.result.md`: <expected vs actual>
- `git diff <hash>`: <what was changed to fix it>

### Recommendation
<Imperative instruction that could be added to the skill's process>

---

## Lesson 2: ...
```

**Constraints:**
- One file per skill — only for skills with actual lessons
- File naming: `<skill-name>.lessons.md` (hyphenated, matching ecosystem conventions)
- `promote-candidate` status means the lesson should be considered for integration into the skill's process steps
- Lessons are append-only within a file; resolved lessons stay for reference but are marked `status: resolved`
- Cross-cutting summary in `artifacts/lessons/retrospective-summary.md`

### 4.7 Refactoring Ticket + Audit Summary

**Written by:** Code Health Auditor
**Read by:** Developer (implements refactoring), Senior Reviewer (reviews approach)
**Location:** `artifacts/refactoring/refactoring-<NNN>.md` and `artifacts/refactoring/audit-summary.md`

#### Refactoring Ticket

```markdown
---
ticket_id: refactoring-<NNN>
priority: P0 | P1 | P2
categories:
  - <category-id>
affected_files:
  - <app file path>
estimated_scope: small | medium | large
status: open | in-progress | resolved
created_at: <ISO timestamp>
---

## Summary
<1-2 sentences: what the problem is and why it matters for LLM agents>

## Findings

### Finding 1: <category-id>
- **Metric:** <measured value>
- **Threshold:** <threshold that was exceeded>
- **Impact:** <how this affects LLM agent code generation>
- **Evidence:** <file:line-range, function names>

### Finding 2: ...

## Suggested Refactoring
1. <step with exact file paths>
2. <step referencing existing patterns to follow>
3. ...
Estimated commits: <count>

## Related Lessons
- <cross-reference to Retrospective Analyst finding, or "none">

## Resolution Log
<!-- Developer fills this in after refactoring -->
- Commits: ___
- Files changed: ___
- New files created: ___
- Tests passing: ___
```

**Scope definitions:**
- **small**: Single file, <50 lines changed, no interface changes
- **medium**: 2-3 files, possible interface changes, <200 lines changed
- **large**: 4+ files, interface changes, >200 lines changed

**Constraints:** One ticket per file/file-group. Max 10 per audit. Status lifecycle: `open` → `in-progress` → `resolved`.

#### Audit Summary

```markdown
---
last_audited: <ISO timestamp>
audited_by: code-health-auditor
scope: <"full codebase" | "domain: <name>" | "targeted: <paths>">
files_scanned: <count>
files_deep_read: <count>
total_tickets: <count>
overflow_files: <count of files that qualified but exceeded the 20-file cap>
---

## Metrics
| Metric | Value |
|--------|-------|
| Total files scanned | <count> |
| Total lines of code | <count> |
| Files over 800 lines | <count> |
| Files over 600 lines | <count> |
| Files over 400 lines | <count> |
| Open tickets (P0) | <count> |
| Open tickets (P1) | <count> |
| Open tickets (P2) | <count> |

## Hotspots
| Rank | File | Lines | Categories | Priority |
|------|------|-------|------------|----------|
| 1 | <path> | <count> | <ids> | <P0/P1/P2> |

## Tickets Written
- `refactoring-<NNN>`: <summary> (P<X>)

## Overflow
<!-- Files that qualified for deep-read but were capped -->
- <path> (<line count>, reason: <size/hot/lesson-ref>)

## Comparison to Last Audit
- Resolved since last audit: <count>
- New issues found: <count>
- Trend: improving | stable | degrading
```

**Constraints:**
- One audit summary per audit run — overwrites the previous summary
- Overflow section tracks files that exceeded the 20-file deep-read cap
- Comparison section is empty on first audit

### 4.8 Code Review

**Written by:** Senior Reviewer
**Read by:** Orchestrator, Developer, Game Logic Reviewer
**Location:** `artifacts/reviews/code-review-<NNN>.md`

```markdown
---
review_id: code-review-<NNN>
review_type: code
reviewer: senior-reviewer
trigger: bug-fix | design-implementation | refactoring
target_report: <bug-NNN | design-NNN | refactoring-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
files_reviewed:
  - <app file path>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
scenarios_to_rerun:
  - <scenario-id>
reviewed_at: <ISO timestamp>
follows_up: <code-review-NNN>  # optional — for re-reviews
---

## Review Scope
<What was reviewed>

## Issues

### CRITICAL / HIGH / MEDIUM
1. **<title>** — `<file>:<line>`
   <buggy code + fix>

## What Looks Good
## Verdict
## Required Changes
## Scenarios to Re-run
```

**Constraints:**
- Verdict `BLOCKED` = CRITICAL issues, `CHANGES_REQUIRED` = HIGH/MEDIUM must fix, `APPROVED` = ready for rules review
- `scenarios_to_rerun` tells Orchestrator what to re-test after both reviews pass
- Counters per-prefix: `code-review-001` and `rules-review-001` coexist independently
- Follow-up reviews: update existing verdict (trivial fix) or new artifact with `follows_up` (substantive re-review)

### 4.9 Rules Review

**Written by:** Game Logic Reviewer
**Read by:** Orchestrator, Developer
**Location:** `artifacts/reviews/rules-review-<NNN>.md`

```markdown
---
review_id: rules-review-<NNN>
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix | design-implementation | escalation-ruling
target_report: <bug-NNN | design-NNN | escalation-NNN>
domain: <domain>
commits_reviewed:
  - <commit hash>
mechanics_verified:
  - <mechanic-name>
verdict: APPROVED | CHANGES_REQUIRED | BLOCKED
issues_found:
  critical: <count>
  high: <count>
  medium: <count>
ptu_refs:
  - <rulebook-file>#<section>
reviewed_at: <ISO timestamp>
follows_up: <rules-review-NNN>  # optional — for re-reviews
---

## Review Scope
## Mechanics Verified
### <Mechanic Name>
- **Rule:** "<quote>" (`<file>#<section>`)
- **Implementation:** <what the code does>
- **Status:** CORRECT | INCORRECT | NEEDS REVIEW

## Summary
## Rulings
## Verdict
## Required Changes
```

**Constraints:**
- Verdict meanings match Code Review
- `mechanics_verified` lists every mechanic checked — even if all correct
- `ptu_refs` must point to actual rulebook files
- Escalation rulings also produce a `rules-review-*.md` for audit trail
- Both reviews (code + rules) are always required before a fix proceeds to re-test

## 5. Authority Hierarchy

When skills disagree:

| Domain | Final authority |
|--------|----------------|
| PTU game logic, formulas, rule interpretation | Game Logic Reviewer |
| Code quality, architecture, patterns, performance | Senior Reviewer |
| UI/UX design, feature surface area, user flows | Feature Designer |
| Pipeline sequencing, what to test next | Orchestrator |
| Scenario data accuracy, assertion math | Scenario Verifier |
| Failure classification (6 categories: APP_BUG/SCENARIO_BUG/TEST_BUG/AMBIGUOUS/FEATURE_GAP/UX_GAP) | Result Verifier |
| Pattern identification and lesson accuracy | Retrospective Analyst |
| Structural code health issues and refactoring priority | Code Health Auditor |

No skill overrides another outside its authority domain.

## 6. Shared References

All skills that need PTU knowledge read from shared reference files rather than encoding rulebook content themselves.

| Reference | Path | Used by |
|-----------|------|---------|
| Chapter Index | `.claude/skills/references/ptu-chapter-index.md` | Synthesizer, Crafter, Verifiers, Game Logic Reviewer, Feature Designer |
| Skill Interfaces | `.claude/skills/references/skill-interfaces.md` | All skills (artifact format contracts) |
| App Surface | `.claude/skills/references/app-surface.md` | Crafter, Playtester, Dev, Feature Designer, Code Health Auditor |
| Playwright Patterns | `.claude/skills/references/playwright-patterns.md` | Playtester |
| Lesson Files | `app/tests/e2e/artifacts/lessons/` | Retrospective Analyst (writes), all skills (read) |
| Refactoring Tickets | `app/tests/e2e/artifacts/refactoring/` | Code Health Auditor (writes), Developer + Senior Reviewer (read) |
| Review Artifacts | `app/tests/e2e/artifacts/reviews/` | Senior Reviewer + Game Logic Reviewer (write), Orchestrator + Developer (read) |

Reference files live in `.claude/skills/references/`.

## 7. Lifecycle Patterns

### 7.1 Full Loop (new domain)

1. Orchestrator: "No loops for domain X. Go to Synthesizer terminal, load the gameplay-loop-synthesizer skill"
2. Synthesizer produces loops → writes to `artifacts/loops/`
3. Orchestrator: "Loops ready. Go to Crafter terminal, load the scenario-crafter skill"
4. Crafter produces scenarios → writes to `artifacts/scenarios/`
5. Orchestrator: "Scenarios ready. Go to Verifier terminal, load the scenario-verifier skill"
6. Verifier validates → writes to `artifacts/verifications/`
7. Orchestrator: "Verified. Go to Playtester terminal, load the playtester skill"
8. Playtester executes → writes specs + results
9. Orchestrator: "Results ready. Go to Result Verifier terminal, load the result-verifier skill"
10. Result Verifier triages → writes reports
11. Orchestrator: "3 bugs found. Go to Dev terminal, start with bug-001 (CRITICAL)"

### 7.2 Bug Fix Cycle (Cross-Ecosystem)

1. Dev reads bug ticket (`tickets/bug/`) + source report → implements fix → commits
2. Senior Reviewer reviews code → writes `reviews/code-review-<NNN>.md` with verdict
3. Game Logic Reviewer confirms PTU correctness → writes `reviews/rules-review-<NNN>.md` with verdict
4. Orchestrator detects both reviews APPROVED → creates retest ticket in `tickets/retest/`
5. Playtester picks up retest ticket → re-runs scenario → new result
6. Result Verifier checks → PASS or new bug ticket

### 7.3 Targeted Test (specific feature change)

1. Orchestrator: "Feature X touches combat damage. Existing loops cover this — go to Playtester, re-run combat-basic-damage-001 through 004"
2. Skip Synthesizer/Crafter/Verifier — artifacts already exist and are current

### 7.4 Stale Artifact Detection

The Orchestrator detects staleness by comparing timestamps:
- Loop file older than app code change in the same domain → loop may be stale
- Scenario references a loop that was regenerated → scenario needs re-crafting
- Verification references a scenario that was re-crafted → needs re-verification

### 7.5 Gap Detection Cycle (Reactive, Cross-Ecosystem)

When tests fail because a feature doesn't exist (not because of a bug):

1. Playtester runs test → API returns 404 or operation unsupported (does NOT retry 404s)
2. Result Verifier triages → classifies as `FEATURE_GAP` or `UX_GAP` → writes report + ticket
3. Orchestrator detects gap ticket → routes to Feature Designer terminal
4. Feature Designer reads gap ticket + source report + app surface → writes design spec to `designs/`, enriches ticket with `design_spec` reference
5. Orchestrator detects pending design → routes to Developer terminal with design spec path
6. Developer implements design → fills in Implementation Log → sets `status: implemented` → updates `app-surface.md`
7. Orchestrator detects implemented design → creates retest ticket → routes to Playtester
8. Playtester re-runs scenario → Result Verifier re-triages → PASS (gap closed) or new ticket

### 7.6 Proactive Gap Detection

Gaps can be detected before testing, avoiding wasted Playtester cycles:

1. Synthesizer runs Step 4b feasibility check → annotates workflow steps with `[GAP: FEATURE_GAP]` or `[GAP: UX_GAP]`
2. Crafter includes gap-annotated steps as-is (does not skip)
3. Scenario Verifier detects gap annotations → adds `has_feasibility_warnings: true` to verification report frontmatter
4. Orchestrator scans verification frontmatter → detects feasibility warnings → can route to Feature Designer before Playtester
5. Feature Designer writes design spec → Developer implements → Playtester tests (first run succeeds for gap steps)
