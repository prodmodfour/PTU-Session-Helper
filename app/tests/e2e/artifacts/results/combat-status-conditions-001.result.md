---
scenario_id: combat-status-conditions-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-status-conditions-001.spec.ts
duration_ms: 13000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Paralyzed on Charmander | status=Paralyzed | status=Paralyzed | PASS |
| 2 | Burned on Fire-type (API allows) | status=Burned | status=Burned | PASS |
| 3 | Paralyzed on Electric-type (API allows) | status=Paralyzed | status=Paralyzed | PASS |
| 4 | Duplicate prevention | no duplicate added | no duplicate added | PASS |
| 5 | Remove status | status removed | status removed | PASS |
| 6 | Multiple conditions coexist | both present | both present | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
