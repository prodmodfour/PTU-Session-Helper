---
scenario_id: combat-workflow-stage-buffs-001
run_id: 2026-02-15-001
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-stage-buffs-001.spec.ts
duration_ms: 3200
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | HP and initiative | Growlithe 43/43, Bulbasaur 39/39, Growlithe first | All correct | PASS |
| 2 | +2 SpATK stage applied | previous=0, change=+2, current=+2 | previous=0, change=+2, current=+2 | PASS |
| 3 | Net stage after -1 debuff | previous=+2, change=-1, current=+1 | previous=+2, change=-1, current=+1 | PASS |
| 4 | Modified SpATK with +1 stage | stageModifiers.specialAttack=1 | stageModifiers.specialAttack=1 | PASS |
| 5 | Stage-boosted damage (24) | HP=15/39 | HP=15/39, damage=24 applied | PASS |
| 6 | HP after stage-boosted attack | HP=15/39 | HP=15/39 | PASS |
| 7 | Stage-modified evasion (SpDEF +3) | stageModifiers.specialDefense=3 | stageModifiers.specialDefense=3 | PASS |
| 8 | Stage clamping (+3 within [-6,+6]) | specialDefense stage=+3 | specialDefense stage=+3 | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — all passed -->

## Self-Correction Log
<!-- None — clean run -->

## Notes
- Assertion 7 (Special Evasion = 2): Evasion is computed client-side from modified SpDEF (floor(11/5)=2). The test verifies the stage value (+3) is correct on the server. Full evasion calculation cannot be verified through the API alone (see Lesson 2 in playtester.lessons.md).
