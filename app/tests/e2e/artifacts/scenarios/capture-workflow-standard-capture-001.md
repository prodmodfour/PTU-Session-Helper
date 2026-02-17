---
scenario_id: capture-workflow-standard-capture-001
loop_id: capture-workflow-standard-capture
tier: workflow
priority: P0
ptu_assertions: 8
mechanics_tested:
  - capture-rate-formula
  - hp-percentage-modifier
  - evolution-stage-modifier
  - injury-modifier
  - capture-attempt-roll
  - trainer-level-subtraction
  - post-capture-ownership
  - capture-difficulty-description
---

## Narrative

A wild Oddish appears on Route 3. The GM creates a wild encounter, and a trainer decides to capture it. The party weakens the Oddish with a powerful hit that drops it to exactly 1 HP and inflicts a Massive Damage injury. The GM checks the capture rate — now boosted to 129 by the low HP and injury — and the trainer throws a Poke Ball. The rate is so high that capture is mathematically guaranteed regardless of the roll. After capture, the Oddish is linked to the trainer with origin "captured" and retains its weakened 1 HP.

## Species Data

**Oddish** (gen1/oddish.md)
- Type: Grass/Poison
- Base Stats: HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3
- Evolution: Stage 1 of 3 (Oddish -> Gloom -> Vileplume)

**Non-deterministic API check:** Pokemon created via `POST /api/pokemon` with explicit base stats — deterministic. HP = level + (baseHp x 3) + 10. No random stat points distributed.

**Evolution stage note:** Oddish is a 3-stage line. The API's `Math.max(3, evolutionStage)` hardcode produces the correct result for 3-stage lines. Evolution modifier assertions are valid for this species.

## Setup (API)

POST /api/characters {
  "name": "Trainer Ash",
  "level": 5,
  "type": "player"
}
$trainer_id = response.data.id

POST /api/pokemon {
  "species": "Oddish",
  "level": 8,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"]
}
$oddish_id = response.data.id
<!-- Oddish is unowned (wild): no ownerId set -->
<!-- maxHp = 8 + (5 x 3) + 10 = 33 -->

POST /api/encounters { "name": "Route 3: Wild Oddish" }
$encounter_id = response.data.id

POST /api/encounters/$encounter_id/combatants {
  "pokemonId": $oddish_id,
  "side": "enemies"
}
$oddish_combatant_id = find Oddish combatant ID from encounter response

POST /api/encounters/$encounter_id/start

## Phase 1: Initial Capture Rate Assessment

POST /api/capture/rate { "pokemonId": $oddish_id }

### Assertions (Phase 1)

1. **Initial capture rate at full HP:**
   base: 100
   levelModifier: -(8 x 2) = -16
   hpModifier: (33/33) x 100 = 100%, above 75% -> -30
   evolutionModifier: stage 1 of 3, remaining 2 -> +10
   shinyModifier: 0, legendaryModifier: 0, statusModifier: 0, injuryModifier: 0
   captureRate = 100 + (-16) + (-30) + 10 = **64**
   **Assert: captureRate = 64** (App-enforced: calculateCaptureRate)
   **Assert: breakdown.levelModifier = -16, breakdown.hpModifier = -30, breakdown.evolutionModifier = 10**

2. **Capture difficulty label:**
   64 >= 60 -> "Easy"
   **Assert: difficulty = "Easy"** (App-enforced: getCaptureDescription)

## Phase 2: Weaken the Wild Oddish

The party deals 32 damage to bring Oddish to 1 HP.

POST /api/encounters/$encounter_id/damage {
  "combatantId": $oddish_combatant_id,
  "damage": 32
}
<!-- 32 damage on 33 HP: 33 - 32 = 1 HP remaining -->
<!-- Massive damage check: 32 / 33 = 97.0% >= 50% -> injury auto-applied -->
<!-- App-enforced: calculateDamage handles injury assignment (confirmed by combat-injury-massive-damage-001 test) -->

### Assertions (Phase 2)

3. **Oddish HP after damage:**
   33 - 32 = 1
   **Assert: Oddish currentHp = 1** (App-enforced: damage calculation and DB sync)

## Phase 3: Improved Capture Rate

POST /api/capture/rate { "pokemonId": $oddish_id }

### Assertions (Phase 3)

4. **Capture rate at 1 HP with 1 injury:**
   base: 100
   levelModifier: -(8 x 2) = -16
   hpModifier: currentHp === 1 -> +30 (special case, checked before percentage tiers)
   evolutionModifier: remaining 2 -> +10
   injuryModifier: 1 x 5 = +5 (from massive damage in Phase 2)
   shinyModifier: 0, legendaryModifier: 0, statusModifier: 0
   captureRate = 100 + (-16) + 30 + 10 + 5 = **129**
   Change from Phase 1: 64 -> 129 (+65 swing: HP -30 to +30 = +60, injury +5)
   **Assert: captureRate = 129** (App-enforced: calculateCaptureRate)
   **Assert: breakdown.hpModifier = 30, breakdown.injuryModifier = 5**

5. **Improved difficulty label:**
   129 >= 80 -> "Very Easy"
   **Assert: difficulty = "Very Easy"** (App-enforced: getCaptureDescription)

## Phase 4: Capture Attempt

POST /api/capture/attempt {
  "pokemonId": $oddish_id,
  "trainerId": $trainer_id
}

### Assertions (Phase 4)

6. **Capture is mathematically guaranteed:**
   captureRate = 129, trainerLevel = 5, modifiers = 0
   modifiedRoll = roll - 5
   Maximum possible roll = 100 -> maximum modifiedRoll = 95
   95 <= 129 -> always true
   Even minimum roll = 1 -> modifiedRoll = -4 -> -4 <= 129 -> true
   Every possible 1d100 outcome produces success.
   **Assert: captured = true** (App-enforced: attemptCapture, deterministic outcome at this rate)
   **Assert: captureRate = 129, trainerLevel = 5**

## Phase 5: Post-Capture Verification

GET /api/pokemon/$oddish_id

### Assertions (Phase 5)

7. **Ownership transferred:**
   **Assert: ownerId = $trainer_id** (App-enforced: prisma.pokemon.update on capture success)
   **Assert: origin = "captured"** (App-enforced: origin field set to 'captured')

8. **Combat state preserved — capture does not heal:**
   **Assert: currentHp = 1** (App-enforced: capture only updates ownerId and origin, not HP/status/injuries)

## Teardown

POST /api/encounters/$encounter_id/end
DELETE /api/pokemon/$oddish_id
DELETE /api/characters/$trainer_id
