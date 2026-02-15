---
scenario_id: combat-struggle-attack-001
loop_id: combat-struggle-attack
priority: P2
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Struggle Attack" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 10,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
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
2. Select the "Test: Struggle Attack" encounter
3. Charmander goes first (SPD 7 > 5); click "Next Turn" to reach Bulbasaur
4. Select **Struggle Attack** from combat maneuvers / action menu
5. Select target: Charmander
6. System uses Struggle stats: Normal, DB 4, AC 4, Physical, Melee
7. GM rolls accuracy (d20 >= 4 + Charmander Physical Evasion)
8. System calculates damage — no STAB even if type matches
9. Click "Apply"

## Assertions

1. **Struggle fixed stats:**
   PTU rule: "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type"
   **Assert: Struggle uses AC 4, DB 4, Physical, Normal type**

2. **No STAB on Struggle:**
   Bulbasaur types = [Grass, Poison]. Struggle type = Normal. No match anyway.
   But even if a Normal-type Pokemon used Struggle:
   PTU rule: "Never apply STAB to Struggle Attacks"
   Effective DB = 4 (NOT 6 even with STAB match)
   **Assert: STAB is not applied to Struggle; DB remains 4**

3. **Damage calculation:**
   Struggle DB 4 → Set damage = 11
   Damage = SetDamage(11) + ATK(5) - DEF(4) = 12
   Normal vs Fire = neutral (×1)
   Final damage = 12
   **Assert: Damage applied is 12**

4. **Charmander HP after Struggle:**
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Remaining = 32 - 12 = 20
   **Assert: Charmander HP displays "20/32"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
