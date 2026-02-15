---
scenario_id: combat-status-conditions-001
loop_id: combat-status-conditions
priority: P1
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Status Conditions" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$charmander_id = response.data.id

POST /api/pokemon {
  "species": "Pikachu",
  "level": 10,
  "baseHp": 4, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 5, "baseSpDefense": 5, "baseSpeed": 9,
  "types": ["Electric"]
}
$pikachu_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $charmander_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $pikachu_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Status Conditions" encounter
3. Apply **Paralyzed** to Charmander via status panel:
   POST /api/encounters/$encounter_id/status { "combatantId": $charmander_combatant_id, "status": "Paralyzed", "action": "add" }
4. Attempt to apply **Burned** to Charmander (Fire type — should be blocked):
   POST /api/encounters/$encounter_id/status { "combatantId": $charmander_combatant_id, "status": "Burned", "action": "add" }
5. Attempt to apply **Paralyzed** to Pikachu (Electric type — should be blocked):
   POST /api/encounters/$encounter_id/status { "combatantId": $pikachu_combatant_id, "status": "Paralyzed", "action": "add" }
6. Attempt to apply **Paralyzed** to Charmander again (duplicate — should not stack):

## Assertions

1. **Status applied to non-immune type:**
   Charmander is Fire type. Paralysis immunity belongs to Electric types.
   **Assert: Charmander's statusConditions includes "Paralyzed"**

2. **Type immunity blocks Burn on Fire type:**
   PTU rule: Fire Types → immune to Burn
   `isImmuneToStatus(["Fire"], "Burned")` = true
   **Assert: Burn NOT added to Charmander; response indicates type immunity**

3. **Type immunity blocks Paralysis on Electric type:**
   PTU rule: Electric Types → immune to Paralysis
   `isImmuneToStatus(["Electric"], "Paralyzed")` = true
   **Assert: Paralysis NOT added to Pikachu; response indicates type immunity**

4. **No duplicate statuses:**
   PTU rule: "Unlike the video games, there is no limit to the number of Status Afflictions" but same status should not stack
   **Assert: Charmander has exactly one "Paralyzed" entry (not two)**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$charmander_id
DELETE /api/pokemon/$pikachu_id
