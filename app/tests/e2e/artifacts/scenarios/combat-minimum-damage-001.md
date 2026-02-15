---
scenario_id: combat-minimum-damage-001
loop_id: combat-basic-physical-attack
priority: P2
ptu_assertions: 3
---

## Setup (API)

POST /api/encounters { "name": "Test: Minimum Damage" }
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
  "species": "Geodude",
  "level": 10,
  "baseHp": 4, "baseAttack": 8, "baseDefense": 10,
  "baseSpAttack": 3, "baseSpDefense": 3, "baseSpeed": 2,
  "types": ["Rock", "Ground"]
}
$target_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $attacker_id, "side": "ally" }
POST /api/encounters/$encounter_id/combatants { "pokemonId": $target_id, "side": "enemy" }
POST /api/encounters/$encounter_id/start

Boost Geodude's DEF to ensure damage goes negative:
POST /api/encounters/$encounter_id/stages { "combatantId": $geodude_combatant_id, "stat": "defense", "delta": 6 }

## Actions (UI)

1. Navigate to `/gm`
2. Select the "Test: Minimum Damage" encounter
3. Bulbasaur goes first (SPD 5 > 2)
4. Select move: **Tackle** (Normal, DB 5, Physical, AC 2)
5. Select target: Geodude (DEF 10 at +6 CS)
6. GM rolls accuracy (assume hit)
7. System calculates damage — result should be minimum 1
8. Click "Apply"

## Assertions

1. **Modified DEF with +6 combat stages:**
   Multiplier at +6 = ×2.2
   Modified DEF = floor(DEF(10) × 2.2) = floor(22.0) = 22
   **Assert: Geodude modified DEF is 22**

2. **Raw damage is negative, minimum 1 applied, then resistance reduces, then final minimum 1:**
   Tackle DB 5 → Set damage = 13
   Raw damage = SetDamage(13) + ATK(5) - ModifiedDEF(22) = 13 + 5 - 22 = -4
   PTU rule: "An attack will always do a minimum of 1 damage, even if Defense Stats would reduce it to 0"
   After defense minimum: max(1, -4) = 1
   Type effectiveness: Normal vs Rock/Ground → Rock resists Normal (×0.5), Ground neutral (×1) → combined ×0.5
   After effectiveness: floor(1 × 0.5) = floor(0.5) = 0
   Final minimum (not immune — Normal is resisted, not immune): max(1, 0) = 1
   Final damage = 1
   **Assert: Damage applied is 1 (not 0 or negative)**

3. **Geodude HP reduced by exactly 1:**
   Geodude HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Remaining = 32 - 1 = 31
   **Assert: Geodude HP displays "31/32"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
