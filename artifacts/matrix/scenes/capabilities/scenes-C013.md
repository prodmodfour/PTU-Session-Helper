---
cap_id: scenes-C013
name: Get Active Scene
type: api-endpoint
domain: scenes
---

### scenes-C013
- **name:** Get Active Scene
- **type:** api-endpoint
- **location:** `app/server/api/scenes/active.get.ts`
- **game_concept:** Active scene retrieval with enrichment
- **description:** Returns the currently active scene enriched with isPlayerCharacter flags and ownerId on Pokemon from DB lookups. Returns null if no scene is active.
- **inputs:** None
- **outputs:** `{ success, data: EnrichedScene | null }`
- **accessible_from:** gm, group, player
