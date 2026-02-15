---
scenario_id: combat-status-conditions-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1: Status applied to non-immune type
- **Scenario says:** Charmander (Fire) is not immune to Paralysis. Paralysis added.
- **Independent derivation:** Electric types are immune to Paralysis. Fire types are NOT. Charmander = Fire -> Paralysis applies.
- **Status:** CORRECT

### Assertion 2: Type immunity blocks Burn on Fire type
- **Scenario says:** Fire types immune to Burn. isImmuneToStatus(["Fire"], "Burned") = true.
- **Independent derivation:** PTU: "Fire Types -> immune to Burn." Charmander = Fire -> Burn blocked.
- **Status:** CORRECT

### Assertion 3: Type immunity blocks Paralysis on Electric type
- **Scenario says:** Electric types immune to Paralysis. isImmuneToStatus(["Electric"], "Paralyzed") = true.
- **Independent derivation:** PTU: "Electric Types -> immune to Paralysis." Pikachu = Electric -> Paralysis blocked.
- **Status:** CORRECT

### Assertion 4: No duplicate statuses
- **Scenario says:** Charmander has exactly one "Paralyzed" (not two after re-application attempt).
- **Independent derivation:** Same status should not stack. One entry per unique status condition.
- **Status:** CORRECT

## Data Validity
- [x] Charmander: Fire type matches gen1/charmander.md
- [x] Pikachu: Electric type matches gen1/pikachu.md
- [x] Type immunity table matches PTU rules

## Completeness Check
- [x] Status application -- covered
- [x] Type immunity blocking (2 types tested) -- covered
- [x] No duplicate statuses -- covered
- [ ] Multiple different statuses on same target -- not tested
- [ ] Persistent vs Volatile distinction -- not tested in assertions

## Errata Check
- No errata affects status condition type immunities

## Issues Found
(none)
