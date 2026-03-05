---
cap_id: capture-C041
name: usePlayerRequestHandlers.handleApproveCapture
type: composable-function
domain: capture
---

### capture-C041: usePlayerRequestHandlers.handleApproveCapture
- **cap_id**: capture-C041
- **name**: GM Capture Approval Handler
- **type**: composable-function
- **location**: `app/composables/usePlayerRequestHandlers.ts` -- `handleApproveCapture()`
- **game_concept**: GM approves and executes a player's capture request
- **description**: When GM approves a player's capture request: (1) captures undo snapshot, (2) finds trainer combatant and computes accuracy params (decree-042), (3) rolls accuracy via rollAccuracyCheck, (4) if miss: consumes Standard Action and sends ack with miss reason, (5) if hit: calls attemptCapture with encounter context, (6) reloads encounter state, (7) sends player_action_ack with capture result including accuracyRoll, accuracyHit, captured, captureRate, roll, reason.
- **inputs**: { requestId, targetPokemonId, trainerCombatantId, ballType }
- **outputs**: Sends player_action_ack via WebSocket, reloads encounter state
- **accessible_from**: gm
