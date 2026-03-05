---
cap_id: capture-C009
name: evaluateBallCondition
type: utility
domain: capture
---

### capture-C009: evaluateBallCondition
- **cap_id**: capture-C009
- **name**: Ball Condition Evaluator Registry
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts` -- `evaluateBallCondition()`
- **game_concept**: PTU conditional Poke Ball modifiers (13 ball types have conditions)
- **description**: Registry-based dispatcher that evaluates conditional modifiers for any ball type. Looks up the ball name in BALL_CONDITION_EVALUATORS and calls the appropriate pure evaluator function. Returns modifier=0 if no evaluator exists or conditions are not met. Covers 13 conditional balls: Timer, Quick, Level, Heavy, Fast (stat-comparison); Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive (context-dependent).
- **inputs**: ballName (string), context (Partial<BallConditionContext>)
- **outputs**: BallConditionResult { modifier, conditionMet, description? }
- **accessible_from**: gm, player (auto-imported utility)
