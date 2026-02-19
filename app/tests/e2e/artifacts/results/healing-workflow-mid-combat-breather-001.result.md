---
scenario_id: healing-workflow-mid-combat-breather-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-workflow-mid-combat-breather-001.spec.ts
duration_ms: 926
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | All combat stages reset to 0 | stagesReset=true, all 7 stages=0 | Match | PASS |
| 2 | Confused (volatile) cured | conditionsCured contains Confused | Match | PASS |
| 3 | Stuck cured (breather rule) | conditionsCured contains Stuck | Match | PASS |
| 4 | Burned (persistent) survives | NOT in conditionsCured, still in statusConditions | Match | PASS |
| 5 | Tripped+Vulnerable applied | trippedApplied=true, vulnerableApplied=true | Match | PASS |
| 6 | Turn consumed | Action used (verified via encounter state) | Match | PASS |
| 7 | Post-breather entity state correct | DB entity synced, Burned present, Confused/Stuck gone | Match | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
