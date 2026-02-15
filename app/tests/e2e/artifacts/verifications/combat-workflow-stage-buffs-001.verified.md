---
scenario_id: combat-workflow-stage-buffs-001
verified_at: 2026-02-15T12:00:00Z
status: PASS
assertions_checked: 8
assertions_correct: 8
---

## Assertion Verification

### Assertion 1: HP and Initiative
- **Scenario says:** Growlithe HP = 43, Bulbasaur HP = 39, Growlithe(SPD 6) before Bulbasaur(SPD 5)
- **Independent derivation:**
  - Growlithe HP = 15 + (6 × 3) + 10 = 43. SPD = 6 (gen1/growlithe.md)
  - Bulbasaur HP = 14 + (5 × 3) + 10 = 39. SPD = 5 (gen1/bulbasaur.md)
  - 6 > 5 → Growlithe first
- **Status:** CORRECT

### Assertion 2: Stage Applied (+2 SpATK)
- **Scenario says:** Previous = 0, change = +2, current = +2
- **Independent derivation:** 0 + 2 = +2. Within [-6, +6] range.
- **Status:** CORRECT

### Assertion 3: Net Stage After Debuff
- **Scenario says:** Previous = +2, change = −1, current = +1, multiplier = ×1.2
- **Independent derivation:** +2 + (−1) = +1. Stage multiplier table (core/07-combat.md p235): +1 = ×1.2.
- **Status:** CORRECT

### Assertion 4: Modified Stat
- **Scenario says:** Base SpATK = 7, stage = +1, modified = floor(7 × 1.2) = floor(8.4) = 8
- **Independent derivation:** 7 × 1.2 = 8.4, floor(8.4) = 8. Per "raised by 20%, rounded down" (core/07-combat.md p235).
- **Status:** CORRECT

### Assertion 5: Damage (Stage-Boosted Ember → Bulbasaur)
- **Scenario says:** Ember DB 6 (STAB), set damage 15, modified SpATK 8 − SpDEF 7 = 1, raw 16, Fire vs Grass/Poison ×1.5, final = floor(24) = 24
- **Independent derivation:**
  - Ember: Fire, Special, DB 4 + STAB 2 = 6
  - STAB check: Growlithe(Fire) + Ember(Fire) → match ✓
  - Set damage DB 6 = 15
  - Modified SpATK = 8 (from assertion 4), SpDEF(Bulbasaur) = 7
  - Raw = max(1, 15 + 8 − 7) = 16
  - Type: Fire vs Grass = SE (×1.5), Fire vs Poison = Neutral (×1), combined = ×1.5
  - Final = floor(16 × 1.5) = floor(24) = 24
- **Status:** CORRECT

### Assertion 6: HP After Stage-Boosted Attack
- **Scenario says:** Bulbasaur HP 39 − 24 = 15. Compare: without stages, raw = 15, final = floor(22.5) = 22. Stages added 2 damage.
- **Independent derivation:** 39 − 24 = 15. Without stage: SpATK = 7, raw = max(1, 15 + 7 − 7) = 15, final = floor(15 × 1.5) = floor(22.5) = 22. Difference: 24 − 22 = 2.
- **Status:** CORRECT

### Assertion 7: Stage-Modified Evasion
- **Scenario says:** Base SpDEF 7, base evasion = floor(7/5) = 1. With +3 stage: modified SpDEF = floor(7 × 1.6) = 11, evasion = floor(11/5) = 2
- **Independent derivation:**
  - Base Special Evasion = floor(7 / 5) = floor(1.4) = 1
  - +3 CS multiplier = ×1.6 (core/07-combat.md p235)
  - Modified SpDEF = floor(7 × 1.6) = floor(11.2) = 11
  - Modified Special Evasion = floor(11 / 5) = floor(2.2) = 2
  - Per "Raising your Defense, Special Defense, and Speed Combat Stages can give you additional evasion" (core/07-combat.md p234)
- **Status:** CORRECT

### Assertion 8: Stage Clamping
- **Scenario says:** Bulbasaur SpDEF stage = +3, within [-6, +6]
- **Independent derivation:** +3 is within [-6, +6] range. Per "may never be raised higher than +6 or lower than -6" (core/07-combat.md p235).
- **Status:** CORRECT

## Data Validity
- [x] Growlithe: base stats match gen1/growlithe.md (HP 6, ATK 7, DEF 5, SpATK 7, SpDEF 5, SPD 6)
- [x] Growlithe: type Fire matches gen1/growlithe.md
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5)
- [x] Bulbasaur: types Grass/Poison match gen1/bulbasaur.md
- [x] Ember: learnable by Growlithe at L15 (learned at L6 per gen1/growlithe.md)
- [x] STAB: Growlithe(Fire) + Ember(Fire) → correctly applied
- [x] Type effectiveness: Fire vs Grass = SE (×1.5) — verified
- [x] Type effectiveness: Fire vs Poison = Neutral (×1) — verified
- [x] Stage multiplier table values: +1=×1.2, +3=×1.6 — match core/07-combat.md p235

## Completeness Check
- [x] Loop combat-workflow-stage-buffs-and-matchups: Stage buff applied (+2)
- [x] Stage debuff applied (−1), net calculated
- [x] Modified stat used in damage calculation
- [x] STAB applied with stages
- [x] Type effectiveness applied after defense
- [x] Evasion recalculated from stage-modified stat
- [x] Stage clamping verified

## Errata Check
- No errata in errata-2.md affects combat stages, STAB, or type effectiveness formulas used here.

## Lessons Applied
- [x] Lesson 1 (STAB eligibility): Growlithe/Ember pair verified — Fire matches Fire ✓
- [x] Lesson 2 (learn level): Ember L6 ≤ Growlithe L15 ✓
- [x] Lesson 3 (type effectiveness): Fire vs Grass and Fire vs Poison individually verified

## Issues Found
<!-- None -->
