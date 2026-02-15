---
scenario_id: combat-take-a-breather-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-take-a-breather-001.spec.ts
duration_ms: 14000
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Full breather flow: reset stages, cure volatile, apply Tripped+Vulnerable | stages=0, volatile cleared, Tripped+Vulnerable applied | stages=0, volatile cleared, Tripped+Vulnerable applied | PASS |
| 2 | Persistent not removed (Paralyzed stays) | Paralyzed present | Paralyzed present | PASS |
| 3 | Temp HP removed | tempHP=0 | tempHP=0 | PASS |
| 4 | Clean state still applies Tripped+Vulnerable | Tripped+Vulnerable applied | Tripped+Vulnerable applied | PASS |
| 5 | Logged in move log | log entry present | log entry present | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
