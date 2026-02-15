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
- Scenarios: `<domain>-<description>-<NNN>.md` (e.g., `combat-basic-damage-001.md`)
- Verifications: `<scenario-id>.verified.md` (e.g., `combat-basic-damage-001.verified.md`)
- Results: `<scenario-id>.result.md` (e.g., `combat-basic-damage-001.result.md`)
- Reports: `<category>-<NNN>.md` (e.g., `bug-001.md`, `correction-001.md`, `escalation-001.md`)

---

## 1. Gameplay Loop

**Written by:** Gameplay Loop Synthesizer
**Read by:** Scenario Crafter, Scenario Verifier
**Location:** `artifacts/loops/<domain>.md`

```markdown
---
loop_id: <domain>-<description>
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
- <rule name>: <exact quote or paraphrase from rulebook with file:section reference>
- ...

## Expected Outcomes
- <observable result after loop completes>
- ...

## Edge Cases
- <variant condition> → <expected different behavior>
- ...
```

**Constraints:**
- One file per domain, containing the main loop and all sub-loops
- Each sub-loop gets its own `## Sub-Loop: <name>` section with the same structure
- `ptu_refs` must point to actual rulebook files via `references/ptu-chapter-index.md`
- `app_features` must point to actual app files via `references/app-surface.md`

---

## 2. Scenario

**Written by:** Scenario Crafter
**Read by:** Scenario Verifier, Playtester
**Location:** `artifacts/scenarios/<scenario-id>.md`

```markdown
---
scenario_id: <domain>-<description>-<NNN>
loop_id: <source loop_id>
priority: P0 | P1 | P2
ptu_assertions: <count of assertions that test PTU rules>
---

## Setup (API)
<!-- API calls to create test data. Use request fixture format. -->
POST /api/<endpoint> {
  <json body>
}
<!-- Variable capture: -->
<!-- $encounter_id = response.data.id -->

## Actions (UI)
1. Navigate to <route>
2. <user interaction> (click, type, select)
3. ...

## Assertions
<!-- EVERY assertion must show its derivation -->
1. <what to check>
   Derivation: <formula with concrete values>
   Example: HP = level(15) + (baseHp(5) * 3) + 10 = 40
   **Assert: <element> displays "<expected value>"**

2. ...

## Teardown
<!-- API calls to clean up test data -->
DELETE /api/<endpoint>/$variable
```

**Constraints:**
- One file per scenario (not per domain)
- Priority: P0 = core mechanic must work, P1 = important flow, P2 = edge case
- Every assertion MUST show the mathematical derivation with concrete values
- Use real Pokemon species with looked-up base stats (from pokedex files)
- Setup uses API calls, not UI navigation (faster, more reliable)
- Actions use specific route paths from `references/app-surface.md`
- Variable capture syntax: `$var = response.path.to.value`

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
