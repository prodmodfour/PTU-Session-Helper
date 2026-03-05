---
review_id: rules-review-ptu-rule-121
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-121
domain: combat
commits_reviewed:
  - 3e169e3e
  - c1d49a76
  - b3b37a55
  - 74ba0fd2
mechanics_verified:
  - sprint-action-cost
  - sprint-movement-bonus
  - turn-state-action-tracking
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
ptu_refs:
  - core/07-combat.md#Page-245-Sprint-Maneuver
  - core/07-combat.md#Page-227-Action-Types
  - core/07-combat.md#Page-227-Full-Action
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Sprint Action Cost (Standard Action)
- **Rule:** "Maneuver: Sprint / Action: Standard / Class: Status / Range: Self / Effect: Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md#Page-245`)
- **Implementation:** `sprint.post.ts` lines 42-49 set `standardActionUsed: true`, `shiftActionUsed: true`, and `hasActed: true` on `combatant.turnState`.
- **Status:** CORRECT (with note on shift action -- see M1 below)

### Sprint Movement Bonus (+50%)
- **Rule:** "Increase your Movement Speeds by 50% for the rest of your turn." (`core/07-combat.md#Page-245`)
- **Implementation:** Sprint applies a `'Sprint'` tempCondition (line 38). The `movementModifiers.ts` utility (line 72) applies `Math.floor(speed * 1.5)` when the tempCondition is present. The `intercept.service.ts` (line 216-217) applies the same formula.
- **Status:** CORRECT. The +50% is correctly applied as a multiplicative speed modifier. The rounding-down via `Math.floor` is the standard PTU approach for fractional values.

### Turn State Action Tracking
- **Rule:** "During each round of combat, each participant may take one Standard Action, one Shift Action, and one Swift Action on their turn in any order." (`core/07-combat.md#Page-227`)
- **Implementation:** `sprint.post.ts` uses immutable spread pattern to update `combatant.turnState`, matching the `breather.post.ts` pattern (lines 172-178). The updated combatants array is persisted via `prisma.encounter.update`.
- **Status:** CORRECT. Immutable update pattern preserves other turnState fields (swiftActionUsed, canBeCommanded, isHolding, forfeit flags).

### Sprint Duration / Cleanup
- **Rule:** "for the rest of your turn" (`core/07-combat.md#Page-245`)
- **Implementation:** Sprint is stored as a `tempCondition` on the combatant. `next-turn.post.ts` line 107 clears all tempConditions (`currentCombatant.tempConditions = []`) when the turn ends, except during declaration phase.
- **Status:** CORRECT. Although comments say "until next turn", the practical behavior is identical to "rest of your turn" since tempConditions clear at the turn-end transition in `next-turn.post.ts`.

### WebSocket Broadcast
- **Rule:** N/A (application architecture)
- **Implementation:** The client-side `useEncounterActions.ts` (line 243) calls `broadcastUpdate()` after the sprint endpoint returns. This sends an `encounter_update` WebSocket event containing the full encounter state, ensuring Group View sees the updated turnState and tempConditions.
- **Status:** CORRECT. The broadcast happens after the server response is set on the store, so all clients receive the post-sprint state.

## Findings

### M1: shiftActionUsed is a design interpretation, not RAW (MEDIUM)

**Issue:** PTU lists Sprint as "Action: Standard" -- NOT as a Full Action. Full Actions are explicitly defined on p.227 as consuming "both your Standard Action and Shift Action." The three listed Full Actions are Take a Breather, Coup de Grace, and Intercept. Sprint is not among them.

Setting `shiftActionUsed: true` means the combatant cannot shift after sprinting. The ticket justifies this with "the Sprint movement IS the shift," which is a reasonable game-design interpretation: if Sprint grants +50% movement for the rest of your turn, the natural expectation is that you use your remaining shift movement at the boosted speed, effectively making it a combined standard+shift action.

However, RAW does not explicitly state this. A strict reading allows: Standard Action (Sprint for +50%) + Shift Action (move at boosted speed). Under that reading, the shift is still available as a separate action, and Sprint merely buffs it. The current implementation collapses both into one action.

**File:** `app/server/api/encounters/[id]/sprint.post.ts` line 47
**Severity:** MEDIUM
**Recommendation:** This is an ambiguity best resolved by a design decree. The current behavior is defensible and consistent with the breather pattern. No code change required unless a decree rules otherwise. Filing a `decree-need` ticket.

### M2: Redundant client-side action consumption (MEDIUM)

**Issue:** In `useEncounterActions.ts`, Sprint handling (lines 198-212) makes two sequential server calls:

