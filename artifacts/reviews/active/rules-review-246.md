---
review_id: rules-review-246
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-023
domain: player-view+capture+healing
commits_reviewed:
  - e4e9a639
  - 0379fb83
  - 9a6b9bee
  - c9ec6aec
  - 5271574d
  - c9dd7374
files_reviewed:
  - app/types/player-sync.ts
  - app/composables/usePlayerCombat.ts
  - app/components/encounter/PlayerRequestPanel.vue
  - app/composables/usePlayerRequestHandlers.ts
  - app/composables/useCapture.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/api/encounters/[id]/breather.post.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 2
reviewed_at: 2026-03-02T12:00:00Z
follows_up: null
---

## Review Scope

Game logic review of feature-023 P0: Player Capture & Healing Interfaces. Verifying that action economy annotations, GM approval workflow, and integration with existing PTU mechanics are correct.

**PTU rules verified against:**
- Capture: PTU Core p.214 (capture rate formula), p.227 (capture is Standard Action, throwing accuracy AC 6)
- Breather: PTU Core p.245 (Full Action -- uses Standard + Shift, cures volatile + Slowed/Stuck, Tripped/Vulnerable penalties)
- Healing Item: PTU Core p.276 (using items is a Standard Action during combat)

**Decrees verified:**
- decree-013: 1d100 capture system -- CONFIRMED. The player capture path delegates to `useCapture.attemptCapture()` which calls `/api/capture/attempt`, which uses `calculateCaptureRate()` and `attemptCapture()` from `captureRate.ts`. These implement the 1d100 system exclusively.
- decree-014: Stuck/Slow bonuses separate -- CONFIRMED. Not modified by this P0. The existing `captureRate.ts` handles Stuck (+10) and Slow (+5) in `OTHER_CONDITIONS` category, separate from volatile.
- decree-015: Real max HP for capture rate -- CONFIRMED. Not modified. The `/api/capture/attempt` endpoint reads `pokemon.maxHp` from the database, which is the real max HP (injury-reduced effective max is a separate computed value).
- decree-017: Pokemon Center heals to effective max HP -- Not directly applicable to combat healing items, but the healing item path (`encounterStore.useItem`) delegates to the existing `/api/encounters/:id/use-item` endpoint which has its own HP cap logic.
- decree-029: Rest healing min 1 HP -- Applicable to breather context. The breather endpoint (`breather.post.ts`) does NOT heal HP -- it resets stages, removes temp HP, cures conditions, and applies penalties. HP healing via breather is not a PTU mechanic. Decree-029 applies to rest healing (30-min rest, extended rest), not Take a Breather. No violation.

## Action Economy Verification

### Capture (Standard Action -- PTU p.227)

**Type annotation:** `player-sync.ts` line 14 comments "Standard Action, PTU p.227" -- CORRECT.

**Action consumption flow:**
1. Player sends `requestCapture` via WebSocket (no action consumed yet -- just a request)
2. GM receives in `PlayerRequestPanel`, clicks Approve
3. `handleApproveCapture` calls `useCapture.attemptCapture()` with `encounterContext`
4. `attemptCapture` in `useCapture.ts` (line 188-201) calls `/api/encounters/:id/action` with `actionType: 'standard'` after successful capture API call
5. Then `encounterStore.loadEncounter()` refreshes state

**Assessment:** The Standard Action is consumed server-side via the encounter action endpoint. The consumption happens AFTER the capture attempt API call succeeds, which means if the capture itself succeeds but the action consumption fails, the `warning` ref is set but the capture still proceeds. This is the existing behavior from the GM capture flow and is handled with a warning message. Correct for P0.

**Note:** The accuracy check (AC 6, d20 roll) is rolled by `rollAccuracyCheck()` but the result is only used for nat-20 critical detection on the server side. The actual AC 6 miss check is not implemented here. This is a pre-existing gap in the capture system (the GM currently handles AC 6 checks manually or through separate UI). P1 (capture UI) is the correct place to add this validation. Not blocking P0.

### Breather (Full Action -- PTU p.245)

**Type annotation:** `player-sync.ts` line 15 comments "Full Action, PTU p.245" -- CORRECT.

**Action consumption flow:**
1. Player sends `requestBreather` via WebSocket
2. GM receives, clicks Approve
3. `handleApproveBreather` calls `$fetch('/api/encounters/:id/breather')` with `combatantId` and `assisted`
4. The breather endpoint (`breather.post.ts` lines 172-178) sets `standardActionUsed: true` AND `shiftActionUsed: true` -- CORRECT for Full Action
5. Encounter state refreshed and broadcast

**Assessment:** Full Action correctly consumes both Standard and Shift actions. The `assisted` flag is properly forwarded. The breather shift banner logic in `handleApproveBreather` (lines 132-148) correctly detects the breather result and prompts the GM to shift the token on the VTT grid, which aligns with PTU p.245 ("must then move away from all enemies").

