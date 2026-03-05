---
cap_id: capture-C022
name: evaluateDiveBall
type: utility
domain: capture
---

### capture-C022: evaluateDiveBall
- **cap_id**: capture-C022
- **name**: Dive Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateDiveBall()`
- **game_concept**: PTU p.272: -20 if target found underwater or underground
- **description**: Context-dependent evaluator (GM-provided flag). Returns -20 if isUnderwaterOrUnderground is true. This is a GM override toggle.
- **inputs**: context.isUnderwaterOrUnderground
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
