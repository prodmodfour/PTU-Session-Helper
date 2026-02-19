---
scenario_id: healing-workflow-pokemon-center-full-heal-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 10
assertions_correct: 10
---

## Assertion Verification

### Assertion 1: Character full HP restore
- **Scenario says:** hpHealed = 44 - 15 = 29; newHp = 44; maxHp = 44
- **Independent derivation:** Pokemon Center sets currentHp = maxHp. hpHealed = 44 - 15 = 29. newHp = 44. maxHp unchanged = 44.
- **Status:** CORRECT

### Assertion 2: Character all statuses cleared (persistent + volatile)
- **Scenario says:** Pokemon Center clears ALL status conditions; Frozen and Confused both cleared
- **Independent derivation:** Pokemon Center sets statusConditions to []. This clears ALL conditions — persistent (Frozen) AND volatile (Confused). This differs from extended rest which only clears persistent.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `pokemon-center.post.ts` — sets `statusConditions: []` unconditionally.

### Assertion 3: Character injuries healed (daily cap applied)
- **Scenario says:** injuries = 4, injuriesHealedToday = 0; maxHealable = 3; injuriesHealed = 3; remaining = 1; counter = 3
- **Independent derivation:** maxHealable = max(0, 3 - 0) = 3. injuriesHealed = min(4, 3) = 3. remaining = 4 - 3 = 1. injuriesHealedToday = 0 + 3 = 3.
- **Status:** CORRECT

### Assertion 4: Character healing time (< 5 injuries uses 30 min/injury)
- **Scenario says:** baseTime = 60; injuryTime = 4 x 30 = 120; totalTime = 180; description = "3 hours"
- **Independent derivation:** calculatePokemonCenterTime(4): base = 60. injuries < 5 -> injuryTime = 4 * 30 = 120. total = 60 + 120 = 180 min = 3 hours.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `utils/restHealing.ts#calculatePokemonCenterTime`. Uses injury count at time of visit (4), not post-healing count.

### Assertion 5: Character AP NOT restored (per ptu-rule-038)
- **Scenario says:** Pokemon Centers do NOT restore drained AP; drainedAp remains at 2; apRestored = 0
- **Independent derivation:** Per ptu-rule-038, Pokemon Centers never restore drained AP — that is exclusively an Extended Rest benefit. The endpoint was fixed to remove conditional AP restoration logic.
- **Status:** CORRECT
- **Implementation check:** Confirmed `pokemon-center.post.ts` no longer has `meetsExtendedRest` variable or conditional `drainedAp: 0` spread. Response includes `apRestored: 0` hardcoded. Fix per ptu-rule-038.

### Assertion 6: Pokemon full HP restore
- **Scenario says:** hpHealed = 34 - 5 = 29; newHp = 34
- **Independent derivation:** Pokemon Center: currentHp = maxHp = 34. hpHealed = 34 - 5 = 29.
- **Status:** CORRECT

### Assertion 7: Pokemon statuses cleared
- **Scenario says:** Poisoned cleared
- **Independent derivation:** Pokemon Center sets statusConditions to []. Poisoned removed.
- **Status:** CORRECT

### Assertion 8: Pokemon injuries fully healed (under cap)
- **Scenario says:** injuries = 2, injuriesHealedToday = 0; maxHealable = 3; injuriesHealed = 2; remaining = 0
- **Independent derivation:** maxHealable = max(0, 3 - 0) = 3. injuriesHealed = min(2, 3) = 2. remaining = 2 - 2 = 0.
- **Status:** CORRECT

### Assertion 9: Pokemon healing time
- **Scenario says:** baseTime = 60; injuryTime = 2 x 30 = 60; totalTime = 120; description = "2 hours"
- **Independent derivation:** calculatePokemonCenterTime(2): base = 60. injuries < 5 -> injuryTime = 2 * 30 = 60. total = 60 + 60 = 120 min = 2 hours.
- **Status:** CORRECT

### Assertion 10: Pokemon moves restored
- **Scenario says:** Water Gun (At-Will) and Bide (Daily x1) both have usedToday and usedThisScene reset to 0
- **Independent derivation:** Pokemon Center resets ALL moves: both usedToday and usedThisScene set to 0 for every move (not just daily — all frequencies). This is more comprehensive than extended rest.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `pokemon/[id]/pokemon-center.post.ts` — iterates all moves, sets both counters to 0 unconditionally.

## Data Validity
- [x] Squirtle: base stats match gen1/squirtle.md (HP 4, ATK 5, DEF 7, SpATK 5, SpDEF 6, SPD 4)
- [x] Squirtle type: Water matches gen1/squirtle.md
- [x] Character uses `characterType: "player"` (correction-006 fix applied)
- [x] Character uses `hp: 6` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 44` and `currentHp: 44` (correction-006 fix applied)
- [x] Character maxHp formula: (8 x 2) + (6 x 3) + 10 = 44 matches explicit value
- [x] Pokemon maxHp formula: 12 + (4 x 3) + 10 = 34 matches scenario comment
- [x] ptu-rule-038 impact correctly reflected: Pokemon Center does NOT restore AP

## Completeness Check
- [x] All steps from loop healing-workflow-pokemon-center-full-heal (W3) covered
- [x] Full HP restore for both entity types (Assertions 1, 6)
- [x] All status clearing (persistent + volatile) for both types (Assertions 2, 7)
- [x] Injury healing with daily cap for over-cap case (Assertion 3) and under-cap case (Assertion 8)
- [x] Healing time calculation (Assertions 4, 9)
- [x] AP NOT restored per ptu-rule-038 (Assertion 5)
- [x] Move restoration (Assertion 10)
- [x] Post-heal verification via GET (Phase 3)

## Errata Check
- No errata affects Pokemon Center mechanics. Errata-2.md references Medic class features but not the base Pokemon Center healing rules.

## Issues Found
<!-- None -->
