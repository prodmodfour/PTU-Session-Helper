---
cap_id: capture-C036
name: useCapture.rollAccuracyCheck
type: composable-function
domain: capture
---

### capture-C036: useCapture.rollAccuracyCheck
- **cap_id**: capture-C036
- **name**: Poke Ball Accuracy Check
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` -- `rollAccuracyCheck()`
- **game_concept**: PTU p.214: AC 6 Status Attack Roll with full accuracy system (decree-042)
- **description**: Rolls d20 for Poke Ball accuracy. Computes threshold from base AC 6 + evasion - accuracy stages - flanking + rough terrain (matching useMoveCalculation formula). Evasion capped at 9 (PTU p.234). Natural 1 always misses, natural 20 always hits, otherwise roll >= threshold.
- **inputs**: CaptureAccuracyParams? { throwerAccuracyStage?, targetSpeedEvasion?, flankingPenalty?, roughTerrainPenalty? }
- **outputs**: { roll, isNat1, isNat20, hits, threshold }
- **accessible_from**: gm (used by CapturePanel.rollAndThrow and usePlayerRequestHandlers.handleApproveCapture)
