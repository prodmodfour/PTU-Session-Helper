---
scenario_id: combat-basic-special-001
verified_at: 2026-02-15T21:00:00
status: PASS
assertions_checked: 4
assertions_correct: 4
re_verification: true
previous_status: PARTIAL (2 of 4 correct — STAB omission on Charmander/Ember)
correction_applied: Replaced attacker with Psyduck(Water)/Confusion(Psychic) to eliminate STAB
---

## Assertion Verification

### Assertion 1: Charmander starting HP
- **Scenario says:** HP = level(11) + (baseHp(4) × 3) + 10 = 11 + 12 + 10 = 33
- **Independent derivation:** HP = 11 + (4 × 3) + 10 = 11 + 12 + 10 = 33
- **Status:** CORRECT

### Assertion 2: Special Evasion used (not Physical)
- **Scenario says:** Special Evasion = floor(SpDEF(5) / 5) = 1; Physical Evasion = floor(DEF(4) / 5) = 0; Threshold = AC(2) + SpecialEvasion(1) = 3
- **Independent derivation:** Confusion is Psychic-type, Special class → uses Special Evasion per PTU (core/07-combat.md p234: "for every 5 points in Special Defense, +1 Special Evasion"). Charmander SpDEF = 5, floor(5/5) = 1. Physical Evasion = floor(DEF(4)/5) = 0. Threshold = 2 + 1 = 3.
- **Status:** CORRECT

### Assertion 3: Damage uses SpATK vs SpDEF, no STAB
- **Scenario says:** DB 5 → set damage 13; no STAB (Psyduck=Water, Confusion=Psychic); Damage = 13 + SpATK(7) - SpDEF(5) = 15; Psychic vs Fire = neutral (×1); Final = 15
- **Independent derivation:** DB 5 → set damage chart: 9/13/16, average = 13. STAB check: Psyduck types = [Water], Confusion type = Psychic → no match → no STAB. Damage = 13 + 7 - 5 = 15. Type effectiveness: Psychic vs Fire = neutral (×1). Final damage = 15.
- **Status:** CORRECT
- **Previous issue resolved:** Original scenario used Charmander(Fire)/Ember(Fire) which triggered unwanted STAB. New Psyduck(Water)/Confusion(Psychic) pairing correctly isolates the "no STAB" case.

### Assertion 4: Charmander HP after attack
- **Scenario says:** 33 - 15 = 18, displays "18/33"
- **Independent derivation:** 33 - 15 = 18
- **Status:** CORRECT

## Data Validity

- [x] Psyduck: base stats match gen1/psyduck.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 5, SPD 6)
- [x] Psyduck: type Water matches pokedex
- [x] Confusion: learnable by Psyduck at level 11 (learned at level 11 — exact match)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Charmander: type Fire matches pokedex
- [x] DB 5 set damage = 13 matches PTU Damage Chart (core/07-combat.md p237)

## Completeness Check

- [x] Special move uses SpATK/SpDEF — tested
- [x] Special Evasion (not Physical) — tested and explicitly contrasted
- [x] No STAB correctly demonstrated (Water attacker, Psychic move — type mismatch)
- [x] HP outcome verified
- [ ] Edge case: Speed Evasion added to Special Evasion — separate scenario if needed

## Errata Check

- No errata in errata-2.md affects basic special attack mechanics, STAB, or evasion formulas

## Issues Found

(none — previous STAB issue fully resolved by species/move replacement)
