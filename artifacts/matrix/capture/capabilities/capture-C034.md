---
cap_id: capture-C034
name: useCapture.calculateCaptureRateLocal
type: composable-function
domain: capture
---

### capture-C034: useCapture.calculateCaptureRateLocal
- **cap_id**: capture-C034
- **name**: Client-Side Capture Rate Calculation
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `calculateCaptureRateLocal()`
- **game_concept**: PTU capture rate preview without API call, with ball modifier
- **description**: Calculates capture rate locally using calculateCaptureRate utility + calculateBallModifier. Used for real-time preview in CapturePanel as the GM adjusts ball type and context toggles. Less accurate than server-side (evolution stage defaults if not provided). Accepts conditionContext for conditional ball modifier evaluation.
- **inputs**: { level, currentHp, maxHp, evolutionStage?, maxEvolutionStage?, statusConditions?, injuries?, isShiny?, isLegendary?, ballType?, conditionContext? }
- **outputs**: CaptureRateData (with ball breakdown)
- **accessible_from**: gm, player (via usePlayerCapture.estimateCaptureRate)
