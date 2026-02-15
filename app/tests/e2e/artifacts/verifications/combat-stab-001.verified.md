---
scenario_id: combat-stab-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: STAB detection
- **Scenario says:** Charmander types = [Fire]. Ember type = Fire. Match found.
- **Independent derivation:** Charmander type from pokedex: Fire. Ember type from move reference: Fire. Type match -> STAB applies. PTU: "If a Pokemon uses a damaging Move with which it shares a Type, the Damage Base of the Move is increased by +2."
- **Status:** CORRECT

### Assertion 2: Effective Damage Base with STAB
- **Scenario says:** Base DB = 4. STAB = +2. Effective DB = 6.
- **Independent derivation:** DB 4 + 2 (STAB) = 6.
- **Status:** CORRECT

### Assertion 3: Set damage at boosted DB
- **Scenario says:** DB 6 -> set damage 15. Damage = 15 + SpATK(6) - SpDEF(4) = 17.
- **Independent derivation:** DB 6 set damage from chart = 15 (10 / 15 / 20). 15 + 6 - 4 = 17. Fire vs Fighting = neutral (x1). Final = 17.
- **Status:** CORRECT

### Assertion 4: Machop HP after STAB attack
- **Scenario says:** Machop HP = 41. Remaining = 41 - 17 = 24.
- **Independent derivation:** HP = 10 + (7 x 3) + 10 = 41. 41 - 17 = 24.
- **Status:** CORRECT

## Data Validity
- [x] Charmander: base stats match gen1/charmander.md (SpATK 6)
- [x] Machop: base stats match gen1/machop.md (HP 7, SpDEF 4)
- [x] Ember: Fire, DB 4, Special, AC 2 -- match move reference
- [x] Ember learnable at level 10 (learned at level 7)

## Completeness Check
- [x] STAB detection -- covered
- [x] DB increase of +2 -- covered
- [x] Set damage at boosted DB -- covered
- [x] Damage comparison with/without STAB -- covered (11 vs 15 noted)
- [ ] Struggle STAB exclusion -- not tested here (tested in combat-struggle-attack-001)

## Errata Check
- No errata affects STAB mechanics

## Issues Found
(none)
