---
scenario_id: combat-damage-and-faint-001
loop_id: combat-damage-application
priority: P0
ptu_assertions: 5
---

## Setup (API)

POST /api/encounters { "name": "Test: Damage and Faint" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Machop",
  "level": 10,
  "baseHp": 7, "baseAttack": 8, "baseDefense": 5,
  "baseSpAttack": 4, "baseSpDefense": 4, "baseSpeed": 4,
  "types": ["Fighting"]
}
$attacker_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$target_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $attacker_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Damage and Faint" encounter
3. Charmander goes first (SPD 7 > 4); click "Next Turn" to reach Machop's turn
4. Apply 20 damage to Charmander via damage panel (direct damage application)
5. Observe HP reduction
6. On next Machop turn, apply 20 more damage to Charmander
7. Observe faint

## Assertions

1. **Charmander max HP:**
   HP = level(10) + (baseHp(4) × 3) + 10 = 10 + 12 + 10 = 32
   **Assert: Charmander HP displays "32/32" at start**

2. **After first 20 damage:**
   newHp = 32 - 20 = 12
   **Assert: Charmander HP displays "12/32"**

3. **After second 20 damage:**
   Raw: 12 - 20 = -8
   Floored: max(0, -8) = 0
   **Assert: Charmander HP displays "0/32"**

4. **Fainted status on HP reaching 0:**
   PTU rule: "A Pokémon at 0 Hit Points or less is Fainted"
   **Assert: Charmander has "Fainted" in statusConditions**

5. **Fainted combatant turn is skipped:**
   **Assert: On next round, Charmander's turn is skipped in initiative order**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
