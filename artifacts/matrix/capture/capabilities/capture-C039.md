---
cap_id: capture-C039
name: usePlayerCombat.requestCapture
type: composable-function
domain: capture
---

### capture-C039: usePlayerCombat.requestCapture
- **cap_id**: capture-C039
- **name**: Player Capture Request (WebSocket)
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts` -- `requestCapture()`
- **game_concept**: PTU p.227: Player requests to throw a Poke Ball (Standard Action, GM must approve)
- **description**: Sends a player_action WebSocket message with action='capture' to the GM. Includes targetPokemonId, targetPokemonName, ballType (default Basic Ball), captureRatePreview, and trainerCombatantId. GM receives this in PlayerRequestPanel and can approve (handleApproveCapture) or deny.
- **inputs**: { targetPokemonId, targetPokemonName, ballType?, captureRatePreview?, trainerCombatantId }
- **outputs**: WebSocket message sent (no return value)
- **accessible_from**: player
