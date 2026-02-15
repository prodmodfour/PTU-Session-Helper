# PTU Skills Ecosystem — Specification

## 1. Purpose

The PTU Session Helper app must accurately replicate PTU 1.05 gameplay. Code correctness alone is insufficient — the app must be validated against actual gameplay scenarios derived from the rulebooks. This ecosystem exists to automate that validation loop.

**Core principle:** The playtest loop drives the dev loop. Gameplay defines correctness.

## 2. Architecture

### 2.1 Separate Terminals

Each skill runs in its own Claude Code terminal (session). Skills never share context windows. The user acts as liaison between terminals, copy-pasting context summaries and following the Orchestrator's guidance on which terminal to use next.

**Why separate terminals:**
- Each skill has a distinct role and knowledge set — mixing them bloats context
- Terminal crashes or context clears don't cascade
- Skills can run concurrently (e.g., Dev fixing bug A while Scenario Crafter writes scenarios for domain B)
- Matches the real-world model: QA team members don't share a single brain

### 2.2 Artifact-Based Communication

All inter-skill communication happens through persistent files on disk. No skill assumes knowledge of another skill's context. Every skill reads its inputs from the filesystem and writes its outputs to the filesystem.

```
app/tests/e2e/artifacts/
├── loops/              # Gameplay Loop Synthesizer → writes
├── scenarios/          # Scenario Crafter → writes
├── verifications/      # Scenario Verifier → writes
├── results/            # Playtester → writes
├── reports/            # Result Verifier → writes
├── designs/            # Feature Designer → writes
└── pipeline-state.md   # Updated by every skill, read by Orchestrator
```

Playwright spec files live separately:
```
app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts
```

### 2.3 Pipeline Flow

```
                    ┌──────────────┐
                    │ Orchestrator │ ← reads pipeline-state.md
                    │  (advises)   │   tells user which terminal next
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
   TESTING LOOP       DEV LOOP              REVIEW LOOP
        │                  │                       │
   Synthesizer        Developer              Reviewer
        ↓                  ↑                 Game Logic
   Crafter            (fixes bugs)           Reviewer
        ↓                  │                       │
   Verifier           ←────┴───────────────────────┘
        ↓                        (bug reports)
   Playtester
        ↓
   Result Verifier
        ├── APP_BUG ──────────→ DEV LOOP (Developer → Reviewer)
        ├── SCENARIO_BUG ─────→ Scenario Crafter (TESTING LOOP)
        ├── TEST_BUG ─────────→ Playtester (retry/fix)
        ├── AMBIGUOUS ────────→ Game Logic Reviewer
        ├── FEATURE_GAP ──────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)
        └── UX_GAP ───────────→ DESIGN LOOP (Feature Designer → Developer → Reviewer)
```

## 3. Skills

### 3.1 Orchestrator

| Field | Value |
|-------|-------|
| **File** | `.claude/skills/orchestrator.md` |
| **Trigger** | Ask Claude to load the orchestrator skill |
| **Input** | `app/tests/e2e/artifacts/pipeline-state.md`, artifact directory contents |
| **Output** | Advice to user (no files written except `pipeline-state.md` updates) |
| **Terminal** | Persistent — keep open throughout a testing session |

**Responsibilities:**
- Scan artifact directories to determine pipeline position
- Detect stale artifacts (e.g., loop updated but scenarios not re-crafted)
- Detect open bug reports that need dev attention
- Suggest the next action: which terminal, which command, which domain
- After dev fixes, suggest re-running only affected scenarios
- When all scenarios pass for a domain, declare it clean and suggest next domain

**Does NOT:**
- Write code
- Write artifacts (other than pipeline-state.md)
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
| **Output** | Review feedback, approval/rejection |
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
| **Output** | PTU compliance report with CORRECT/INCORRECT/NEEDS REVIEW per mechanic |
| **Terminal** | Spin up when needed for PTU rule questions |

**Evolved from:** `verify-ptu.md` (deleted after evolution)

