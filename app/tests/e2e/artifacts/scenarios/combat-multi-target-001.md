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
  "level": 10,
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

1. **Single set damage roll shared across targets:**
   Earthquake DB 10 → Set damage = 24
   **Assert: Same base damage value (24) used for both target calculations**

2. **Charmander damage — Ground vs Fire = Super Effective (×1.5):**
   Damage before effectiveness = max(1, SetDamage(24) + ATK(8) - DEF(4)) = 28
   Ground vs Fire = SE (×1.5)
   Final damage = floor(28 × 1.5) = floor(42.0) = 42
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   42 > 32 → HP = 0, Fainted
   **Assert: Charmander takes 42 damage, HP → 0, Fainted**

3. **Machop damage — Ground vs Fighting = neutral (×1):**
   Damage before effectiveness = max(1, SetDamage(24) + ATK(8) - DEF(5)) = 27
   Ground vs Fighting = neutral (×1)
   Final damage = 27
   Machop HP = level(10) + (baseHp(7) × 3) + 10 = 41
   Remaining = 41 - 27 = 14
   **Assert: Machop takes 27 damage, HP displays "14/41"**

4. **Different final damage per target:**
   Charmander: 42 (SE, lower DEF)
   Machop: 27 (neutral, higher DEF)
   **Assert: Per-target damage differs despite same base damage roll**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_a_id
DELETE /api/pokemon/$target_b_id
