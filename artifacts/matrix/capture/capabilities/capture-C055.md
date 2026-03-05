---
cap_id: capture-C055
name: HumanCharacter.ownedSpecies
type: prisma-field
domain: capture
---

### capture-C055: HumanCharacter.ownedSpecies
- **cap_id**: capture-C055
- **name**: Trainer Owned Species History
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -- HumanCharacter.ownedSpecies (JSON array, mapped as capturedSpecies)
- **game_concept**: PTU p.461: +1 trainer XP for new species capture
- **description**: JSON array of lowercase species names tracking all species a trainer has owned. Updated on successful capture with new species. Used by capture/attempt.post.ts to check isNewSpecies and award +1 trainer XP.
- **inputs**: Appended on capture of new species
- **outputs**: Used for new species detection and trainer XP calculation
- **accessible_from**: api-only (internal to capture attempt API)
