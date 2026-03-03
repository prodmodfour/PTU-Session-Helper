---
review_id: rules-review-280
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-044
domain: capture
commits_reviewed:
  - 225c16a6
  - aabbc668
  - 28bfcf12
mechanics_verified:
  - standard-action-consumption
  - action-type-per-turn-limit
  - friend-ball-loyalty-bonus
  - capture-action-economy
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Standard Actions (p.227)
  - core/07-combat.md#Action Types (p.227)
  - core/09-gear-and-items.md#Friend Ball (p.279)
  - core/05-pokemon.md#Loyalty (p.210)
reviewed_at: 2026-03-03T19:30:00Z
follows_up: null
---

## Mechanics Verified

### Standard Action Consumption (R049)

- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn" (`core/07-combat.md` p.227, line 83-84). "Throwing a Poke Ball to Capture a wild Pokemon" is listed as a Standard Action example (line 107).
- **Implementation:** The `action.post.ts` endpoint accepts `actionType: 'standard' | 'shift' | 'swift'` and sets the corresponding `turnState` flag (`standardActionUsed`, `shiftActionUsed`, or `swiftActionUsed`) to `true`. Callers in `useCapture.ts` and `usePlayerRequestHandlers.ts` pass `actionType: 'standard'` when a Poke Ball is thrown.
- **Status:** CORRECT

### Action Type Per-Turn Limit (R050)

- **Rule:** Each action type is available once per turn. Using a Standard Action as a Shift Action is governed by separate rules (p.227, line 114-118), not by this endpoint.
- **Implementation:** The endpoint checks `if (combatant.turnState[field])` and returns 400 if the action was already consumed. This prevents double-consumption within a single turn.
- **Status:** CORRECT

### Capture Action Economy Flow (R051)

- **Rule:** Throwing a Poke Ball is a Standard Action (p.227). Even if the ball misses the AC 6 accuracy check, the Standard Action is still consumed (the trainer spent their action throwing the ball, regardless of whether it hits).
- **Implementation verified in two code paths:**
  1. **Ball hits, capture attempted** (`useCapture.ts` line 206-218): After a successful `attemptCapture()` call, the composable calls the action endpoint with `actionType: 'standard'`. Standard Action consumed.
  2. **Ball misses** (`usePlayerRequestHandlers.ts` line 84-96): When `accuracyResult.hits` is false, the handler still calls the action endpoint with `actionType: 'standard'`. Standard Action consumed even on a miss.
- **Status:** CORRECT. Both hit and miss paths consume the Standard Action, which is the correct PTU behavior. Per decree-042, the full accuracy system applies to Poke Ball throws; the endpoint only handles the action economy side, not accuracy, so no decree conflict.

### Friend Ball +1 Loyalty (R052)

- **Rule:** "A caught Pokemon will start with +1 Loyalty" (`core/09-gear-and-items.md` p.279, Friend Ball entry).
- **Implementation:** Commit aabbc668 reads `pokemon.loyalty`, increments by 1, caps at 6 (maximum loyalty rank per PTU p.210: ranks 0-6), and persists via `prisma.pokemon.update()`.
- **Status:** CORRECT. The +1 is additive from the Pokemon's current loyalty value after capture. The `Math.min(6, currentLoyalty + 1)` cap prevents exceeding the PTU maximum of 6 (Devoted).

### Loyalty Range (R053)

- **Rule:** "There are 7 Ranks of Loyalty, from 0 to 6" (`core/05-pokemon.md` p.210).
- **Implementation:** The `Math.min(6, ...)` cap enforces the upper bound. The schema default is `@default(3)` (Neutral), which is the PTU-standard starting loyalty for freshly caught wild Pokemon (PTU p.210: "Caught Pokemon usually start at 3, Neutral").
- **Status:** CORRECT. Note: the code fallback uses `?? 2` which differs from the schema default of 3, but this is a code quality concern (covered in code-review-307 MED-001), not a rules violation. The schema default ensures all new Pokemon rows start at 3; the fallback only applies if the value is somehow null/undefined at runtime, which Prisma prevents.

## Decree Compliance

- **decree-013** (use core 1d100 capture, not errata d20 playtest): Not affected. The action consumption endpoint does not touch capture roll mechanics.
- **decree-042** (full accuracy system applies to Poke Ball throws): Not affected directly. The endpoint only sets `standardActionUsed = true`. Accuracy checks happen upstream in `useCapture.rollAccuracyCheck()` and the `/api/capture/attempt` endpoint. The action consumption correctly occurs after both hit and miss accuracy outcomes, as verified in R051.

## What Looks Good

1. **Both hit and miss paths consume Standard Action.** This is a subtle but important PTU rule: the trainer spends the action regardless of accuracy outcome. Both callers implement this correctly.
2. **Generic action consumption.** The endpoint handles all three action types, not just Standard. This correctly models PTU's per-turn action budget (Standard + Shift + Swift) and could serve future features (e.g., marking a Shift Action as used after movement, or a Swift Action after a quick Feature).
3. **Double-use prevention.** The 400 on already-consumed action prevents action economy exploits.
4. **Friend Ball loyalty cap at 6.** The upper bound prevents exceeding the PTU loyalty system's defined range.

## Verdict

**APPROVED.** All PTU mechanics are correctly implemented. The action consumption endpoint properly models the per-turn action budget. Capture-specific action economy flows (both hit and miss) correctly consume Standard Actions. Friend Ball +1 Loyalty is correctly applied and capped. No decree violations.
