---
scenario_id: combat-basic-physical-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Charmander starting HP
- **Scenario says:** HP = level(10) + (baseHp(4) x 3) + 10 = 10 + 12 + 10 = 32
- **Independent derivation:** HP = 10 + (4 x 3) + 10 = 10 + 12 + 10 = 32
- **Status:** CORRECT

### Assertion 2: Accuracy threshold
- **Scenario says:** Physical Evasion = floor(DEF(4) / 5) = 0. Threshold = AC(2) + 0 = 2.
- **Independent derivation:** Charmander DEF = 4. floor(4 / 5) = floor(0.8) = 0. Threshold = 2 + 0 = 2.
- **Status:** CORRECT

### Assertion 3: Damage calculation
- **Scenario says:** Tackle DB 5 -> set damage 13. No STAB (Grass/Poison != Normal). Damage = 13 + ATK(5) - DEF(4) = 14. Normal vs Fire = neutral. Final = 14.
- **Independent derivation:** DB 5 set damage = 13 (chart: 9 / 13 / 16). Bulbasaur is Grass/Poison, Tackle is Normal -- no STAB. 13 + 5 - 4 = 14. Normal vs Fire = neutral (x1). Final = 14.
- **Status:** CORRECT

### Assertion 4: Charmander HP after attack
- **Scenario says:** 32 - 14 = 18. HP displays "18/32".
- **Independent derivation:** 32 - 14 = 18.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Bulbasaur types: Grass/Poison matches pokedex
- [x] Charmander types: Fire matches pokedex
- [x] Tackle learnable by Bulbasaur at level 10 (learned at level 1)
- [x] Tackle stats: Normal, DB 5, Physical, AC 2 -- match move reference

## Completeness Check
- [x] Move selection and target selection -- covered
- [x] Accuracy threshold with evasion -- covered
- [x] Set damage lookup -- covered
- [x] ATK vs DEF damage formula -- covered
- [x] Type effectiveness (neutral) -- covered
- [x] HP reduction -- covered

## Errata Check
- No errata affects basic physical attack mechanics

## Issues Found
(none)
