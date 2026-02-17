---
scenario_id: combat-workflow-wild-encounter-001
run_id: 2026-02-15-002
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts
duration_ms: 3600
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Growlithe HP (deterministic) | 43/43 | 43/43 | PASS |
| 2 | Oddish HP (dynamic, full, >= 35) | $oddish_hp/$oddish_hp | full HP, >= 35 | PASS |
| 3 | Initiative — Growlithe first (SPD 6 > Oddish) | Growlithe active | Growlithe active | PASS |
| 4 | Serve encounter | isServed=true | isServed=true | PASS |
| 5 | Growlithe STAB Ember -> Oddish (dynamic damage, x1.5 SE) | $oddish_hp - $ember_damage | computed correctly | PASS |
| 6 | Oddish injury check (dynamic) | injury if $ember_damage >= maxHP/2 | consistent | PASS |
| 7 | Oddish STAB Acid -> Growlithe (dynamic damage) | 43 - $acid_damage | computed correctly | PASS |
| 8 | Growlithe injury check (dynamic) | injury if $acid_damage >= 21.5 | consistent | PASS |
| 9 | Second Ember -> Oddish faint check | HP floored at 0, Fainted status | faint confirmed | PASS |
| 10 | Encounter lifecycle — end + unserve | isActive=false, isServed=false | false, false | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — API-only test -->

## Self-Correction Log
<!-- None needed -->

## Notes
- Previous run (2026-02-15-001) failed at assertion 2: scenario assumed deterministic stats for wild-spawned Oddish.
- Fixed by commit `2a4f84e: fix: apply 3 corrections to combat Tier 1 scenarios` — spec now reads actual Oddish stats from API after wild-spawn and computes all damage values dynamically.
- All 10 assertions pass regardless of random stat-point distribution.
