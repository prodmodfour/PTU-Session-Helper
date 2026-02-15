---
scenario_id: combat-critical-hit-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Normal (non-crit) damage baseline
- **Scenario says:** Tackle DB 5 -> set damage 13. Normal = 13 + ATK(5) - DEF(4) = 14.
- **Independent derivation:** DB 5 set damage = 13 (chart: 9 / 13 / 16). No STAB (Grass/Poison != Normal). 13 + 5 - 4 = 14.
- **Status:** CORRECT

### Assertion 2: Critical hit doubles set damage, not stat
- **Scenario says:** Crit set damage = 13 x 2 = 26. Crit damage = 26 + ATK(5) - DEF(4) = 27. NOT (13+5-4) x 2 = 28.
- **Independent derivation:** PTU: "A Critical Hit adds the Damage Dice Roll a second time...but does not add Stats a second time; for example, a DB6 Move Crit would be 4d6+16+Stat, or 30+Stat going by set damage." For set damage: double the set damage value, add stat once. 13 x 2 = 26. 26 + 5 - 4 = 27.
- **Status:** CORRECT

### Assertion 3: Type effectiveness applies normally on crits
- **Scenario says:** Normal vs Fire = neutral (x1). Final = 27.
- **Independent derivation:** Normal vs Fire = neutral. 27 x 1 = 27.
- **Status:** CORRECT

### Assertion 4: Charmander HP after critical hit
- **Scenario says:** HP 32 - 27 = 5. Displays "5/32".
- **Independent derivation:** HP = 10 + 12 + 10 = 32. 32 - 27 = 5.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (ATK 5)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, DEF 4)
- [x] Tackle: Normal, DB 5, Physical, AC 2 -- match move reference
- [x] Tackle learnable at level 10 (learned at level 1)

## Completeness Check
- [x] Crit doubles set damage -- covered
- [x] Stats NOT doubled -- explicitly shown (27 not 28)
- [x] Type effectiveness on crit -- covered
- [ ] Crit + STAB interaction -- not tested (would need STAB-eligible crit scenario)

## Errata Check
- No errata affects critical hit mechanics

## Issues Found
(none)
