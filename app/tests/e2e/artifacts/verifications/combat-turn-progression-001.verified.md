---
scenario_id: combat-turn-progression-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: After start -- round 1, first combatant
- **Scenario says:** Pikachu active, round 1. Initiative: Pikachu(9) > Charmander(7) > Bulbasaur(5).
- **Independent derivation:** Speeds: 9, 7, 5. Descending order confirmed. Pikachu first. Round starts at 1.
- **Status:** CORRECT

### Assertion 2: After 1st Next Turn -- Charmander active
- **Scenario says:** Charmander active, round 1.
- **Independent derivation:** After Pikachu's turn, next in order is Charmander (SPD 7). Still round 1 (not all combatants have acted).
- **Status:** CORRECT

### Assertion 3: After 2nd Next Turn -- Bulbasaur active
- **Scenario says:** Bulbasaur active, round 1.
- **Independent derivation:** After Charmander's turn, next is Bulbasaur (SPD 5). Still round 1.
- **Status:** CORRECT

### Assertion 4: After 3rd Next Turn -- round 2, wraps
- **Scenario says:** Pikachu active again, round 2.
- **Independent derivation:** All 3 combatants have acted. New round begins (round 2). First combatant in order = Pikachu.
- **Status:** CORRECT

## Data Validity
- [x] Pikachu: SPD 9 matches gen1/pikachu.md
- [x] Charmander: SPD 7 matches gen1/charmander.md
- [x] Bulbasaur: SPD 5 matches gen1/bulbasaur.md

## Completeness Check
- [x] Turn advancement through all combatants -- covered
- [x] Round counter increment on wrap -- covered
- [x] Active combatant indicator -- covered
- [ ] Fainted combatant skip -- tested in combat-damage-and-faint-001

## Errata Check
- No errata affects turn progression

## Issues Found
(none)
