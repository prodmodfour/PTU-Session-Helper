---
scenario_id: combat-damage-and-faint-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Charmander max HP
- **Scenario says:** HP = level(10) + (baseHp(4) x 3) + 10 = 32
- **Independent derivation:** HP = 10 + 12 + 10 = 32
- **Status:** CORRECT

### Assertion 2: After first 20 damage
- **Scenario says:** 32 - 20 = 12
- **Independent derivation:** 32 - 20 = 12
- **Status:** CORRECT

### Assertion 3: After second 20 damage -- HP floored at 0
- **Scenario says:** 12 - 20 = -8, floored to max(0, -8) = 0
- **Independent derivation:** 12 - 20 = -8. App floors at 0. HP = 0.
- **Status:** CORRECT

### Assertion 4: Fainted status on HP reaching 0
- **Scenario says:** Charmander has "Fainted" in statusConditions.
- **Independent derivation:** PTU: "A Pokemon at 0 Hit Points or less is Fainted." HP = 0 -> Fainted.
- **Status:** CORRECT

### Assertion 5: Fainted combatant turn skipped
- **Scenario says:** Charmander's turn is skipped in next round.
- **Independent derivation:** PTU: Fainted Pokemon "cannot use any Actions." Turn should be skipped.
- **Status:** CORRECT

## Data Validity
- [x] Machop: base stats match gen1/machop.md (HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4)
- [x] Charmander: base stats match gen1/charmander.md (HP 4)
- [x] HP formula correct for Charmander

## Completeness Check
- [x] Direct damage application -- covered
- [x] HP floor at 0 -- covered
- [x] Fainted status added -- covered
- [x] Fainted turn skipped -- covered
- [ ] Statuses cleared on faint -- not explicitly tested (PTU states persistent/volatile statuses clear on faint)

## Errata Check
- No errata affects damage application or faint mechanics

## Issues Found
(none)
