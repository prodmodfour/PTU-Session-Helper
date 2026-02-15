---
scenario_id: combat-type-immunity-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

### Assertion 1: Immunity detection
- **Scenario says:** Fighting vs Ghost = Immune (x0). "If either Type is Immune, the attack does 0 damage."
- **Independent derivation:** Ghost types are immune to Fighting-type attacks (and Normal-type). Gastly is Ghost/Poison. Fighting vs Ghost = immune. Combined = x0.
- **Status:** CORRECT

### Assertion 2: No HP change on immune target
- **Scenario says:** Gastly HP = 10 + (3 x 3) + 10 = 29. Would-be damage = 18 but immunity -> 0. HP remains "29/29".
- **Independent derivation:** HP = 10 + 9 + 10 = 29. DB 5 set damage = 13. Would-be: 13 + ATK(8) - DEF(3) = 18. Immunity overrides: damage = 0. HP = 29/29.
- **Status:** CORRECT

### Assertion 3: Move still consumed
- **Scenario says:** Move frequency consumed even on immunity.
- **Independent derivation:** PTU: Move is "used" regardless of whether it deals damage. Frequency consumed.
- **Status:** CORRECT

## Data Validity
- [x] Machop: base stats match gen1/machop.md (ATK 8)
- [x] Gastly: base stats match gen1/gastly.md (HP 3, DEF 3, types Ghost/Poison)
- [x] Karate Chop: Fighting, DB 5, Physical, AC 2 -- match move reference
- [x] Karate Chop learnable by Machop at level 10 (learned at level 7)

## Completeness Check
- [x] Immunity detection -- covered
- [x] Zero damage on immunity -- covered
- [x] HP unchanged -- covered
- [x] Move consumed -- covered

## Errata Check
- No errata affects type immunity mechanics

## Issues Found
(none)
