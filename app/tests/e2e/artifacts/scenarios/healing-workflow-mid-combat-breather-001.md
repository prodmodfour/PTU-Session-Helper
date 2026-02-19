---
scenario_id: healing-workflow-mid-combat-breather-001
loop_id: healing-workflow-mid-combat-breather
tier: workflow
priority: P0
ptu_assertions: 7
mechanics_tested:
  - breather-stage-reset
  - breather-volatile-cure
  - breather-temp-hp-removal
  - breather-tripped-vulnerable
  - breather-action-cost
---

## Narrative

Mid-combat, a Machop is suffering badly — Confused (volatile), Stuck (other condition cured by breather), and Burned (persistent). Its attack stage was buffed to +3 but defense dropped to -2 and speed to -4. The GM decides to Take a Breather, sacrificing Machop's turn to reset stages, cure volatile/stuck conditions, and clear debuffs. Burned persists (persistent condition). Machop ends up Tripped and Vulnerable but free of confusion and stage penalties.

## Species Data

**Machop** (gen1/machop.md)
- Type: Fighting
- Base Stats: HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4

**Non-deterministic API check:** Pokemon created via explicit `POST` with base stats — deterministic. HP = level + (baseHp × 3) + 10.

## Setup (API)

POST /api/pokemon {
  "species": "Machop",
  "level": 15,
  "baseHp": 7,
  "baseAttack": 8,
  "baseDefense": 5,
  "baseSpAtk": 4,
  "baseSpDef": 4,
  "baseSpeed": 4,
  "types": ["Fighting"]
}
$machop_id = response.data.id
<!-- maxHp = 15 + (7 × 3) + 10 = 46 -->

<!-- Need a second combatant for a valid encounter -->
POST /api/pokemon {
  "species": "Geodude",
  "level": 12,
  "baseHp": 4,
  "baseAttack": 8,
  "baseDefense": 10,
  "baseSpAtk": 3,
  "baseSpDef": 3,
  "baseSpeed": 2,
  "types": ["Rock", "Ground"]
}
$geodude_id = response.data.id

POST /api/encounters { "name": "Breather Test Combat" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants {
  "pokemonId": $machop_id,
  "side": "ally"
}
$machop_combatant_id = find Machop combatant ID from encounter response

POST /api/encounters/$encounter_id/combatants {
  "pokemonId": $geodude_id,
  "side": "enemies"
}

POST /api/encounters/$encounter_id/start

<!-- Set up combat state: stages, conditions -->
POST /api/encounters/$encounter_id/stages {
  "combatantId": $machop_combatant_id,
  "attack": 3,
  "defense": -2,
  "speed": -4
}

POST /api/encounters/$encounter_id/status {
  "combatantId": $machop_combatant_id,
  "status": "Confused",
  "action": "add"
}

POST /api/encounters/$encounter_id/status {
  "combatantId": $machop_combatant_id,
  "status": "Stuck",
  "action": "add"
}

POST /api/encounters/$encounter_id/status {
  "combatantId": $machop_combatant_id,
  "status": "Burned",
  "action": "add"
}

## Phase 1: Pre-Breather State Verification

GET /api/encounters/$encounter_id

Verify Machop combatant has:
- stages: attack +3, defense -2, speed -4 (others 0)
- statusConditions includes: Confused, Stuck, Burned
- Confirm combat is active

## Phase 2: Take a Breather

POST /api/encounters/$encounter_id/breather {
  "combatantId": $machop_combatant_id
}

### Assertions (Phase 2)

1. **All combat stages reset to 0:**
   Before: attack +3, defense -2, speed -4
   After: all 7 stages (attack, defense, specialAttack, specialDefense, speed, accuracy, evasion) = 0
   Note: positive stages (attack +3) are also lost — tactical cost of breather
   **Assert: breatherResult.stagesReset = true** (App-enforced: createDefaultStageModifiers)

2. **Volatile condition cured (Confused):**
   Confused is in VOLATILE_CONDITIONS list → cured by breather
   **Assert: breatherResult.conditionsCured includes "Confused"** (App-enforced: volatile cure)

3. **Stuck condition cured (special breather rule):**
   Stuck is in OTHER_CONDITIONS but explicitly cured by breather alongside volatiles
   **Assert: breatherResult.conditionsCured includes "Stuck"** (App-enforced: Slowed + Stuck cured)

4. **Persistent condition survives (Burned):**
   Burned is in PERSISTENT_CONDITIONS → NOT cured by breather
   **Assert: breatherResult.conditionsCured does NOT include "Burned"** (App-enforced: persistent survives)

5. **Tripped + Vulnerable applied as temp conditions:**
   **Assert: breatherResult.trippedApplied = true** (App-enforced: tempConditions updated)
   **Assert: breatherResult.vulnerableApplied = true** (App-enforced: tempConditions updated)

6. **Turn consumed (Full Action cost):**
   Find Machop combatant in response encounter data:
   **Assert: combatant turnState has standardActionUsed = true** (App-enforced: breather costs full action)
   **Assert: combatant turnState has hasActed = true** (App-enforced: turn consumed)

## Phase 3: Post-Breather Verification

GET /api/encounters/$encounter_id

Find Machop combatant in response:

### Assertions (Phase 3)

7. **Machop post-breather state:**
   - All stage modifiers = 0 (including the previously positive attack +3)
   - statusConditions contains "Burned" but NOT "Confused" or "Stuck"
   - tempConditions contains "Tripped" and "Vulnerable"
   **Assert: Machop combatant stages all zero, Burned remains, Confused/Stuck gone** (App-enforced: breather + DB sync)

## Phase 4: Verify Entity DB Sync

GET /api/pokemon/$machop_id

- Verify underlying Pokemon record was synced: stages at defaults, Burned in statusConditions, Confused/Stuck removed

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$machop_id
DELETE /api/pokemon/$geodude_id
