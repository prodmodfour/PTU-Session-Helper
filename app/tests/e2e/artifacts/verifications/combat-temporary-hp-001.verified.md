---
scenario_id: combat-temporary-hp-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

### Assertion 1: Before damage -- Temp HP stacked on real HP
- **Scenario says:** Charmander HP = 32/32, Temp HP = 10.
- **Independent derivation:** HP = 10 + (4 x 3) + 10 = 32. Temp HP granted = 10. Real HP unaffected.
- **Status:** CORRECT

### Assertion 2: After 15 damage -- Temp HP absorbs first
- **Scenario says:** tempHpAbsorbed = min(10, 15) = 10. remainingDamage = 5. newHp = 32 - 5 = 27. newTempHp = 0.
- **Independent derivation:** PTU: "Temporary Hit Points are always lost first from damage." 10 temp HP absorbs 10 of the 15 damage. Remaining 5 hits real HP: 32 - 5 = 27. Temp HP = 0.
- **Status:** CORRECT

### Assertion 3: After 8 more damage -- no Temp HP
- **Scenario says:** tempHpAbsorbed = 0. remainingDamage = 8. newHp = 27 - 8 = 19.
- **Independent derivation:** No temp HP remaining. Full 8 damage to real HP: 27 - 8 = 19.
- **Status:** CORRECT

## Data Validity
- [x] Charmander: HP base 4 matches gen1/charmander.md
- [x] HP formula correct: 32

## Completeness Check
- [x] Temp HP absorbs damage first -- covered
- [x] Remainder carries to real HP -- covered
- [x] No temp HP = all to real HP -- covered
- [ ] Temp HP does not stack (highest applies) -- not tested
- [ ] Temp HP does not count for HP percentage -- not tested

## Errata Check
- No errata affects Temporary HP mechanics

## Issues Found
(none)
