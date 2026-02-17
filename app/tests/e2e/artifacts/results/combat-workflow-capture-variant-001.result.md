---
scenario_id: combat-workflow-capture-variant-001
run_id: 2026-02-16-002
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-capture-variant-001.spec.ts
duration_ms: 1400
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Rattata acts first (speed >= 7 > 4) | Rattata first in turnOrder | Rattata first in turnOrder | PASS |
| 2 | Squirtle HP after Rattata STAB Tackle | 35 - max(1, 10+rattataATK) (dynamic) | Matches computed value | PASS |
| 3 | Rattata HP after Squirtle STAB Water Gun | maxHp - max(1, 24-rattataSpDEF) (dynamic) | Matches computed value | PASS |
| 4 | Injury check (dynamic conditional) | damage >= maxHp/2 → injuryGained | Matches conditional | PASS |
| 5 | Capture rate is positive | captureRate > 0 | captureRate > 0 | PASS |
| 6 | Capture succeeds | captured = true | captured = true | PASS |
| 7 | Pokemon linked to trainer | origin="captured", ownerId=trainerId | origin="captured", ownerId=trainerId | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None — clean run -->

## Screenshots
<!-- None — API-only assertions -->

## Self-Correction Log
<!-- No retries needed -->

## Notes

Spec regenerated from correction-005 rewrite using dynamic query-then-compute assertions. Wild-spawn Rattata has non-deterministic stats; all expected values are derived from queried actual stats after spawn. Verified stable across 3 consecutive runs with different random stat distributions — no flakiness.

Key changes from previous (stale) spec:
- Trainer level raised from 10 to 30 (guarantees capture via crit bonus + level subtraction)
- Damage values computed dynamically from queried Rattata stats instead of hardcoded
- Injury assertion uses dynamic conditional (`damage >= maxHp/2`) instead of assuming `true`
- Capture attempt uses `accuracyRoll: 20` (crit) instead of `modifiers: 100`
- Imports from `./combat-helpers` (not `./capture-helpers`)
