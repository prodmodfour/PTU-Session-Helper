---
scenario_id: combat-workflow-status-chain-001
loop_id: combat-workflow-status-chain
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - status-application
  - persistent-status-effects
  - volatile-status-effects
  - take-a-breather
  - status-clear-on-combat-end
---

## Narrative

During a fight, the GM inflicts Paralyzed on the player's Eevee (Normal type — not immune). Next, Confused (volatile) is applied to Eevee, giving it two simultaneous statuses. Eevee uses Take a Breather: the volatile Confused is cured and all combat stages reset, but the persistent Paralyzed remains. Tripped and Vulnerable are added as the Breather penalty. When the encounter ends, volatile conditions are cleared but Paralyzed persists on the entity.

## Setup (API)

POST /api/encounters { "name": "Test: Status Chain" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Eevee", "level": 13,
  "baseHp": 6, "baseAttack": 6, "baseDefense": 5,
  "baseSpAttack": 5, "baseSpDefense": 7, "baseSpeed": 6,
  "types": ["Normal"]
}
$eevee_id = response.data.id

POST /api/pokemon {
  "species": "Pikachu", "level": 14,
  "baseHp": 4, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 5, "baseSpDefense": 5, "baseSpeed": 9,
  "types": ["Electric"]
}
$pikachu_id = response.data.id

POST /api/pokemon {
  "species": "Rattata", "level": 10,
  "baseHp": 3, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 3, "baseSpDefense": 4, "baseSpeed": 7,
  "types": ["Normal"]
}
$rattata_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $eevee_id, "side": "ally" }
$eevee_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $pikachu_id, "side": "ally" }
$pikachu_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $rattata_id, "side": "enemy" }

POST /api/encounters/$encounter_id/start

## Phase 1: Start Encounter

### Assertions (Phase 1)

1. **HP values:**
   Eevee HP = 13 + (6 x 3) + 10 = 41
   Pikachu HP = 14 + (4 x 3) + 10 = 36
   **Assert: Eevee HP is 41/41, Pikachu HP is 36/36**

## Phase 2: Apply Paralyzed to Eevee

POST /api/encounters/$encounter_id/status {
  "combatantId": $eevee_combatant.id,
  "add": ["Paralyzed"]
}

Paralyzed is a persistent status. Eevee is Normal type — not immune (only Electric is immune to Paralysis).

GM applies the stage penalty for Paralysis (Speed lowered by 4 CS):
POST /api/encounters/$encounter_id/stages {
  "combatantId": $eevee_combatant.id,
  "changes": { "speed": -4 }
}

### Assertions (Phase 2)

2. **Paralyzed applied to Eevee:**
   Eevee types = [Normal] — Normal has no Paralysis immunity
   **Assert: Eevee statusConditions includes "Paralyzed"**

3. **Speed stage penalty:**
   Paralyzed lowers Speed by 4 CS
   **Assert: Eevee speed stage = -4**

## Phase 3: Apply Confused to Eevee (Stacking Statuses)

POST /api/encounters/$encounter_id/status {
  "combatantId": $eevee_combatant.id,
  "add": ["Confused"]
}

Confused is a volatile status. PTU allows multiple statuses simultaneously.

### Assertions (Phase 3)

4. **Multiple statuses stacked:**
   **Assert: Eevee statusConditions includes both "Paralyzed" AND "Confused"**

## Phase 4: Eevee Takes a Breather

POST /api/encounters/$encounter_id/breather {
  "combatantId": $eevee_combatant.id
}

Take a Breather is a Full Action (Standard + Shift consumed). Effects:
- All combat stages reset to 0
- All volatile statuses cured (Confused removed)
- Temporary HP removed (none in this case)
- Slow and Stuck conditions removed (none in this case)
- Tripped and Vulnerable added as penalty
- Persistent statuses NOT affected (Paralyzed remains)

### Assertions (Phase 4)

5. **Stages reset:**
   All combat stages return to 0 (Speed was -4 from Paralysis penalty)
   **Assert: Eevee speed stage = 0 (reset by Breather)**

6. **Volatile cleared, persistent remains:**
   Confused (volatile) -> removed
   Paralyzed (persistent) -> remains
   **Assert: Eevee statusConditions includes "Paralyzed" but NOT "Confused"**

7. **Breather penalty applied:**
   **Assert: Eevee statusConditions includes "Tripped" and "Vulnerable"**

## Phase 5: End Encounter

POST /api/encounters/$encounter_id/end

### Assertions (Phase 5)

8. **Persistent status survives combat end:**
   Volatile statuses (Tripped, Vulnerable) cleared at end of encounter.
   Persistent statuses (Paralyzed) remain on the entity record.
   **Assert: Eevee entity retains "Paralyzed" after encounter ends**

## Teardown

DELETE /api/pokemon/$eevee_id
DELETE /api/pokemon/$pikachu_id
DELETE /api/pokemon/$rattata_id
