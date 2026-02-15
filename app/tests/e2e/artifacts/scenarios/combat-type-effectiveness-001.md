---
scenario_id: combat-type-effectiveness-001
loop_id: combat-type-effectiveness
priority: P1
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Type Effectiveness" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Squirtle",
  "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 7,
  "baseSpAttack": 5, "baseSpDefense": 6, "baseSpeed": 4,
  "types": ["Water"]
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
2. Select the "Test: Type Effectiveness" encounter
3. Charmander goes first (SPD 7 > 4); click "Next Turn" to reach Squirtle
4. Select move: **Water Gun** (Water, DB 4, Special, AC 2, Range 4)
5. Select target: Charmander
6. System detects: Water vs Fire = Super Effective (×1.5)
7. GM rolls accuracy (assume hit)
8. System calculates damage with effectiveness multiplier applied after defense
9. Click "Apply"

## Assertions

1. **Type effectiveness detection:**
   Water vs Fire = Super Effective
   PTU rule: "A Super-Effective hit will deal x1.5 damage"
   **Assert: "Super Effective" indicator displayed for Water Gun vs Charmander**

2. **Damage before effectiveness:**
   Water Gun DB = 4 → Set damage = 11
   No STAB (Squirtle is Water, Water Gun is Water — actually this IS STAB!)
   STAB: DB 4 + 2 = 6 → Set damage = 15
   Damage before effectiveness = SetDamage(15) + SpATK(5) - SpDEF(5) = 15
   **Assert: Base damage (before effectiveness) is 15**

3. **Damage after effectiveness (applied after defense):**
   PTU rule: "After defenses and damage reduction have been applied, apply Type Weaknesses or Resistances"
   Final damage = floor(15 × 1.5) = floor(22.5) = 22
   **Assert: Final damage applied is 22**

4. **Charmander HP after super effective hit:**
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Remaining = 32 - 22 = 10
   **Assert: Charmander HP displays "10/32"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
