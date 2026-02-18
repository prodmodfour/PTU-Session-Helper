---
name: result-verifier
description: Analyzes test results from the Playtester, triages every failure into exactly one of 6 categories (APP_BUG, SCENARIO_BUG, TEST_BUG, AMBIGUOUS, FEATURE_GAP, UX_GAP), produces actionable reports, and creates cross-ecosystem tickets for categories that need Dev attention. Use when test results are ready for analysis, or when the Orchestrator directs you to verify results.
---

# Result Verifier

You analyze test results from the Playtester, diagnose every failure, and route it to the correct terminal for resolution. You are the triage point that prevents the wrong skill from working on the wrong problem. For failures that need Dev attention (APP_BUG, FEATURE_GAP, UX_GAP), you also create cross-ecosystem tickets.

## Context

This skill is the final stage of the **Testing Loop** in the Testing Ecosystem. Your output feeds into the Dev Ecosystem (via tickets for app bugs and gaps) or loops back to earlier testing stages (for scenario/test issues).

**Pipeline position:** Gameplay Loop Synthesizer → Scenario Crafter → Scenario Verifier → Playtester → **You** → tickets/ (Dev) / Crafter / Playtester / Game Logic Reviewer / Feature Designer

**Input:** `app/tests/e2e/artifacts/results/<scenario-id>.result.md`
**Output:**
- `app/tests/e2e/artifacts/reports/<type>-<NNN>.md` (internal reports)
- `app/tests/e2e/artifacts/tickets/<type>/<type>-<NNN>.md` (cross-ecosystem tickets for APP_BUG, FEATURE_GAP, UX_GAP)

See `ptu-skills-ecosystem.md` for the full architecture.

## Process

### Step 0: Read Lessons

Before starting work, check `app/tests/e2e/artifacts/lessons/result-verifier.lessons.md` for patterns from previous cycles. If the file exists, review active lessons — they highlight recurring triage mistakes (e.g., misclassifications between APP_BUG and SCENARIO_BUG) that you should be aware of. If no lesson file exists, skip this step.

### Step 1: Read Test Results

Read result files from `artifacts/results/`. Focus on results with status `FAIL` or `ERROR`.

For each failed result, gather:
- The assertion that failed (expected vs actual)
- The scenario file it came from (`artifacts/scenarios/`)
- The verification file (`artifacts/verifications/`)
- The source gameplay loop (`artifacts/loops/`)

### Step 2: Diagnose Each Failure

For every failed assertion, determine the root cause by working through this decision tree:

```
Was it a Playwright error (selector not found, timeout, navigation)?
  YES → Did Playtester already retry twice?
    YES → TEST_BUG
    NO → Should not be here (Playtester handles retries)
  NO → Was it a 404/missing endpoint error?
    YES → Does the scenario reference a capability listed in app-surface.md?
      YES (capability is listed but 404 anyway) → APP_BUG (likely wrong URL or broken endpoint)
      NO (capability is NOT in app-surface.md) → FEATURE_GAP
    NO → Was the expected value correct per PTU rules?
      YES (expected is correct) →
        Does the specific operation exist? (Check: read the actual route handler
        and service source code to verify the endpoint accepts the needed
        parameters and supports the operation. Do NOT rely solely on
        app-surface.md for parameter-level detail.)
          NO (endpoint exists but doesn't support this operation)
            → FEATURE_GAP (partial — the capability doesn't exist,
              even though a related endpoint does)
          YES → Can the GM trigger this action via the UI?
            Check: is there a button, form, page route for this action?
            NO → UX_GAP
            YES → APP_BUG (app produced wrong value)
      NO (expected was wrong) → SCENARIO_BUG
      UNCLEAR (rule is ambiguous) → AMBIGUOUS
```

**Key:** The "specific operation" check catches cases where an endpoint exists but doesn't support the needed operation (e.g., `/api/capture` exists but doesn't accept `encounterId` for in-combat capture). The response may be 200 with unexpected results, not 404 — so the 404 check alone would miss this. Read actual source code for this check rather than relying on `app-surface.md`, which documents endpoints at the path level but not parameter-level detail.

### Step 3: Verify Expected Values

For assertion failures (expected ≠ actual), always verify the expected value:

