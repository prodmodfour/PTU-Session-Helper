---
cap_id: capture-C051
name: PlayerActionType.capture
type: constant
domain: capture
---

### capture-C051: PlayerActionType 'capture'
- **cap_id**: capture-C051
- **name**: Capture Player Action Type
- **type**: constant
- **location**: `app/types/player-sync.ts` -- PlayerActionType union, PlayerActionRequest interface, CaptureAckResult interface
- **game_concept**: Player-to-GM capture request protocol
- **description**: Defines the 'capture' action type in the PlayerActionType union. PlayerActionRequest includes capture-specific fields: targetPokemonId, targetPokemonName, ballType, captureRatePreview, trainerCombatantId. CaptureAckResult provides structured response: accuracyRoll, accuracyHit, captured, captureRate, roll, reason. Used in player_action and player_action_ack WebSocket messages.
- **inputs**: N/A (type definition)
- **outputs**: Type contracts for capture request/ack
- **accessible_from**: gm, player (used by composables and components on both sides)
