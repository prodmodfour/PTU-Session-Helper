---
scenario_id: combat-multi-target-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-multi-target-001.spec.ts
duration_ms: 3000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Same base damage for both targets | baseDamage equal | baseDamage equal | PASS |
| 2 | Charmander: 51 damage, fainted | damage=51, fainted=true | damage=51, fainted=true | PASS |
| 3 | Machop: 33 damage, HP 8/41 | damage=33, HP=8 | damage=33, HP=8 | PASS |
| 4 | Different final damage per target | 51 != 33 | 51 != 33 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
