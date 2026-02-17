---
scenario_id: combat-workflow-faint-replacement-001
loop_id: combat-workflow-faint-and-replacement
tier: workflow
priority: P0
ptu_assertions: 10
mechanics_tested:
  - damage-application
  - faint-check
  - injury-check
  - status-clear-on-faint
  - initiative-insertion
  - turn-progression
---

## Narrative

Mid-combat, an enemy Pidgey attacks the player's Caterpie with STAB Tackle over two rounds. Before the second hit, the GM applies Burned status to Caterpie (from a previous effect). The second Tackle drops Caterpie to 0 HP — it faints, and the Burned status is automatically cleared (only "Fainted" remains). The player sends out Charmander as a replacement, who enters the initiative order based on its Speed stat and retaliates with STAB Ember against Pidgey.

## Setup (API)

POST /api/encounters { "name": "Test: Faint and Replacement" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Caterpie", "level": 8,
  "baseHp": 5, "baseAttack": 3, "baseDefense": 4,
  "baseSpAttack": 2, "baseSpDefense": 2, "baseSpeed": 5,
  "types": ["Bug"]
}
$caterpie_id = response.data.id

POST /api/pokemon {
  "species": "Pidgey", "level": 10,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 4, "baseSpDefense": 4, "baseSpeed": 6,
  "types": ["Normal", "Flying"]
}
$pidgey_id = response.data.id

POST /api/pokemon {
  "species": "Charmander", "level": 13,
  "baseHp": 4, "baseAttack": 5, "baseDefense": 4,
  "baseSpAttack": 6, "baseSpDefense": 5, "baseSpeed": 7,
  "types": ["Fire"]
}
$charmander_id = response.data.id

POST /api/encounters/$encounter_id/combatants { "pokemonId": $caterpie_id, "side": "ally" }
$caterpie_combatant = response.data

POST /api/encounters/$encounter_id/combatants { "pokemonId": $pidgey_id, "side": "enemy" }
$pidgey_combatant = response.data

POST /api/encounters/$encounter_id/start

## Phase 1: Start Encounter

### Assertions (Phase 1)

1. **HP values:**
   Caterpie HP = 8 + (5 × 3) + 10 = 33
   Pidgey HP = 10 + (4 × 3) + 10 = 32
   **Assert: Caterpie HP is 33/33, Pidgey HP is 32/32**

2. **Initiative order:**
   Pidgey Speed = 6, Caterpie Speed = 5
   Order: Pidgey (6) > Caterpie (5)
   **Assert: Pidgey appears before Caterpie in turn order**

## Phase 2: Round 1 — Pidgey Tackle → Caterpie

1. Select move: **Tackle** (Normal, Physical, DB 5, AC 4)
   - Learn level: L1 (gen1/pidgey.md: Level-Up Moves) ✓
   - STAB check: Pidgey is Normal/Flying, Tackle is Normal → **STAB applies (+2 DB)**
   - Effective DB = 5 + 2 = 7
2. Set damage for DB 7 = 17
3. Apply to Caterpie

### Assertions (Phase 2)

3. **Damage calculation:**
   Set damage = 17 (DB 7)
   ATK(Pidgey) = 5, DEF(Caterpie) = 4
   Raw = max(1, 17 + 5 − 4) = 18
   Type effectiveness:
     Normal vs Bug = Neutral (×1) — Normal chart: Bug not listed
     Combined = ×1
   Final damage = 18
   Caterpie HP: 33 − 18 = 15
   **Assert: Caterpie HP is 15/33**

4. **Injury check:**
   Damage = 18, Caterpie maxHP = 33
   Threshold = 33 / 2 = 16.5
   18 ≥ 16.5 → Massive Damage
   **Assert: Caterpie injuries = 1**

POST /api/encounters/$encounter_id/next-turn

## Phase 3: Round 1 — Caterpie Tackle → Pidgey

1. Select move: **Tackle** (Normal, Physical, DB 5, AC 4)
   - Learn level: L1 (gen1/caterpie.md: Level-Up Moves) ✓
   - STAB check: Caterpie is Bug, Tackle is Normal → **no STAB** (Bug ≠ Normal)
   - Effective DB = 5
2. Set damage for DB 5 = 13
3. Apply to Pidgey

### Assertions (Phase 3)

5. **Damage calculation (no STAB):**
   Set damage = 13 (DB 5)
   ATK(Caterpie) = 3, DEF(Pidgey) = 4
   Raw = max(1, 13 + 3 − 4) = 12
   Type effectiveness:
     Normal vs Normal = Neutral (×1) — Normal chart: Normal not listed
     Normal vs Flying = Neutral (×1) — Normal chart: Flying not listed
     Combined = ×1
   Final damage = 12
   Pidgey HP: 32 − 12 = 20
   **Assert: Pidgey HP is 20/32**

POST /api/encounters/$encounter_id/next-turn

## Phase 4: Apply Burned Status

GM applies Burned to Caterpie (simulating a prior fire-type move effect):

POST /api/encounters/$encounter_id/status {
  "combatantId": $caterpie_combatant.id,
  "add": ["Burned"]
}

### Assertions (Phase 4)

6. **Status applied:**
   Caterpie types = [Bug] — Bug is not immune to Burn (only Fire is immune)
   **Assert: Caterpie statusConditions includes "Burned"**

## Phase 5: Round 2 — Pidgey Tackle → Caterpie (Faint)

Same calculation as Phase 2:
Tackle DB 7 (STAB), set damage = 17, ATK(5) − DEF(4), raw = 18, ×1 = 18

### Assertions (Phase 5)

7. **Caterpie faints:**
   Caterpie HP: 15 − 18 = −3 → 0 (floor at 0)
   **Assert: Caterpie HP is 0/33**

8. **Status cleared on faint:**
   On faint: all persistent statuses (Burned) and volatile statuses are cleared.
   Only "Fainted" remains.
   **Assert: Caterpie statusConditions = ["Fainted"] (Burned was cleared)**

## Phase 6: Add Replacement — Charmander

POST /api/encounters/$encounter_id/combatants { "pokemonId": $charmander_id, "side": "ally" }
$charmander_combatant = response.data

### Assertions (Phase 6)

9. **Replacement combatant:**
   Charmander HP = 13 + (4 × 3) + 10 = 35
   **Assert: Charmander HP is 35/35**
   Charmander Speed = 7, Pidgey Speed = 6
   **Assert: Charmander appears before Pidgey in turn order (SPD 7 > 6)**

## Phase 7: Charmander Ember → Pidgey

1. Select move: **Ember** (Fire, Special, DB 4, AC 2)
   - Learn level: L7 (gen1/charmander.md: Level-Up Moves) ✓
   - STAB check: Charmander is Fire, Ember is Fire → **STAB applies (+2 DB)**
   - Effective DB = 4 + 2 = 6
2. Set damage for DB 6 = 15
3. Apply to Pidgey

### Assertions (Phase 7)

10. **Damage calculation:**
    Set damage = 15 (DB 6)
    SpATK(Charmander) = 6, SpDEF(Pidgey) = 4
    Raw = max(1, 15 + 6 − 4) = 17
    Type effectiveness:
      Fire vs Normal = Neutral (×1) — Fire chart: Normal not listed
      Fire vs Flying = Neutral (×1) — Fire chart: Flying not listed
      Combined = ×1
    Final damage = 17
    Pidgey HP: 20 − 17 = 3
    **Assert: Pidgey HP is 3/32**

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$caterpie_id
DELETE /api/pokemon/$pidgey_id
DELETE /api/pokemon/$charmander_id
