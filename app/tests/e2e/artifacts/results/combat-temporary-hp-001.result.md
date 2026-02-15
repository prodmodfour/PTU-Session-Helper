---
scenario_id: combat-temporary-hp-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-temporary-hp-001.spec.ts
duration_ms: 2000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Temp HP = 10, real HP 32/32 | tempHP=10, HP=32 | tempHP=10, HP=32 | PASS |
| 2 | After 15 damage: temp absorbs 10, real HP 27/32 | tempHP=0, HP=27 | tempHP=0, HP=27 | PASS |
| 3 | After 8 more: no temp, real HP 19/32 | tempHP=0, HP=19 | tempHP=0, HP=19 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
