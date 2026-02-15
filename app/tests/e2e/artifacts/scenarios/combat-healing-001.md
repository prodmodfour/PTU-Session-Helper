---
scenario_id: combat-healing-001
loop_id: combat-healing
priority: P1
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Healing" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$pokemon_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 10,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$opponent_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $pokemon_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $opponent_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Healing" encounter
3. Apply 20 damage to Charmander via damage panel:
   POST /api/encounters/$encounter_id/damage { "combatantId": $charmander_combatant_id, "amount": 20 }
4. Observe HP drop
5. Heal Charmander 15 HP via heal panel:
   POST /api/encounters/$encounter_id/heal { "combatantId": $charmander_combatant_id, "amount": 15 }
6. Observe HP increase
7. Heal Charmander 10 more HP (attempt to exceed max):
   POST /api/encounters/$encounter_id/heal { "combatantId": $charmander_combatant_id, "amount": 10 }
8. Observe HP capped at max

## Assertions

1. **Starting HP:**
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   **Assert: Charmander HP displays "32/32"**

2. **After 20 damage:**
   newHp = 32 - 20 = 12
   **Assert: Charmander HP displays "12/32"**

3. **After 15 heal:**
   newHp = min(maxHp(32), 12 + 15) = min(32, 27) = 27
   **Assert: Charmander HP displays "27/32"**

4. **After 10 more heal — capped at max HP:**
   newHp = min(maxHp(32), 27 + 10) = min(32, 37) = 32
   PTU rule: HP cannot exceed maximum
   **Assert: Charmander HP displays "32/32" (not "37/32")**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pokemon_id
DELETE /api/pokemon/$opponent_id
