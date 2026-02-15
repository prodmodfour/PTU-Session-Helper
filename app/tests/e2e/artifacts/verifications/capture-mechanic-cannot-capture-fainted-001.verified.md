---
scenario_id: capture-mechanic-cannot-capture-fainted-001
verified_at: 2026-02-15T20:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

### Assertion 1: canBeCaptured is false when currentHp = 0
- **Scenario says:** canBeCaptured = currentHp > 0 -> 0 > 0 = false
- **Independent derivation:** captureRate.ts line 77: `const canBeCaptured = currentHp > 0`. With currentHp = 0: 0 > 0 = false. rate.post.ts returns `canBeCaptured` in response data.
- **Status:** CORRECT

### Assertion 2: Capture rejected with reason — no roll made
- **Scenario says:** captured === false, reason === "Pokemon is at 0 HP and cannot be captured"
- **Independent derivation:** attempt.post.ts lines 69-79: checks `rateResult.canBeCaptured`. When false, returns early:
  ```
  { success: false, data: { captured: false, reason: 'Pokemon is at 0 HP and cannot be captured', captureRate, difficulty } }
  ```
  The `attemptCapture()` function is never called — no roll occurs.
- **Status:** CORRECT
- **Implementation check:** Exact string match verified against attempt.post.ts line 74.

### Assertion 3: No capture roll was made
- **Scenario says:** response.data.roll is undefined
- **Independent derivation:** The fainted-rejection response (attempt.post.ts lines 70-79) returns `{ captured, reason, captureRate, difficulty }` — no `roll`, `modifiedRoll`, or other roll-related fields. The response shape is different from a successful attempt response. `response.data.roll` is indeed undefined.
- **Status:** CORRECT

## Data Validity
- [x] Oddish: base stats match gen1/oddish.md
- [x] maxHp = 5 + (5 x 3) + 10 = 30 (PTU Pokemon HP formula)
- [x] Pokemon HP set to 0 via PUT to simulate fainted state
- [x] PTU rule: "Pokemon reduced to 0 Hit Points or less cannot be captured" (core/05-pokemon.md, p214) ✓

## Completeness Check
- [x] Loop capture-mechanic-cannot-capture-fainted: rate API rejection ✓, attempt API rejection ✓, no-roll verification ✓
- [x] Both endpoints tested for fainted Pokemon handling
- [x] Response shape difference between fainted and normal attempts verified

## Errata Check
- No errata corrections apply. Fainted capture prevention matches 1.05 core rules.

## Issues Found
<!-- Empty — all assertions correct -->
