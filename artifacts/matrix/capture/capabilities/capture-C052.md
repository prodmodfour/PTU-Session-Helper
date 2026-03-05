---
cap_id: capture-C052
name: PokemonOrigin.captured
type: prisma-field
domain: capture
---

### capture-C052: PokemonOrigin 'captured'
- **cap_id**: capture-C052
- **name**: Pokemon Origin 'captured' Value
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -- Pokemon.origin field; `app/types/character.ts` -- PokemonOrigin type
- **game_concept**: PTU: captured Pokemon tracked with 'captured' origin
- **description**: The Pokemon.origin field (String, default 'manual') accepts 'captured' as a value. Set automatically by capture/attempt.post.ts on successful capture. Used for tracking how Pokemon entered the game.
- **inputs**: Set during capture
- **outputs**: Stored in DB, readable on Pokemon entity
- **accessible_from**: gm (visible in character/Pokemon management)
