---
scenario_id: combat-take-a-breather-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Pre-breather state
- **Scenario says:** Bulbasaur has ATK CS = +3, DEF CS = +2, status includes "Confused".
- **Independent derivation:** Setup applies +3 ATK CS, +2 DEF CS, and Confused status. Pre-state is correctly established.
- **Status:** CORRECT

### Assertion 2: All combat stages reset to 0
- **Scenario says:** PTU: "they set their Combat Stages back to their default level." ATK CS = 0, DEF CS = 0.
- **Independent derivation:** Take a Breather resets ALL combat stages to 0. ATK +3 -> 0, DEF +2 -> 0.
- **Status:** CORRECT

### Assertion 3: Volatile status cured
- **Scenario says:** Confused is Volatile. "cured of all Volatile Status effects." Confused removed.
- **Independent derivation:** PTU classifies Confused as Volatile. Take a Breather cures all Volatile statuses.
- **Status:** CORRECT

### Assertion 4: Tripped and Vulnerable applied
- **Scenario says:** PTU: "They then become Tripped and are Vulnerable until the end of their next turn."
- **Independent derivation:** Take a Breather penalty: Tripped + Vulnerable added to combatant.
- **Status:** CORRECT

### Assertion 5: Full Action consumed
- **Scenario says:** Take a Breather = Full Action = Standard + Shift consumed.
- **Independent derivation:** PTU: "Taking a Breather is a Full Action." Full Actions consume Standard + Shift.
- **Status:** CORRECT

## Data Validity
- [x] Bulbasaur: base stats match gen1/bulbasaur.md
- [x] Confused is a valid Volatile status in PTU

## Completeness Check
- [x] Stage reset -- covered
- [x] Volatile status cured -- covered
- [x] Tripped + Vulnerable applied -- covered
- [x] Full Action consumption -- covered
- [ ] Temporary HP removal -- not tested (PTU: "lose all Temporary Hit Points" on Breather). Coverage gap noted.
- [ ] Slow/Stuck removal -- not tested (PTU: "the Slow and Stuck conditions")

## Errata Check
- No errata affects Take a Breather mechanics

## Issues Found
(none -- minor coverage gaps for Temp HP and Slow/Stuck removal noted in completeness)
