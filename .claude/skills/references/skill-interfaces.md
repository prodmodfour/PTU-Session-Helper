# Skill Interfaces

Data contracts between skills in the PTU Skills Ecosystem. All artifacts use markdown with YAML frontmatter. Skills read from the previous stage's directory and write to their own.

## Artifact Directory Layout

```
app/tests/e2e/artifacts/
├── loops/              # Gameplay Loop Synthesizer writes
├── scenarios/          # Scenario Crafter writes
├── verifications/      # Scenario Verifier writes
├── results/            # Playtester writes
├── reports/            # Result Verifier writes
└── pipeline-state.md   # Every skill updates after writing artifacts
```

Playwright spec files: `app/tests/e2e/scenarios/<domain>/<scenario-id>.spec.ts`

## File Naming Conventions

- Loops: `<domain>.md` (e.g., `combat.md`, `capture.md`)
- Workflow scenarios: `<domain>-workflow-<description>-<NNN>.md` (e.g., `combat-workflow-wild-encounter-001.md`)
- Mechanic scenarios: `<domain>-<mechanic>-<NNN>.md` (e.g., `combat-stab-001.md`)
- Verifications: `<scenario-id>.verified.md` (e.g., `combat-workflow-wild-encounter-001.verified.md`)
- Results: `<scenario-id>.result.md` (e.g., `combat-workflow-wild-encounter-001.result.md`)
- Reports: `<category>-<NNN>.md` (e.g., `bug-001.md`, `correction-001.md`, `escalation-001.md`)

---

## 1. Gameplay Loop

**Written by:** Gameplay Loop Synthesizer
**Read by:** Scenario Crafter, Scenario Verifier
**Location:** `artifacts/loops/<domain>.md`

Loops come in two tiers. Tier 1 (Session Workflows) are the primary output — they represent real GM tasks at the table. Tier 2 (Mechanic Validations) are secondary — they isolate individual PTU rules for focused testing.

### 1a. Tier 1: Session Workflow

```markdown
---
loop_id: <domain>-workflow-<description>
tier: workflow
domain: <domain>
gm_intent: <one sentence: what the GM is trying to accomplish>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
app_features:
  - <app-file-path>
  - ...
mechanics_exercised:
  - <mechanic-name>
  - ...
sub_workflows:
  - <loop_id of workflow variation>
  - ...
---

## GM Context
<1-2 sentences: when does this happen in a session? What real-play situation triggers it?>

## Preconditions
- <state required before this workflow starts>

## Workflow Steps
1. **[Setup]** <GM creates/configures something>
2. **[Action]** <GM or system performs a game action>
3. **[Mechanic: <name>]** <system applies a PTU rule — tag which mechanic fires>
4. **[Bookkeeping]** <GM resolves aftermath>
5. **[Done]** <end state that proves the workflow succeeded>

## PTU Rules Applied
- <rule name>: <exact quote or paraphrase> (file:section)
- ...

## Expected End State
- <what the app should show when this workflow is complete>
- <what data should exist in the database>

## Variations
- **<variation name>**: <how the workflow changes> → sub-workflow loop_id
```

### 1b. Tier 2: Mechanic Validation

```markdown
---
loop_id: <domain>-mechanic-<description>
tier: mechanic
domain: <domain>
ptu_refs:
  - <rulebook-file>#<section>
  - ...
app_features:
  - <app-file-path>
  - ...
sub_loops:
  - <loop_id of edge case variant>
  - ...
---

## Preconditions
- <state required before this loop can execute>

## Steps
1. <game action in PTU terms>
2. <system responds>
3. ...

## PTU Rules Applied
- <rule name>: <exact quote or paraphrase> (file:section)
- ...

## Expected Outcomes
- <observable result with formula>
- ...

## Edge Cases
- <variant condition> → <expected different behavior>
- ...
```

**Constraints:**
- One file per domain, containing all workflows and mechanic validations
- Tier 1 workflows listed first (W1, W2...), Tier 2 mechanics second (M1, M2...)
- Each sub-workflow/sub-loop gets its own section
- `ptu_refs` must point to actual rulebook files via `references/ptu-chapter-index.md`
- `app_features` must point to actual app files via `references/app-surface.md`
- Workflow `mechanics_exercised` lists which PTU rules are implicitly tested by the workflow

---

## 2. Scenario

**Written by:** Scenario Crafter
**Read by:** Scenario Verifier, Playtester
**Location:** `artifacts/scenarios/<scenario-id>.md`

Scenarios come in two types matching the two loop tiers.

### 2a. Workflow Scenario (from Tier 1 loops)

Multi-phase scenarios that test a realistic GM task end-to-end. Assertions are placed at phase boundaries.

