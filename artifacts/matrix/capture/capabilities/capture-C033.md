---
cap_id: capture-C033
name: useCapture.getCaptureRate
type: composable-function
domain: capture
---

### capture-C033: useCapture.getCaptureRate
- **cap_id**: capture-C033
- **name**: Server-Side Capture Rate Fetch
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `getCaptureRate()`
- **game_concept**: Accurate capture rate with full SpeciesData (evolution stage, legendary detection)
- **description**: Calls POST /api/capture/rate with pokemonId, optional ballType, conditionContext, encounterId, and trainerId. Returns CaptureRateData with full breakdown and ball modifier details. Used when accuracy is critical (has evolution stage data that client-side does not).
- **inputs**: pokemonId, ballType?, conditionContext?, encounterId?, trainerId?
- **outputs**: CaptureRateData | null
- **accessible_from**: gm, player (via usePlayerCapture.fetchCaptureRate)
