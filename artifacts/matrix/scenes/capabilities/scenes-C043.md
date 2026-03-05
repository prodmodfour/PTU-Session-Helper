---
cap_id: scenes-C043
name: Batch Position Update Store Action
type: store-action
domain: scenes
---

### scenes-C043
- **name:** Batch Position Update Store Action
- **type:** store-action
- **location:** `app/stores/groupViewTabs.ts` -- updatePositions
- **game_concept:** Scene drag-and-drop persistence
- **description:** Sends batch position updates to PUT /api/scenes/:id/positions. Fire-and-forget.
- **inputs:** sceneId, positions object
- **outputs:** Server response (void)
- **accessible_from:** gm
