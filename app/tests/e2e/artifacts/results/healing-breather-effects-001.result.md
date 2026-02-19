---
scenario_id: healing-breather-effects-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-breather-effects-001.spec.ts
duration_ms: 1800
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | All 7 combat stages reset to 0 | All stages=0, stagesReset=true | Match | PASS |
| 2 | Volatile conditions cured | conditionsCured contains Enraged, Suppressed | Match | PASS |
| 3 | Slowed+Stuck cured | conditionsCured contains Slowed, Stuck | Match | PASS |
| 4 | Persistent survives | Paralyzed NOT in conditionsCured, still in statusConditions | Match | PASS |
| 5 | Tripped+Vulnerable applied | trippedApplied=true, vulnerableApplied=true, tempConditions match | Match | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
