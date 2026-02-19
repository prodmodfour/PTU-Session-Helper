---
scenario_id: healing-workflow-post-combat-quick-rest-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-workflow-post-combat-quick-rest-001.spec.ts
duration_ms: 483
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Pre-rest HP | 30/40 | 30/40 | PASS |
| 2 | First rest heals 2 HP | newHp=32, hpHealed=2 | 32, 2 | PASS |
| 3 | Rest minutes after first rest | 30 used, 450 remaining | 30, 450 | PASS |
| 4 | Second rest heals 2 HP | newHp=34, hpHealed=2 | 34, 2 | PASS |
| 5 | Cumulative rest minutes | 60 used, 420 remaining | 60, 420 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
