# Browser Audit: Capture Domain -- Untestable Items

These capabilities have no UI terminus -- they are server-side services, utility functions, constants, composable internals, API endpoints, Prisma fields, or WebSocket events that are consumed by other code but never directly rendered in the browser.

---

## Utility Functions (Pure Calculation)

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C001 | calculateCaptureRate | utility | Pure function in `utils/captureRate.ts`. Called by composables/API, not rendered. |
| capture-C002 | attemptCapture | utility | Pure function in `utils/captureRate.ts`. Returns capture result data consumed by CapturePanel. |
| capture-C003 | getCaptureDescription | utility | Pure function returning difficulty text. Consumed by CaptureRateDisplay. |
| capture-C023 | formatModifier | utility | Formatting helper in `utils/pokeBallFormatters.ts`. Renders as text within BallSelector/CaptureRateDisplay but has no independent UI element. |
| capture-C024 | modifierClass | utility | CSS class helper in `utils/pokeBallFormatters.ts`. Returns class name, no UI element. |
| capture-C025 | isLegendarySpecies | utility | Boolean check function. No UI element. |
| capture-C059 | trainerXpOnCapture | utility | XP calculation utility. No UI terminus. |

## Constants

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C004 | POKE_BALL_CATALOG | constant | Object literal in `constants/pokeBalls.ts`. Data consumed by BallSelector. |
| capture-C026 | LEGENDARY_SPECIES | constant | Array in capture utilities. No UI element. |
| capture-C051 | PlayerActionType.capture | constant | Enum value in types. No UI element. |
| capture-C056 | BallConditionContext | constant | TypeScript type/interface. No UI element. |

## Ball Category/Lookup Utilities

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C005 | calculateBallModifier | utility | Returns numeric modifier. Consumed by BallSelector. |
| capture-C006 | getBallsByCategory | utility | Groups balls for BallSelector dropdown. No independent UI. |
| capture-C007 | getBallDef | utility | Looks up single ball definition. No independent UI. |
| capture-C008 | getAvailableBallNames | utility | Returns ball name list. Consumed by BallSelector. |

## Ball Condition Evaluators

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C009 | evaluateBallCondition | utility | Dispatcher for ball-specific evaluators. No UI element. |
| capture-C010 | evaluateTimerBall | utility | Timer Ball conditional logic. No UI element. |
| capture-C011 | evaluateQuickBall | utility | Quick Ball conditional logic. No UI element. |
| capture-C012 | evaluateLevelBall | utility | Level Ball conditional logic. No UI element. |
| capture-C013 | evaluateHeavyBall | utility | Heavy Ball conditional logic. No UI element. |
| capture-C014 | evaluateFastBall | utility | Fast Ball conditional logic. No UI element. |
| capture-C015 | evaluateLoveBall | utility | Love Ball conditional logic. No UI element. |
| capture-C016 | evaluateNetBall | utility | Net Ball conditional logic. No UI element. |
| capture-C017 | evaluateDuskBall | utility | Dusk Ball conditional logic. No UI element. |
| capture-C018 | evaluateMoonBall | utility | Moon Ball conditional logic. No UI element. |
| capture-C019 | evaluateLureBall | utility | Lure Ball conditional logic. No UI element. |
| capture-C020 | evaluateRepeatBall | utility | Repeat Ball conditional logic. No UI element. |
| capture-C021 | evaluateNestBall | utility | Nest Ball conditional logic. No UI element. |
| capture-C022 | evaluateDiveBall | utility | Dive Ball conditional logic. No UI element. |

## Service Functions

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C027 | buildConditionContext | service-function | Server-side in `ball-condition.service.ts`. No UI element. |
| capture-C028 | checkEvolvesWithStone | service-function | Server-side evolution check. No UI element. |
| capture-C029 | deriveEvoLine | service-function | Server-side evolution line derivation. No UI element. |

## API Endpoints

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C030 | Capture Rate API | api-endpoint | Server endpoint. Consumed by composables. |
| capture-C031 | Capture Attempt API | api-endpoint | Server endpoint. Called by CapturePanel/PlayerCapturePanel. |

## Composable Functions

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C032 | useCapture | composable-function | Composable instance. Consumed by CapturePanel. |
| capture-C033 | useCapture.getCaptureRate | composable-function | Fetch function. No independent UI. |
| capture-C034 | useCapture.calculateCaptureRateLocal | composable-function | Local calculation. Output shown via CaptureRateDisplay. |
| capture-C035 | useCapture.attemptCapture | composable-function | API caller. Result shown via CapturePanel. |
| capture-C036 | useCapture.rollAccuracyCheck | composable-function | Dice roll function. Result shown via CapturePanel. |
| capture-C037 | useCapture.getAvailableBalls | composable-function | Ball list function. Consumed by BallSelector. |
| capture-C038 | usePlayerCapture | composable-function | Player-side composable. Consumed by PlayerCapturePanel. |
| capture-C039 | usePlayerCombat.requestCapture | composable-function | WebSocket sender. No independent UI. |
| capture-C040 | usePlayerCombat.captureTargets | composable-function | Computed list. Consumed by PlayerCapturePanel. |
| capture-C041 | usePlayerRequestHandlers.handleApproveCapture | composable-function | GM approval handler. No independent UI. |

## WebSocket Events

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C050 | capture_attempt WebSocket event | websocket-event | Network protocol event. No UI element. |

## Prisma Fields

| Cap ID | Name | Type | Reason |
|--------|------|------|--------|
| capture-C052 | PokemonOrigin.captured | prisma-field | Database enum value. No UI element. |
| capture-C053 | Pokemon.ownerId | prisma-field | Database field. No UI element. |
| capture-C054 | Pokemon.loyalty | prisma-field | Database field. No UI element. |
| capture-C055 | HumanCharacter.ownedSpecies | prisma-field | Database field. No UI element. |

---

## Summary

| Category | Count |
|----------|-------|
| Utility functions | 7 |
| Constants/types | 4 |
| Ball utilities | 4 |
| Ball evaluators | 14 |
| Service functions | 3 |
| API endpoints | 2 |
| Composable functions | 10 |
| WebSocket events | 1 |
| Prisma fields | 4 |
| **Total untestable** | **49** |
