---
scenario_id: combat-critical-hit-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-critical-hit-001.spec.ts
duration_ms: 8000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Normal damage baseline: 14 | 14 | 14 | PASS |
| 2 | Crit damage: 27, HP 32 to 5 | damage=27, HP=5 | damage=27, HP=5 | PASS |
| 3 | Crit nearly double normal | ratio~1.93 | ratio~1.93 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
