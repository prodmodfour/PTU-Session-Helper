---
scenario_id: healing-workflow-injury-healing-cycle-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 6
assertions_correct: 6
---

## Assertion Verification

### Assertion 1: Natural healing succeeds (24h elapsed)
- **Scenario says:** lastInjuryTime 25h ago -> canHealInjuryNaturally = true; injuriesHealedToday 1 < cap 3; success, injuriesHealed = 1, injuries = 3, injuriesHealedToday = 2
- **Independent derivation:** canHealInjuryNaturally: 25 >= 24 -> true. Daily cap: 1 < 3 -> allowed. injuries: 4 - 1 = 3. injuriesHealedToday: 1 + 1 = 2.
- **Status:** CORRECT
- **Implementation check:** Character heal-injury checks daily limit first (1 < 3 passes), then natural timer (25h >= 24h passes). Natural healing does NOT reset lastInjuryTime (per ptu-rule-034 fix). Confirmed in `heal-injury.post.ts`.

### Assertion 2: AP drain succeeds (no time requirement)
- **Scenario says:** injuriesHealedToday = 2 < cap 3; injuries = 2, drainedAp = 2, injuriesHealedToday = 3
- **Independent derivation:** Daily cap: 2 < 3 -> allowed. drain_ap skips time check. injuries: 3 - 1 = 2. drainedAp: 0 + 2 = 2 (was 0 from character creation default, natural heal doesn't touch it). injuriesHealedToday: 2 + 1 = 3.
- **Status:** CORRECT
- **Implementation check:** drain_ap path in `heal-injury.post.ts` does not check lastInjuryTime. drainedAp starts at 0 (default from character creation, not set in setup PUT).

### Assertion 3: Daily cap blocks third heal
- **Scenario says:** injuriesHealedToday = 3 (at cap); response.success = false; message contains "Daily injury healing limit"
- **Independent derivation:** Daily cap check: 3 >= 3 -> blocked. Error message returned before any other checks.
- **Status:** CORRECT
- **Implementation check:** Character endpoint checks `injuriesHealedToday >= 3` first. Returns failure with descriptive message.

### Assertion 4: Injuries unchanged after blocked attempt
- **Scenario says:** injuries = 2 (unchanged); injuriesHealedToday = 3 (unchanged)
- **Independent derivation:** Failed requests do not modify DB state. injuries and counters remain at pre-attempt values.
- **Status:** CORRECT

### Assertion 5: Natural heal blocked by daily cap
- **Scenario says:** injuriesHealedToday = 3 -> blocked; lastInjuryTime still ~25h ago (NOT reset per ptu-rule-034); daily cap is sole blocker
- **Independent derivation:** Character endpoint checks daily cap first: 3 >= 3 -> blocked before reaching the natural timer check. Even though lastInjuryTime is still ~25h ago (timer would pass), the daily cap prevents healing.
- **Status:** CORRECT
- **Implementation check:** Character heal-injury checks daily limit BEFORE natural timer. The note about ptu-rule-034 is informational but accurate — the timer was never reset by prior natural heal.

### Assertion 6: Final state after healing cycle
- **Scenario says:** injuries = 2; injuriesHealedToday = 3; drainedAp = 2; lastInjuryTime is not null
- **Independent derivation:** injuries: 4 - 1(natural) - 1(AP drain) = 2. injuriesHealedToday: 1(prior) + 1(natural) + 1(AP drain) = 3. drainedAp: 0 + 2(one drain) = 2. lastInjuryTime: never cleared (injuries remain > 0), never reset by natural heal (ptu-rule-034) or AP drain (ptu-rule-032).
- **Status:** CORRECT

## Data Validity
- [x] Character uses `characterType: "npc"` (correction-006 fix applied)
- [x] Character uses `hp: 5` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 49` and `currentHp: 49` (correction-006 fix applied)
- [x] Character maxHp formula: (12 x 2) + (5 x 3) + 10 = 49 matches explicit value
- [x] ptu-rule-034 impact correctly reflected: natural heal does NOT reset lastInjuryTime
- [x] ptu-rule-032 impact correctly reflected: AP drain does NOT reset lastInjuryTime

## Completeness Check
- [x] All steps from loop healing-workflow-injury-healing-cycle (W4) covered
- [x] Natural healing path tested (Phase 1)
- [x] AP drain path tested (Phase 2)
- [x] Daily cap blocking tested for both methods (Phases 3-4)
- [x] Cross-method daily cap verified (natural after AP drain at cap)
- [x] Final state verification via GET (Phase 5)

## Errata Check
- No errata affects natural injury healing, AP drain, or daily cap mechanics

## Issues Found
<!-- None -->
