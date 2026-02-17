---
scenario_id: capture-workflow-multi-attempt-001
loop_id: capture-workflow-multi-attempt-retry
tier: workflow
priority: P1
ptu_assertions: 9
mechanics_tested:
  - capture-rate-formula
  - hp-percentage-modifier
  - status-condition-modifier
  - injury-modifier
  - capture-attempt-roll
  - trainer-level-subtraction
  - capture-rate-improvement-feedback
  - post-capture-ownership
  - capture-difficulty-description
---

## Narrative

The party encounters a high-level wild Oddish (Level 45) deep on Victory Road. The trainer optimistically throws a Poke Ball, but the capture rate is deeply negative (-10) at full HP — the attempt almost certainly fails. The party then weakens the Oddish with a powerful attack that drops it to 1 HP and inflicts a Massive Damage injury. A teammate inflicts Paralysis. With the improved conditions, the capture rate jumps from -10 to 65 ("Easy"). The trainer tries again and eventually captures the Oddish.

## Species Data

**Oddish** (gen1/oddish.md)
- Type: Grass/Poison
- Base Stats: HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3
- Evolution: Stage 1 of 3 (Oddish -> Gloom -> Vileplume)

**Non-deterministic API check:** Pokemon created via `POST /api/pokemon` with explicit base stats — deterministic. HP = 45 + (5 x 3) + 10 = 70. The capture attempt roll (1d100) is non-deterministic — assertions use relational checks and retry loops.

**Evolution stage note:** Oddish is a 3-stage line. The API's `Math.max(3, evolutionStage)` hardcode produces the correct result for this species.

## Setup (API)

POST /api/characters {
  "name": "Trainer Red",
  "level": 5,
  "type": "player"
}
$trainer_id = response.data.id

POST /api/pokemon {
  "species": "Oddish",
  "level": 45,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"]
}
$oddish_id = response.data.id
<!-- maxHp = 45 + (5 x 3) + 10 = 70 -->

POST /api/encounters { "name": "Victory Road: Wild Oddish" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants {
  "pokemonId": $oddish_id,
  "side": "enemies"
}
$oddish_combatant_id = find Oddish combatant ID from encounter response

POST /api/encounters/$encounter_id/start

## Phase 1: Initial Capture Rate (Full HP)

POST /api/capture/rate { "pokemonId": $oddish_id }

### Assertions (Phase 1)

1. **Initial capture rate — deeply negative:**
   base: 100
   levelModifier: -(45 x 2) = -90
   hpModifier: (70/70) x 100 = 100%, above 75% -> -30
   evolutionModifier: stage 1 of 3, remaining 2 -> +10
   shinyModifier: 0, legendaryModifier: 0, statusModifier: 0, injuryModifier: 0
   captureRate = 100 + (-90) + (-30) + 10 = **-10**
   **Assert: captureRate = -10** (App-enforced: calculateCaptureRate)

2. **Capture difficulty label:**
   -10 < 1 -> "Nearly Impossible"
   **Assert: difficulty = "Nearly Impossible"** (App-enforced: getCaptureDescription)

## Phase 2: First Capture Attempt (Expected Failure)

POST /api/capture/attempt {
  "pokemonId": $oddish_id,
  "trainerId": $trainer_id
}

Analysis:
  captureRate = -10, trainerLevel = 5, modifiers = 0
  modifiedRoll = roll - 5
  For success: modifiedRoll <= -10 -> roll <= -5
  Minimum possible roll = 1 -> modifiedRoll = -4 -> -4 > -10 -> FAIL
  Only natural 100 (1% chance) can succeed at this rate.

### Assertions (Phase 2)

3. **First attempt response confirms low rate and relational check:**
   **Assert: response.data.captureRate = -10**
   **Assert: response.data.modifiedRoll === response.data.roll - 5** (trainerLevel = 5, modifiers = 0)
   **Note for Playtester:** 99% probability of failure. If naturalHundred = true (1% chance), skip to Phase 5 (post-capture verification). Otherwise proceed with Phase 3.

## Phase 3: Improve Conditions

### Step 3a: Weaken Oddish

POST /api/encounters/$encounter_id/damage {
  "combatantId": $oddish_combatant_id,
  "damage": 69
}
<!-- 69 damage on 70 HP: 70 - 69 = 1 HP remaining -->
<!-- Massive damage: 69 / 70 = 98.6% >= 50% -> 1 injury auto-applied -->
<!-- App-enforced: calculateDamage handles injury assignment -->

### Step 3b: Apply Paralyzed Status

POST /api/encounters/$encounter_id/status {
  "combatantId": $oddish_combatant_id,
  "add": ["Paralyzed"]
}

### Assertions (Phase 3)

4. **HP after damage:**
   70 - 69 = 1
   **Assert: Oddish currentHp = 1** (App-enforced: damage calculation and DB sync)

5. **Injury from massive damage:**
   Damage 69 on maxHp 70: 69/70 = 98.6% >= 50% -> Massive Damage -> 1 injury
   **Assert: Oddish injuries = 1** (App-enforced: massive damage rule)

6. **Status applied:**
   **Assert: Oddish statusConditions includes "Paralyzed"** (App-enforced: status sync to DB)

## Phase 4: Improved Capture Rate

POST /api/capture/rate { "pokemonId": $oddish_id }

### Assertions (Phase 4)

7. **Capture rate after improvements — dramatic swing:**
   base: 100
   levelModifier: -(45 x 2) = -90
   hpModifier: currentHp === 1 -> +30 (was -30, swing of +60)
   evolutionModifier: remaining 2 -> +10
   statusModifier: Paralyzed (Persistent) -> +10
   injuryModifier: 1 x 5 = +5
   captureRate = 100 + (-90) + 30 + 10 + 10 + 5 = **65**
   Change from Phase 1: -10 -> 65 (+75 swing)
   **Assert: captureRate = 65** (App-enforced: calculateCaptureRate)
   **Assert: breakdown.hpModifier = 30, breakdown.statusModifier = 10, breakdown.injuryModifier = 5**

8. **Improved difficulty label:**
   65 >= 60 -> "Easy"
   **Assert: difficulty = "Easy"** (App-enforced: getCaptureDescription)

## Phase 5: Retry Capture (Expected Success)

POST /api/capture/attempt {
  "pokemonId": $oddish_id,
  "trainerId": $trainer_id
}

Analysis:
  captureRate = 65, trainerLevel = 5, modifiers = 0
  modifiedRoll = roll - 5
  For success: modifiedRoll <= 65 -> roll <= 70
  P(success per attempt) = 70%

**Note for Playtester:** If the first retry fails, loop up to 4 more times (total 5 retries). Cumulative P(success) = 1 - 0.3^5 = 99.76%. Assert on eventual success.

### Assertions (Phase 5)

9. **Capture eventually succeeds and ownership transferred:**
   **Assert: captured = true** (eventual, after retries if needed)
   Verify post-capture state:
   GET /api/pokemon/$oddish_id
   **Assert: ownerId = $trainer_id, origin = "captured"** (App-enforced: prisma.pokemon.update)

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$oddish_id
DELETE /api/characters/$trainer_id
