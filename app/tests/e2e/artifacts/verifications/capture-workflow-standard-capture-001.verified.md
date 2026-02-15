---
scenario_id: capture-workflow-standard-capture-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 8
assertions_correct: 8
---

## Assertion Verification

### Assertion 1: Initial capture rate at full HP
- **Scenario says:** captureRate = 100 + (-16) + (-30) + 10 = 64
- **Independent derivation:**
  base: 100
  levelModifier: -(8 x 2) = -16
  hpModifier: (33/33) x 100 = 100%, 100% > 75% -> -30
  evolutionModifier: Oddish stage 1/3, Math.max(3,1)=3, remaining 2 -> +10
  shiny: 0, legendary: 0, status: 0, injury: 0, stuck: 0, slow: 0
  captureRate = 100 + (-16) + (-30) + 10 = **64**
- **Status:** CORRECT

### Assertion 2: Capture difficulty label
- **Scenario says:** 64 >= 60 -> "Easy"
- **Independent derivation:** getCaptureDescription(64): 64 >= 80? No. 64 >= 60? Yes -> "Easy"
- **Status:** CORRECT

### Assertion 3: Oddish HP after damage
- **Scenario says:** 33 - 32 = 1
- **Independent derivation:** calculateDamage(32, 33, 33, 0, 0): hpDamage = 32, newHp = max(0, 33-32) = 1. Massive damage: 32 >= 33/2 (16.5) -> injuryGained = true, newInjuries = 1.
- **Status:** CORRECT
- **Implementation check:** calculateDamage in combatant.service.ts line 50 confirms `injuryGained = hpDamage >= maxHp / 2`

### Assertion 4: Capture rate at 1 HP with 1 injury
- **Scenario says:** captureRate = 100 + (-16) + 30 + 10 + 5 = 129
- **Independent derivation:**
  base: 100
  levelModifier: -16
  hpModifier: currentHp === 1 -> +30 (captureRate.ts line 90, before percentage check)
  evolutionModifier: +10
  injuryModifier: 1 x 5 = +5
  captureRate = 100 + (-16) + 30 + 10 + 5 = **129**
- **Status:** CORRECT

### Assertion 5: Improved difficulty label
- **Scenario says:** 129 >= 80 -> "Very Easy"
- **Independent derivation:** getCaptureDescription(129): 129 >= 80? Yes -> "Very Easy"
- **Status:** CORRECT

### Assertion 6: Capture is mathematically guaranteed
- **Scenario says:** Max possible roll = 100 -> modifiedRoll = 95 -> 95 <= 129 -> always true
- **Independent derivation:** captureRate = 129, trainerLevel = 5. modifiedRoll = roll - 5. Max roll = 100: if naturalHundred (roll=100) -> captured. If roll=99: modifiedRoll = 94, 94 <= 129 -> captured. Min roll=1: modifiedRoll = -4, -4 <= 129 -> captured. Every possible roll produces success.
- **Status:** CORRECT
- **Implementation check:** attemptCapture in captureRate.ts lines 186-210 confirmed: `success = naturalHundred || modifiedRoll <= effectiveCaptureRate`

### Assertion 7: Ownership transferred
- **Scenario says:** ownerId = $trainer_id, origin = "captured"
- **Independent derivation:** attempt.post.ts lines 93-100: on success, `prisma.pokemon.update({ ownerId: body.trainerId, origin: 'captured' })`. Confirmed.
- **Status:** CORRECT

### Assertion 8: Combat state preserved
- **Scenario says:** currentHp = 1
- **Independent derivation:** attempt.post.ts only updates ownerId and origin fields — currentHp, statusConditions, injuries are not modified by the capture endpoint. Pokemon retains currentHp = 1.
- **Status:** CORRECT

## Data Validity
- [x] Oddish: base stats match gen1/oddish.md (HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3)
- [x] Oddish types: Grass/Poison matches pokedex
- [x] Oddish evolution: stage 1 of 3 (Oddish -> Gloom -> Vileplume/Bellossom) matches pokedex
- [x] No moves used in this scenario
- [x] No abilities referenced in this scenario

## Completeness Check
- [x] Loop capture-workflow-standard-capture steps covered: setup, damage, rate preview, capture attempt, post-capture verification
- [x] All expected outcomes have assertions with derivations
- [x] Edge case: Poke Ball accuracy roll not exercised (optional parameter, FEATURE_GAP per loop feasibility)
- [x] Massive damage injury implicitly tested via 32/33 HP damage

## Errata Check
- Errata file contains a Sept 2015 Playtest d20-based capture system. App implements PTU 1.05 core d100 system. No errata corrections apply to this scenario.

## Issues Found
<!-- Empty — all assertions correct -->
