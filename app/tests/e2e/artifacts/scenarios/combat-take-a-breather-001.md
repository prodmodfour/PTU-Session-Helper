---
scenario_id: combat-take-a-breather-001
loop_id: combat-maneuver-take-a-breather
priority: P1
ptu_assertions: 5
---

## Setup (API)

POST /api/encounters { "name": "Test: Take a Breather" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 10,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$pokemon_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$opponent_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $pokemon_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $opponent_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

Pre-condition setup (apply stages and status before breather):

POST /api/encounters/$encounter_id/stages { "combatantId": $bulbasaur_combatant_id, "stat": "attack", "delta": 3 }
POST /api/encounters/$encounter_id/stages { "combatantId": $bulbasaur_combatant_id, "stat": "defense", "delta": 2 }
POST /api/encounters/$encounter_id/status { "combatantId": $bulbasaur_combatant_id, "status": "Confused", "action": "add" }

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Take a Breather" encounter
3. Verify Bulbasaur has: ATK +3 CS, DEF +2 CS, Confused status
4. On Bulbasaur's turn, select **Take a Breather** from combat maneuvers
5. System processes breather as Full Action (consumes Standard + Shift)
6. Observe stage resets and status changes

## Assertions

1. **Pre-breather state:**
   **Assert: Bulbasaur has ATK CS = +3, DEF CS = +2, status includes "Confused"**

2. **All combat stages reset to 0:**
   PTU rule: "they set their Combat Stages back to their default level"
   **Assert: Bulbasaur ATK CS = 0, DEF CS = 0 (all stages at 0)**

3. **Volatile status cured:**
   Confused is a Volatile status affliction.
   PTU rule: "cured of all Volatile Status effects"
   **Assert: "Confused" removed from Bulbasaur's statusConditions**

4. **Tripped and Vulnerable applied:**
   PTU rule: "They then become Tripped and are Vulnerable until the end of their next turn"
   **Assert: Bulbasaur's statusConditions now include "Tripped" and "Vulnerable"**

5. **Full Action consumed:**
   Take a Breather is a Full Action = Standard + Shift consumed.
   PTU rule: "Taking a Breather is a Full Action"
   **Assert: Both Standard Action and Shift Action are consumed for this turn**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pokemon_id
DELETE /api/pokemon/$opponent_id