**Breather cures verified:** The server endpoint cures all volatile conditions except Cursed (requires source KO/distance per p.245) plus Slowed and Stuck. This is correct per decree-014 (Stuck/Slow are separate from volatile). Applied penalties: Tripped + Vulnerable (standard) or Tripped + ZeroEvasion (assisted). All correct.

### Healing Item (Standard Action -- PTU p.276)

**Type annotation:** `player-sync.ts` line 16 comments "Standard Action, PTU p.276" -- CORRECT.

**Action consumption flow:**
1. Player sends `requestHealingItem` via WebSocket
2. GM receives, clicks Approve
3. `handleApproveHealingItem` calls `encounterStore.useItem()` which calls `/api/encounters/:id/use-item`
4. The use-item endpoint handles Standard Action consumption internally

**Assessment:** Delegates to the existing item-use system. The `trainerCombatantId` is resolved to `trainerCombatant.entityId` to get the correct Prisma entity ID. Correct.

## GM Approval Workflow Assessment

The GM approval workflow does NOT bypass any PTU validation rules:

1. **Capture validation** is handled by `/api/capture/attempt` -- checks if Pokemon is owned (can't capture owned), checks if at 0 HP (can't capture fainted), calculates rate from real DB state.
2. **Breather validation** is handled by `breather.post.ts` -- requires valid combatantId, applies all rule effects server-side.
3. **Healing item validation** is handled by `/api/encounters/:id/use-item` -- validates item name, user, target.

The GM acts as a gatekeeper (approve/deny) but does not skip any server-side validation. This is the correct pattern -- the GM approval adds a human-in-the-loop check, and the server enforces the rules.

## Issues

### MEDIUM

#### RL-1: Breather assisted flag forwarded but assistant's Standard Action not consumed

**File:** `app/composables/usePlayerRequestHandlers.ts` (lines 102-163)

When a breather is assisted (PTU p.245), another character uses their Standard Action to help. The `handleApproveBreather` handler correctly forwards `assisted: true` to the breather endpoint, which applies the correct penalties (Tripped + ZeroEvasion instead of Tripped + Vulnerable). However, the assistant's Standard Action consumption is not handled anywhere in this flow.

The breather endpoint comment (line 7-9) notes: "The assistant's Standard Action must be consumed separately by the GM." This is a known limitation of the existing breather system, not introduced by P0. However, since the player request now includes `assisted: true`, the GM clicking Approve may expect the system to handle both action costs.

**Recommendation:** This is pre-existing behavior. For P0, add a comment in the handler noting that the assistant's action cost must be managed manually. Consider filing a follow-up ticket for P1/P2 to prompt the GM to select the assistant and consume their action.

#### RL-2: No validation that the requesting player's combatant has remaining Standard/Full Action

**File:** `app/composables/usePlayerCombat.ts` (lines 351-408)

The `requestCapture`, `requestBreather`, and `requestHealingItem` functions send requests without checking whether the player's combatant has the required action economy remaining. For example, `requestCapture` does not check `canUseStandardAction`, and `requestBreather` does not check that both Standard and Shift are available.

The P0 spec treats these as "request" functions -- the player requests, the GM validates. Server-side validation handles the actual action consumption. However, a player could spam requests for actions they cannot afford, cluttering the GM's request panel.

**Recommendation:** This is acceptable for P0 (the GM is the gatekeeper). P1 should add client-side guards using the existing `canUseStandardAction` and `canUseShiftAction` computed properties to disable capture/breather/healing request buttons when actions are exhausted. The composable already exposes these -- it is just not wired yet.

## What Looks Good

1. **Action type comments are accurate.** All three new types have correct PTU page references and action cost annotations in the type definition comments.

2. **Capture delegates to the proven 1d100 system.** Per decree-013, the capture path uses the existing `calculateCaptureRate` + `attemptCapture` pipeline. No new capture logic was introduced -- P0 correctly builds the request/approval plumbing only.

3. **Breather delegates to the full-featured endpoint.** The breather endpoint handles all PTU p.245 mechanics: stage reset, temp HP removal, volatile condition curing (with Cursed exception), Slowed/Stuck curing, penalty application, initiative reorder on speed change, and move log entry. The P0 handler correctly passes through to this endpoint.

4. **Healing item delegates to the existing use-item system.** The `encounterStore.useItem()` call correctly maps the player request fields to the store method's parameters.

5. **GM approval does not bypass server validation.** The human-in-the-loop pattern is correct -- the GM gates the action, and the server enforces the rules.

6. **WebSocket protocol is already capable.** The existing `player_action` / `player_action_ack` message types, `forwardToGm` routing, and `routeToPlayer` response routing handle the new action types without server-side changes. This validates the original protocol design.

## Verdict

**APPROVED**

The P0 implementation correctly annotates action economy for all three new action types, delegates to existing server-side validation for capture, breather, and healing items, and does not bypass any PTU rules through the GM approval workflow. The two MEDIUM issues (RL-1 assistant action cost, RL-2 client-side action guards) are pre-existing limitations and acceptable deferrals to P1/P2. No decree violations found.
