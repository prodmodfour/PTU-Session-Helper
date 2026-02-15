---
scenario_id: combat-injury-massive-damage-001
loop_id: combat-injuries
priority: P2
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Massive Damage Injury" }
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
2. Select the "Test: Massive Damage Injury" encounter
3. Charmander goes first (SPD 7 > 4); click "Next Turn" to reach Machop
4. Select move: **Karate Chop** (Fighting, DB 5, Physical, AC 2, Melee, crit on 17+)
5. Select target: Charmander
6. GM rolls accuracy (assume hit, non-crit)
7. System calculates damage and checks for Massive Damage injury
8. Click "Apply"

## Assertions

1. **Charmander max HP and injury threshold:**
   HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Massive Damage threshold = maxHp(32) × 0.5 = 16
   **Assert: Charmander starts at 32/32 HP, 0 injuries**

2. **Damage calculation:**
   Karate Chop DB 5 → Set damage = 13
   Damage = SetDamage(13) + ATK(8) - DEF(4) = 17
   Fighting vs Fire = neutral (×1)
   Final damage = 17
   **Assert: Damage applied is 17**

3. **Massive Damage triggers injury:**
   PTU rule: "any single attack or damage source that does damage equal to 50% or more of their Max Hit Points" → 1 injury
   Damage(17) >= threshold(16)? YES (17 >= 16)
   **Assert: Charmander gains 1 injury (injury count goes from 0 to 1)**

4. **HP reduced but not fainted:**
   Remaining HP = 32 - 17 = 15 (> 0, not fainted)
   **Assert: Charmander HP displays "15/32", NOT fainted, injury count = 1**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
