---
cap_id: capture-C016
name: evaluateNetBall
type: utility
domain: capture
---

### capture-C016: evaluateNetBall
- **cap_id**: capture-C016
- **name**: Net Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateNetBall()`
- **game_concept**: PTU p.272: -20 if target is Water or Bug type
- **description**: Context-dependent evaluator. Returns -20 if the target Pokemon has Water or Bug as any of its types (case-insensitive check).
- **inputs**: context.targetTypes
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
