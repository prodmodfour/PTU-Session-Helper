---
scenario_id: combat-minimum-damage-001
verified_at: 2026-02-15T19:00:00Z
status: PARTIAL
assertions_checked: 3
assertions_correct: 2
---

## Assertion Verification

### Assertion 1: Modified DEF with +6 combat stages
- **Scenario says:** Multiplier at +6 = x2.2. Modified DEF = floor(10 x 2.2) = 22.
- **Independent derivation:** CS +6 multiplier = x2.2 (from PTU table). floor(10 x 2.2) = floor(22.0) = 22.
- **Status:** CORRECT

### Assertion 2: Raw damage is negative, minimum 1 applied
- **Scenario says:** Raw = 13 + 5 - 22 = -4. Normal vs Rock/Ground = neutral (x1). Final = max(1, -4) x 1 = 1.
- **Independent derivation:** Raw = 13 + 5 - 22 = -4. After defense min: max(1, -4) = 1. BUT the scenario claims "Normal vs Rock/Ground = neutral (x1)" -- this is INCORRECT. Normal is resisted by Rock type: Normal vs Rock = x0.5, Normal vs Ground = x1. Combined = x0.5. Correct derivation: After defense min: 1. After effectiveness: floor(1 x 0.5) = 0. After final min (not immune, Normal is not immune to Rock/Ground): max(1, 0) = 1. Final damage = 1.
- **Status:** INCORRECT (derivation wrong, but final value coincidentally correct)
- **Fix:** Type effectiveness should be x0.5 (Rock resists Normal), not x1. The full derivation: raw(-4) -> min 1 -> x0.5 = 0 -> final min 1. Result is still 1 damage, but the reasoning must show the Rock resistance step. This matters because if you tested this without the +6 DEF boost (e.g., raw damage > 1), the Rock resistance would materially change the result.

### Assertion 3: Geodude HP reduced by exactly 1
- **Scenario says:** Geodude HP = 10 + (4 x 3) + 10 = 32. Remaining = 32 - 1 = 31.
- **Independent derivation:** HP = 10 + 12 + 10 = 32. 32 - 1 = 31.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (HP 5, ATK 5, DEF 5, SpATK 7, SpDEF 7, SPD 5)
- [x] Geodude: base stats match gen1/geodude.md (HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2)
- [x] Bulbasaur types: Grass/Poison matches pokedex
- [x] Geodude types: Rock/Ground matches pokedex
- [x] Tackle learnable by Bulbasaur at level 10 (learned at level 1)

## Completeness Check
- [x] Defense exceeding damage roll + ATK -- covered
- [x] Minimum 1 damage rule -- covered
- [ ] Type resistance interaction with minimum damage -- derivation incorrect (Rock resists Normal)
- [x] HP reduction by exactly 1 -- covered

## Errata Check
- No errata affects minimum damage mechanics

## Issues Found
1. **Assertion 2 derivation is wrong: Normal vs Rock/Ground is NOT neutral.** Rock resists Normal (x0.5). The final damage (1) is coincidentally correct because the final minimum-1 rule catches it, but the derivation path is incorrect. This matters for test correctness: the scenario should explicitly show the resistance step to prove the tester understands the interaction between minimum damage and type resistance.
