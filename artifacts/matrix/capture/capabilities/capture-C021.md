---
cap_id: capture-C021
name: evaluateNestBall
type: utility
domain: capture
---

### capture-C021: evaluateNestBall
- **cap_id**: capture-C021
- **name**: Nest Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateNestBall()`
- **game_concept**: PTU p.272: -20 if target is under level 10
- **description**: Context-dependent evaluator. Returns -20 if targetLevel < 10.
- **inputs**: context.targetLevel
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
