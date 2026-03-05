---
cap_id: capture-C017
name: evaluateDuskBall
type: utility
domain: capture
---

### capture-C017: evaluateDuskBall
- **cap_id**: capture-C017
- **name**: Dusk Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateDuskBall()`
- **game_concept**: PTU p.273: -20 in dark or low-light conditions
- **description**: Context-dependent evaluator (GM-provided flag). Returns -20 if isDarkOrLowLight is true. This is a GM override toggle since lighting conditions are not automatically tracked.
- **inputs**: context.isDarkOrLowLight
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
