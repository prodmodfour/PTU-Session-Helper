---
cap_id: capture-C014
name: evaluateFastBall
type: utility
domain: capture
---

### capture-C014: evaluateFastBall
- **cap_id**: capture-C014
- **name**: Fast Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateFastBall()`
- **game_concept**: PTU p.272: -20 if target has Movement Capability above 7
- **description**: Stat-comparison evaluator. Returns -20 modifier if the target's highest movement capability exceeds 7. Uses targetMovementSpeed from context (derived from max of Overland, Swim, Sky).
- **inputs**: context.targetMovementSpeed
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
