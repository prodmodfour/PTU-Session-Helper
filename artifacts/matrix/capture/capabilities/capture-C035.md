---
cap_id: capture-C035
name: useCapture.attemptCapture
type: composable-function
domain: capture
---

### capture-C035: useCapture.attemptCapture
- **cap_id**: capture-C035
- **name**: Capture Attempt Execution
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `attemptCapture()`
- **game_concept**: PTU p.227: throwing a Poke Ball is a Standard Action
- **description**: Calls POST /api/capture/attempt with pokemonId, trainerId, accuracyRoll, accuracyThreshold, ballType, modifiers, conditionContext. When encounterContext is provided, also calls POST /api/encounters/{id}/action to consume the trainer's Standard Action. If action consumption fails, sets warning but does not block the capture result.
- **inputs**: { pokemonId, trainerId, accuracyRoll?, accuracyThreshold?, ballType?, modifiers?, conditionContext?, encounterContext? }
- **outputs**: CaptureAttemptResult | null
- **accessible_from**: gm (via CapturePanel and usePlayerRequestHandlers)
