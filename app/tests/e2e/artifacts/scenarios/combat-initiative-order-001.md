---
scenario_id: combat-initiative-order-001
loop_id: combat-initiative-order
priority: P0
ptu_assertions: 3
---

## Setup (API)

POST /api/encounters { "name": "Test: Initiative Order" }
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
2. Select the "Test: Initiative Order" encounter
3. Observe the turn order list after combat starts
4. Verify the active combatant indicator

## Assertions

1. **Turn order sorted by Speed (descending):**
   Pikachu Speed = 9 → Initiative = 9
   Charmander Speed = 7 → Initiative = 7
   Bulbasaur Speed = 5 → Initiative = 5
   **Assert: Turn order is Pikachu (9) → Charmander (7) → Bulbasaur (5)**

2. **First active combatant is fastest:**
   **Assert: Pikachu is the active combatant (highlighted) after start**

3. **Initiative values match Speed stats:**
   PTU rule: "a Pokémon's Initiative is simply their Speed Stat"
   **Assert: Each combatant's displayed initiative equals their Speed stat**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pikachu_id
DELETE /api/pokemon/$charmander_id
DELETE /api/pokemon/$bulbasaur_id
