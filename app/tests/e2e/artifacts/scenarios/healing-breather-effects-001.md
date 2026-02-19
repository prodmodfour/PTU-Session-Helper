---
scenario_id: healing-breather-effects-001
loop_id: healing-mechanic-breather-effects
tier: mechanic
priority: P1
ptu_assertions: 5
---

## Narrative

Validates the complete set of Take a Breather combat effects in isolation. Sets up a combatant with modified stages, volatile conditions, persistent conditions, and other conditions. Verifies that breather resets stages, cures volatiles + Slowed + Stuck, preserves persistent conditions and Fainted/Trapped/Tripped/Vulnerable, and applies Tripped + Vulnerable as temp conditions.

## Species Data

**Geodude** (gen1/geodude.md)
- Type: Rock/Ground
- Base Stats: HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2

**Non-deterministic API check:** Pokemon created via explicit `POST` with base stats — deterministic.

## Setup (API)

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
<!-- maxHp = 12 + (4 × 3) + 10 = 34 -->

<!-- Second combatant for valid encounter -->
POST /api/pokemon {
  "species": "Bulbasaur",
  "level": 15,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 5,
  "baseSpAtk": 7,
  "baseSpDef": 7,
  "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$bulbasaur_id = response.data.id

POST /api/encounters { "name": "Breather Effects Test" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $geodude_id, "side": "ally" }
$geodude_combatant_id = find Geodude combatant ID

POST /api/encounters/$encounter_id/combatants { "pokemonId": $bulbasaur_id, "side": "enemies" }

POST /api/encounters/$encounter_id/start

<!-- Set up comprehensive combat state on Geodude -->

<!-- Stages: mix of positive and negative -->
POST /api/encounters/$encounter_id/stages {
  "combatantId": $geodude_combatant_id,
  "attack": 2,
  "defense": -3,
  "specialAttack": 0,
  "specialDefense": -1,
  "speed": -6,
  "accuracy": -4,
  "evasion": 1
}

<!-- Volatile conditions -->
POST /api/encounters/$encounter_id/status { "combatantId": $geodude_combatant_id, "status": "Enraged", "action": "add" }
POST /api/encounters/$encounter_id/status { "combatantId": $geodude_combatant_id, "status": "Suppressed", "action": "add" }

<!-- Slowed + Stuck (cured by breather despite being "other" conditions) -->
POST /api/encounters/$encounter_id/status { "combatantId": $geodude_combatant_id, "status": "Slowed", "action": "add" }
POST /api/encounters/$encounter_id/status { "combatantId": $geodude_combatant_id, "status": "Stuck", "action": "add" }

<!-- Persistent condition (should survive breather) -->
POST /api/encounters/$encounter_id/status { "combatantId": $geodude_combatant_id, "status": "Paralyzed", "action": "add" }

## Actions

POST /api/encounters/$encounter_id/breather {
  "combatantId": $geodude_combatant_id
}

## Assertions

1. **All 7 combat stages reset to 0:**
   Before: atk +2, def -3, spDef -1, spd -6, acc -4, eva +1 (spAtk already 0)
   After: all 7 stages = 0
   Positive stages (atk +2, eva +1) are also lost — breather resets everything
   **Assert: breatherResult.stagesReset = true** (App-enforced: createDefaultStageModifiers)
   Verify via encounter GET: Geodude combatant all stages = 0

2. **Volatile conditions cured:**
   Enraged → volatile → cured
   Suppressed → volatile → cured
   **Assert: breatherResult.conditionsCured includes "Enraged"** (App-enforced: volatile cure)
   **Assert: breatherResult.conditionsCured includes "Suppressed"** (App-enforced: volatile cure)

3. **Slowed + Stuck cured (special breather rule):**
   Slowed → other condition → cured by breather (special rule)
   Stuck → other condition → cured by breather (special rule)
   **Assert: breatherResult.conditionsCured includes "Slowed"** (App-enforced: explicit Slowed/Stuck cure)
   **Assert: breatherResult.conditionsCured includes "Stuck"** (App-enforced: explicit Slowed/Stuck cure)

4. **Persistent condition survives:**
   Paralyzed → persistent → NOT cured by breather
   **Assert: breatherResult.conditionsCured does NOT include "Paralyzed"** (App-enforced: persistent immune to breather)
   Verify via encounter GET: Geodude statusConditions still contains "Paralyzed"

5. **Tripped + Vulnerable applied as temp conditions:**
   **Assert: breatherResult.trippedApplied = true** (App-enforced: tempConditions)
   **Assert: breatherResult.vulnerableApplied = true** (App-enforced: tempConditions)
   Verify via encounter GET: Geodude combatant tempConditions includes "Tripped" and "Vulnerable"

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$geodude_id
DELETE /api/pokemon/$bulbasaur_id
