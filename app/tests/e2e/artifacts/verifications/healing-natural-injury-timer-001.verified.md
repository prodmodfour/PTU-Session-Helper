---
scenario_id: healing-natural-injury-timer-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 5
assertions_correct: 5
---

## Assertion Verification

### Assertion 1 (Test 1): 25 hours elapsed — natural healing succeeds
- **Scenario says:** canHealInjuryNaturally: 25 >= 24 -> true; injuriesHealed = 1; injuries = 1
- **Independent derivation:** canHealInjuryNaturally(lastInjuryTime): hoursSinceInjury = 25, 25 >= 24 -> true. injuries: 2 - 1 = 1. injuriesHealedToday: 0 + 1 = 1.
- **Status:** CORRECT
- **Implementation check:** Pokemon heal-injury endpoint uses `canHealInjuryNaturally()` from `utils/restHealing.ts`. Confirmed formula `hoursSinceInjury >= 24`.

### Assertion 2 (Test 2): 12 hours elapsed — natural healing blocked
- **Scenario says:** canHealInjuryNaturally: 12 < 24 -> false; response.success = false; message contains "hours remaining"; hoursRemaining ~ 12
- **Independent derivation:** hoursSinceInjury = 12, 12 < 24 -> false. hoursRemaining = 24 - 12 = 12.
- **Status:** CORRECT
- **Implementation check:** Pokemon endpoint returns failure with `hoursRemaining` when timer check fails.

### Assertion 3 (Test 3): null lastInjuryTime — healing blocked
- **Scenario says:** lastInjuryTime is null -> canHealInjuryNaturally returns false
- **Independent derivation:** canHealInjuryNaturally(null): null check -> returns false immediately.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `utils/restHealing.ts` — if lastInjuryTime is null, returns false.

### Assertion 4 (Test 4): Chained natural heals succeed (timer NOT reset per ptu-rule-034)
- **Scenario says:** After first natural heal, lastInjuryTime still ~25h ago; second heal: 25 >= 24 -> true; injuriesHealedToday = 2; injuries = 1
- **Independent derivation:** First heal: injuries 3 -> 2, injuriesHealedToday 0 -> 1. lastInjuryTime NOT reset (per ptu-rule-034 fix — uses `...(newInjuries === 0 ? { lastInjuryTime: null } : {})`, newInjuries = 2 so no change). Second heal: timer still ~25h, 25 >= 24 -> true. Daily cap: 1 < 3 -> allowed. injuries: 2 - 1 = 1. injuriesHealedToday: 1 + 1 = 2.
- **Status:** CORRECT
- **Implementation check:** Confirmed natural path in both `characters/[id]/heal-injury.post.ts` and `pokemon/[id]/heal-injury.post.ts` no longer resets lastInjuryTime after healing. Fix per ptu-rule-034.

### Assertion 5 (Test 5): Last injury healed — lastInjuryTime cleared to null
- **Scenario says:** injuries 1 -> 0, lastInjuryTime set to null; injuriesHealedToday = 3; response.success = true (daily cap 2 < 3 at time of check)
- **Independent derivation:** Third heal: daily cap check: 2 < 3 -> passes. Timer: still ~25h -> passes. injuries: 1 - 1 = 0. injuriesHealedToday: 2 + 1 = 3. newInjuries = 0 -> conditional spread sets lastInjuryTime = null.
- **Status:** CORRECT

## Data Validity
- [x] Geodude base HP: 4 matches gen1/geodude.md
- [x] Character uses `characterType: "npc"` (correction-006 fix applied)
- [x] Character uses `hp: 5` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 36` and `currentHp: 36` (correction-006 fix applied)
- [ ] Character maxHp formula mismatch: (8 x 2) + (5 x 3) + 10 = 41, but scenario specifies maxHp: 36. This does not affect any assertions (no HP-dependent calculations in this scenario), but the test data is internally inconsistent.
- [x] ptu-rule-034 impact correctly reflected: natural heal does NOT reset lastInjuryTime

## Completeness Check
- [x] All expected outcomes from loop healing-mechanic-natural-injury-timer (M8) covered
- [x] 25+ hours: healing succeeds (Test 1)
- [x] < 24 hours: healing blocked with countdown (Test 2)
- [x] null lastInjuryTime: healing blocked (Test 3)
- [x] Chained heals succeed when timer not reset (Test 4)
- [x] Last injury clears lastInjuryTime to null (Test 5)

## Errata Check
- No errata affects the natural injury healing timer mechanic

## Issues Found

1. **Minor data inconsistency (non-blocking):** Character "Trainer Elm" has `maxHp: 36` but the PTU formula for level 8, hp 5 yields (8 x 2) + (5 x 3) + 10 = 41. Since this scenario tests only injury timer mechanics (no HP calculations), the mismatch does not affect any assertion. The API accepts explicit maxHp values. Recommend updating `maxHp: 41` and `currentHp: 41` in the scenario for data consistency, but this does not warrant a PARTIAL status.
