---
scenario_id: combat-workflow-template-setup-001
run_id: 2026-02-15-002
status: PASS
spec_file: tests/e2e/scenarios/combat/combat-workflow-template-setup-001.spec.ts
duration_ms: 3700
retries_used: 0
---

## Assertion Results

| # | Description | Expected | Actual | Status |
|---|-------------|----------|--------|--------|
| 1 | Template created | name="Gym Battle: Fire Team" | name matches, id assigned | PASS |
| 2 | Encounter created from template | new encounter id | encounterId assigned | PASS |
| 3a | Template Charmander HP (dynamic, >= 34) | currentHp=maxHp, maxHp >= 34 | full HP, >= 34 | PASS |
| 3b | Template Rattata HP (dynamic, >= 29) | currentHp=maxHp, maxHp >= 29 | full HP, >= 29 | PASS |
| 4 | 2 template combatants present | combatants.length=2 | 2 combatants | PASS |
| 5 | Squirtle added as player — 3 total | 3 combatants, HP=35/35, side=players | 3 combatants, 35/35, players | PASS |
| 6 | Squirtle last in initiative (SPD 4 < 7) | last in turnOrder | last position | PASS |
| 7 | Encounter started | isActive=true | true | PASS |
| 8 | Encounter served | isServed=true | true | PASS |

## Errors
<!-- None -->

## Playwright Errors
<!-- None -->

## Screenshots
<!-- None — API-only test -->

## Self-Correction Log
<!-- None needed -->

## Notes
- Previous run (2026-02-15-001) failed at assertion 3a: scenario assumed deterministic HP for template-loaded Pokemon.
- Fixed by commit `2a4f84e: fix: apply 3 corrections to combat Tier 1 scenarios` — spec now uses `>=` minimum checks and verifies currentHp=maxHp (full HP) instead of exact values.
- All 8 assertions pass regardless of random stat-point distribution during template load.
