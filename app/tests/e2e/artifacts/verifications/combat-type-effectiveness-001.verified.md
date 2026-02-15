---
scenario_id: combat-type-effectiveness-001
verified_at: 2026-02-15T19:00:00Z
status: PARTIAL
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Type effectiveness detection
- **Scenario says:** Water vs Fire = Super Effective (x1.5)
- **Independent derivation:** Water is super effective against Fire. PTU SE multiplier = x1.5.
- **Status:** CORRECT

### Assertion 2: Damage before effectiveness
- **Scenario says:** Squirtle (Water) using Water Gun (Water) = STAB. DB 4 + 2 = 6. Set damage = 15. Damage = 15 + SpATK(5) - SpDEF(5) = 15.
- **Independent derivation:** Squirtle is Water, Water Gun is Water -> STAB applies. DB 4 + 2 = 6. DB 6 set damage = 15 (chart: 10 / 15 / 20). Damage = 15 + 5 - 5 = 15.
- **Status:** CORRECT

### Assertion 3: Damage after effectiveness
- **Scenario says:** floor(15 x 1.5) = floor(22.5) = 22
- **Independent derivation:** 15 x 1.5 = 22.5. floor(22.5) = 22.
- **Status:** CORRECT

### Assertion 4: Charmander HP after hit
- **Scenario says:** 32 - 22 = 10. HP displays "10/32".
- **Independent derivation:** Charmander HP = 10 + (4 x 3) + 10 = 32. 32 - 22 = 10.
- **Status:** CORRECT

## Data Validity
- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Squirtle types: Water matches pokedex
- [x] Charmander types: Fire matches pokedex
- [ ] **Water Gun NOT learnable at level 10.** Squirtle learns Water Gun at level 13. At level 10, Squirtle knows: Tackle (1), Tail Whip (4), Bubble (7), Withdraw (10).
- [x] Water Gun stats: Water, DB 4, Special, AC 2 -- match move reference

## Completeness Check
- [x] SE detection and indicator -- tested
- [x] Effectiveness applied after defense -- tested
- [x] Floor applied to result -- tested
- [x] STAB correctly accounted for in derivation -- tested

## Errata Check
- No errata affects type effectiveness mechanics

## Issues Found
1. **Water Gun not learnable at level 10.** Squirtle learns Water Gun at level 13. All assertion values are correct, but the test data is invalid. Fix options:
   - **Option A (recommended):** Raise Squirtle to level 13+ so Water Gun is available
   - **Option B:** Use Bubble (Water, DB 2, Special) instead -- but this changes all damage values
   - **Option C:** Keep level 10 and use Water Gun anyway if the API allows specifying arbitrary moves (bypassing level check)
