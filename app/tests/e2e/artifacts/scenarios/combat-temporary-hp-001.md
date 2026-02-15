---
scenario_id: combat-temporary-hp-001
loop_id: combat-temporary-hp
priority: P2
ptu_assertions: 3
---

## Setup (API)

POST /api/encounters { "name": "Test: Temporary HP" }
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

Grant 10 Temporary HP to Charmander:
POST /api/encounters/$encounter_id/heal { "combatantId": $charmander_combatant_id, "tempHp": 10 }

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Temporary HP" encounter
3. Verify Charmander has 10 Temp HP and 32/32 real HP
4. Apply 15 damage to Charmander via damage panel
5. Observe Temp HP absorbed first, remainder goes to real HP
6. Apply 8 more damage (no Temp HP remaining)
7. Observe all damage goes to real HP

## Assertions

1. **Before damage — Temp HP stacked on real HP:**
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Temp HP = 10
   **Assert: Charmander displays HP "32/32" with Temp HP indicator showing 10**

2. **After 15 damage — Temp HP absorbs first:**
   PTU rule: "Temporary Hit Points are always lost first from damage"
   tempHpAbsorbed = min(tempHp(10), damage(15)) = 10
   remainingDamage = 15 - 10 = 5
   newHp = 32 - 5 = 27
   newTempHp = 10 - 10 = 0
   **Assert: Charmander HP displays "27/32", Temp HP = 0**

3. **After 8 more damage — no Temp HP, all to real HP:**
   tempHpAbsorbed = min(0, 8) = 0
   remainingDamage = 8
   newHp = 27 - 8 = 19
   **Assert: Charmander HP displays "19/32"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$pokemon_id
DELETE /api/pokemon/$opponent_id
