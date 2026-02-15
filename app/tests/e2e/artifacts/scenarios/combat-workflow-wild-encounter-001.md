---
scenario_id: combat-workflow-wild-encounter-001
loop_id: combat-workflow-full-wild-encounter
tier: workflow
priority: P0
ptu_assertions: 10
mechanics_tested:
  - hp-calculation
  - initiative-ordering
  - turn-progression
  - damage-formula
  - stab
  - type-effectiveness
  - injury-check
  - faint-check
  - encounter-lifecycle
  - serve-unserve
---

## Narrative

The party encounters a wild Oddish while traveling through a forest route. The GM creates a wild encounter, spawns the Oddish via the wild-spawn endpoint, and adds the player's Growlithe. Over two rounds of combat, Growlithe's STAB Fire-type Ember proves super effective against the Grass/Poison Oddish. Oddish retaliates with STAB Acid but deals only neutral damage to Fire-type Growlithe. After two Embers, Oddish faints. The GM ends and unserves the encounter.

**Note:** Wild-spawned Pokemon have non-deterministic stats due to random stat-point distribution. All Oddish-dependent values are read from the API after spawn and derived dynamically.

## Setup (API)

POST /api/encounters { "name": "Route Forest: Wild Oddish" }
$encounter_id = response.data.id

POST /api/pokemon {
  "species": "Growlithe", "level": 15,
  "baseHp": 6, "baseAttack": 7, "baseDefense": 5,
  "baseSpAttack": 7, "baseSpDefense": 5, "baseSpeed": 6,
  "types": ["Fire"]
}
$growlithe_id = response.data.id

POST /api/encounters/$encounter_id/wild-spawn {
  "pokemon": [{ "species": "Oddish", "level": 10 }]
}
$oddish_combatant = response.data[0]
$oddish_id = $oddish_combatant.entityId
<!-- wild-spawn creates Pokemon with random stat-point distribution -->
<!-- Oddish types: Grass/Poison (from species DB) -->

GET /api/pokemon/$oddish_id
$oddish = response.data
$oddish_hp = $oddish.maxHp
$oddish_spatk = $oddish.currentStats.specialAttack
$oddish_spdef = $oddish.currentStats.specialDefense
$oddish_speed = $oddish.currentStats.speed
<!-- Minimum values (0 random points): HP=35, SpATK=8, SpDEF=7, Speed=3 -->

POST /api/encounters/$encounter_id/combatants { "pokemonId": $growlithe_id, "side": "players" }
$growlithe_combatant = response.data

## Phase 1: Start Encounter

POST /api/encounters/$encounter_id/start
POST /api/encounters/$encounter_id/serve

### Assertions (Phase 1)

1. **Growlithe HP (deterministic):**
   HP = level(15) + (baseHp(6) x 3) + 10 = 15 + 18 + 10 = 43
   **Assert: Growlithe HP is 43/43**

2. **Oddish HP (dynamic):**
   HP = $oddish_hp (read from API after spawn, minimum 35)
   **Assert: Oddish HP is $oddish_hp/$oddish_hp (full HP, >= 35)**

3. **Initiative order:**
   Growlithe Speed = 6 (deterministic), Oddish Speed = $oddish_speed (minimum 3)
   Growlithe base speed (6) significantly exceeds Oddish base (3)
   **Assert: Growlithe appears before Oddish in turn order**

## Phase 2: Round 1 — Growlithe Ember -> Oddish

1. Select move: **Ember** (Fire, Special, DB 4, AC 2)
   - Learn level: L6 (gen1/growlithe.md: Level-Up Moves)
   - STAB check: Growlithe is Fire, Ember is Fire -> **STAB applies (+2 DB)**
   - Effective DB = 4 + 2 = 6
2. Set damage for DB 6 = 15
3. Apply to Oddish

### Assertions (Phase 2)

4. **Damage calculation (dynamic):**
   Set damage = 15 (DB 6)
   SpATK(Growlithe) = 7, SpDEF(Oddish) = $oddish_spdef
   Raw = max(1, 15 + 7 - $oddish_spdef)
   Type effectiveness:
     Fire vs Grass = SE (x1.5) — Fire chart: Grass listed as 1.5
     Fire vs Poison = Neutral (x1) — Fire chart: Poison not listed
     Combined = 1.5 x 1 = x1.5
   $ember_damage = floor(Raw x 1.5)
   $oddish_hp_after_r1 = $oddish_hp - $ember_damage
   **Assert: Oddish HP is $oddish_hp_after_r1/$oddish_hp**

5. **Injury check (Massive Damage, dynamic):**
   Damage = $ember_damage, Oddish maxHP = $oddish_hp
   Threshold = $oddish_hp / 2
   $ember_damage >= Threshold -> Massive Damage
   **Assert: Oddish injuries = 1 if $ember_damage >= $oddish_hp/2, else 0**

POST /api/encounters/$encounter_id/next-turn

## Phase 3: Round 1 — Oddish Acid -> Growlithe

1. Select move: **Acid** (Poison, Special, DB 4, AC 2)
   - Learn level: L9 (gen1/oddish.md: Level-Up Moves)
   - STAB check: Oddish is Grass/Poison, Acid is Poison -> **STAB applies (+2 DB)**
   - Effective DB = 4 + 2 = 6
2. Set damage for DB 6 = 15
3. Apply to Growlithe

### Assertions (Phase 3)

6. **Damage calculation (dynamic):**
   Set damage = 15 (DB 6)
   SpATK(Oddish) = $oddish_spatk, SpDEF(Growlithe) = 5
   Raw = max(1, 15 + $oddish_spatk - 5)
   Type effectiveness:
     Poison vs Fire = Neutral (x1) — Poison chart: Fire not listed
     Combined = x1
   $acid_damage = Raw
   Growlithe HP: 43 - $acid_damage
   **Assert: Growlithe HP is (43 - $acid_damage)/43**

7. **Injury check (dynamic):**
   Damage = $acid_damage, Growlithe maxHP = 43
   Threshold = 43 / 2 = 21.5
   **Assert: Growlithe injuries = 1 if $acid_damage >= 21.5, else 0**

POST /api/encounters/$encounter_id/next-turn

## Phase 4: Round 2 — Growlithe Ember -> Oddish (Faint)

Same move and calculation as Phase 2:
Ember (DB 6 with STAB), set damage = 15, SpATK(7) - SpDEF($oddish_spdef), x1.5
$ember_damage same as Phase 2

### Assertions (Phase 4)

8. **Oddish HP after second Ember:**
   Oddish HP: $oddish_hp_after_r1 - $ember_damage
   Result floored at 0 if negative
   **Assert: Oddish HP is max(0, $oddish_hp - 2 x $ember_damage)/$oddish_hp**

9. **Faint check (dynamic):**
   If $oddish_hp - 2 x $ember_damage <= 0 -> Fainted
   **Assert: If HP reached 0, Oddish statusConditions includes "Fainted"**

## Phase 5: End and Unserve

POST /api/encounters/$encounter_id/end
POST /api/encounters/$encounter_id/unserve

### Assertions (Phase 5)

10. **Encounter lifecycle:**
    Encounter ended — isActive set to false.
    Encounter unserved — isServed set to false.
    **Assert: Encounter isActive = false and isServed = false**

## Teardown

DELETE /api/pokemon/$growlithe_id
DELETE /api/pokemon/$oddish_id
