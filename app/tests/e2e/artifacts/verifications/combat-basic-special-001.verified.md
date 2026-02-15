---
scenario_id: combat-basic-special-001
verified_at: 2026-02-15T19:00:00Z
status: PARTIAL
assertions_checked: 4
assertions_correct: 2
---

## Assertion Verification

### Assertion 1: Machop starting HP
- **Scenario says:** HP = level(10) + (baseHp(7) x 3) + 10 = 10 + 21 + 10 = 41
- **Independent derivation:** HP = 10 + (7 x 3) + 10 = 10 + 21 + 10 = 41
- **Status:** CORRECT

### Assertion 2: Special Evasion used (not Physical)
- **Scenario says:** Special Evasion = floor(SpDEF(4) / 5) = 0. Threshold = 2 + 0 = 2.
- **Independent derivation:** SpDEF = 4. floor(4 / 5) = floor(0.8) = 0. Threshold = MoveAC(2) + SpecialEvasion(0) = 2. Physical Evasion = floor(DEF(5)/5) = 1 (correctly NOT used for Special moves).
- **Status:** CORRECT

### Assertion 3: Damage uses SpATK vs SpDEF
- **Scenario says:** Ember DB 4, set damage = 11. Damage = 11 + SpATK(6) - SpDEF(4) = 13. No STAB.
- **Independent derivation:** Charmander is Fire type. Ember is Fire type. STAB APPLIES: DB 4 + 2 = 6. DB 6 -> set damage = 15 (from chart: 10 / 15 / 20). Damage = 15 + SpATK(6) - SpDEF(4) = 17. Fire vs Fighting = neutral (x1). Final = 17.
- **Status:** INCORRECT
- **Fix:** STAB must be applied. Charmander (Fire) using Ember (Fire) is a type match. Correct damage = 17, not 13. The scenario says "No STAB yet (tested separately)" but the app will apply STAB -- the assertion will fail against a correctly functioning app.

### Assertion 4: Machop HP after attack
- **Scenario says:** 41 - 13 = 28. HP displays "28/41".
- **Independent derivation:** With STAB: 41 - 17 = 24. HP should display "24/41".
- **Status:** INCORRECT
- **Fix:** HP after attack should be "24/41" (not "28/41")

## Data Validity
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Machop: base stats match gen1/machop.md (HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4)
- [x] Charmander types: Fire matches pokedex
- [x] Machop types: Fighting matches pokedex
- [x] Ember learnable by Charmander at level 10 (learned at level 7)
- [x] Ember stats: Fire, DB 4, Special, AC 2 -- match move reference

## Completeness Check
- [x] Special move uses SpATK/SpDEF -- tested
- [x] Special Evasion (not Physical) -- tested
- [ ] STAB interaction -- incorrectly excluded. Recommendation: Use a non-STAB move for the basic special test (e.g., Charmander using a non-Fire Special move, or use a different attacker whose type doesn't match the move).

## Errata Check
- No errata affects Special attack or Ember mechanics

## Issues Found
1. **Assertions 3-4 are incorrect due to STAB omission.** Charmander (Fire) using Ember (Fire) triggers STAB. The scenario cannot "opt out" of STAB -- the app applies it automatically. Fix options:
   - **Option A (recommended):** Change attacker to a non-Fire Pokemon that knows a Special move (e.g., Pikachu using Electro Ball, or Gastly using a Special Ghost move)
   - **Option B:** Use a Special move that doesn't match Charmander's type (e.g., Dragon Rage at level 16, but that has fixed damage)
   - **Option C:** Accept STAB in the assertions: damage = 17, HP = "24/41"
