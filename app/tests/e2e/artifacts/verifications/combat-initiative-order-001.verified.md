---
scenario_id: combat-initiative-order-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

### Assertion 1: Turn order sorted by Speed (descending)
- **Scenario says:** Pikachu SPD 9 > Charmander SPD 7 > Bulbasaur SPD 5. Order: Pikachu -> Charmander -> Bulbasaur.
- **Independent derivation:** Pikachu base Speed = 9, Charmander base Speed = 7, Bulbasaur base Speed = 5. PTU: "Initiative is simply their Speed Stat." Descending: 9, 7, 5.
- **Status:** CORRECT

### Assertion 2: First active combatant is fastest
- **Scenario says:** Pikachu is active (highlighted) after start.
- **Independent derivation:** Highest initiative (9) = Pikachu. First turn goes to Pikachu.
- **Status:** CORRECT

### Assertion 3: Initiative values match Speed stats
- **Scenario says:** Each combatant's initiative equals their Speed stat.
- **Independent derivation:** PTU rule: "a Pokemon's Initiative is simply their Speed Stat." Initiative = Speed at CS 0 (no pre-battle effects).
- **Status:** CORRECT

## Data Validity
- [x] Pikachu: base stats match gen1/pikachu.md (HP 4, ATK 6, DEF 4, SpATK 5, SpDEF 5, SPD 9)
- [x] Charmander: base stats match gen1/charmander.md (SPD 7)
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (SPD 5)
- [x] All types match pokedex files

## Completeness Check
- [x] Sort by Speed descending -- covered
- [x] Active combatant indicator -- covered
- [x] Initiative = Speed -- covered
- [ ] Tie-breaking -- not tested (separate scenario or edge case)

## Errata Check
- No errata affects initiative mechanics

## Issues Found
(none)
