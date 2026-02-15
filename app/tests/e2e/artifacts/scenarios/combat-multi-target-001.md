---
scenario_id: combat-multi-target-001
loop_id: combat-multi-target
priority: P2
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Multi-Target" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Geodude",
  "level": 34,
  "baseHp": 4, "baseAttack": 8, "baseDefense": 10,
  "baseSpAttack": 3, "baseSpDefense": 3, "baseSpeed": 2,
  "types": ["Rock", "Ground"]
}
$attacker_id = response.data.id

POST /api/pokemon {
  "species": "Charmander",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$target_a_id = response.data.id

POST /api/pokemon {
  "species": "Machop",
  "level": 10,
  "baseHp": 7, "baseAttack": 8, "baseDefense": 5,
  "baseSpAttack": 4, "baseSpDefense": 4, "baseSpeed": 4,
  "types": ["Fighting"]
}
$target_b_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $attacker_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_a_id, "side": "enemy" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_b_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Multi-Target" encounter
3. Charmander (SPD 7) goes first, then Machop (SPD 4), then Geodude (SPD 2)
4. Advance to Geodude's turn
5. Select move: **Earthquake** (Ground, DB 10, Physical, AC 2, Burst 3)
6. Select targets: Charmander and Machop (both in Burst 3 range)
7. Roll accuracy separately for each target (assume both hit)
8. Single damage roll applies to both targets
9. Each target's DEF and type effectiveness applied individually
10. Click "Apply"

## Assertions

1. **Single set damage roll shared across targets (with STAB):**
   Geodude is Rock/Ground, Earthquake is Ground → STAB applies
   STAB: DB 10 + 2 = 12 → Set damage = 30
   **Assert: Same base damage value (30) used for both target calculations**

2. **Charmander damage — Ground vs Fire = Super Effective (×1.5):**
   Damage before effectiveness = max(1, SetDamage(30) + ATK(8) - DEF(4)) = 34
   Ground vs Fire = SE (×1.5)
   Final damage = floor(34 × 1.5) = floor(51.0) = 51
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   51 > 32 → HP = 0, Fainted
   **Assert: Charmander takes 51 damage, HP → 0, Fainted**

3. **Machop damage — Ground vs Fighting = neutral (×1):**
   Damage before effectiveness = max(1, SetDamage(30) + ATK(8) - DEF(5)) = 33
   Ground vs Fighting = neutral (×1)
   Final damage = 33
   Machop HP = level(10) + (baseHp(7) × 3) + 10 = 41
   Remaining = 41 - 33 = 8
   **Assert: Machop takes 33 damage, HP displays "8/41"**

4. **Different final damage per target:**
   Charmander: 51 (SE ×1.5, lower DEF 4)
   Machop: 33 (neutral ×1, higher DEF 5)
   **Assert: Per-target damage differs despite same base damage roll**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_a_id
DELETE /api/pokemon/$target_b_id
