---
scenario_id: combat-type-immunity-001
loop_id: combat-type-immunity
priority: P1
ptu_assertions: 3
---

## Setup (API)

POST /api/encounters { "name": "Test: Type Immunity" }
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
  "species": "Gastly",
  "level": 10,
  "baseHp": 3, "baseAttack": 4, "baseDefense": 3,
  "baseSpAttack": 10, "baseSpDefense": 4, "baseSpeed": 8,
  "types": ["Ghost", "Poison"]
}
$target_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $attacker_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Type Immunity" encounter
3. Gastly goes first (SPD 8 > 4); click "Next Turn" to reach Machop
4. Select move: **Karate Chop** (Fighting, DB 5, Physical, AC 2, Melee)
5. Select target: Gastly
6. System detects: Fighting vs Ghost = Immune (×0)
7. GM rolls accuracy (assume hit)
8. Damage = 0 regardless of calculation

## Assertions

1. **Immunity detection:**
   Fighting vs Ghost = Immune
   Gastly types = [Ghost, Poison]. Fighting vs Ghost = Immune.
   PTU rule: "If either Type is Immune, the attack does 0 damage"
   **Assert: "Immune" indicator displayed; attack deals 0 damage**

2. **No HP change on immune target:**
   Gastly HP = level(10) + (baseHp(3) × 3) + 10 = 10 + 9 + 10 = 29
   Would-be damage = SetDamage(13) + ATK(8) - DEF(3) = 18, but immunity → 0
   **Assert: Gastly HP remains "29/29" after attack**

3. **Move still consumed:**
   PTU rule: Move frequency is consumed even on immunity
   **Assert: Karate Chop frequency is consumed (move marked as used)**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
