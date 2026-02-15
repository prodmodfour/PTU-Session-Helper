---
scenario_id: combat-struggle-attack-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Struggle fixed stats
- **Scenario says:** AC 4, DB 4, Physical, Normal type.
- **Independent derivation:** PTU: "Struggle Attacks have an AC of 4 and a Damage Base of 4, are Melee-Ranged, Physical, and Normal Type."
- **Status:** CORRECT

### Assertion 2: No STAB on Struggle
- **Scenario says:** Bulbasaur is Grass/Poison, Struggle is Normal -- no match. But even with match, STAB never applies.
- **Independent derivation:** PTU: "Never apply STAB to Struggle Attacks." Regardless of type match, STAB = 0. DB stays 4.
- **Status:** CORRECT

### Assertion 3: Damage calculation
- **Scenario says:** DB 4 -> set damage 11. Damage = 11 + ATK(5) - DEF(4) = 12. Normal vs Fire = neutral. Final = 12.
- **Independent derivation:** DB 4 set damage = 11 (chart: 7 / 11 / 14). 11 + 5 - 4 = 12. Normal vs Fire = neutral (x1). Final = 12.
- **Status:** CORRECT

### Assertion 4: Charmander HP after Struggle
- **Scenario says:** HP 32 - 12 = 20. Displays "20/32".
- **Independent derivation:** 32 - 12 = 20.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: ATK 5 matches gen1/bulbasaur.md
- [x] Charmander: HP 4 (=32 calculated), DEF 4 matches gen1/charmander.md
- [x] Struggle stats match PTU rulebook

## Completeness Check
- [x] Fixed Struggle stats -- covered
- [x] No STAB on Struggle -- covered
- [x] Damage calculation -- covered
- [ ] Expert Combat upgrade (AC 3, DB 5) -- not tested (edge case)
- [ ] Capability modifiers changing Struggle type -- not tested (edge case)

## Errata Check
- No errata affects Struggle Attack mechanics

## Issues Found
(none)
