---
cap_id: scenes-C004
name: SceneSyncPayload Type
type: constant
domain: scenes
---

### scenes-C004
- **name:** SceneSyncPayload Type
- **type:** constant
- **location:** `app/types/player-sync.ts` -- SceneSyncPayload
- **game_concept:** Player-visible scene data contract for WebSocket sync
- **description:** Stripped-down scene payload pushed to players. Excludes terrains, modifiers, positions. Contains scene metadata, characters with isPlayerCharacter, Pokemon with ownerId, and groups.
- **inputs:** Active scene data from DB
- **outputs:** WebSocket message payload to player clients
- **accessible_from:** player
