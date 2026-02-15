---
scenario_id: combat-combat-stages-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-combat-stages-001.spec.ts
duration_ms: 14000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | +2 ATK stage | atkCS=+2 | atkCS=+2 | PASS |
| 2 | -2 DEF stage | defCS=-2 | defCS=-2 | PASS |
| 3 | Stages stack additively | atkCS=+4 | atkCS=+4 | PASS |
| 4 | Clamp at +6 | atkCS=+6 | atkCS=+6 | PASS |
| 5 | Clamp at -6 | defCS=-6 | defCS=-6 | PASS |
| 6 | Multiple stats in one call | atkCS+spAtkCS updated | atkCS+spAtkCS updated | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
