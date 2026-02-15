---
scenario_id: combat-injury-massive-damage-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-injury-massive-damage-001.spec.ts
duration_ms: 2000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Starting HP 32/32, 0 injuries | HP=32, injuries=0 | HP=32, injuries=0 | PASS |
| 2 | Damage = 17 | 17 | 17 | PASS |
| 3 | Injury triggered (17 >= 16) | injury count > 0 | injury count = 1 | PASS |
| 4 | HP 15/32, not fainted, injury count 1 | HP=15, fainted=false, injuries=1 | HP=15, fainted=false, injuries=1 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
