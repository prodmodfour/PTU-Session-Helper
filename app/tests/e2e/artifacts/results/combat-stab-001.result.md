---
scenario_id: combat-stab-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-stab-001.spec.ts
duration_ms: 8000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | STAB: DB 4 to 6, damage 17 | damage=17 | damage=17 | PASS |
| 2 | Non-STAB baseline: damage 12 | damage=12 | damage=12 | PASS |
| 3 | STAB difference = +5 | diff=5 | diff=5 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
