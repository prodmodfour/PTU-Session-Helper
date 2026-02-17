---
scenario_id: capture-mechanic-status-modifiers-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-mechanic-status-modifiers-001.spec.ts
duration_ms: 480
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Paralyzed (Persistent) -> statusModifier +10 | captureRate=100, statusModifier=10 | captureRate=100, statusModifier=10 | PASS |
| 2 | Confused (Volatile) -> statusModifier +5 | captureRate=95, statusModifier=5 | captureRate=95, statusModifier=5 | PASS |
| 3 | Stuck -> stuckModifier +10, statusModifier = 0 | captureRate=100, stuckModifier=10, statusModifier=0 | captureRate=100, stuckModifier=10, statusModifier=0 | PASS |
| 4 | Slowed -> slowModifier +5, statusModifier = 0 | captureRate=95, slowModifier=5, statusModifier=0 | captureRate=95, slowModifier=5, statusModifier=0 | PASS |
| 5 | Paralyzed + Confused stacked -> statusModifier = 15 | captureRate=105, statusModifier=15 | captureRate=105, statusModifier=15 | PASS |
| 6 | Burned + Stuck + Slowed mixed | captureRate=115, statusModifier=10, stuckModifier=10, slowModifier=5 | captureRate=115, statusModifier=10, stuckModifier=10, slowModifier=5 | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- No retries needed -->
