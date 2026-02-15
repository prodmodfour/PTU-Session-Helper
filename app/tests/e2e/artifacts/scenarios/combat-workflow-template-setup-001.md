---
scenario_id: combat-workflow-template-setup-001
loop_id: combat-workflow-setup-from-template
tier: workflow
priority: P0
ptu_assertions: 7
mechanics_tested:
  - encounter-lifecycle
  - template-loading
  - initiative-calculation
  - serve-to-group
---

## Narrative

The GM has a recurring gym battle saved as a template. Instead of manually creating the encounter and adding combatants, the GM creates a base encounter, saves it as a template, then loads the template into a fresh encounter. The template preserves the enemy team (Charmander and Rattata). The GM adds the player's Squirtle to the loaded encounter, starts combat, and serves it to the Group View. This validates the template-load workflow that lets GMs quickly set up pre-built encounters.

**Note:** Template-loaded Pokemon have non-deterministic stats. The template stores species/level data, and recreation distributes random stat points. All stat-dependent assertions read actual values from the API after template load.

## Setup (API) — Create Source Encounter for Template

POST /api/encounters { "name": "Gym Battle Template Source" }
$source_encounter_id = response.data.id

POST /api/pokemon {
  "species": "Charmander", "level": 12,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$template_charmander_id = response.data.id

POST /api/pokemon {
  "species": "Rattata", "level": 10,
  "baseHp": 3, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 3, "baseSpDefense": 4, "baseSpeed": 7,
  "types": ["Normal"]
}
$template_rattata_id = response.data.id

POST /api/encounters/$source_encounter_id/combatants { "pokemonId": $template_charmander_id, "side": "enemy" }
POST /api/encounters/$source_encounter_id/combatants { "pokemonId": $template_rattata_id, "side": "enemy" }

## Phase 1: Save as Template

POST /api/encounter-templates/from-encounter {
  "encounterId": $source_encounter_id,
  "name": "Gym Battle: Fire Team"
}
$template_id = response.data.id

### Assertions (Phase 1)

1. **Template created:**
   **Assert: Template exists with name "Gym Battle: Fire Team" and id = $template_id**

## Phase 2: Load Template into New Encounter

POST /api/encounter-templates/$template_id/load
$encounter_id = response.data.id

GET /api/encounters/$encounter_id
$combatants = response.data.combatants
$charmander = combatant where species = "Charmander"
$rattata = combatant where species = "Rattata"
$charmander_hp = $charmander.entity.maxHp
$rattata_hp = $rattata.entity.maxHp

### Assertions (Phase 2)

2. **Encounter created from template:**
   **Assert: New encounter exists with id = $encounter_id**

3. **Template combatants present with valid stats:**
   Template-loaded Pokemon have non-deterministic stats (recreated via generateAndCreatePokemon).
   Minimum HP values: Charmander L12 = 12 + (4 x 3) + 10 = 34, Rattata L10 = 10 + (3 x 3) + 10 = 29
   **Assert: Encounter has 2 combatants**
   **Assert: Charmander currentHp = maxHp (full HP) and maxHp >= 34**
   **Assert: Rattata currentHp = maxHp (full HP) and maxHp >= 29**

## Phase 3: Add Player Combatant

POST /api/pokemon {
  "species": "Squirtle", "level": 13,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 7,
  "baseSpAttack": 5, "baseSpDefense": 6, "baseSpeed": 4,
  "types": ["Water"]
}
$squirtle_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $squirtle_id, "side": "players" }

### Assertions (Phase 3)

4. **Player combatant added:**
   Total combatants = 3 (2 from template + 1 player)
   Squirtle HP = 13 + (4 x 3) + 10 = 35
   **Assert: Encounter has 3 combatants, Squirtle HP is 35/35 on players side**

## Phase 4: Start and Serve

POST /api/encounters/$encounter_id/start
POST /api/encounters/$encounter_id/serve

### Assertions (Phase 4)

5. **Initiative calculated:**
   Charmander Speed >= 7 (base), Rattata Speed >= 7 (base), Squirtle Speed = 4 (deterministic)
   Order: Charmander/Rattata (>= 7) > Squirtle (4)
   **Assert: Squirtle is last in turn order (Speed 4 < minimum 7 of template Pokemon)**

6. **Encounter started:**
   **Assert: Encounter isActive = true**

7. **Encounter served:**
   **Assert: Encounter isServed = true**

## Teardown

POST /api/encounters/$encounter_id/end
POST /api/encounters/$encounter_id/unserve
DELETE /api/pokemon/$squirtle_id
<!-- Template Pokemon cleaned up separately -->
DELETE /api/pokemon/$template_charmander_id
DELETE /api/pokemon/$template_rattata_id
POST /api/encounters/$source_encounter_id/end
DELETE /api/encounter-templates/$template_id
