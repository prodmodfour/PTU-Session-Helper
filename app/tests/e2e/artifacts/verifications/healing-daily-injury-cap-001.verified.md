---
scenario_id: healing-daily-injury-cap-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1 (Test 1): Pokemon Center caps at 3 injuries/day
- **Scenario says:** injuries = 5, injuriesHealedToday = 0; maxHealable = max(0, 3-0) = 3; injuriesHealed = min(5,3) = 3; remaining = 2; counter = 3
- **Independent derivation:** calculatePokemonCenterInjuryHealing: maxHealable = max(0, 3 - 0) = 3. injuriesHealed = min(5, 3) = 3. remaining = 5 - 3 = 2. injuriesHealedToday = 0 + 3 = 3.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `utils/restHealing.ts#calculatePokemonCenterInjuryHealing`. Cap is hardcoded at 3.

### Assertion 2 (Test 2): Prior heals reduce remaining capacity
- **Scenario says:** injuries = 4, injuriesHealedToday = 2; maxHealable = max(0, 3-2) = 1; injuriesHealed = min(4,1) = 1; remaining = 3; counter = 3
- **Independent derivation:** maxHealable = max(0, 3 - 2) = 1. injuriesHealed = min(4, 1) = 1. remaining = 4 - 1 = 3. injuriesHealedToday = 2 + 1 = 3.
- **Status:** CORRECT

### Assertion 3 (Test 3): Already at cap — 0 injuries healed
- **Scenario says:** injuries = 3, injuriesHealedToday = 3; maxHealable = 0; injuriesHealed = 0; atDailyInjuryLimit = true; remaining = 3; success = true (HP/status still healed)
- **Independent derivation:** maxHealable = max(0, 3 - 3) = 0. injuriesHealed = min(3, 0) = 0. Pokemon Center still heals HP to full and clears all statuses even at injury cap. atDailyInjuryLimit = (injuriesHealedToday >= 3) = true.
- **Status:** CORRECT
- **Implementation check:** Pokemon Center endpoint always succeeds (returns success = true). Injury healing is capped but HP restore, status clearing, and move recovery proceed unconditionally.

### Assertion 4 (Test 4): Character heal-injury blocked at daily cap
- **Scenario says:** injuries = 2, injuriesHealedToday = 3; response.success = false; message contains "Daily injury healing limit"
- **Independent derivation:** Character heal-injury checks daily limit first: 3 >= 3 -> blocked. Returns failure with "Daily injury healing limit" message.
- **Status:** CORRECT
- **Implementation check:** Confirmed character endpoint checks `injuriesHealedToday >= 3` before method-specific logic.

## Data Validity
- [x] Geodude base HP: 4 matches gen1/geodude.md
- [x] Pokemon maxHp: 15 + (4 x 3) + 10 = 37 matches scenario comment
- [x] Character uses `characterType: "npc"` (correction-006 fix applied)
- [x] Character uses `hp: 5` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 49` and `currentHp: 49` (correction-006 fix applied)
- [x] Character maxHp formula: (12 x 2) + (5 x 3) + 10 = 49 matches explicit value

## Completeness Check
- [x] All expected outcomes from loop healing-mechanic-daily-injury-cap (M7) covered
- [x] Pokemon Center with 0 prior heals (Test 1)
- [x] Pokemon Center with partial prior usage (Test 2)
- [x] Pokemon Center at daily cap (Test 3)
- [x] Character heal-injury at daily cap (Test 4)
- [x] Cross-source cap sharing demonstrated (PC and heal-injury share injuriesHealedToday)

## Errata Check
- No errata in errata-2.md affects the daily injury healing cap of 3

## Issues Found
<!-- None -->
