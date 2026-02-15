---
scenario_id: combat-type-immunity-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-type-immunity-001.spec.ts
duration_ms: 6000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Fighting vs Ghost immune: 0 damage | 0 | 0 | PASS |
| 2 | Move consumed on immune target | moveConsumed=true | moveConsumed=true | PASS |
| 3 | Non-immune takes full damage | damage>0 | damage>0 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
