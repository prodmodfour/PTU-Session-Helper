---
scenario_id: capture-mechanic-hp-modifier-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 6
assertions_correct: 6
---

## Assertion Verification

### Assertion 1: Full HP (100%) -> hpModifier = -30
- **Scenario says:** hpPercentage = 100%, > 75% -> -30, captureRate = 60
- **Independent derivation:**
  Constant components: 100 + (-20) + 10 = 90 (base + levelMod + evoMod)
  hpPercentage = (40/40) x 100 = 100%
  Code path: currentHp !== 1 (40 != 1), 100 > 25, 100 > 50, 100 > 75 -> else branch -> -30
  captureRate = 90 + (-30) = **60**
- **Status:** CORRECT

### Assertion 2: Exactly 75% HP -> hpModifier = -15
- **Scenario says:** hpPercentage = 75%, <= 75% -> -15, captureRate = 75
- **Independent derivation:**
  hpPercentage = (30/40) x 100 = 75%
  Code path: currentHp !== 1 (30 != 1), 75 > 25, 75 > 50, 75 <= 75 -> -15
  captureRate = 90 + (-15) = **75**
- **Status:** CORRECT

### Assertion 3: Exactly 50% HP -> hpModifier = 0
- **Scenario says:** hpPercentage = 50%, <= 50% -> 0, captureRate = 90
- **Independent derivation:**
  hpPercentage = (20/40) x 100 = 50%
  Code path: currentHp !== 1 (20 != 1), 50 > 25, 50 <= 50 -> 0
  captureRate = 90 + 0 = **90**
- **Status:** CORRECT

### Assertion 4: Exactly 25% HP -> hpModifier = +15
- **Scenario says:** hpPercentage = 25%, <= 25% -> +15, captureRate = 105
- **Independent derivation:**
  hpPercentage = (10/40) x 100 = 25%
  Code path: currentHp !== 1 (10 != 1), 25 <= 25 -> +15
  captureRate = 90 + 15 = **105**
- **Status:** CORRECT

### Assertion 5: Exactly 1 HP -> hpModifier = +30 (special case)
- **Scenario says:** currentHp === 1 -> +30, captureRate = 120
- **Independent derivation:**
  Code path: currentHp === 1 (line 90) -> +30 (checked BEFORE percentage tiers)
  hpPercentage would be (1/40) x 100 = 2.5% but never evaluated
  captureRate = 90 + 30 = **120**
- **Status:** CORRECT
- **Implementation check:** Confirmed captureRate.ts line 90: `if (currentHp === 1) { hpModifier = 30 }` before else-if chain

### Assertion 6: 0 HP -> canBeCaptured = false
- **Scenario says:** canBeCaptured = currentHp > 0 -> false
- **Independent derivation:** captureRate.ts line 77: `const canBeCaptured = currentHp > 0`. 0 > 0 = false.
- **Status:** CORRECT

## Data Validity
- [x] Oddish: evolution lookup via SpeciesData -> stage 1, Math.max(3,1) = 3, remaining 2, modifier +10
- [x] Direct-data mode used (no Pokemon DB record) — deterministic assertions
- [x] All HP values produce clean percentages with maxHp = 40

## Completeness Check
- [x] Loop capture-mechanic-hp-modifier: all 5 tier boundaries tested (>75%, =75%, =50%, =25%, =1HP)
- [x] 0 HP edge case tested (canBeCaptured = false)
- [x] 1 HP special case priority over percentage tiers verified
- [x] All expected outcomes have assertions

## Errata Check
- No errata corrections apply. HP modifier tiers match 1.05 core rules.

## Issues Found
<!-- Empty — all assertions correct -->
