---
cap_id: capture-C059
name: trainerXpOnCapture
type: utility
domain: capture
---

### capture-C059: Trainer XP on New Species Capture
- **cap_id**: capture-C059
- **name**: Trainer XP Award on New Species
- **type**: utility
- **location**: `app/utils/trainerExperience.ts` -- `applyTrainerXp()`, `isNewSpecies()` (called from `app/server/api/capture/attempt.post.ts`)
- **game_concept**: PTU p.461: +1 trainer XP for capturing a new species
- **description**: After successful capture, attempt.post.ts checks if the captured species is new for the trainer (isNewSpecies against ownedSpecies JSON array). If new: appends species to ownedSpecies, calls applyTrainerXp to add +1 XP. Handles multi-level jumps (bank reaches 10+). Broadcasts character_update WebSocket event on level-up.
- **inputs**: trainer's currentXp, currentLevel, captured species
- **outputs**: Updated trainerXp, level, ownedSpecies in DB; speciesXp in API response
- **accessible_from**: api-only (internal to capture attempt API)
