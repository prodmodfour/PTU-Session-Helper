---
scenario_id: combat-combat-stages-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Stage application and clamping
- **Scenario says:** Bulbasaur ATK +2 CS applied, clamped within [-6, +6].
- **Independent derivation:** +2 is within range. PTU: "may never be raised higher than +6 or lower than -6."
- **Status:** CORRECT

### Assertion 2: Modified stat calculation (positive stages)
- **Scenario says:** Multiplier at +2 = x1.4. Modified ATK = floor(5 x 1.4) = 7.
- **Independent derivation:** PTU table: +2 = x1.4. floor(5 x 1.4) = floor(7.0) = 7.
- **Status:** CORRECT

### Assertion 3: Damage with stage-modified ATK
- **Scenario says:** Tackle DB 5 -> set 13. Damage = 13 + ModifiedATK(7) - DEF(4) = 16. Baseline = 14.
- **Independent derivation:** 13 + 7 - 4 = 16. Without stages: 13 + 5 - 4 = 14. Difference = +2.
- **Status:** CORRECT

### Assertion 4: Negative stage test
- **Scenario says:** -2 DEF CS. Multiplier = x0.8. Modified DEF = floor(4 x 0.8) = 3.
- **Independent derivation:** PTU table: -2 = x0.8. floor(4 x 0.8) = floor(3.2) = 3.
- **Status:** CORRECT

### Assertion 5: Stage multiplier table verification
- **Scenario says:** Full multiplier table from -6 to +6.
- **Independent derivation:** Matches PTU: -6=x0.4, -5=x0.5, -4=x0.6, -3=x0.7, -2=x0.8, -1=x0.9, 0=x1, +1=x1.2, +2=x1.4, +3=x1.6, +4=x1.8, +5=x2.0, +6=x2.2.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: ATK 5 matches gen1/bulbasaur.md
- [x] Charmander: DEF 4 matches gen1/charmander.md
- [x] Tackle: DB 5, Physical -- match move reference

## Completeness Check
- [x] Positive stage application -- covered
- [x] Negative stage application -- covered
- [x] Modified stat in damage calc -- covered
- [x] Full multiplier table -- covered
- [ ] Evasion recalculation from modified stats -- not tested (sub-loop combat-stages-evasion-bonus)
- [ ] Speed stages and movement -- not tested (sub-loop combat-stages-speed-movement)

## Errata Check
- No errata affects combat stage mechanics

## Issues Found
(none)
