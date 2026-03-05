---
cap_id: scenes-C030
name: Scene-End AP Restoration
type: service-function
domain: scenes
---

### scenes-C030
- **name:** Scene-End AP Restoration
- **type:** service-function
- **location:** `app/server/services/scene.service.ts` -- restoreSceneAp()
- **game_concept:** PTU Core p221 -- AP regained at scene end
- **description:** Restores AP for all characters in a scene at scene end. Groups by (level, drainedAp) for batch updates. Unbinds bound AP, restores currentAp to max minus drainedAp.
- **inputs:** charactersJson (raw JSON string)
- **outputs:** Number of characters restored
- **accessible_from:** api-only
