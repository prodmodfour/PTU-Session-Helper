---
scenario_id: capture-workflow-multi-attempt-001
run_id: 2026-02-16-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-workflow-multi-attempt-001.spec.ts
duration_ms: 1300
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Initial capture rate (full HP) | captureRate=-10 | captureRate=-10 | PASS |
| 2 | Capture difficulty label | difficulty="Nearly Impossible" | difficulty="Nearly Impossible" | PASS |
| 3 | First attempt response: rate and roll math | captureRate=-10, modifiedRoll=roll-5 | captureRate=-10, modifiedRoll=roll-5 | PASS |
| 4 | HP after 69 damage | currentHp=1 | currentHp=1 | PASS |
| 5 | Injuries from massive damage + HP marker | injuryGained=true, injuries=2 | injuryGained=true, injuries=2 | PASS |
| 6 | Paralyzed status applied | statusConditions includes "Paralyzed" | statusConditions includes "Paralyzed" | PASS |
| 7 | Improved capture rate | captureRate=70, hpMod=30, statusMod=10, injuryMod=10 | captureRate=70, hpMod=30, statusMod=10, injuryMod=10 | PASS |
| 8 | Improved difficulty label | difficulty="Easy" | difficulty="Easy" | PASS |
| 9 | Capture eventually succeeds, ownership verified | captured=true, ownerId=trainerId, origin="captured" | captured=true, ownerId=trainerId, origin="captured" | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
- Spec updated (2026-02-16): Expected injury count corrected from 1 to 2 for HP marker injury feature (commit `20253c3`). Damage crossing the 50% HP threshold adds +1 marker injury on top of massive damage. Updated: newInjuries 1→2, captureRate 65→70, injuryModifier 5→10.
