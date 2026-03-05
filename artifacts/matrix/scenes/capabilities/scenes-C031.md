---
cap_id: scenes-C031
name: Calculate Scene-End AP
type: utility
domain: scenes
---

### scenes-C031
- **name:** Calculate Scene-End AP
- **type:** utility
- **location:** `app/utils/restHealing.ts` -- calculateSceneEndAp()
- **game_concept:** PTU Core p221 -- AP restoration math
- **description:** Pure function: AP = maxAp(level) - drainedAp. Drained AP stays until Extended Rest. Bound AP released at scene end.
- **inputs:** level, drainedAp, boundAp (optional)
- **outputs:** Restored AP value
- **accessible_from:** api-only
