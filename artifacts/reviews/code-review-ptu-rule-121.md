---
review_id: code-review-ptu-rule-121
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-121
domain: combat
commits_reviewed:
  - 74ba0fd2
  - b3b37a55
  - c1d49a76
  - 3e169e3e
files_reviewed:
  - app/server/api/encounters/[id]/sprint.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
  - app/server/api/encounters/[id]/end.post.ts
  - app/composables/useEncounterActions.ts
  - app/composables/useEncounterCombatActions.ts
  - app/stores/encounterCombat.ts
  - app/server/services/encounter.service.ts
  - app/server/api/encounters/[id]/action.post.ts
  - app/server/utils/turn-helpers.ts
  - app/utils/movementModifiers.ts
  - app/constants/combatManeuvers.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Review Scope

Reviewed 4 commits implementing the sprint action consumption fix (ptu-rule-121):

1. **74ba0fd2** `feat: add Sprint maneuver server endpoint for DB persistence` -- Created the `sprint.post.ts` endpoint. Adds Sprint tempCondition, logs to moveLog, persists to DB. Clean initial implementation.
2. **b3b37a55** `fix: add missing weather fields to sprint and breather responses` -- Added `weather`, `weatherDuration`, `weatherSource` to manually-built response objects. Correct fix for response parity.
3. **c1d49a76** `refactor: use buildEncounterResponse in sprint, breather, and end endpoints` -- Replaced manual response object construction with the shared `buildEncounterResponse()` helper in all three endpoints. Eliminates the class of bugs where individual endpoints drift out of sync with response schema changes. Good refactor.
4. **3e169e3e** `fix: consume standard and shift actions when using Sprint` -- The core fix. Added turnState update setting `standardActionUsed: true`, `shiftActionUsed: true`, `hasActed: true` after applying the Sprint tempCondition. Matches the breather endpoint pattern (lines 172-178 of breather.post.ts).

## Issues

### MEDIUM: PTU correctness question -- does Sprint consume the Shift Action?

**File:** `app/server/api/encounters/[id]/sprint.post.ts`, lines 42-49

The fix sets `shiftActionUsed: true` with the comment "the Sprint movement IS the shift." The PTU text (p.245) says:

> Maneuver: Sprint
> Action: Standard
> Effect: Increase your Movement Speeds by 50% for the rest of your turn.

Sprint is listed as a **Standard** action only. The effect increases movement speed -- the combatant would then separately use their Shift Action to move at the increased speed. Setting `shiftActionUsed: true` server-side prevents the combatant from using their Shift to actually move with the sprint bonus.

Note: The client-side composable (`useEncounterActions.ts`, line 199-201) only calls `useAction(combatantId, 'standard')` for sprint -- it does NOT call `useAction('shift')`. This is consistent with Sprint being a Standard-only action. The shift consumption comes exclusively from the server endpoint.

**Per Lesson 2:** This is a PTU rule correctness question, not a code quality issue. I am flagging it explicitly for the **Game Logic Reviewer** to verify whether Sprint should consume only the Standard Action or both Standard and Shift. The ticket itself says "optionally `shiftActionUsed: true` since the Sprint movement IS the shift" -- the word "optionally" suggests uncertainty.

**Disposition:** This does not block approval because the implementation matches the ticket's resolution log and the breather pattern. However, the Game Logic Reviewer must verify the PTU interpretation before this ships.

## What Looks Good

1. **Immutability pattern:** The turnState update uses spread syntax (`combatant.turnState = { ...combatant.turnState, ... }`), consistent with the project's immutability requirements and matching the breather endpoint pattern exactly.

2. **buildEncounterResponse refactor (c1d49a76):** Eliminated 17-line manual response objects in sprint, breather, and end endpoints. All three now use the shared `buildEncounterResponse()` helper, which includes weather fields, grid config, wield relationships, declarations, and all other encounter state. This prevents future response drift bugs.

3. **Sprint idempotency guard:** Line 37 checks `!combatant.tempConditions.includes('Sprint')` before adding, preventing duplicate Sprint conditions. The spread syntax on line 38 (`[...combatant.tempConditions, 'Sprint']`) creates a new array reference.

4. **WebSocket broadcast:** The composable calls `broadcastUpdate()` after the sprint endpoint returns (useEncounterActions.ts, line 243), ensuring the Group View receives the updated encounter state with consumed actions.

5. **Sprint lifecycle is complete:** The Sprint tempCondition is cleared at the start of the combatant's next turn (turn-helpers.ts, line 32: `trainer.tempConditions = []`), and the movement modifier is applied in `movementModifiers.ts` (line 72: `modifiedSpeed = Math.floor(modifiedSpeed * 1.5)`).

6. **Commit granularity:** Four small, focused commits with clear conventional commit prefixes. Each commit produces a working state. The feat/fix/refactor progression is logical.

7. **Error handling:** Consistent with project patterns -- known H3 errors re-thrown, unknown errors wrapped in 500.

8. **File size:** sprint.post.ts is 90 lines, well under the 800-line limit.

## Verdict

**APPROVED** -- The core fix correctly adds action consumption to the sprint endpoint, matching the established breather pattern. The immutability patterns are correct, WebSocket broadcasting works through the existing composable flow, and the buildEncounterResponse refactor is a quality improvement.

One medium-severity item flagged for the Game Logic Reviewer: whether Sprint should consume only the Standard Action (per PTU text: "Action: Standard") or both Standard and Shift (as implemented). This is a PTU rules interpretation question outside the Senior Reviewer's domain.

## Required Changes

None. The medium issue is deferred to the Game Logic Reviewer for a PTU correctness ruling.
