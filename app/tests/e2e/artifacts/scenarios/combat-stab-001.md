---
scenario_id: combat-stab-001
loop_id: combat-stab
priority: P1
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: STAB Bonus" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$attacker_id = response.data.id

POST /api/pokemon {
  "species": "Machop",
  "level": 10,
  "baseHp": 7, "baseAttack": 8, "baseDefense": 5,
  "baseSpAttack": 4, "baseSpDefense": 4, "baseSpeed": 4,
  "types": ["Fighting"]
}
$target_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $attacker_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: STAB Bonus" encounter
3. Charmander goes first (SPD 7 > 4)
4. Select move: **Ember** (Fire, DB 4, Special, AC 2, Range 4)
5. Select target: Machop
6. System detects STAB: Charmander type (Fire) matches Ember type (Fire)
7. System applies STAB: DB 4 + 2 = 6
8. GM rolls accuracy (assume hit)
9. System calculates damage with STAB-boosted DB
10. Click "Apply"

## Assertions

1. **STAB detection:**
   Charmander types = [Fire]. Ember type = Fire. Match found.
   PTU rule: "If a Pokémon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2"
   **Assert: STAB indicator shown for Ember when used by Charmander**

2. **Effective Damage Base with STAB:**
   Base DB = 4. STAB bonus = +2. Effective DB = 6.
   **Assert: Effective DB displayed as 6 (not 4)**

3. **Set damage at boosted DB:**
   DB 4 → Set damage = 11 (without STAB)
   DB 6 → Set damage = 15 (with STAB)
   Damage = SetDamage(15) + SpATK(6) - SpDEF(4) = 17
   Fire vs Fighting = neutral (×1)
   **Assert: Damage applied is 17 (not 13 which would be without STAB)**

4. **Machop HP after STAB attack:**
   Machop HP = level(10) + (baseHp(7) × 3) + 10 = 41
   Remaining = 41 - 17 = 24
   **Assert: Machop HP displays "24/41"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
