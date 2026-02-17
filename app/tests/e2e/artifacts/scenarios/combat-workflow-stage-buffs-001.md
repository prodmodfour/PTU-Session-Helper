---
scenario_id: combat-workflow-stage-buffs-001
loop_id: combat-workflow-stage-buffs-and-matchups
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - combat-stages
  - stage-multiplier-table
  - stab
  - type-effectiveness
  - damage-formula
  - evasion-from-stages
---

## Narrative

A trainer battle is underway between Growlithe and Bulbasaur. The GM boosts Growlithe's Special Attack by +2 stages (simulating a move like Flame Charge or a held item). Then the enemy Bulbasaur lowers Growlithe's Special Attack by 1 stage (simulating Growl's analog). With a net +1 SpATK stage (×1.2 multiplier), Growlithe fires off a STAB Ember that is also super effective against Bulbasaur's Grass typing. The damage is verifiably higher than a zero-stage attack. Finally, the GM boosts Bulbasaur's Special Defense stages to demonstrate evasion recalculation from modified stats.

## Setup (API)

POST /api/encounters { "name": "Test: Stage Buffs and Matchups" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Growlithe", "level": 15,
  "baseHp": 6, "baseAttack": 7, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 5, "baseSpeed": 6,
  "types": ["Fire"]
}
$growlithe_id = response.data.id

POST /api/pokemon {
  "species": "Bulbasaur", "level": 14,
  "baseHp": 5, "baseAttack": 5, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 7, "baseSpeed": 5,
  "types": ["Grass", "Poison"]
}
$bulbasaur_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $growlithe_id, "side": "ally" }
$growlithe_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $bulbasaur_id, "side": "enemy" }
$bulbasaur_combatant = response.data

POST /api/encounters/$encounter_id/start

## Phase 1: Start Encounter

### Assertions (Phase 1)

1. **HP and initiative:**
   Growlithe HP = 15 + (6 × 3) + 10 = 43
   Bulbasaur HP = 14 + (5 × 3) + 10 = 39
   Initiative: Growlithe(SPD 6) > Bulbasaur(SPD 5)
   **Assert: Growlithe HP is 43/43, Bulbasaur HP is 39/39, Growlithe before Bulbasaur in turn order**

## Phase 2: Apply +2 SpATK to Growlithe

POST /api/encounters/$encounter_id/stages {
  "combatantId": $growlithe_combatant.id,
  "changes": { "specialAttack": 2 }
}

### Assertions (Phase 2)

2. **Stage applied (+2 SpATK):**
   Previous = 0, change = +2, current = +2
   **Assert: Growlithe specialAttack stage = +2**

POST /api/encounters/$encounter_id/next-turn

## Phase 3: Apply −1 SpATK to Growlithe (Enemy Debuff)

POST /api/encounters/$encounter_id/stages {
  "combatantId": $growlithe_combatant.id,
  "changes": { "specialAttack": -1 }
}

### Assertions (Phase 3)

3. **Net stage after debuff:**
   Previous = +2, change = −1, current = +1
   Stage multiplier at +1 = ×1.2
   **Assert: Growlithe specialAttack stage = +1**

POST /api/encounters/$encounter_id/next-turn

## Phase 4: Round 2 — Growlithe Ember → Bulbasaur (With Stage Modifier)

1. Select move: **Ember** (Fire, Special, DB 4, AC 2)
   - Learn level: L6 (gen1/growlithe.md: Level-Up Moves) ✓
   - STAB check: Growlithe is Fire, Ember is Fire → **STAB applies (+2 DB)**
   - Effective DB = 4 + 2 = 6
2. Set damage for DB 6 = 15
3. Apply to Bulbasaur

### Assertions (Phase 4)

4. **Modified stat:**
   Base SpATK = 7, stage = +1, multiplier = ×1.2
   Modified SpATK = floor(7 × 1.2) = floor(8.4) = 8
   **Assert: Growlithe effective SpATK = 8**

5. **Damage calculation (with stage, STAB, type effectiveness):**
   Set damage = 15 (DB 6)
   Modified SpATK = 8, SpDEF(Bulbasaur) = 7
   Raw = max(1, 15 + 8 − 7) = 16
   Type effectiveness:
     Fire vs Grass = SE (×1.5) — Fire chart: Grass listed as 1.5
     Fire vs Poison = Neutral (×1) — Fire chart: Poison not listed
     Combined = 1.5 × 1 = ×1.5
   Final damage = floor(16 × 1.5) = floor(24) = 24
   **Assert: Damage applied is 24**

6. **HP after stage-boosted attack:**
   Bulbasaur HP: 39 − 24 = 15
   (Compare: without stage boost, SpATK = 7, raw = 15, final = floor(15 × 1.5) = 22 — stages added 2 damage)
   **Assert: Bulbasaur HP is 15/39**

## Phase 5: Evasion From Stages

POST /api/encounters/$encounter_id/stages {
  "combatantId": $bulbasaur_combatant.id,
  "changes": { "specialDefense": 3 }
}

### Assertions (Phase 5)

7. **Stage-modified evasion:**
   Base SpDEF = 7, base Special Evasion = floor(7 / 5) = 1
   With +3 SpDEF stage: modified SpDEF = floor(7 × 1.6) = floor(11.2) = 11
   Modified Special Evasion = floor(11 / 5) = 2
   **Assert: Bulbasaur Special Evasion = 2 (was 1 before stages)**

8. **Stage clamping (sanity check):**
   Bulbasaur SpDEF stage = +3, within [-6, +6] range
   **Assert: Bulbasaur specialDefense stage = +3**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$growlithe_id
DELETE /api/pokemon/$bulbasaur_id
