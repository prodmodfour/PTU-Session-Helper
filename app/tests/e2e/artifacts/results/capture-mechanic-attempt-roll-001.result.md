---
scenario_id: capture-mechanic-attempt-roll-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-mechanic-attempt-roll-001.spec.ts
duration_ms: 700
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Response includes all expected fields | 13 required keys present | All 13 keys present | PASS |
| 2 | Trainer level subtracted from roll | modifiedRoll === roll - 8 | Relational check passed | PASS |
| 3 | Capture success matches roll logic, no crit | captured === (nat100 \|\| modifiedRoll <= rate), criticalHit=false, effectiveRate=captureRate | All relational checks passed | PASS |
| 4 | Critical accuracy detected, +10 bonus | criticalHit=true, effectiveRate=captureRate+10 | criticalHit=true, effectiveRate=captureRate+10 | PASS |
| 5 | Critical capture logic still applies | captured === (nat100 \|\| modifiedRoll <= effectiveRate) | Relational check passed | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- No retries needed -->
