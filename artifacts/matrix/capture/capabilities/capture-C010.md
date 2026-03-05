---
cap_id: capture-C010
name: evaluateTimerBall
type: utility
domain: capture
---

### capture-C010: evaluateTimerBall
- **cap_id**: capture-C010
- **name**: Timer Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateTimerBall()`
- **game_concept**: PTU p.272: Timer Ball improves by -5 per round, total capped at -20
- **description**: Round-dependent evaluator. Base +5 in catalog. Conditional: -5 per round elapsed since encounter start. Total capped at -20. Round 1: total +5, Round 2: 0, Round 3: -5, Round 6+: -20.
- **inputs**: context.encounterRound
- **outputs**: BallConditionResult with round-based modifier
- **accessible_from**: gm, player (via evaluateBallCondition)
