---
scenario_id: combat-workflow-healing-recovery-001
loop_id: combat-workflow-healing-and-recovery
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - healing-capped-at-max
  - faint-recovery
  - temporary-hp
  - injury-healing
---

## Narrative

In a tough fight, the GM needs to heal multiple combatants. Bulbasaur has taken damage and gained an injury. Charmander has been knocked out (HP = 0, Fainted). Squirtle is at full HP but about to take a hit. The GM heals Bulbasaur with a Potion (HP capped at max), revives Charmander with a Revive (Fainted removed), grants Squirtle temporary HP (absorbed first on next hit), and heals Bulbasaur's injury. Each healing interaction is verified.

## Setup (API)

POST /api/encounters { "name": "Test: Healing and Recovery" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur", "level": 15,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$bulbasaur_id = response.data.id

POST /api/pokemon {
  "species": "Charmander", "level": 13,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$charmander_id = response.data.id

POST /api/pokemon {
  "species": "Squirtle", "level": 13,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 7,
  "baseSpAttack": 5, "baseSpDefense": 6, "baseSpeed": 4,
  "types": ["Water"]
}
$squirtle_id = response.data.id

POST /api/pokemon {
  "species": "Rattata", "level": 10,
  "baseHp": 3, "baseAttack": 6, "baseDefense": 4,
  "baseSpAttack": 3, "baseSpDefense": 4, "baseSpeed": 7,
  "types": ["Normal"]
}
$rattata_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $bulbasaur_id, "side": "ally" }
$bulbasaur_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $charmander_id, "side": "ally" }
$charmander_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $squirtle_id, "side": "ally" }
$squirtle_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $rattata_id, "side": "enemy" }

POST /api/encounters/$encounter_id/start

## Phase 1: Damage Setup — Weaken Bulbasaur and Faint Charmander

Apply damage to set up the healing test conditions:

POST /api/encounters/$encounter_id/damage {
  "combatantId": $bulbasaur_combatant.id,
  "amount": 25
}
<!-- Bulbasaur maxHP = 15 + (5 × 3) + 10 = 40 -->
<!-- After 25 damage: HP = 40 − 25 = 15 -->
<!-- Massive Damage check: 25 ≥ 40/2 = 20 → injury +1 -->

POST /api/encounters/$encounter_id/damage {
  "combatantId": $charmander_combatant.id,
  "amount": 50
}
<!-- Charmander maxHP = 13 + (4 × 3) + 10 = 35 -->
<!-- After 50 damage: HP = 35 − 50 = −15 → 0 (floor) -->
<!-- Fainted: HP reached 0 -->
<!-- Massive Damage check: 35 ≥ 35/2 = 17.5 → injury +1 -->
<!-- (hpDamage is capped at currentHp for injury check if app uses actual HP lost; -->
<!--  but raw damage 50 ≥ 17.5 → injury regardless) -->

### Assertions (Phase 1)

1. **Bulbasaur damaged:**
   Bulbasaur HP: 40 − 25 = 15
   Injury: 25 ≥ 20 → Massive Damage
   **Assert: Bulbasaur HP is 15/40, injuries = 1**

2. **Charmander fainted:**
   Charmander HP: 35 − 50 → 0 (fainted)
   **Assert: Charmander HP is 0/35, statusConditions includes "Fainted"**

## Phase 2: Heal Bulbasaur (Capped at Max)

POST /api/encounters/$encounter_id/heal {
  "combatantId": $bulbasaur_combatant.id,
  "amount": 30
}

### Assertions (Phase 2)

3. **Healing capped at max HP:**
   newHp = min(maxHp, currentHp + amount) = min(40, 15 + 30) = min(40, 45) = 40
   **Assert: Bulbasaur HP is 40/40 (healed to full, not 45)**

## Phase 3: Revive Charmander (Faint Recovery)

POST /api/encounters/$encounter_id/heal {
  "combatantId": $charmander_combatant.id,
  "amount": 20
}

### Assertions (Phase 3)

4. **Faint recovery:**
   newHp = min(35, 0 + 20) = 20
   HP > 0 → Fainted status removed
   **Assert: Charmander HP is 20/35, statusConditions does NOT include "Fainted"**

## Phase 4: Grant Temporary HP to Squirtle

POST /api/encounters/$encounter_id/heal {
  "combatantId": $squirtle_combatant.id,
  "amount": 0,
  "tempHp": 15
}

### Assertions (Phase 4)

5. **Temporary HP granted:**
   Squirtle HP remains 35/35 (real HP unchanged)
   temporaryHp = 15
   **Assert: Squirtle HP is 35/35, temporaryHp = 15**

## Phase 5: Damage Squirtle (Temp HP Absorbs First)

POST /api/encounters/$encounter_id/damage {
  "combatantId": $squirtle_combatant.id,
  "amount": 20
}

### Assertions (Phase 5)

6. **Temp HP absorption:**
   Incoming damage = 20
   Temp HP absorbs: min(15, 20) = 15
   Remaining damage: 20 − 15 = 5
   Real HP: 35 − 5 = 30
   Temp HP: 15 − 15 = 0
   **Assert: Squirtle HP is 30/35, temporaryHp = 0**

7. **Temp HP absorbed correctly:**
   Temp HP took 15 of the 20 damage; only 5 reached real HP
   **Assert: Squirtle lost exactly 5 real HP (from 35 to 30)**

## Phase 6: Heal Bulbasaur's Injury

POST /api/encounters/$encounter_id/heal {
  "combatantId": $bulbasaur_combatant.id,
  "amount": 0,
  "healInjuries": 1
}

### Assertions (Phase 6)

8. **Injury healed:**
   Previous injuries = 1, heal 1 → 0
   **Assert: Bulbasaur injuries = 0**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$bulbasaur_id
DELETE /api/pokemon/$charmander_id
DELETE /api/pokemon/$squirtle_id
DELETE /api/pokemon/$rattata_id
