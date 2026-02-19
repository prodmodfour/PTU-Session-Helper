---
scenario_id: healing-ap-drain-injury-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 4
assertions_correct: 4
---

## Assertion Verification

### Assertion 1 (Test 1): AP drain succeeds without time requirement
- **Scenario says:** lastInjuryTime 2h ago (natural blocked), but drain_ap skips time check; injuries = 2, drainedAp = 2, injuriesHealedToday = 1
- **Independent derivation:** drain_ap method does not check lastInjuryTime. Daily cap: 0 < 3 -> allowed. injuries: 3 - 1 = 2. drainedAp: 0 + 2 = 2. injuriesHealedToday: 0 + 1 = 1.
- **Status:** CORRECT
- **Implementation check:** drain_ap path in `heal-injury.post.ts` has no timer check. Confirmed in code — only daily cap is checked before draining.

### Assertion 2 (Test 2): AP accumulates across drains
- **Scenario says:** injuries = 1, drainedAp = 4, injuriesHealedToday = 2
- **Independent derivation:** injuries: 2 - 1 = 1. drainedAp: 2 + 2 = 4. injuriesHealedToday: 1 + 1 = 2.
- **Status:** CORRECT

### Assertion 3 (Test 3): Last injury healed — lastInjuryTime set to null
- **Scenario says:** injuries = 0, drainedAp = 6, injuriesHealedToday = 3; lastInjuryTime = null
- **Independent derivation:** injuries: 1 - 1 = 0. drainedAp: 4 + 2 = 6. injuriesHealedToday: 2 + 1 = 3. When injuries reach 0, `...(newInjuries === 0 ? { lastInjuryTime: null } : {})` clears lastInjuryTime.
- **Status:** CORRECT
- **Implementation check:** Confirmed AP drain path uses conditional spread to set lastInjuryTime to null only when injuries reach 0 (fixed in commit a84e7fd per ptu-rule-032).

### Assertion 4 (Test 4): AP drain preserves lastInjuryTime (unlike natural healing)
- **Scenario says:** After AP drain with 1 injury remaining, lastInjuryTime is still ~25 hours ago (not reset to now)
- **Independent derivation:** AP drain path (after ptu-rule-032 fix) does not touch lastInjuryTime unless injuries reach 0. With 1 injury remaining (2-1=1), lastInjuryTime is untouched. The original ~25h timestamp is preserved.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `heal-injury.post.ts` — drain_ap path uses `...(newInjuries === 0 ? { lastInjuryTime: null } : {})`. With newInjuries = 1, the spread evaluates to `{}` (no change). Fixed per ptu-rule-032 (commit a84e7fd).

## Data Validity
- [x] Character uses `characterType: "npc"` (correction-006 fix applied)
- [x] Character uses `hp: 6` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 58` and `currentHp: 58` (correction-006 fix applied)
- [x] Character maxHp formula: (15 x 2) + (6 x 3) + 10 = 58 matches explicit value
- [x] ptu-rule-032 behavior correctly reflected: AP drain preserves lastInjuryTime

## Completeness Check
- [x] All expected outcomes from loop healing-mechanic-ap-drain-injury (M9) covered
- [x] AP drain without time requirement (Test 1)
- [x] AP accumulation across drains (Test 2)
- [x] Last injury clears lastInjuryTime (Test 3)
- [x] Timer preservation verified (Test 4)
- [x] Daily cap reached at Test 3 (injuriesHealedToday = 3)

## Errata Check
- No errata affects AP drain injury healing mechanics

## Issues Found
<!-- None -->
