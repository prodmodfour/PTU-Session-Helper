---
cap_id: capture-C012
name: evaluateLevelBall
type: utility
domain: capture
---

### capture-C012: evaluateLevelBall
- **cap_id**: capture-C012
- **name**: Level Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateLevelBall()`
- **game_concept**: PTU p.272: -20 if target level < half active Pokemon level
- **description**: Stat-comparison evaluator. Returns -20 modifier if target's level is under half the active Pokemon's level. Requires both targetLevel and activePokemonLevel in context.
- **inputs**: context.targetLevel, context.activePokemonLevel
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
