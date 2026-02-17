---
correction_id: correction-005
category: SCENARIO_BUG
scenario_id: combat-workflow-capture-variant-001
supersedes: correction-004
---

## What Was Wrong

Correction-004 fixed non-deterministic stats by replacing `POST /api/encounters/$id/wild-spawn` with explicit `POST /api/pokemon` + `POST /api/encounters/$id/combatants`. This eliminates the flakiness but **removes the wild-spawn flow from the test entirely**.

The scenario is "Wild Encounter Capture Variant" — its purpose is to test the pipeline: wild-spawn → weaken → capture. With explicit creation, the setup is identical to every other combat spec. The wild-spawn endpoint, `generateAndCreatePokemon`, and the random stat distribution are no longer exercised. The "wild encounter" in the scenario name becomes misleading.

## Recommended Fix

Keep wild-spawn and make assertions dynamic instead of hardcoded:

1. **Wild-spawn Rattata** via `POST /api/encounters/$id/wild-spawn` (preserve the real flow)
2. **Query actual stats** via `GET /api/pokemon/$rattata_id` after spawn
3. **Compute expected values** from actual stats:
   - `maxHp` = as returned by the API
   - `damage` = `max(1, setDamage + attackerSpAtk - defenderSpDef)` (known from Squirtle's fixed stats)
   - `finalHp` = `maxHp - damage`
   - `injuryThreshold` = `maxHp / 2`
   - `injuryGained` = `damage >= injuryThreshold`
4. **Assert against computed values** — validates damage formula, injury logic, and capture flow without depending on a specific stat roll

This approach:
- Tests the actual wild-spawn → combat → capture pipeline end-to-end
- Eliminates flakiness (no hardcoded HP expectations)
- Still validates that damage formula, injury threshold, and capture mechanics are internally consistent
- Only Squirtle's stats need to be deterministic (already the case via explicit creation)

## Tradeoff

Dynamic assertions test "the system is internally consistent" rather than "this specific number matches." The Squirtle → Rattata damage will vary per run depending on Rattata's random SpDEF, but the test still validates that `newHp == maxHp - computedDamage` and that injury fires when `damage >= maxHp/2`. The capture rate assertion (`> 0`) is already dynamic and unaffected.

## Action Required

- [ ] Scenario Crafter: rewrite scenario with dynamic assertions (query-then-compute pattern)
- [ ] Scenario Verifier: re-verify PTU math holds for the dynamic formulas
- [ ] Playtester: regenerate spec from updated scenario
- [ ] Revert scenario file to use wild-spawn setup
