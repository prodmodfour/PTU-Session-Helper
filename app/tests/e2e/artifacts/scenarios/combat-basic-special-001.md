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
  "species": "Psyduck",
  "level": 11,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 5, "baseSpeed": 6,
  "types": ["Water"]
}
$attacker_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 11,
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
2. Select the "Test: Basic Special Attack" encounter
3. Charmander (SPD 7) goes first; click "Next Turn" to reach Psyduck (SPD 6)
4. Select move: **Confusion** (Psychic, DB 5, Special, AC 2, Range 6)
5. Select target: Charmander
6. System calculates accuracy threshold using **Special Evasion** (not Physical)
7. GM rolls accuracy (assume hit, roll >= 3)
8. System calculates and applies set damage using **SpATK vs SpDEF**
9. Click "Apply"

## Assertions

1. **Charmander starting HP:**
   HP = level(11) + (baseHp(4) × 3) + 10 = 11 + 12 + 10 = 33
   **Assert: Charmander HP displays "33/33" before attack**

2. **Special Evasion used (not Physical):**
   Special Evasion = floor(SpDEF(5) / 5) = floor(1.0) = 1
   Physical Evasion = floor(DEF(4) / 5) = floor(0.8) = 0
   Threshold = MoveAC(2) + SpecialEvasion(1) = 3 (NOT 2 — Physical Evasion is lower and irrelevant for Special moves)
   **Assert: Accuracy threshold is 3 (uses Special Evasion, not Physical)**

3. **Damage uses SpATK vs SpDEF:**
   Confusion DB = 5 → Set damage = 13
   No STAB (Psyduck is Water, Confusion is Psychic — types do not match)
   Damage = SetDamage(13) + SpATK(7) - SpDEF(5) = 15
   Type effectiveness: Psychic vs Fire = neutral (×1)
   Final damage = 15
   **Assert: Damage applied is 15 (uses SpATK 7, not ATK 5; no STAB)**

4. **Charmander HP after attack:**
   Remaining HP = 33 - 15 = 18
   **Assert: Charmander HP displays "18/33" after attack**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
