---
domain: capture
type: capabilities
total_capabilities: 59
mapped_at: 2026-03-05T12:00:00Z
mapped_by: app-capability-mapper
---

# App Capabilities: Capture

> Re-mapped: 2026-03-05. Major expansion from 13 to 59 capabilities. New since last mapping: 25 Poke Ball types with full conditional modifier system (13 evaluators), ball-condition.service, player capture request flow (WebSocket), BallSelector/CapturePanel/CaptureContextToggles components, PlayerCapturePanel, post-capture effects (Heal Ball, Friend Ball, Luxury Ball), trainer XP on new species, decree-042 accuracy system, decree-049 loyalty defaults.

---

## Capability Listing

| Cap ID | Name | Type |
|--------|------|------|
| capture-C001 | calculateCaptureRate | utility |
| capture-C002 | attemptCapture | utility |
| capture-C003 | getCaptureDescription | utility |
| capture-C004 | POKE_BALL_CATALOG | constant |
| capture-C005 | calculateBallModifier | utility |
| capture-C006 | getBallsByCategory | utility |
| capture-C007 | getBallDef | utility |
| capture-C008 | getAvailableBallNames | utility |
| capture-C009 | evaluateBallCondition | utility |
| capture-C010 | evaluateTimerBall | utility |
| capture-C011 | evaluateQuickBall | utility |
| capture-C012 | evaluateLevelBall | utility |
| capture-C013 | evaluateHeavyBall | utility |
| capture-C014 | evaluateFastBall | utility |
| capture-C015 | evaluateLoveBall | utility |
| capture-C016 | evaluateNetBall | utility |
| capture-C017 | evaluateDuskBall | utility |
| capture-C018 | evaluateMoonBall | utility |
| capture-C019 | evaluateLureBall | utility |
| capture-C020 | evaluateRepeatBall | utility |
| capture-C021 | evaluateNestBall | utility |
| capture-C022 | evaluateDiveBall | utility |
| capture-C023 | formatModifier | utility |
| capture-C024 | modifierClass | utility |
| capture-C025 | isLegendarySpecies | utility |
| capture-C026 | LEGENDARY_SPECIES | constant |
| capture-C027 | buildConditionContext | service-function |
| capture-C028 | checkEvolvesWithStone | service-function |
| capture-C029 | deriveEvoLine | service-function |
| capture-C030 | Capture Rate API | api-endpoint |
| capture-C031 | Capture Attempt API | api-endpoint |
| capture-C032 | useCapture | composable-function |
| capture-C033 | useCapture.getCaptureRate | composable-function |
| capture-C034 | useCapture.calculateCaptureRateLocal | composable-function |
| capture-C035 | useCapture.attemptCapture | composable-function |
| capture-C036 | useCapture.rollAccuracyCheck | composable-function |
| capture-C037 | useCapture.getAvailableBalls | composable-function |
| capture-C038 | usePlayerCapture | composable-function |
| capture-C039 | usePlayerCombat.requestCapture | composable-function |
| capture-C040 | usePlayerCombat.captureTargets | composable-function |
| capture-C041 | usePlayerRequestHandlers.handleApproveCapture | composable-function |
| capture-C042 | CapturePanel | component |
| capture-C043 | BallSelector | component |
| capture-C044 | CaptureContextToggles | component |
| capture-C045 | CaptureRateDisplay | component |
| capture-C046 | CombatantCaptureSection | component |
| capture-C047 | PlayerCapturePanel | component |
| capture-C048 | PlayerCombatActions.captureButton | component |
| capture-C049 | PlayerRequestPanel.captureApproval | component |
| capture-C050 | capture_attempt WebSocket event | websocket-event |
| capture-C051 | PlayerActionType.capture | constant |
| capture-C052 | PokemonOrigin.captured | prisma-field |
| capture-C053 | Pokemon.ownerId | prisma-field |
| capture-C054 | Pokemon.loyalty | prisma-field |
| capture-C055 | HumanCharacter.ownedSpecies | prisma-field |
| capture-C056 | BallConditionContext | constant |
| capture-C057 | CombatantCard.captureSection | component |
| capture-C058 | player.index.captureAckDisplay | component |
| capture-C059 | trainerXpOnCapture | utility |