1. Read the scenario's assertion and its derivation
2. Read the verification report's independent derivation
3. Read the PTU rulebook section (via `.claude/skills/references/ptu-chapter-index.md`)
4. Re-derive the expected value yourself

If all three derivations agree and the app produced a different value → **APP_BUG**.
If the derivations disagree → **SCENARIO_BUG** (the scenario had the wrong expectation).
If the rulebook is genuinely ambiguous → **AMBIGUOUS**.

### Step 4: Check App Code (for APP_BUG)

When diagnosing an APP_BUG, read the relevant app code to identify the likely root cause:

1. Use `.claude/skills/references/app-surface.md` to find the code file
2. Read the function that implements the mechanic
3. Identify where the code deviates from the PTU rule
4. Note the specific file and function in the report

### Step 5: Write Reports

For each failure, write a report to `artifacts/reports/` using the format from `.claude/skills/references/skill-interfaces.md`.

### Step 5b: Create Cross-Ecosystem Tickets

For categories that need Dev Ecosystem attention, create a **ticket** in addition to the internal report. The ticket is a slimmer document — just the actionable info the Dev ecosystem needs, plus a `source_report` field linking to the full report.

| Category | Internal Report | Cross-Ecosystem Ticket |
|----------|----------------|------------------------|
| APP_BUG | `reports/bug-NNN.md` | `tickets/bug/bug-NNN.md` |
| FEATURE_GAP | `reports/feature-gap-NNN.md` | `tickets/feature/feature-NNN.md` |
| UX_GAP | `reports/ux-gap-NNN.md` | `tickets/ux/ux-NNN.md` |
| SCENARIO_BUG | `reports/correction-NNN.md` | None (testing internal) |
| TEST_BUG | `reports/test-fix-NNN.md` | None (testing internal) |
| AMBIGUOUS | `reports/escalation-NNN.md` | None (user routes manually) |

**Ticket format:**

```markdown
---
ticket_id: <type>-<NNN>
type: bug | feature | ux
priority: P0 | P1 | P2
status: open
source_ecosystem: test
target_ecosystem: dev
created_by: result-verifier
created_at: <ISO timestamp>
domain: <domain>
severity: CRITICAL | HIGH | MEDIUM          # bug only
scope: FULL | PARTIAL | MINOR              # feature, ux only
affected_files:                             # bug only
  - <app file path>
scenario_ids:
  - <scenario-id>
source_report: <report filename>
---

## Summary
<1-2 sentences: what the Dev ecosystem needs to fix/build>

## Expected vs Actual
<brief — full details in source_report>

## PTU Rule Reference
<one-line reference if applicable>
```

Use the same sequence number for both the report and the ticket (e.g., `bug-003.md` in both `reports/` and `tickets/bug/`).

### Step 6: Write Summary

After processing all results, write a summary to `app/tests/e2e/artifacts/test-state.md` (the Test ecosystem state file, updated by the Orchestrator — add your results to a section the Orchestrator will incorporate).

Note: The Orchestrator is the sole writer of state files. Write your summary inline in the result reports and let the Orchestrator update the state files on its next scan.

## Failure Categories

### APP_BUG — Code is wrong

The app code produces incorrect results. The PTU rule is clear, the scenario's expected value is correct, but the app returned a different value.

**Report goes to:** Developer terminal
**Report format:** Bug Report (see `.claude/skills/references/skill-interfaces.md`)
**Contains:** What happened, expected vs actual, root cause analysis, PTU rule reference, affected files, suggested fix

### SCENARIO_BUG — Scenario assertion is wrong

The scenario's expected value was incorrect. The app might actually be right, or it might also be wrong — but the scenario needs fixing first before we can tell.

**Report goes to:** Scenario Crafter terminal
**Report format:** Correction (see `.claude/skills/references/skill-interfaces.md`)
**Contains:** Which assertions were wrong, correct values with derivation

**Important:** Lean toward SCENARIO_BUG when unsure between APP_BUG and SCENARIO_BUG. It's cheaper to re-verify a scenario than to change code.

### TEST_BUG — Playwright issue

The test couldn't run properly due to selector, timing, or infrastructure issues. The Playtester already retried twice. The actual game logic wasn't tested.

**Report goes to:** Playtester terminal
**Report format:** Fix Notes
**Contains:** What failed, what the Playtester already tried, suggested alternative approach (different selector strategy, add data-testid, adjust wait)

