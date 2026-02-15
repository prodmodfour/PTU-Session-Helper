---
scenario_id: combat-basic-special-001
loop_id: combat-basic-special-attack
priority: P0
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Basic Special Attack" }
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
2. Select the "Test: Basic Special Attack" encounter
3. Charmander (SPD 7) goes first; on Charmander's turn:
4. Select move: **Ember** (Fire, DB 4, Special, AC 2, Range 4)
5. Select target: Machop
6. System calculates accuracy threshold using **Special Evasion** (not Physical)
7. GM rolls accuracy (assume hit, roll >= 2)
8. System calculates and applies set damage using **SpATK vs SpDEF**
9. Click "Apply"

## Assertions

1. **Machop starting HP:**
   HP = level(10) + (baseHp(7) × 3) + 10 = 10 + 21 + 10 = 41
   **Assert: Machop HP displays "41/41" before attack**

2. **Special Evasion used (not Physical):**
   Special Evasion = floor(SpDEF(4) / 5) = floor(0.8) = 0
   Physical Evasion = floor(DEF(5) / 5) = floor(1.0) = 1
   Threshold = MoveAC(2) + SpecialEvasion(0) = 2 (NOT 3 — Physical Evasion is irrelevant for Special moves)
   **Assert: Accuracy threshold is 2 (uses Special Evasion, not Physical)**

3. **Damage uses SpATK vs SpDEF:**
   Ember DB = 4 → Set damage = 11
   No STAB yet (tested separately in combat-stab-001)
   Damage = SetDamage(11) + SpATK(6) - SpDEF(4) = 13
   Type effectiveness: Fire vs Fighting = neutral (×1)
   Final damage = 13
   **Assert: Damage applied is 13 (uses SpATK 6, not ATK 5)**

4. **Machop HP after attack:**
   Remaining HP = 41 - 13 = 28
   **Assert: Machop HP displays "28/41" after attack**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
