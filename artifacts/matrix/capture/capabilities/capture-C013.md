---
cap_id: capture-C013
name: evaluateHeavyBall
type: utility
domain: capture
---

### capture-C013: evaluateHeavyBall
- **cap_id**: capture-C013
- **name**: Heavy Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateHeavyBall()`
- **game_concept**: PTU p.272: -5 per Weight Class above 1
- **description**: Stat-comparison evaluator. Returns -5 * (WC - 1) modifier. WC 1: 0, WC 2: -5, WC 3: -10, WC 4: -15, WC 5: -20, WC 6: -25.
- **inputs**: context.targetWeightClass
- **outputs**: BallConditionResult with weight-class-based modifier
- **accessible_from**: gm, player (via evaluateBallCondition)