**Responsibilities:**
- Verify code changes implement PTU 1.05 rules correctly
- Resolve `AMBIGUOUS` escalations from Scenario Verifier and Result Verifier
- Review Dev output for game logic correctness (complements Senior Reviewer's code quality review)
- Provide definitive PTU rule interpretations when skills disagree

**Authority:** On PTU game logic, this skill's judgment overrides all others. On code quality and architecture, Senior Reviewer overrides.

### 3.10 Retrospective Analyst

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

### 3.11 Feature Designer

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

### 4.5 Pipeline State

```markdown
---
last_updated: 2026-02-15T14:30:00
updated_by: result-verifier
---

## Domain: combat

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | complete | 4 loops | 2026-02-15 |
| Scenarios | complete | 12 scenarios | 2026-02-15 |
| Verifications | complete | 12 verified | 2026-02-15 |
| Test Runs | partial | 8/12 run | 2026-02-15 |
| Results | pending | 3 FAIL, 5 PASS | 2026-02-15 |

### Open Issues
- bug-001: CRITICAL APP_BUG — damage calc missing defense (assigned to Dev)
- bug-002: HIGH APP_BUG — STAB not applied (assigned to Dev)
- correction-001: SCENARIO_BUG — wrong base stat for Charmander (assigned to Crafter)

## Domain: capture
| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |

## Domain: healing
| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started | — | — |
```

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

No skill overrides another outside its authority domain.

## 6. Shared References

All skills that need PTU knowledge read from shared reference files rather than encoding rulebook content themselves.

| Reference | Path | Used by |
|-----------|------|---------|
| Chapter Index | `.claude/skills/references/ptu-chapter-index.md` | Synthesizer, Crafter, Verifiers, Game Logic Reviewer, Feature Designer |
| Skill Interfaces | `.claude/skills/references/skill-interfaces.md` | All skills (artifact format contracts) |
| App Surface | `.claude/skills/references/app-surface.md` | Crafter, Playtester, Dev, Feature Designer |
| Playwright Patterns | `.claude/skills/references/playwright-patterns.md` | Playtester |
| Lesson Files | `app/tests/e2e/artifacts/lessons/` | Retrospective Analyst (writes), all skills (read) |

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

### 7.2 Bug Fix Cycle

1. Dev reads bug report, implements fix, commits
2. Reviewer approves fix, notes affected scenarios
3. Game Logic Reviewer confirms PTU correctness of fix
4. Orchestrator: "Fix approved. Go to Playtester terminal, re-run scenario X"
5. Playtester re-runs → new result
6. Result Verifier checks → PASS or new bug

### 7.3 Targeted Test (specific feature change)

1. Orchestrator: "Feature X touches combat damage. Existing loops cover this — go to Playtester, re-run combat-basic-damage-001 through 004"
2. Skip Synthesizer/Crafter/Verifier — artifacts already exist and are current

### 7.4 Stale Artifact Detection

The Orchestrator detects staleness by comparing timestamps:
- Loop file older than app code change in the same domain → loop may be stale
- Scenario references a loop that was regenerated → scenario needs re-crafting
- Verification references a scenario that was re-crafted → needs re-verification

### 7.5 Gap Detection Cycle (Reactive)

When tests fail because a feature doesn't exist (not because of a bug):

1. Playtester runs test → API returns 404 or operation unsupported (does NOT retry 404s)
2. Result Verifier triages → classifies as `FEATURE_GAP` or `UX_GAP` → writes gap report to `reports/`
3. Orchestrator detects gap report → routes to Feature Designer terminal
4. Feature Designer reads gap report + workflow context + app surface → writes design spec to `designs/` with `status: complete`
5. Orchestrator detects pending design → routes to Developer terminal with design spec path
6. Developer implements design → fills in Implementation Log → sets `status: implemented` → updates `app-surface.md`
7. Orchestrator detects implemented design → routes to Playtester terminal with original scenario path
8. Playtester re-runs scenario → Result Verifier re-triages → PASS (gap closed) or new issue

### 7.6 Proactive Gap Detection

Gaps can be detected before testing, avoiding wasted Playtester cycles:

1. Synthesizer runs Step 4b feasibility check → annotates workflow steps with `[GAP: FEATURE_GAP]` or `[GAP: UX_GAP]`
2. Crafter includes gap-annotated steps as-is (does not skip)
3. Scenario Verifier detects gap annotations → adds `has_feasibility_warnings: true` to verification report frontmatter
4. Orchestrator scans verification frontmatter → detects feasibility warnings → can route to Feature Designer before Playtester
5. Feature Designer writes design spec → Developer implements → Playtester tests (first run succeeds for gap steps)
