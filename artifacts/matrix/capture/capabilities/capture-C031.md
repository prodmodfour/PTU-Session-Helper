---
cap_id: capture-C031
name: Capture Attempt API
type: api-endpoint
domain: capture
---

### capture-C031: Capture Attempt API
- **cap_id**: capture-C031
- **name**: Execute Capture Attempt Endpoint
- **type**: api-endpoint
- **location**: `app/server/api/capture/attempt.post.ts`
- **game_concept**: Full PTU capture attempt with accuracy validation, ball modifiers, auto-link, post-capture effects, trainer XP
- **description**: POST endpoint performing a full capture attempt. (1) Validates accuracy roll if provided (nat 1 always misses, nat 20 always hits, else roll >= threshold per decree-042). (2) Looks up Pokemon (must be wild/unowned) + Trainer from DB. (3) Fetches SpeciesData for evolution/legendary detection. (4) Calculates capture rate. (5) Resolves ball type and builds condition context via buildConditionContext. (6) Calls attemptCapture with ball modifier. On success: sets ownerId, origin='captured', loyalty=2 (decree-049). Applies post-capture effects: Heal Ball (heal_full to maxHp per decree-015), Friend Ball (loyalty_plus_one), Luxury Ball (raised_happiness). Checks for new species -> +1 trainer XP (PTU p.461). Broadcasts capture_attempt WebSocket event.
- **inputs**: { pokemonId, trainerId, accuracyRoll?, accuracyThreshold?, ballType?, modifiers?, encounterId?, conditionContext? }
- **outputs**: { captured, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, trainerLevel, modifiers, ballModifier, ballType, difficulty, breakdown, ballBreakdown, pokemon, trainer, postCaptureEffect?, speciesXp? }
- **accessible_from**: gm, player (via useCapture composable, used by GM and GM-on-behalf-of-player flows)
