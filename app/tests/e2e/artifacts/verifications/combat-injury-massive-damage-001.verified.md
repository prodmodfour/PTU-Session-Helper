---
scenario_id: combat-injury-massive-damage-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Charmander max HP and injury threshold
- **Scenario says:** HP = 10 + (4 x 3) + 10 = 32. Massive Damage threshold = 32 x 0.5 = 16.
- **Independent derivation:** HP = 32. PTU: "damage equal to 50% or more of their Max Hit Points." 50% of 32 = 16.
- **Status:** CORRECT

### Assertion 2: Damage calculation
- **Scenario says:** Karate Chop DB 5 -> set damage 13. Damage = 13 + ATK(8) - DEF(4) = 17. Fighting vs Fire = neutral.
- **Independent derivation:** DB 5 set damage = 13. 13 + 8 - 4 = 17. Fighting vs Fire = neutral (x1) (Fire is not in Fighting's SE/resist/immune lists). Final = 17.
- **Status:** CORRECT

### Assertion 3: Massive Damage triggers injury
- **Scenario says:** Damage(17) >= threshold(16)? YES. Charmander gains 1 injury.
- **Independent derivation:** 17 >= 16 -> Massive Damage. PTU: "any single attack or damage source that does damage equal to 50% or more of their Max Hit Points" -> 1 injury. Injury count: 0 -> 1.
- **Status:** CORRECT

### Assertion 4: HP reduced but not fainted
- **Scenario says:** 32 - 17 = 15 (> 0). Not fainted. Injury count = 1.
- **Independent derivation:** 32 - 17 = 15. 15 > 0 -> not fainted. HP = "15/32", injuries = 1.
- **Status:** CORRECT

## Data Validity
- [x] Machop: ATK 8 matches gen1/machop.md
- [x] Charmander: HP 4, DEF 4 matches gen1/charmander.md
- [x] Karate Chop: Fighting, DB 5, Physical, AC 2 -- match move reference
- [x] Karate Chop learnable by Machop at level 10 (learned at level 7)

## Completeness Check
- [x] Massive Damage threshold calculation -- covered
- [x] Injury triggered at >= 50% -- covered
- [x] HP reduction -- covered
- [x] Not fainted (HP > 0) -- covered
- [ ] HP Marker injuries -- not tested (separate injury type)
- [ ] Multiple injuries from single hit -- not tested

## Errata Check
- No errata affects Massive Damage or injury mechanics

## Issues Found
(none)
