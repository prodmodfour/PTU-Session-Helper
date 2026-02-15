---
scenario_id: combat-combat-stages-001
loop_id: combat-combat-stages
priority: P1
ptu_assertions: 5
---

## Setup (API)

POST /api/encounters { "name": "Test: Combat Stages" }
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
2. Select the "Test: Combat Stages" encounter
3. Apply +2 ATK combat stage to Bulbasaur via stages panel:
   POST /api/encounters/$encounter_id/stages { "combatantId": $attacker_combatant_id, "stat": "attack", "delta": 2 }
4. On Bulbasaur's turn, select move: **Tackle** (Normal, DB 5, Physical)
5. Select target: Charmander
6. Observe modified ATK used in damage calculation
7. Click "Apply"

## Assertions

1. **Stage application and clamping:**
   Bulbasaur ATK starts at CS 0. Apply +2 → CS = 2.
   PTU rule: "they may never be raised higher than +6 or lower than -6"
   **Assert: Bulbasaur ATK combat stage displays +2**

2. **Modified stat calculation (positive stages):**
   PTU rule: "For every Combat Stage above 0, a Stat is raised by 20%"
   Multiplier at +2 = ×1.4
   Modified ATK = floor(ATK(5) × 1.4) = floor(7.0) = 7
   **Assert: Modified ATK shown as 7 (base 5 × 1.4)**

3. **Damage with stage-modified ATK:**
   Tackle DB 5 → Set damage = 13
   Damage = SetDamage(13) + ModifiedATK(7) - DEF(4) = 16
   Baseline (no stages) = 13 + 5 - 4 = 14
   **Assert: Damage is 16 (not 14 baseline)**

4. **Negative stage test:**
   Apply -2 DEF to Charmander:
   POST /api/encounters/$encounter_id/stages { "combatantId": $target_combatant_id, "stat": "defense", "delta": -2 }
   Multiplier at -2 = ×0.8
   Modified DEF = floor(DEF(4) × 0.8) = floor(3.2) = 3
   **Assert: Charmander DEF combat stage displays -2, modified DEF = 3**

5. **Stage multiplier table verification:**
   PTU multiplier table: -6=×0.4, -5=×0.5, -4=×0.6, -3=×0.7, -2=×0.8, -1=×0.9, 0=×1, +1=×1.2, +2=×1.4, +3=×1.6, +4=×1.8, +5=×2.0, +6=×2.2
   **Assert: Combat stage system uses the correct multiplier table**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