1. Line 199: `encounterStore.useAction(combatantId, 'standard')` -- calls `/api/encounters/${id}/action` which marks `standardActionUsed: true` server-side.
2. Lines 208-211: `encounterCombatStore.sprint(encounterId, combatantId)` -- calls `/api/encounters/${id}/sprint` which now ALSO sets `standardActionUsed: true`, `shiftActionUsed: true`, `hasActed: true` server-side.

The first call's effect is entirely redundant because the second call (sprint endpoint) unconditionally overwrites the same field. This means:
- An extra HTTP round-trip on every Sprint action.
- A race condition window: between the two calls, the combatant's turnState shows `standardActionUsed: true` but `shiftActionUsed: false`, which is an intermediate state that could be observed by concurrent clients.
- The `action.post.ts` endpoint (line 54) throws a 400 if the action is already used, so if Sprint is attempted when the standard action is already consumed, the first call would fail even though the sprint endpoint itself has no such guard.

**File:** `app/composables/useEncounterActions.ts` lines 198-212
**Severity:** MEDIUM
**Recommendation:** Remove the `useAction('standard')` call on line 199 for the `sprint` maneuver ID since the sprint endpoint now handles action consumption. This would also apply to the `take-a-breather` case (lines 203-205) since the breather endpoint similarly handles its own action consumption. However, this is a client-side code quality issue, not a game logic error, so it falls under Senior Reviewer scope.

### Pre-existing: No server-side guard against double Sprint

**Note:** The sprint endpoint does not check `combatant.turnState.standardActionUsed` before applying Sprint. If the standard action is already consumed (e.g., the combatant used a move), the sprint endpoint will still apply the Sprint tempCondition and mark actions as used without error. In practice, the client-side UI likely prevents this (Sprint button hidden when standard action is used), but the server lacks a defensive guard. This is a pre-existing issue from the original `74ba0fd2` commit, not introduced by the fix being reviewed.

## Decree Check

- **decree-006** (initiative-speed-cs): Not directly applicable. Sprint does not change Speed CS; it adds a movement speed multiplier via tempCondition. No initiative reorder needed.
- **decree-032** (Cursed tick on Standard Action): Tangentially relevant. Sprint consuming the Standard Action means Cursed damage would tick if the combatant is Cursed. The sprint endpoint does not trigger Cursed ticks itself (that is handled by `next-turn.post.ts`), which is correct -- tick damage fires at turn end, not at action consumption time.
- **No existing decrees** govern Sprint's shift action consumption. See M1.

## Errata Check

Searched `books/markdown/errata-2.md` for "Sprint" -- only one hit, in the Combat Medic's Primer errata: "After taking a Sprint Maneuver, you may apply a Restorative Item on an adjacent target as a Swift Action." This confirms Sprint is a recognized maneuver in errata but does not modify Sprint's action cost or mechanics.

## Summary

The fix in commit `3e169e3e` correctly addresses the missing action consumption by adding `standardActionUsed`, `shiftActionUsed`, and `hasActed` to the Sprint endpoint's turnState update. The implementation uses the correct immutable spread pattern matching `breather.post.ts`. The Sprint +50% movement bonus is correctly implemented via tempCondition with proper cleanup at turn end. WebSocket broadcast propagates the updated state to all clients.

Two MEDIUM issues identified:
1. Setting `shiftActionUsed` is a reasonable interpretation but not explicitly RAW; recommend a decree for clarity.
2. The client-side `useEncounterActions.ts` now has redundant action consumption calls for Sprint (and similarly for Breather).

No CRITICAL or HIGH issues found. The core fix is sound.

## Rulings

1. **Sprint Standard Action consumption:** CORRECT per PTU p.245. Sprint is listed as "Action: Standard."
2. **Sprint Shift Action consumption:** Defensible but not explicitly RAW. Recommend decree. Not blocking.
3. **hasActed flag:** CORRECT. Consistent with how other action-consuming endpoints work. `hasActed` is used by initiative reorder (decree-006) to prevent double-turns.
4. **Sprint + already-used actions edge case:** Server endpoint has no guard (pre-existing). Client UI likely prevents this, but server should ideally validate. Not blocking for this review.

## Verdict

**APPROVED** -- The fix correctly implements Sprint action consumption per PTU rules. The two MEDIUM findings are non-blocking: M1 is a design interpretation question best resolved by decree, and M2 is a client-side code quality matter for Senior Reviewer.

## Required Changes

None required. Optional improvements:
- File `decree-need` ticket for Sprint shift action consumption (M1)
- Remove redundant `useAction('standard')` call for Sprint in `useEncounterActions.ts` (M2, Senior Reviewer scope)
