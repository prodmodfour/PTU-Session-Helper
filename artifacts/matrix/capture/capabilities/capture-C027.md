---
cap_id: capture-C027
name: buildConditionContext
type: service-function
domain: capture
---

### capture-C027: buildConditionContext
- **cap_id**: capture-C027
- **name**: Ball Condition Context Builder
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts` -- `buildConditionContext()`
- **game_concept**: Auto-populate Poke Ball condition context from DB data
- **description**: Server-side service that builds BallConditionContext from Pokemon, SpeciesData, trainer, and encounter state. Auto-populates: encounterRound (from encounter record), targetLevel/types/gender/species/weightClass/movementSpeed (from SpeciesData), activePokemonLevel/gender/evoLine (from trainer's active Pokemon in encounter), trainerOwnsSpecies (Prisma count query), targetEvolvesWithStone (from evolutionTriggers). GM overrides take priority over auto-populated values.
- **inputs**: pokemon (PokemonFields), speciesData, trainer ({ id }), encounterId?, gmOverrides?
- **outputs**: Partial<BallConditionContext>
- **accessible_from**: api-only (used by capture/rate.post.ts and capture/attempt.post.ts)
