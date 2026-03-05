---
cap_id: capture-C015
name: evaluateLoveBall
type: utility
domain: capture
---

### capture-C015: evaluateLoveBall
- **cap_id**: capture-C015
- **name**: Love Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateLoveBall()`
- **game_concept**: PTU p.272: -30 if active Pokemon is same evo line + opposite gender
- **description**: Context-dependent evaluator. Returns -30 if the active Pokemon is the same evolutionary line as the target AND opposite gender. Does not work with genderless Pokemon. Uses evo line overlap check (case-insensitive).
- **inputs**: context.targetGender, context.activePokemonGender, context.targetEvoLine, context.activePokemonEvoLine
- **outputs**: BallConditionResult (-30 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
