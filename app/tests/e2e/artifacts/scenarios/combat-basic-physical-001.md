---
scenario_id: combat-basic-physical-001
loop_id: combat-basic-physical-attack
priority: P0
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Basic Physical Attack" }
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
2. Select the "Test: Basic Physical Attack" encounter
3. On Bulbasaur's turn (or Charmander's, depending on initiative — Charmander SPD 7 > Bulbasaur SPD 5, so Charmander goes first; click "Next Turn" to reach Bulbasaur's turn)
4. Select move: **Tackle** (Normal, DB 5, Physical, AC 2, Melee)
5. Select target: Charmander
6. System calculates accuracy threshold: AC 2 + Physical Evasion 0 = 2
7. GM rolls accuracy (assume hit, roll >= 2)
8. System calculates and applies set damage
9. Click "Apply"

## Assertions

1. **Charmander starting HP:**
   HP = level(10) + (baseHp(4) × 3) + 10 = 10 + 12 + 10 = 32
   **Assert: Charmander HP displays "32/32" before attack**

2. **Accuracy threshold:**
   Physical Evasion = floor(DEF(4) / 5) = floor(0.8) = 0
   Threshold = MoveAC(2) + PhysicalEvasion(0) = 2
   **Assert: Accuracy threshold shown as 2**

3. **Damage calculation (set damage mode):**
   Tackle DB = 5 → Set damage = 13
   No STAB (Bulbasaur is Grass/Poison, Tackle is Normal — no type match)
   Damage = SetDamage(13) + ATK(5) - DEF(4) = 14
   Type effectiveness: Normal vs Fire = neutral (×1)
   Final damage = 14
   **Assert: Damage applied is 14**

4. **Charmander HP after attack:**
   Remaining HP = 32 - 14 = 18
   **Assert: Charmander HP displays "18/32" after attack**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
