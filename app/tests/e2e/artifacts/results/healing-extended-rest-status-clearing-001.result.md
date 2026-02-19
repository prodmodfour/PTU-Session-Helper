---
scenario_id: healing-extended-rest-status-clearing-001
run_id: 2026-02-19-001
status: PASS
spec_file: tests/e2e/scenarios/healing/healing-extended-rest-status-clearing-001.spec.ts
duration_ms: 2800
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Burned cleared, Confused survives | clearedStatuses=["Burned"], remaining=["Confused"] | Match | PASS |
| 2 | All persistent cleared | clearedStatuses contains Frozen, Paralyzed, Poisoned | Match | PASS |
| 3 | No persistent: nothing cleared | clearedStatuses=[] | [] | PASS |
| 4 | Badly Poisoned cleared, Enraged+Slowed survive | clearedStatuses=["Badly Poisoned"], remaining=["Enraged","Slowed"] | Match | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None - all tests passed -->

## Self-Correction Log
<!-- None -->
