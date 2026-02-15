---
scenario_id: combat-multi-target-001
verified_at: 2026-02-15T19:00:00Z
status: FAIL
assertions_checked: 4
assertions_correct: 0
---

## Assertion Verification

### Assertion 1: Single set damage roll shared across targets
- **Scenario says:** Earthquake DB 10 -> Set damage = 24
- **Independent derivation:** Geodude is Rock/Ground. Earthquake is Ground type. STAB applies: DB 10 + 2 = 12. DB 12 -> Set damage = 30 (from chart: 13 / 30 / 46). The scenario uses 24 (DB 10 without STAB).
- **Status:** INCORRECT
- **Fix:** Set damage should be 30 (DB 12 with STAB), not 24 (DB 10 without STAB)

### Assertion 2: Charmander damage -- Ground vs Fire = SE (x1.5)
- **Scenario says:** Damage before effectiveness = max(1, 24 + 8 - 4) = 28. Final = floor(28 x 1.5) = 42. Charmander faints.
- **Independent derivation:** With STAB correction: Damage before effectiveness = max(1, 30 + 8 - 4) = 34. Ground vs Fire = SE (x1.5). Final = floor(34 x 1.5) = floor(51) = 51. Charmander HP = 32, 51 > 32 -> HP = 0, Fainted. Same faint outcome but different damage value.
- **Status:** INCORRECT
- **Fix:** Damage should be 51 (not 42). Charmander still faints (same outcome).

### Assertion 3: Machop damage -- Ground vs Fighting = neutral (x1)
- **Scenario says:** Damage = max(1, 24 + 8 - 5) = 27. Machop HP 41 - 27 = 14.
- **Independent derivation:** With STAB correction: Damage = max(1, 30 + 8 - 5) = 33. Ground vs Fighting = neutral (x1). Final = 33. Machop HP = 41 - 33 = 8.
- **Status:** INCORRECT
- **Fix:** Damage should be 33 (not 27). Machop HP should be "8/41" (not "14/41").

### Assertion 4: Different final damage per target
- **Scenario says:** Charmander 42, Machop 27 -- different due to DEF and type.
- **Independent derivation:** With corrections: Charmander 51, Machop 33 -- still different. Concept is correct but values are wrong.
- **Status:** INCORRECT
- **Fix:** Values should be 51 and 33.

## Data Validity
- [x] Geodude: base stats match gen1/geodude.md (HP 4, ATK 8, DEF 10, SpATK 3, SpDEF 3, SPD 2)
- [x] Charmander: base stats match gen1/charmander.md (HP 4, ATK 5, DEF 4, SpATK 6, SpDEF 5, SPD 7)
- [x] Machop: base stats match gen1/machop.md (HP 7, ATK 8, DEF 5, SpATK 4, SpDEF 4, SPD 4)
- [x] Geodude types: Rock/Ground match pokedex
- [ ] **Earthquake NOT learnable at level 10.** Geodude learns Earthquake at level 34. At level 10, Geodude knows: Defense Curl (1), Tackle (1), Mud Sport (4), Rock Polish (6), Rollout (10).
- [ ] **STAB missed.** Geodude is Rock/Ground; Earthquake is Ground type. STAB (+2 DB) must apply.

## Completeness Check
- [x] Multi-target move uses single damage roll -- covered
- [x] Per-target defense subtraction -- covered
- [x] Per-target type effectiveness -- covered
- [x] Different final damage values per target -- covered
- [ ] Accuracy rolled separately per target -- mentioned but not asserted

## Errata Check
- No errata affects Earthquake or multi-target mechanics

## Issues Found
1. **CRITICAL: Earthquake not learnable at level 10.** Geodude learns Earthquake at level 34. Fix: Either raise Geodude to level 34+ or use a different multi-target move available at level 10 (e.g., Magnitude at level 12, or Bulldoze at level 22). Alternatively, use a higher-level Geodude.
2. **CRITICAL: STAB not applied.** Geodude (Rock/Ground) using Earthquake (Ground) = STAB match. DB should be 10 + 2 = 12, set damage = 30. All downstream damage values are wrong.
