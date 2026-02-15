---
scenario_id: capture-mechanic-status-modifiers-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 6
assertions_correct: 6
---

## Assertion Verification

### Assertion 1: Paralyzed (Persistent) -> statusModifier +10
- **Scenario says:** captureRate = 90 + 10 = 100, breakdown.statusModifier = 10
- **Independent derivation:**
  Constant: 90 (100 - 20 + 0 + 10)
  For loop over ['Paralyzed']:
    'Paralyzed' in PERSISTENT_CONDITIONS (captureRate.ts line 16-18)? Yes -> statusModifier += 10
  captureRate = 90 + 10 = **100**
- **Status:** CORRECT

### Assertion 2: Confused (Volatile) -> statusModifier +5
- **Scenario says:** captureRate = 90 + 5 = 95, breakdown.statusModifier = 5
- **Independent derivation:**
  For loop over ['Confused']:
    'Confused' in PERSISTENT_CONDITIONS? No. else if VOLATILE_CONDITIONS (line 21-24)? Yes -> statusModifier += 5
  captureRate = 90 + 5 = **95**
- **Status:** CORRECT

### Assertion 3: Stuck -> stuckModifier +10 (separate from statusModifier)
- **Scenario says:** captureRate = 100, breakdown.stuckModifier = 10, breakdown.statusModifier = 0
- **Independent derivation:**
  For loop over ['Stuck']:
    'Stuck' in PERSISTENT_CONDITIONS? No. else if VOLATILE_CONDITIONS? No. -> statusModifier stays 0
    'Stuck' in STUCK_CONDITIONS (line 27)? Yes -> stuckModifier += 10
  captureRate = 90 + 0 + 10 = **100**
- **Status:** CORRECT
- **Implementation check:** The if/else-if for Persistent/Volatile means Stuck does NOT add to statusModifier. Separate if-check for STUCK_CONDITIONS adds to stuckModifier. Code lines 123-136 confirmed.

### Assertion 4: Slowed -> slowModifier +5 (separate from statusModifier)
- **Scenario says:** captureRate = 95, breakdown.slowModifier = 5, breakdown.statusModifier = 0
- **Independent derivation:**
  For loop over ['Slowed']:
    'Slowed' in PERSISTENT_CONDITIONS? No. else if VOLATILE_CONDITIONS? No. -> statusModifier stays 0
    'Slowed' in SLOW_CONDITIONS (line 28)? Yes -> slowModifier += 5
  captureRate = 90 + 0 + 5 = **95**
- **Status:** CORRECT

### Assertion 5: Stacked Paralyzed + Confused -> statusModifier +15
- **Scenario says:** captureRate = 90 + 15 = 105, breakdown.statusModifier = 15
- **Independent derivation:**
  For 'Paralyzed': PERSISTENT -> statusModifier += 10
  For 'Confused': VOLATILE -> statusModifier += 5
  Total statusModifier = 15
  captureRate = 90 + 15 = **105**
- **Status:** CORRECT

### Assertion 6: Burned + Stuck + Slowed -> +25 across three modifier fields
- **Scenario says:** captureRate = 115, breakdown: statusModifier=10, stuckModifier=10, slowModifier=5
- **Independent derivation:**
  For 'Burned': PERSISTENT -> statusModifier += 10. Not in STUCK or SLOW.
  For 'Stuck': Not Persistent/Volatile (statusModifier unchanged). STUCK_CONDITIONS -> stuckModifier += 10.
  For 'Slowed': Not Persistent/Volatile. SLOW_CONDITIONS -> slowModifier += 5.
  captureRate = 90 + 10 + 10 + 5 = **115**
- **Status:** CORRECT

## Data Validity
- [x] Oddish: evolution lookup correct (stage 1/3, +10)
- [x] Direct-data mode used — deterministic assertions
- [x] Status conditions are valid PTU statuses
- [x] Paralyzed: Persistent (PTU core/07-combat.md) ✓
- [x] Confused: Volatile (PTU core/07-combat.md) ✓
- [x] Stuck, Slowed: Special conditions (PTU core/05-pokemon.md p215) ✓
- [x] Burned: Persistent (PTU core/07-combat.md) ✓

## Completeness Check
- [x] Loop capture-mechanic-status-modifiers: Persistent, Volatile, Stuck, Slow all tested
- [x] Stacking behavior tested (Persistent + Volatile, Mixed all-three)
- [x] Three separate modifier fields (statusModifier, stuckModifier, slowModifier) verified
- [x] Edge case: Stuck not counted in statusModifier — verified via separate assertion

## Errata Check
- No errata corrections apply.

## Issues Found
<!-- Empty — all assertions correct -->
