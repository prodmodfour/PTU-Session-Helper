---
correction_id: correction-004
category: SCENARIO_BUG
scenario_id: combat-workflow-capture-variant-001
---

## What Was Wrong

Assertion 2 ("Rattata HP is 9/29") hardcodes Rattata's maxHP as 29, calculated from base stats only: `level(10) + baseHp(3)*3 + 10 = 29`. However, Rattata was created via `POST /api/encounters/$id/wild-spawn`, which calls `generateAndCreatePokemon` internally. That function distributes `level - 1` (9) random stat points via `distributeStatPoints()`. Each HP point allocated adds 3 to maxHp.

In the failing run, Rattata received +1 to HP base (effective baseHp=4), yielding `10 + 4*3 + 10 = 32`. After 20 damage: `32 - 20 = 12`, not the expected 9.

Same root cause as correction-002 (wild-encounter-001) and correction-003 (template-setup-001).

## Correct Values

Assertions 1, 3, 4, 5 are unaffected. Only assertion 2 (Rattata HP after damage) fails when random stat allocation adds points to HP.

## Fix Applied

Replaced `POST /api/encounters/$id/wild-spawn` with explicit `POST /api/pokemon` using deterministic base stats from `gen1/rattata.md` (HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7), then added Rattata to the encounter via `POST /api/encounters/$id/combatants`. This matches the approach already used for Squirtle in the same scenario.

With deterministic creation, Rattata's stats are fixed: maxHP = 29, and the downstream math (damage=20, final HP=9, injury threshold=14.5) holds exactly.

## Action Required

- [x] Scenario file updated: `artifacts/scenarios/combat-workflow-capture-variant-001.md`
- [ ] Spec file update: `tests/e2e/scenarios/combat/combat-workflow-capture-variant-001.spec.ts` — Playtester must regenerate from the updated scenario
- [ ] Re-run to confirm all assertions pass
