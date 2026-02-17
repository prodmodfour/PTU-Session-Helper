---
scenario_id: capture-mechanic-hp-modifier-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-mechanic-hp-modifier-001.spec.ts
duration_ms: 450
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Full HP (100%) -> hpModifier = -30 | captureRate=60, hpModifier=-30 | captureRate=60, hpModifier=-30 | PASS |
| 2 | Exactly 75% HP -> hpModifier = -15 | captureRate=75, hpModifier=-15 | captureRate=75, hpModifier=-15 | PASS |
| 3 | Exactly 50% HP -> hpModifier = 0 | captureRate=90, hpModifier=0 | captureRate=90, hpModifier=0 | PASS |
| 4 | Exactly 25% HP -> hpModifier = +15 | captureRate=105, hpModifier=15 | captureRate=105, hpModifier=15 | PASS |
| 5 | Exactly 1 HP -> hpModifier = +30 | captureRate=120, hpModifier=30 | captureRate=120, hpModifier=30 | PASS |
| 6 | 0 HP -> canBeCaptured = false | canBeCaptured=false | canBeCaptured=false | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- No retries needed -->
