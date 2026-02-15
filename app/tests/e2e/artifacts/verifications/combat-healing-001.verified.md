---
scenario_id: combat-healing-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Starting HP
- **Scenario says:** Charmander HP = 10 + (4 x 3) + 10 = 32
- **Independent derivation:** HP = 10 + 12 + 10 = 32
- **Status:** CORRECT

### Assertion 2: After 20 damage
- **Scenario says:** 32 - 20 = 12. HP displays "12/32".
- **Independent derivation:** 32 - 20 = 12.
- **Status:** CORRECT

### Assertion 3: After 15 heal
- **Scenario says:** min(32, 12 + 15) = min(32, 27) = 27. HP displays "27/32".
- **Independent derivation:** 12 + 15 = 27. 27 <= 32 (max HP). HP = 27.
- **Status:** CORRECT

### Assertion 4: After 10 more heal -- capped at max
- **Scenario says:** min(32, 27 + 10) = min(32, 37) = 32. HP displays "32/32".
- **Independent derivation:** 27 + 10 = 37. Capped at max HP = 32. HP = 32.
- **Status:** CORRECT

## Data Validity
- [x] Charmander: HP base 4 matches gen1/charmander.md
- [x] HP formula: level(10) + (baseHp(4) x 3) + 10 = 32

## Completeness Check
- [x] Damage reduction -- covered
- [x] Healing increase -- covered
- [x] Max HP cap -- covered
- [ ] Healing from faint (0 HP -> positive) -- not tested in this scenario
- [ ] Injury healing -- not tested in this scenario

## Errata Check
- No errata affects healing mechanics

## Issues Found
(none)
