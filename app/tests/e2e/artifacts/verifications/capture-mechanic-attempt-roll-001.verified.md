---
scenario_id: capture-mechanic-attempt-roll-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Response includes all expected fields
- **Scenario says:** response.data has keys: captured, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, trainerLevel, modifiers, difficulty, breakdown, pokemon, trainer
- **Independent derivation:** attempt.post.ts lines 103-133 returns object with all listed keys. Verified field-by-field against source code.
- **Status:** CORRECT

### Assertion 2: Trainer level correctly subtracted from roll
- **Scenario says:** modifiedRoll === roll - 8
- **Independent derivation:** attemptCapture (captureRate.ts line 199): `modifiedRoll = roll - trainerLevel - modifiers`. trainerLevel = 8, modifiers = 0. So modifiedRoll = roll - 8.
- **Status:** CORRECT

### Assertion 3: Capture success matches roll logic
- **Scenario says:** captured === (naturalHundred || modifiedRoll <= effectiveCaptureRate), criticalHit === false, effectiveCaptureRate === captureRate
- **Independent derivation:**
  No accuracyRoll provided -> body.accuracyRoll is undefined -> criticalHit = (undefined === 20) = false
  In attemptCapture: criticalHit = false -> effectiveCaptureRate = captureRate (no +10 boost)
  success = naturalHundred || modifiedRoll <= effectiveCaptureRate (captureRate.ts line 202)
- **Status:** CORRECT

### Assertion 4: Critical accuracy detected and bonus applied
- **Scenario says:** criticalHit === true, effectiveCaptureRate === captureRate + 10
- **Independent derivation:**
  accuracyRoll: 20 -> attempt.post.ts line 82: `const criticalHit = body.accuracyRoll === 20` -> true
  attemptCapture called with criticalHit = true
  captureRate.ts line 194-196: `if (criticalHit) { effectiveCaptureRate += 10 }`
  effectiveCaptureRate = -20 + 10 = -10
- **Status:** CORRECT

### Assertion 5: Critical attempt capture logic still applies
- **Scenario says:** captured === (naturalHundred || modifiedRoll <= effectiveCaptureRate)
- **Independent derivation:**
  effectiveCaptureRate = -10 (from assertion 4)
  For success without nat100: modifiedRoll <= -10 -> roll - 8 <= -10 -> roll <= -2 (impossible, min roll = 1)
  Only naturalHundred (roll === 100) can succeed. The assertion uses the same success formula.
- **Status:** CORRECT
- **Implementation check:** Non-deterministic roll handled via relational assertions — no exact roll values expected.

## Data Validity
- [x] Oddish: base stats match gen1/oddish.md
- [x] maxHp = 50 + (5 x 3) + 10 = 75 (PTU Pokemon HP formula)
- [x] Capture rate = 100 - 100 - 30 + 10 = -20 (verified against captureRate.ts)
- [x] Two Pokemon created to handle nat-100 edge case on Test 1

## Completeness Check
- [x] Loop capture-mechanic-attempt-roll: normal attempt ✓, critical accuracy ✓
- [x] Sub-loop capture-mechanic-critical-accuracy: crit detection, +10 boost ✓
- [x] Sub-loop capture-mechanic-natural-hundred: included in success condition check but not deterministically testable
- [x] All assertions use relational checks (not exact roll values) — appropriate for non-deterministic roll

## Errata Check
- No errata corrections apply. The 1d100 roll mechanic matches 1.05 core rules.

## Issues Found
<!-- Empty — all assertions correct -->
