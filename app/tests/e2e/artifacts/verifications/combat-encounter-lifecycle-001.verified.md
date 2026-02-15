---
scenario_id: combat-encounter-lifecycle-001
verified_at: 2026-02-15T19:00:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1: Encounter creation
- **Scenario says:** POST /api/encounters returns success with name "Test: Lifecycle"
- **Independent derivation:** Standard API contract. No PTU rule involved.
- **Status:** CORRECT

### Assertion 2: Combatant addition
- **Scenario says:** GET shows 2 combatants on opposing sides
- **Independent derivation:** One ally (Pikachu), one enemy (Bulbasaur) added.
- **Status:** CORRECT

### Assertion 3: Combat start -- initiative calculated
- **Scenario says:** Pikachu (SPD 9) first, encounter status active.
- **Independent derivation:** Pikachu SPD 9 > Bulbasaur SPD 5. Pikachu goes first. PTU: Initiative = Speed.
- **Status:** CORRECT

### Assertion 4: Serve broadcasts to Group View
- **Scenario says:** GET /api/encounters/served returns the active encounter.
- **Independent derivation:** Serve endpoint makes encounter visible on Group View via WebSocket.
- **Status:** CORRECT

### Assertion 5: Combat end and unserve
- **Scenario says:** Encounter status "ended"; served endpoint returns null.
- **Independent derivation:** End marks encounter complete. Unserve removes from Group View.
- **Status:** CORRECT

## Data Validity
- [x] Pikachu: base stats match gen1/pikachu.md (SPD 9)
- [x] Bulbasaur: base stats match gen1/bulbasaur.md (SPD 5)

## Completeness Check
- [x] Create encounter -- covered
- [x] Add combatants -- covered
- [x] Start combat with initiative -- covered
- [x] Serve to Group View -- covered
- [x] End combat -- covered
- [x] Unserve from Group View -- covered
- [ ] Volatile statuses cleared at end -- not tested (mentioned in loop edge cases)

## Errata Check
- No errata affects encounter lifecycle

## Issues Found
(none)
