---
cap_id: capture-C019
name: evaluateLureBall
type: utility
domain: capture
---

### capture-C019: evaluateLureBall
- **cap_id**: capture-C019
- **name**: Lure Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateLureBall()`
- **game_concept**: PTU p.272: -20 if target was baited with food
- **description**: Context-dependent evaluator (GM-provided flag). Returns -20 if targetWasBaited is true. This is a GM override toggle since baiting is not automatically tracked.
- **inputs**: context.targetWasBaited
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