```markdown
---
scenario_id: <domain>-workflow-<description>-<NNN>
loop_id: <source workflow loop_id>
tier: workflow
priority: P0 | P1
ptu_assertions: <count>
mechanics_tested:
  - <mechanic-name>
  - ...
---

## Narrative
<2-3 sentences describing the real play situation this simulates>

## Setup (API)
POST /api/<endpoint> { <json body> }
<!-- $var = response.data.id -->

## Phase 1: <phase name>
<API calls and/or UI actions for this phase>

### Assertions (Phase 1)
1. <what to check>
   Derivation: <formula with concrete values>
   **Assert: <element> displays "<expected value>"**

## Phase 2: <phase name>
<actions>

### Assertions (Phase 2)
2. ...

## Phase N: Resolution
<final actions>

### Assertions (Phase N)
N. <end-state assertion>

## Teardown
DELETE /api/<endpoint>/$variable
```

### 2b. Mechanic Scenario (from Tier 2 loops)

Focused scenarios that isolate a single PTU rule.

```markdown
---
scenario_id: <domain>-<mechanic>-<NNN>
loop_id: <source mechanic loop_id>
tier: mechanic
priority: P1 | P2
ptu_assertions: <count>
---

## Setup (API)
POST /api/<endpoint> { <json body> }

## Actions
1. <focused interaction to trigger the mechanic>

## Assertions
1. <what to check>
   Derivation: <formula with concrete values>
   **Assert: <element> displays "<expected value>"**

## Teardown
DELETE /api/<endpoint>/$variable
```

**Constraints (both types):**
- One file per scenario (not per domain)
- Priority: P0 = session workflow (must work for app to fulfill its purpose), P1 = workflow variation or important mechanic, P2 = edge case
- Every assertion MUST show the mathematical derivation with concrete values
- Use real Pokemon species with looked-up base stats (from pokedex files)
- Setup uses API calls, not UI navigation (faster, more reliable)
- Actions use specific route paths from `references/app-surface.md`
- Variable capture syntax: `$var = response.path.to.value`
- Workflow scenarios MUST place assertions at each phase boundary, not just at the end

---

## 3. Verification Report

**Written by:** Scenario Verifier
**Read by:** Playtester (only runs verified scenarios)
**Location:** `artifacts/verifications/<scenario-id>.verified.md`

```markdown
---
scenario_id: <scenario-id>
verified_at: <ISO timestamp>
status: PASS | FAIL | PARTIAL
assertions_checked: <count>
assertions_correct: <count>
---

## Assertion Verification

### Assertion 1: <description>
- **Scenario says:** <the assertion from the scenario>
- **Independent derivation:** <re-derived from scratch using rulebook>
- **Status:** CORRECT | INCORRECT
- **Fix (if incorrect):** <corrected value with derivation>

### Assertion 2: ...

## Data Validity
- [ ] Species exist in pokedex
- [ ] Base stats match pokedex files
- [ ] Moves are learnable at specified level
- [ ] Abilities are available to species
- [ ] Status conditions are valid PTU statuses

## Completeness Check
- [ ] All steps from source gameplay loop are covered
- [ ] Edge cases from loop are addressed or noted as separate scenarios
- [ ] Errata corrections applied where relevant

## Issues Found
<!-- List any problems, empty if all correct -->
1. <issue description and fix>
```

**Constraints:**
- Only scenarios with status `PASS` proceed to Playtester
- `PARTIAL` means some assertions were corrected — Scenario Crafter should update the original
- `FAIL` means fundamental problems — return to Scenario Crafter for rewrite
- Verifier must re-derive assertions from rulebook independently, not just check the math

---

## 4. Test Result

**Written by:** Playtester
**Read by:** Result Verifier
**Location:** `artifacts/results/<scenario-id>.result.md`

```markdown
---
scenario_id: <scenario-id>
run_id: <YYYY-MM-DD-NNN>
status: PASS | FAIL | ERROR
spec_file: tests/e2e/scenarios/<domain>/<id>.spec.ts
duration_ms: <number>
retries_used: <0-2>
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | <what> | <value> | <value> | PASS/FAIL |
| 2 | ... | ... | ... | ... |

## Errors
<!-- Empty if all passed -->
- Assertion <N> failed: Expected "<expected>", got "<actual>"
- ...

## Playwright Errors
<!-- Selector failures, timeouts, navigation errors -->
<!-- Empty if test ran cleanly -->
- <error message>

## Screenshots
<!-- Captured on failure -->
- <relative path to screenshot>

## Self-Correction Log
<!-- If Playtester retried due to selector/timing issues -->
- Retry 1: <what was adjusted>
- Retry 2: <what was adjusted>
```

**Constraints:**
- `PASS`: all assertions passed
- `FAIL`: one or more assertion failures (expected vs actual mismatch)
- `ERROR`: test could not run (selector not found, timeout, server error) after exhausting retries
- Screenshots are mandatory on any FAIL or ERROR
- Self-correction log documents what the Playtester tried before reporting

