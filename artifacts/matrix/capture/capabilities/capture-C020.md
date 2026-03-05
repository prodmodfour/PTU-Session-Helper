---
cap_id: capture-C020
name: evaluateRepeatBall
type: utility
domain: capture
---

### capture-C020: evaluateRepeatBall
- **cap_id**: capture-C020
- **name**: Repeat Ball Condition Evaluator
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateRepeatBall()`
- **game_concept**: PTU p.272: -20 if trainer already owns same species
- **description**: Context-dependent evaluator. Returns -20 if trainerOwnsSpecies is true. Auto-populated by ball-condition.service via DB query (prisma.pokemon.count).
- **inputs**: context.trainerOwnsSpecies
- **outputs**: BallConditionResult (-20 or 0)
- **accessible_from**: gm, player (via evaluateBallCondition)
