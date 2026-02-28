## Tier 3: Edge Cases and Interactions

### 17. capture-R028 — Natural 20 Accuracy Bonus

- **Rule:** "If you roll a Natural 20 on this Accuracy Check, subtract -10 from the Capture Roll." (05-pokemon.md:1710-1711)
- **Expected behavior:** Nat 20 on accuracy d20 → capture roll effectively easier by 10 (either subtract 10 from roll, or add 10 to capture rate).
- **Actual behavior:** `app/server/api/capture/attempt.post.ts:85` — `criticalHit = body.accuracyRoll === 20`. `app/utils/captureRate.ts:194-195` — `if (criticalHit) { effectiveCaptureRate += 10 }`. Adding 10 to capture rate is mathematically equivalent to subtracting 10 from the roll (since success = roll <= rate).
- **Classification:** Correct
- **Note:** PTU text "subtract -10" is ambiguous double-negative. Intent is clearly to benefit the player on a crit — making the capture easier. The code correctly adds 10 to the effective capture rate.

### 18. capture-R029 — Natural 100 Auto-Capture

- **Rule:** "A natural roll of 100 always captures the target without fail." (05-pokemon.md:1716-1717)
- **Expected behavior:** Raw d100 result of 100 = auto-capture regardless of capture rate or modifiers.
- **Actual behavior:** `app/utils/captureRate.ts:190` — `naturalHundred = roll === 100`. Line 204: `success = naturalHundred || modifiedRoll <= effectiveCaptureRate`. The `roll` variable is the raw 1d100 result (line 187), not the modified roll.
- **Classification:** Correct
- **Note:** The `naturalHundred` flag correctly uses the unmodified raw roll, not `modifiedRoll`. This ensures that trainer level and ball modifiers don't interfere with the natural 100 auto-capture.

### 19. capture-R033 — Accuracy Check Natural 1 Always Misses

- **Rule:** "a roll of 1 is always a miss, even if Accuracy modifiers would cause the total roll to hit." (07-combat.md:746-748)
- **Expected behavior:** Nat 1 on d20 accuracy check = ball automatically misses, regardless of modifiers.
- **Actual behavior:** `app/composables/useCapture.ts:185-192` — `rollAccuracyCheck()` returns `{ roll, isNat20, total }`. The function returns the raw roll value, which enables the caller to check `roll === 1`. However, unlike `isNat20` (which has an explicit convenience flag), there is NO `isNat1` flag in the return type. The GM workflow must manually compare `roll === 1` to detect an auto-miss.
- **Classification:** Approximation
- **Severity:** LOW
- **Issue:** The data needed to enforce nat 1 auto-miss IS returned (the raw `roll` value), but the function lacks an explicit `isNat1` convenience flag parallel to `isNat20`. The omission creates an asymmetry: nat 20 is flagged explicitly, nat 1 is not. The GM must interpret the raw roll. No mechanical incorrectness — the ball WILL miss if the GM checks the roll — but the missing flag could lead to oversight in GM-facing UI.
- **Fix suggestion:** Add `isNat1: roll === 1` to the `rollAccuracyCheck` return type for symmetry with `isNat20`.

---
