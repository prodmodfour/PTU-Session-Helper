---
cap_id: capture-C032
name: useCapture
type: composable-function
domain: capture
---

### capture-C032: useCapture
- **cap_id**: capture-C032
- **name**: Capture Composable
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `useCapture()`
- **game_concept**: Client-side capture interface providing rate calculation, attempt execution, and accuracy checks
- **description**: Primary capture composable providing five functions: getCaptureRate (API call to /api/capture/rate), calculateCaptureRateLocal (client-side calculation with ball modifier preview), attemptCapture (API call to /api/capture/attempt with optional encounter context for Standard Action consumption), rollAccuracyCheck (d20 roll with full accuracy system per decree-042), getAvailableBalls (filtered ball list). Manages loading/error/warning reactive state.
- **inputs**: Various per function (pokemonId, trainerId, encounter context, accuracy params)
- **outputs**: { loading, error, warning, getCaptureRate, calculateCaptureRateLocal, attemptCapture, rollAccuracyCheck, getAvailableBalls }
- **accessible_from**: gm, player (used by CapturePanel component and usePlayerRequestHandlers)
