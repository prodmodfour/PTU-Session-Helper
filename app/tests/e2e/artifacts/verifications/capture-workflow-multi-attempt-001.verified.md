---
scenario_id: capture-workflow-multi-attempt-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 9
assertions_correct: 9
---

## Assertion Verification

### Assertion 1: Initial capture rate — deeply negative
- **Scenario says:** captureRate = 100 + (-90) + (-30) + 10 = -10
- **Independent derivation:**
  base: 100
  levelModifier: -(45 x 2) = -90
  hpModifier: (70/70) x 100 = 100%, > 75% -> -30
  evolutionModifier: Oddish stage 1/3, remaining 2 -> +10
  captureRate = 100 + (-90) + (-30) + 10 = **-10**
- **Status:** CORRECT

### Assertion 2: Capture difficulty label
- **Scenario says:** -10 < 1 -> "Nearly Impossible"
- **Independent derivation:** getCaptureDescription(-10): -10 >= 80? No. >= 60? No. >= 40? No. >= 20? No. >= 1? No -> "Nearly Impossible"
- **Status:** CORRECT

### Assertion 3: First attempt response confirms low rate and relational check
- **Scenario says:** captureRate = -10, modifiedRoll = roll - 5
- **Independent derivation:** attempt.post.ts calls attemptCapture(captureRate=-10, trainerLevel=5, modifiers=0, criticalHit=false). In attemptCapture: modifiedRoll = roll - 5 - 0 = roll - 5. Response includes captureRate from rateResult = -10. Relational assertion is implementation-sound.
- **Status:** CORRECT
- **Implementation check:** No accuracyRoll provided -> criticalHit = (undefined === 20) = false. effectiveCaptureRate = captureRate = -10.

### Assertion 4: HP after damage
- **Scenario says:** 70 - 69 = 1
- **Independent derivation:** calculateDamage(69, 70, 70, 0, 0): hpDamage = 69, newHp = max(0, 70-69) = 1.
- **Status:** CORRECT

### Assertion 5: Injury from massive damage
- **Scenario says:** 69/70 = 98.6% >= 50% -> 1 injury
- **Independent derivation:** calculateDamage: hpDamage = 69, maxHp/2 = 35. 69 >= 35 -> injuryGained = true. newInjuries = 0 + 1 = 1.
- **Status:** CORRECT

### Assertion 6: Status applied
- **Scenario says:** statusConditions includes "Paralyzed"
- **Independent derivation:** POST /api/encounters/:id/status with `add: ["Paralyzed"]` applies status to combatant and syncs to DB. Straightforward API operation.
- **Status:** CORRECT

### Assertion 7: Capture rate after improvements — dramatic swing
- **Scenario says:** captureRate = 100 + (-90) + 30 + 10 + 10 + 5 = 65
- **Independent derivation:**
  base: 100
  levelModifier: -90
  hpModifier: currentHp === 1 -> +30 (captureRate.ts line 90)
  evolutionModifier: +10
  statusModifier: Paralyzed (PERSISTENT_CONDITIONS) -> +10
  injuryModifier: 1 x 5 = +5
  captureRate = 100 + (-90) + 30 + 10 + 10 + 5 = **65**
  Change: -10 -> 65 (+75 swing)
- **Status:** CORRECT
- **Breakdown check:** hpModifier=30, statusModifier=10, injuryModifier=5 all match independent derivation.

### Assertion 8: Improved difficulty label
- **Scenario says:** 65 >= 60 -> "Easy"
- **Independent derivation:** getCaptureDescription(65): 65 >= 80? No. 65 >= 60? Yes -> "Easy"
- **Status:** CORRECT

### Assertion 9: Capture eventually succeeds and ownership transferred
- **Scenario says:** captured = true (eventual), ownerId = $trainer_id, origin = "captured"
- **Independent derivation:** captureRate = 65, trainerLevel = 5. modifiedRoll = roll - 5. Success if roll <= 70. P(success) = 70%. With up to 5 retries: P(at least one) = 1 - 0.3^5 = 99.76%. Post-capture: attempt.post.ts lines 93-100 set ownerId and origin.
- **Status:** CORRECT
- **Implementation check:** Retry loop approach is sound for non-deterministic roll testing.

## Data Validity
- [x] Oddish: base stats match gen1/oddish.md (HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3)
- [x] Oddish types: Grass/Poison matches pokedex
- [x] Oddish evolution: stage 1 of 3 matches pokedex
- [x] maxHp = 45 + (5 x 3) + 10 = 70 (PTU Pokemon HP formula)
- [x] No moves or abilities referenced

## Completeness Check
- [x] Loop capture-workflow-multi-attempt-retry steps covered: initial fail, damage, status application, rate improvement, retry capture
- [x] HP modifier improvement from -30 to +30 demonstrated
- [x] Status condition modifier (+10 Persistent) demonstrated
- [x] Injury modifier (+5) demonstrated
- [x] All expected outcomes have assertions
- [x] Retry loop handles non-deterministic roll

## Errata Check
- No errata corrections apply. App uses 1.05 core d100 system, not the playtest d20 variant.

## Issues Found
<!-- Empty — all assertions correct -->
