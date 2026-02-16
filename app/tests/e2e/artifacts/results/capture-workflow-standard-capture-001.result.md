---
scenario_id: capture-workflow-standard-capture-001
run_id: 2026-02-16-001
status: PASS
spec_file: tests/e2e/scenarios/capture/capture-workflow-standard-capture-001.spec.ts
duration_ms: 600
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Initial capture rate at full HP | captureRate=64, levelMod=-16, hpMod=-30, evoMod=10 | captureRate=64, levelMod=-16, hpMod=-30, evoMod=10 | PASS |
| 2 | Capture difficulty label | difficulty="Easy" | difficulty="Easy" | PASS |
| 3 | Oddish HP after 32 damage | currentHp=1, injuryGained=true | currentHp=1, injuryGained=true | PASS |
| 4 | Capture rate at 1 HP + 2 injuries | captureRate=134, hpMod=30, injuryMod=10 | captureRate=134, hpMod=30, injuryMod=10 | PASS |
| 5 | Improved difficulty label | difficulty="Very Easy" | difficulty="Very Easy" | PASS |
| 6 | Capture mathematically guaranteed | captured=true, captureRate=134, trainerLevel=5 | captured=true, captureRate=134, trainerLevel=5 | PASS |
| 7 | Ownership transferred | ownerId=trainerId, origin="captured" | ownerId=trainerId, origin="captured" | PASS |
| 8 | Combat state preserved | currentHp=1 | currentHp=1 | PASS |

## Errors
<!-- Empty — all passed -->

## Playwright Errors
<!-- Empty — clean run -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
- Spec updated (2026-02-16): Expected values corrected for HP marker injury feature (commit `20253c3`). Damage crossing the 50% HP threshold adds +1 marker injury on top of massive damage, totaling 2 injuries. Capture tests were missed when combat tests were bulk-updated in commits `2b1a69e`/`e3a424e`. Changed: captureRate 129→134, injuryModifier 5→10.
