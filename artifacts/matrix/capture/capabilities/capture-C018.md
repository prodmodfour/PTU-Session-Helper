---
cap_id: capture-C018
name: evaluateMoonBall
type: utility
domain: capture
---

### capture-C018: evaluateMoonBall
- **cap_id**: capture-C018
- **name**: Moon Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateMoonBall()`
- **game_concept**: PTU p.272: -20 if target evolves with an Evolution Stone
- **description**: Context-dependent evaluator. Returns -20 if targetEvolvesWithStone is true. Auto-populated by ball-condition.service from SpeciesData.evolutionTriggers.
- **inputs**: context.targetEvolvesWithStone
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