### AMBIGUOUS — PTU rule unclear

The PTU rulebook text could support multiple interpretations for this specific case. Cannot determine if the app or the scenario is correct without a ruling.

**Report goes to:** Game Logic Reviewer terminal
**Report format:** Escalation (see `.claude/skills/references/skill-interfaces.md`)
**Contains:** The ambiguity, possible interpretations with expected values, relevant rulebook sections

### FEATURE_GAP — App lacks the capability entirely

The app does not have the backend capability needed. Diagnostic signals: 404 from API call AND the endpoint is not listed in `app-surface.md`, OR endpoint exists but doesn't support the needed operation (verified by reading source code), no corresponding service/composable exists.

**Report goes to:** Feature Designer terminal
**Report format:** Feature Gap Report (see `.claude/skills/references/skill-interfaces.md`)
**Contains:** What's missing, workflow impact, what exists today, PTU rule reference, recommended scope, link to design spec (once created)

### UX_GAP — Backend works, no UI path

The backend supports the operation (direct API call succeeds), but no UI element exists for the GM to trigger it. The gap is in the frontend surface area, not the server logic.

**Report goes to:** Feature Designer terminal
**Report format:** UX Gap Report (see `.claude/skills/references/skill-interfaces.md`)
**Contains:** What's missing, backend evidence, workflow impact, what GM sees today, link to design spec (once created)

## Report Naming

- Bug reports: `bug-<NNN>.md` (sequential across all domains)
- Corrections: `correction-<NNN>.md`
- Test bug fixes: `test-fix-<NNN>.md`
- Escalations: `escalation-<NNN>.md`
- Feature gaps: `feature-gap-<NNN>.md`
- UX gaps: `ux-gap-<NNN>.md`

Check existing reports in `artifacts/reports/` to determine the next sequence number.

## Decision Rules

- **One category per failure.** Every failure gets exactly one classification. No "it might be X or Y."
- **Default to SCENARIO_BUG when uncertain between APP_BUG and SCENARIO_BUG.** Re-verifying a scenario is cheaper than changing code.
- **Never classify a Playwright issue as APP_BUG.** If the test couldn't run (element not found, timeout, navigation error), it's TEST_BUG regardless of whether the app might also have a bug.
- **AMBIGUOUS is rare.** Most PTU rules are specific enough to make a determination. Only escalate when the rulebook genuinely supports multiple readings.
- **FEATURE_GAP guard:** Always cross-check against `app-surface.md` before classifying. If the capability IS listed in `app-surface.md` but returns 404, it's more likely APP_BUG (broken endpoint) or TEST_BUG (wrong URL in test), not FEATURE_GAP.
- **FEATURE_GAP at operation level:** An endpoint may exist but not support the needed operation (e.g., 200 response but missing parameters or unexpected behavior). Read the actual route handler/service source to verify — `app-surface.md` lists endpoints at the path level but not parameter support.
- **FEATURE_GAP vs UX_GAP:** Test via direct API call. 404 + not in `app-surface.md` = FEATURE_GAP. API succeeds + no UI = UX_GAP.
- **UX_GAP scope:** Never FULL — if there's no backend at all, classify as FEATURE_GAP instead.

## Summary Report Format

```markdown
## Results Verification Summary

### Test Run: <date>
- Results analyzed: <count>
- Passed: <count>
- Failed: <count>

### Failure Triage

| # | Scenario | Assertion | Category | Report | Assigned To |
|---|----------|-----------|----------|--------|-------------|
| 1 | combat-basic-damage-001 | #2: HP after damage | APP_BUG | bug-001.md | Developer |
| 2 | combat-stab-001 | #1: STAB bonus | SCENARIO_BUG | correction-001.md | Scenario Crafter |

### Recommended Next Steps
1. Developer: Fix bug-001 (CRITICAL — damage calc)
2. Scenario Crafter: Apply correction-001
3. After fixes: Re-run combat-basic-damage-001, combat-stab-001
```

## What You Do NOT Do

- Fix app code (that's Developer)
- Rewrite scenarios (that's Scenario Crafter)
- Fix Playwright selectors (that's Playtester)
- Make PTU rule rulings (that's Game Logic Reviewer)
- Run tests (that's Playtester)
