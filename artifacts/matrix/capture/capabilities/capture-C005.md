---
cap_id: capture-C005
name: calculateBallModifier
type: utility
domain: capture
---

### capture-C005: calculateBallModifier
- **cap_id**: capture-C005
- **name**: Ball Modifier Calculator
- **type**: utility
- **location**: `app/constants/pokeBalls.ts` -- `calculateBallModifier()`
- **game_concept**: PTU Poke Ball total modifier (base + conditional)
- **description**: Calculates the total ball modifier by combining the ball's base modifier from the catalog with conditional modifiers evaluated by the condition engine (evaluateBallCondition). Returns a breakdown of base, conditional, total, whether condition was met, and a description.
- **inputs**: ballType (string), context (Partial<BallConditionContext>)
- **outputs**: { total, base, conditional, conditionMet, description? }
- **accessible_from**: gm, player (auto-imported utility)
