---
correction_id: correction-002
category: SCENARIO_BUG
scenario_id: combat-workflow-wild-encounter-001
---

## What Was Wrong

Assertion 2 ("Oddish HP = 35/35") assumes wild-spawned Pokemon have deterministic stats based on species base stats only (HP = level + baseHp×3 + 10 = 10 + 5×3 + 10 = 35). However, the `generateAndCreatePokemon` function distributes `level - 1` random stat points using weighted random selection via `distributeStatPoints()` in `pokemon-generator.service.ts`. For Oddish L10, 9 points are distributed — each with a ~14.7% chance of landing on HP (base HP 5 out of total 34 base stat points). Each HP point adds 3 to maxHp.

Observed HP values across runs: 35 (0 HP points), 38 (1 point), 41 (2 points), 44 (3 points), 47 (4 points).

All downstream assertions (3-9) that depend on Oddish's stats are also non-deterministic:
- Assertion 3 (initiative): Oddish Speed could increase, but base 3 is unlikely to exceed Growlithe's 6 — **likely still passes**
- Assertions 4-5 (Ember damage to Oddish): SpDEF varies, changing raw damage and HP result
- Assertions 6-7 (Acid damage to Growlithe): SpATK varies, changing raw damage
- Assertions 8-9 (faint): depend on Oddish HP after two Ember hits
- Assertion 10 (lifecycle): stat-independent — **always passes**

## Correct Values

The scenario must account for non-deterministic wild-spawned stats. Two approaches:

### Option A: Read actual stats after spawn (recommended)

After the wild-spawn API call, read the created Pokemon's actual stats and use those for all downstream calculations:

```markdown
## Setup (API)
...
POST /api/encounters/$encounter_id/wild-spawn {
  "pokemon": [{ "species": "Oddish", "level": 10 }]
}
$oddish_combatant = response.data[0]
$oddish_id = $oddish_combatant.entityId

GET /api/pokemon/$oddish_id
$oddish = response.data
$oddish_hp = $oddish.currentHp
$oddish_spatk = $oddish.currentStats.specialAttack
$oddish_spdef = $oddish.currentStats.specialDefense
$oddish_speed = $oddish.currentStats.speed
```

Then derive all expected values from actual stats. The spec file would do the same: read stats first, calculate expected values dynamically.

### Option B: Use manually-created Pokemon instead of wild-spawn

Replace the wild-spawn with a manual `POST /api/pokemon` (like Growlithe), which accepts explicit base stats and produces deterministic HP. This sacrifices testing the wild-spawn endpoint but gives deterministic assertions.

### Option C: Assert stat ranges instead of exact values

Assert that Oddish HP is within the valid range [35, 62] (0-9 HP points × 3 each). Less precise but always passes. Not recommended — weakens the scenario's value.

## Action Required

Update scenario file `artifacts/scenarios/combat-workflow-wild-encounter-001.md`:
- Apply Option A (dynamic stat reading) for the wild-spawn Pokemon
- Recalculate all downstream assertions using the actual stats
- Update the spec file `tests/e2e/scenarios/combat/combat-workflow-wild-encounter-001.spec.ts` to match
- Re-run to confirm all 10 assertions pass
