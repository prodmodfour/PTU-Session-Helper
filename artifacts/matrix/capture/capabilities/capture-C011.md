---
cap_id: capture-C011
name: evaluateQuickBall
type: utility
domain: capture
---

### capture-C011: evaluateQuickBall
- **cap_id**: capture-C011
- **name**: Quick Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateQuickBall()`
- **game_concept**: PTU p.273: Quick Ball best on round 1 (-20), degrades over time
- **description**: Round-dependent evaluator. Base -20 in catalog. Degrades: Round 1: total -20, Round 2: -15, Round 3: -10, Round 4+: 0.
- **inputs**: context.encounterRound
- **outputs**: BallConditionResult with round-based degradation
- **accessible_from**: gm, player (via evaluateBallCondition)
