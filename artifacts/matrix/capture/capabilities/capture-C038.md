---
cap_id: capture-C038
name: usePlayerCapture
type: composable-function
domain: capture
---

### capture-C038: usePlayerCapture
- **cap_id**: capture-C038
- **name**: Player Capture Composable
- **type**: composable-function
- **location**: `app/composables/usePlayerCapture.ts` -- `usePlayerCapture()`
- **game_concept**: Player-side capture rate preview (does NOT execute capture -- GM-only)
- **description**: Provides capture rate preview for the Player View. fetchCaptureRate calls server endpoint for accurate rate (includes SpeciesData). estimateCaptureRate calculates locally as fallback (omits evolution stage and legendary modifiers since client-side Pokemon type lacks SpeciesData). Neither function executes capture -- that is GM-only via usePlayerRequestHandlers.
- **inputs**: Combatant (target)
- **outputs**: { fetchCaptureRate, estimateCaptureRate, loading, error }
- **accessible_from**: player
