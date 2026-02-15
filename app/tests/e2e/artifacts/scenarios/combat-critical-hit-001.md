---
scenario_id: combat-critical-hit-001
loop_id: combat-critical-hit
priority: P1
ptu_assertions: 4
---

## Setup (API)

POST /api/encounters { "name": "Test: Critical Hit" }
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
2. Select the "Test: Critical Hit" encounter
3. Charmander goes first (SPD 7 > 5); click "Next Turn" to reach Bulbasaur
4. Select move: **Tackle** (Normal, DB 5, Physical, AC 2, Melee)
5. Select target: Charmander
6. Mark as critical hit (accuracy roll was natural 20)
7. System doubles the set damage dice (not the stat)
8. Click "Apply"

## Assertions

1. **Normal (non-crit) damage baseline:**
   Tackle DB 5 → Set damage = 13
   Normal damage = SetDamage(13) + ATK(5) - DEF(4) = 14
   **Assert: Without crit, damage would be 14**

2. **Critical hit doubles set damage, not stat:**
   PTU rule: "A Critical Hit adds the Damage Dice Roll a second time to the total damage dealt, but does not add Stats a second time"
   Crit set damage = 13 × 2 = 26
   Crit damage = CritSetDamage(26) + ATK(5) - DEF(4) = 27
   NOT: (13 + 5 - 4) × 2 = 28 (wrong — would double the stat too)
   **Assert: Critical hit damage is 27 (set damage doubled, stat added once)**

3. **Type effectiveness applies normally on crits:**
   Normal vs Fire = neutral (×1)
   Final = 27 × 1 = 27
   **Assert: Final damage is 27**

4. **Charmander HP after critical hit:**
   Charmander HP = level(10) + (baseHp(4) × 3) + 10 = 32
   Remaining = 32 - 27 = 5
   **Assert: Charmander HP displays "5/32"**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$attacker_id
DELETE /api/pokemon/$target_id