---

## 5. Bug Report / Correction / Escalation

**Written by:** Result Verifier
**Read by:** Developer (bug), Scenario Crafter (correction), Game Logic Reviewer (escalation)
**Location:** `artifacts/reports/<type>-<NNN>.md`

### Bug Report (APP_BUG)

```markdown
---
bug_id: bug-<NNN>
severity: CRITICAL | HIGH | MEDIUM
category: APP_BUG
scenario_id: <scenario-id>
affected_files:
  - <app file path>
  - ...
---

## What Happened
<Concise description of the incorrect behavior>

## Expected vs Actual
- **Expected:** <value with PTU derivation>
- **Actual:** <value from test result>

## Root Cause Analysis
<Where in the code the bug likely lives and why>

## PTU Rule Reference
<rulebook file>: "<exact quote>"

## Suggested Fix
<Specific code change suggestion>

## Fix Log
<!-- Dev fills this in after fixing -->
- [ ] Fixed in commit: ___
- [ ] Files changed: ___
- [ ] Re-run scenario: <scenario-id>
```

### Correction (SCENARIO_BUG)

```markdown
---
correction_id: correction-<NNN>
category: SCENARIO_BUG
scenario_id: <scenario-id>
---

## What Was Wrong
<Which assertion(s) had incorrect expected values>

## Correct Values
<Re-derived values with shown math>

## Action Required
Update scenario file `artifacts/scenarios/<scenario-id>.md` assertion(s).
```

### Escalation (AMBIGUOUS)

```markdown
---
escalation_id: escalation-<NNN>
category: AMBIGUOUS
scenario_id: <scenario-id>
ptu_refs:
  - <conflicting rulebook sections>
---

## The Ambiguity
<What the rule says vs what's unclear>

## Possible Interpretations
1. <interpretation A> → expected value X
2. <interpretation B> → expected value Y

## Action Required
Game Logic Reviewer to make a ruling. Update scenario after ruling.
```

---

## 6. Pipeline State

**Updated by:** Every skill after writing artifacts
**Read by:** Orchestrator
**Location:** `artifacts/pipeline-state.md`

```markdown
---
last_updated: <ISO timestamp>
updated_by: <skill name>
---

## Domain: <domain>

| Stage | Status | Count | Last Updated |
|-------|--------|-------|-------------|
| Loops | not started / complete | <N> loops | <date> |
| Scenarios | not started / in progress / complete | <N>/<total> | <date> |
| Verifications | not started / in progress / complete | <N>/<total> | <date> |
| Test Runs | not started / in progress / complete | <N>/<total> | <date> |
| Results | not started / pending triage / complete | <pass>/<fail>/<error> | <date> |

### Open Issues
- <report-id>: <severity> <category> — <summary> (assigned to <skill>)

## Domain: <next domain>
...
```

**Constraints:**
- Every skill updates this file after writing its artifacts
- Orchestrator uses this as its sole source of truth
- Staleness detection: compare stage timestamps — if a loop is newer than its scenarios, scenarios are stale

---

## 7. Lesson File

**Written by:** Retrospective Analyst
**Read by:** All skills (for learning from past errors)
**Location:** `artifacts/lessons/<skill-name>.lessons.md`

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
<2-3 sentences summarizing key patterns found for this skill>

---

## Lesson <N>: <imperative title>

- **Category:** <one of: math-error, data-lookup, missing-check, process-gap, triage-error, selector-issue, routing-error, rule-ambiguity, fix-pattern>
- **Severity:** high | medium | low
- **Domain:** <domain or cross-cutting>
- **Frequency:** observed | recurring | systemic
- **First observed:** <date>
- **Status:** active | resolved | promote-candidate

### Pattern
<Concrete description of the error pattern with artifact references>

### Evidence
- `artifacts/<dir>/<file>`: <what was found>
- `git diff <hash>`: <what was changed>

### Recommendation
<Imperative instruction that could be added to the skill's process>
```

**File naming:** `<skill-name>.lessons.md` — hyphenated, matching ecosystem conventions. Examples:
- `scenario-crafter.lessons.md`
- `result-verifier.lessons.md`
- `playtester.lessons.md`

**Cross-cutting summary:** `artifacts/lessons/retrospective-summary.md` — aggregates metrics and patterns that span multiple skills.

**Constraints:**
- One file per skill — only created for skills with actual lessons
- `promote-candidate` status means the lesson should be considered for integration into the skill's process
- Resolved lessons remain in the file (marked `status: resolved`) for historical reference
- Lessons are numbered sequentially within each file
- The Retrospective Analyst deduplicates before writing — if a pattern already exists, it updates frequency and adds evidence rather than creating a duplicate
