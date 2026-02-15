---
scenario_id: combat-damage-and-faint-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-damage-and-faint-001.spec.ts
duration_ms: 4000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Starting HP 32/32 | 32 | 32 | PASS |
| 2 | After 20 damage: 12/32 | 12 | 12 | PASS |
| 3 | After 20 more: 0/32 (floored) | 0 | 0 | PASS |
| 4 | Fainted status applied | fainted=true | fainted=true | PASS |
| 5 | Fainted state persists on re-fetch | fainted=true | fainted=true | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
