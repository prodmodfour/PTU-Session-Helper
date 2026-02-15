---
scenario_id: combat-turn-progression-001
loop_id: combat-turn-progression
priority: P0
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Turn Progression" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Pikachu",
  "level": 10,
  "baseHp": 4, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 5, "baseSpDefense": 5, "baseSpeed": 9,
  "types": ["Electric"]
}
$pikachu_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$charmander_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 10,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$bulbasaur_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $pikachu_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $charmander_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $bulbasaur_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Turn Progression" encounter
3. Observe: Pikachu is active (round 1)
4. Click "Next Turn" → Charmander becomes active
5. Click "Next Turn" → Bulbasaur becomes active
6. Click "Next Turn" → Pikachu becomes active again (round 2)

## Assertions

1. **After start — round 1, first combatant:**
   Initiative order: Pikachu(9) → Charmander(7) → Bulbasaur(5)
   **Assert: Active combatant is Pikachu, round counter shows 1**

2. **After 1st Next Turn — round 1, second combatant:**
   **Assert: Active combatant is Charmander, round counter shows 1**

3. **After 2nd Next Turn — round 1, third combatant:**
   **Assert: Active combatant is Bulbasaur, round counter shows 1**

4. **After 3rd Next Turn — round 2, wraps to first combatant:**
   All combatants have acted → new round begins
   **Assert: Active combatant is Pikachu, round counter shows 2**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pikachu_id
DELETE /api/pokemon/$charmander_id
DELETE /api/pokemon/$bulbasaur_id
