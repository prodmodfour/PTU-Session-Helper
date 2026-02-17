---
scenario_id: capture-mechanic-attempt-roll-001
loop_id: capture-mechanic-attempt-roll
tier: mechanic
priority: P1
ptu_assertions: 5
---

## Setup (API)

Create two wild Pokemon (to handle the rare case where Test 1's attempt succeeds via natural 100, leaving Test 2 with a fresh target) and one trainer.

POST /api/characters {
  "name": "Trainer May",
  "level": 8,
  "type": "player"
}
$trainer_id = response.data.id

POST /api/pokemon {
  "species": "Oddish",
  "level": 50,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"]
}
$oddish_1_id = response.data.id
<!-- maxHp = 50 + (5 x 3) + 10 = 75 -->
<!-- At full HP: rate = 100 - 100 - 30 + 10 = -20 -->
<!-- With trainer level 8: need roll - 8 <= -20 -> roll <= -12. Impossible except nat 100. -->

POST /api/pokemon {
  "species": "Oddish",
  "level": 50,
  "baseHp": 5,
  "baseAttack": 5,
  "baseDefense": 6,
  "baseSpAtk": 8,
  "baseSpDef": 7,
  "baseSpeed": 3,
  "types": ["Grass", "Poison"]
}
$oddish_2_id = response.data.id

**Non-deterministic API check:** `attemptCapture()` uses `Math.random()` for the 1d100 roll. All assertions are relational — comparing response fields to each other, not expecting specific roll values.

**Enforcement boundary:** Roll math and success logic are App-enforced (attemptCapture utility, executed server-side in attempt.post.ts).

## Actions & Assertions

### Test 1: Normal Attempt (no critical)

POST /api/capture/attempt {
  "pokemonId": $oddish_1_id,
  "trainerId": $trainer_id
}
$response_1 = response

1. **Response includes all expected fields:**
   **Assert: response.data has keys: captured, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, trainerLevel, modifiers, difficulty, breakdown, pokemon, trainer**
   (App-enforced: attempt.post.ts response shape)

2. **Trainer level correctly subtracted from roll:**
   PTU: "Roll 1d100, and subtract the Trainer's Level"
   trainerLevel = 8, modifiers = 0
   **Assert: response.data.modifiedRoll === response.data.roll - 8**
   (App-enforced: attemptCapture math — modifiedRoll = roll - trainerLevel - modifiers)

3. **Capture success matches roll logic:**
   PTU: "If you roll under or equal to the Pokemon's Capture Rate, the Pokemon is Captured!"
   PTU: "A natural roll of 100 always captures the target without fail"
   **Assert: response.data.captured === (response.data.naturalHundred || response.data.modifiedRoll <= response.data.effectiveCaptureRate)**
   **Assert: response.data.criticalHit === false** (no accuracyRoll provided)
   **Assert: response.data.effectiveCaptureRate === response.data.captureRate** (no crit bonus)
   (App-enforced: attemptCapture success condition)

### Test 2: Critical Accuracy Attempt (accuracyRoll: 20)

POST /api/capture/attempt {
  "pokemonId": $oddish_2_id,
  "trainerId": $trainer_id,
  "accuracyRoll": 20
}
$response_2 = response

4. **Critical accuracy detected and bonus applied:**
   PTU: "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll"
   (Equivalent to adding +10 to the effective capture rate)
   captureRate = -20 (same species/level/conditions as Test 1)
   **Assert: response.data.criticalHit === true**
   **Assert: response.data.effectiveCaptureRate === response.data.captureRate + 10**
   (App-enforced: accuracyRoll === 20 detection, +10 to effectiveCaptureRate)

5. **Critical attempt capture logic still applies:**
   Success condition unchanged: naturalHundred OR modifiedRoll <= effectiveCaptureRate
   With captureRate = -20 and crit: effectiveCaptureRate = -10
   Need roll - 8 <= -10 -> roll <= -2. Still impossible except nat 100.
   **Assert: response.data.captured === (response.data.naturalHundred || response.data.modifiedRoll <= response.data.effectiveCaptureRate)**
   (App-enforced: same success formula with boosted rate)

## Teardown

DELETE /api/pokemon/$oddish_1_id
DELETE /api/pokemon/$oddish_2_id
DELETE /api/characters/$trainer_id
