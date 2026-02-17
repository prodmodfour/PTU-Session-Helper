---
scenario_id: capture-mechanic-cannot-capture-fainted-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-mechanic-cannot-capture-fainted-001.spec.ts
duration_ms: 500
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Rate API: canBeCaptured = false when HP = 0 | canBeCaptured=false | canBeCaptured=false | PASS |
| 2 | Attempt API: rejects with reason, no roll | captured=false, reason="Pokemon is at 0 HP and cannot be captured" | captured=false, reason="Pokemon is at 0 HP and cannot be captured" | PASS |
| 3 | No roll field in fainted-rejection response | roll=undefined | roll=undefined | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- No retries needed -->
