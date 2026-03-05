# Capture Domain -- Application Capabilities

> Generated: 2026-03-05 | Source: deep-read of all capture source files | Capabilities: 59

## Summary of Changes Since Last Mapping (2026-02-26)

The previous mapping had 13 capabilities and marked the player capture interface and Poke Ball inventory as missing subsystems. Since then, the capture domain has undergone major expansion:

- **Poke Ball System**: 25 ball types fully cataloged with base modifiers, conditional modifiers (13 evaluator functions), post-capture effects (Heal Ball, Friend Ball, Luxury Ball), and display categories.
- **Player Capture Flow**: Full player-side capture request system via WebSocket (select target, preview rate, request GM approval, receive ack with result).
- **Accuracy System**: Decree-042 full accuracy system for Poke Ball throws (thrower accuracy stages, target Speed Evasion, flanking, rough terrain).
- **Post-Capture Effects**: Heal Ball (full HP restore), Friend Ball (+1 Loyalty), Luxury Ball (raised happiness).
- **Loyalty**: Wild captures default to Loyalty 2 (Wary) per decree-049.
- **Trainer XP**: New species detection and +1 XP award on capture (PTU p.461).
- **GM Context**: CaptureContextToggles for GM-only flags (baited, dark, underwater).
- **Ball Condition Service**: Server-side auto-population of ball condition context from encounter state, SpeciesData, and trainer data.

---

## Individual Capabilities

### Utility Functions (C001-C003: Core Capture Math)

#### capture-C001: Capture Rate Calculation
- **type**: utility
- **location**: `app/utils/captureRate.ts` -> `calculateCaptureRate()`
- **game_concept**: PTU capture rate formula (base 100 adjusted by modifiers)
- **description**: Pure function calculating capture rate from base 100. Applies: level modifier (-level*2), HP modifier (1 HP: +30, <=25%: +15, <=50%: 0, <=75%: -15, >75%: -30), evolution stage modifier (+10/0/-10 based on evolutions remaining), rarity modifiers (shiny: -10, legendary: -30), status condition modifiers (persistent: +10, volatile: +5, Poison/Badly Poisoned deduplicated per decree-038), Stuck: +10, Slowed: +5, injury modifier (+5 per injury). Returns canBeCaptured=false when currentHp<=0.
- **inputs**: CaptureRateInput { level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary }
- **outputs**: CaptureRateResult { captureRate, breakdown, canBeCaptured, hpPercentage }
- **accessible_from**: gm, player

#### capture-C002: Capture Attempt Simulation
- **type**: utility
- **location**: `app/utils/captureRate.ts` -> `attemptCapture()`
- **game_concept**: PTU capture roll (1d100 system per decree-013)
- **description**: Rolls 1d100. Modified roll = roll - trainerLevel + modifiers + ballModifier. Ball modifiers are negative (easier capture). Critical hit adds +10 to effective capture rate. Natural 100 always captures. Success if modifiedRoll <= effectiveCaptureRate.
- **inputs**: captureRate, trainerLevel, modifiers, criticalHit, ballModifier
- **outputs**: { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred, ballModifier }
- **accessible_from**: gm, player

#### capture-C003: Capture Difficulty Description
- **type**: utility
- **location**: `app/utils/captureRate.ts` -> `getCaptureDescription()`
- **game_concept**: Human-readable capture difficulty label
- **description**: Maps capture rate to label: >=80 Very Easy, >=60 Easy, >=40 Moderate, >=20 Difficult, >=1 Very Difficult, <1 Nearly Impossible.
- **inputs**: captureRate (number)
- **outputs**: string
- **accessible_from**: gm, player

### Poke Ball Catalog (C004-C008: Ball Type System)

#### capture-C004: POKE_BALL_CATALOG
- **type**: constant
- **location**: `app/constants/pokeBalls.ts`
- **game_concept**: PTU Chapter 9 p.271-273: all 25 Poke Ball types
- **description**: Complete catalog of all 25 ball types with id, name, category, base modifier, description, cost, conditionDescription, postCaptureEffect. Categories: basic (4), safari (3), apricorn (7), special (11).
- **inputs**: Ball name key
- **outputs**: PokeBallDef
- **accessible_from**: gm, player

#### capture-C005: calculateBallModifier
- **type**: utility
- **location**: `app/constants/pokeBalls.ts`
- **game_concept**: Total ball modifier (base + conditional)
- **description**: Combines base modifier with conditional modifier from evaluateBallCondition.
- **inputs**: ballType, context
- **outputs**: { total, base, conditional, conditionMet, description? }
- **accessible_from**: gm, player

#### capture-C006: getBallsByCategory
- **type**: utility
- **location**: `app/constants/pokeBalls.ts`
- **description**: Groups all 25 balls by category for UI display.
- **accessible_from**: gm, player

#### capture-C007: getBallDef
- **type**: utility
- **location**: `app/constants/pokeBalls.ts`
- **description**: Lookup a single ball definition by name.
- **accessible_from**: gm, player

#### capture-C008: getAvailableBallNames
- **type**: utility
- **location**: `app/constants/pokeBalls.ts`
- **description**: Get ball name strings, optionally including Safari balls.
- **accessible_from**: gm, player

### Ball Condition Evaluators (C009-C022: 13 Conditional Balls)

#### capture-C009: evaluateBallCondition
- **type**: utility
- **location**: `app/utils/pokeBallConditions.ts`
- **description**: Registry dispatcher for 13 conditional ball evaluators. Pure function returning modifier and metadata.
- **accessible_from**: gm, player

#### capture-C010 through capture-C022: Individual Ball Evaluators
- **type**: utility (13 functions)
- **location**: `app/utils/pokeBallConditions.ts`
- **description**: Pure evaluator functions for Timer, Quick, Level, Heavy, Fast, Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive balls. Each takes Partial<BallConditionContext> and returns BallConditionResult.
- **accessible_from**: gm, player (via evaluateBallCondition)

### Formatter Utilities (C023-C024)

#### capture-C023: formatModifier
- **type**: utility
- **location**: `app/utils/pokeBallFormatters.ts`
- **description**: Formats ball modifier as signed string.
- **accessible_from**: gm, player

#### capture-C024: modifierClass
- **type**: utility
- **location**: `app/utils/pokeBallFormatters.ts`
- **description**: Returns CSS class for modifier quality (positive/negative/neutral).
- **accessible_from**: gm, player

### Legendary Detection (C025-C026)

#### capture-C025: isLegendarySpecies
- **type**: utility
- **location**: `app/constants/legendarySpecies.ts`
- **description**: Checks if species is legendary/mythical for -30 capture penalty.
- **accessible_from**: api-only

#### capture-C026: LEGENDARY_SPECIES
- **type**: constant
- **location**: `app/constants/legendarySpecies.ts`
- **description**: ReadonlySet of ~70 legendary species (Gen 1-8, Hisui).
- **accessible_from**: api-only

### Ball Condition Service (C027-C029: Server-Side Context)

#### capture-C027: buildConditionContext
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts`
- **description**: Builds BallConditionContext from Pokemon, SpeciesData, trainer, and encounter state. Auto-populates encounter round, target types/weight/speed, active Pokemon level/gender/evo line, species ownership, stone evolution. GM overrides take priority.
- **accessible_from**: api-only

#### capture-C028: checkEvolvesWithStone
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts`
- **description**: Parses evolutionTriggers JSON to detect Evolution Stone triggers for Moon Ball.
- **accessible_from**: api-only

#### capture-C029: deriveEvoLine
- **type**: service-function
- **location**: `app/server/services/ball-condition.service.ts`
- **description**: Derives basic evolution line from species name and triggers for Love Ball.
- **accessible_from**: api-only

### API Endpoints (C030-C031)

#### capture-C030: Capture Rate API
- **type**: api-endpoint
- **location**: `app/server/api/capture/rate.post.ts`
- **description**: POST /api/capture/rate. Calculates capture rate with DB lookup, ball modifier, and full condition context. Accepts pokemonId or raw data. Returns breakdown + ball breakdown.
- **accessible_from**: gm, player

#### capture-C031: Capture Attempt API
- **type**: api-endpoint
- **location**: `app/server/api/capture/attempt.post.ts`
- **description**: POST /api/capture/attempt. Full capture flow: accuracy validation (decree-042), wild-only check, rate calculation, ball condition context, attempt roll, auto-link on success (ownerId, origin=captured, loyalty=2 per decree-049), post-capture effects (Heal Ball, Friend Ball, Luxury Ball), trainer XP on new species, WebSocket broadcast.
- **accessible_from**: gm, player (via composable)

### Composables (C032-C041)

#### capture-C032: useCapture
- **type**: composable-function
- **location**: `app/composables/useCapture.ts`
- **description**: Primary capture composable: getCaptureRate, calculateCaptureRateLocal, attemptCapture, rollAccuracyCheck, getAvailableBalls.
- **accessible_from**: gm, player

#### capture-C033-C037: useCapture Sub-Functions
- getCaptureRate (C033): Server-side rate fetch
- calculateCaptureRateLocal (C034): Client-side rate with ball modifier
- attemptCapture (C035): Execute capture with Standard Action consumption
- rollAccuracyCheck (C036): d20 accuracy with full accuracy system (decree-042)
- getAvailableBalls (C037): Filtered ball list

#### capture-C038: usePlayerCapture
- **type**: composable-function
- **location**: `app/composables/usePlayerCapture.ts`
- **description**: Player-side capture rate preview. fetchCaptureRate (server), estimateCaptureRate (local fallback).
- **accessible_from**: player

#### capture-C039: usePlayerCombat.requestCapture
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts`
- **description**: Sends capture request via WebSocket to GM.
- **accessible_from**: player

#### capture-C040: usePlayerCombat.captureTargets
- **type**: composable-function
- **location**: `app/composables/usePlayerCombat.ts`
- **description**: Computed: enemy-side, non-fainted Pokemon eligible for capture.
- **accessible_from**: player

#### capture-C041: usePlayerRequestHandlers.handleApproveCapture
- **type**: composable-function
- **location**: `app/composables/usePlayerRequestHandlers.ts`
- **description**: GM-side handler: rolls accuracy, executes capture, sends ack to player.
- **accessible_from**: gm

### Components (C042-C049, C057-C058)

#### capture-C042: CapturePanel (GM)
- **type**: component
- **location**: `app/components/capture/CapturePanel.vue`
- **description**: Full GM capture workflow: ball selection, context toggles, live rate preview, accuracy roll, capture roll, result display with post-capture effects.
- **accessible_from**: gm

#### capture-C043: BallSelector
- **type**: component
- **location**: `app/components/capture/BallSelector.vue`
- **description**: Dropdown for all 25 ball types by category with modifier preview and post-capture badges.
- **accessible_from**: gm

#### capture-C044: CaptureContextToggles
- **type**: component
- **location**: `app/components/capture/CaptureContextToggles.vue`
- **description**: Three GM checkboxes: baited, dark/low-light, underwater/underground.
- **accessible_from**: gm

#### capture-C045: CaptureRateDisplay
- **type**: component
- **location**: `app/components/encounter/CaptureRateDisplay.vue`
- **description**: Color-coded rate display with hover breakdown (capture rate + ball modifier).
- **accessible_from**: gm, player

#### capture-C046: CombatantCaptureSection
- **type**: component
- **location**: `app/components/encounter/CombatantCaptureSection.vue`
- **description**: Wrapper in wild Pokemon's combatant card: trainer selector, species data fetch, accuracy params, delegates to CapturePanel.
- **accessible_from**: gm

#### capture-C047: PlayerCapturePanel
- **type**: component
- **location**: `app/components/player/PlayerCapturePanel.vue`
- **description**: Player capture request: target selection, rate preview, "Request Capture" to GM.
- **accessible_from**: player

#### capture-C048: PlayerCombatActions Capture Button
- **type**: component
- **location**: `app/components/player/PlayerCombatActions.vue`
- **description**: Capture button in player combat actions (trainers only, Standard Action).
- **accessible_from**: player

#### capture-C049: PlayerRequestPanel Capture Approval
- **type**: component
- **location**: `app/components/encounter/PlayerRequestPanel.vue`
- **description**: GM sees capture requests with ball type, target, rate preview; approve/deny.
- **accessible_from**: gm

#### capture-C057: CombatantCard Capture Integration
- **type**: component
- **location**: `app/components/encounter/CombatantCard.vue`
- **description**: Renders CombatantCaptureSection for wild Pokemon in GM view.
- **accessible_from**: gm

#### capture-C058: Player View Capture Ack Display
- **type**: component
- **location**: `app/pages/player/index.vue`
- **description**: Toast display for capture request outcomes (hit/miss/capture result).
- **accessible_from**: player

### WebSocket Events (C050)

#### capture-C050: capture_attempt Broadcast
- **type**: websocket-event
- **location**: `app/server/api/capture/attempt.post.ts` (send), `app/composables/useWebSocket.ts` (receive)
- **description**: Broadcasts capture result to all clients; triggers encounter reload on success.
- **accessible_from**: gm, group, player

### Type Definitions (C051, C056)

#### capture-C051: PlayerActionType 'capture'
- **type**: constant
- **location**: `app/types/player-sync.ts`
- **description**: Player-to-GM capture request protocol: action type, request fields, ack result.
- **accessible_from**: gm, player

#### capture-C056: BallConditionContext Interface
- **type**: constant
- **location**: `app/constants/pokeBalls.ts`
- **description**: Context interface for all 13 conditional ball evaluators.
- **accessible_from**: gm, player

### Prisma Fields (C052-C055)

#### capture-C052: PokemonOrigin 'captured'
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma` -> Pokemon.origin
- **description**: Set to 'captured' on successful capture.
- **accessible_from**: gm

#### capture-C053: Pokemon.ownerId
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma`
- **description**: Nullable FK to HumanCharacter. Set on capture. Null = wild.
- **accessible_from**: gm

#### capture-C054: Pokemon.loyalty
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma`
- **description**: Default 3. Wild captures: 2 (decree-049). Friend Ball: 3.
- **accessible_from**: gm

#### capture-C055: HumanCharacter.ownedSpecies
- **type**: prisma-field
- **location**: `app/prisma/schema.prisma`
- **description**: JSON array for new species XP tracking.
- **accessible_from**: api-only

### Cross-Domain Utility (C059)

#### capture-C059: Trainer XP on New Species Capture
- **type**: utility
- **location**: `app/utils/trainerExperience.ts` (called from `app/server/api/capture/attempt.post.ts`)
- **description**: Awards +1 trainer XP for capturing a new species. Handles multi-level jumps.
- **accessible_from**: api-only

---

## Capability Chains

### Chain 1: GM Direct Capture (In-Encounter)
**Path**: CombatantCard (gm) -> CombatantCaptureSection -> CapturePanel -> useCapture.rollAccuracyCheck -> useCapture.attemptCapture -> POST /api/capture/attempt -> captureRate.ts + pokeBalls.ts + pokeBallConditions.ts + ball-condition.service + legendarySpecies + Prisma (Pokemon, SpeciesData, HumanCharacter) -> auto-link + post-capture effects + trainer XP -> WebSocket broadcast
**Accessibility**: gm-only initiation; group+player receive WebSocket broadcast

### Chain 2: Player Capture Request Flow
**Path**: PlayerCombatActions (player) -> PlayerCapturePanel -> usePlayerCapture.fetchCaptureRate -> POST /api/capture/rate (preview) -> usePlayerCombat.requestCapture -> WebSocket player_action (capture) -> PlayerRequestPanel (gm) -> usePlayerRequestHandlers.handleApproveCapture -> useCapture.rollAccuracyCheck + useCapture.attemptCapture -> POST /api/capture/attempt -> WebSocket player_action_ack -> player.index.vue (toast display)
**Accessibility**: player initiates, gm approves and executes, both see result

### Chain 3: Capture Rate Preview (GM)
**Path**: CapturePanel (gm) -> useCapture.calculateCaptureRateLocal -> captureRate.ts + calculateBallModifier -> evaluateBallCondition
**Accessibility**: gm (real-time preview as ball type and context change)

### Chain 4: Capture Rate Preview (Player)
**Path**: PlayerCapturePanel (player) -> usePlayerCapture.fetchCaptureRate -> POST /api/capture/rate -> captureRate.ts + ball-condition.service
**Fallback**: usePlayerCapture.estimateCaptureRate -> calculateCaptureRateLocal (less accurate, no evolution stage)
**Accessibility**: player

### Chain 5: Ball Condition Evaluation
**Path**: calculateBallModifier -> evaluateBallCondition -> individual evaluator function (13 total) -> BallConditionResult
**Server path**: buildConditionContext -> Prisma queries (encounter round, species data, ownership) -> evaluateBallCondition
**Accessibility**: gm, player (client-side with provided context), api-only (server-side with full DB context)

### Chain 6: Post-Capture Effects
**Path**: capture/attempt.post.ts -> ballDef.postCaptureEffect check -> Prisma update:
  - heal_full: currentHp = maxHp (Heal Ball, decree-015)
  - loyalty_plus_one: loyalty = 3 (Friend Ball, decree-049 base 2 + 1)
  - raised_happiness: (Luxury Ball, no mechanical effect yet)
**Accessibility**: api-only (server-side effect)

### Chain 7: WebSocket Capture Broadcast
**Path**: capture/attempt.post.ts -> broadcast('capture_attempt') -> useWebSocket handler -> lastCaptureAttempt ref -> encounter reload on success
**Accessibility**: gm, group, player (all connected clients)

---

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | C041 (GM capture approval handler), C042 (CapturePanel), C043 (BallSelector), C044 (CaptureContextToggles), C046 (CombatantCaptureSection), C049 (PlayerRequestPanel capture), C057 (CombatantCard capture) |
| **player-only** | C038 (usePlayerCapture), C039 (requestCapture), C040 (captureTargets), C047 (PlayerCapturePanel), C048 (capture button), C058 (capture ack display) |
| **gm+player** | C001-C003 (core math), C004-C008 (ball catalog/helpers), C009-C022 (condition evaluators), C023-C024 (formatters), C030 (rate API), C031 (attempt API), C032-C037 (useCapture composable), C045 (CaptureRateDisplay), C050 (WS event), C051 (action type), C056 (context type) |
| **gm+group+player** | C050 (capture_attempt WebSocket broadcast received by all) |
| **api-only** | C025-C026 (legendary detection), C027-C029 (ball-condition.service), C055 (ownedSpecies), C059 (trainer XP) |

---

## Orphan Capabilities

None identified. All capabilities are connected to at least one chain. The BallConditionContext type (C056) is referenced by the evaluator system and both API endpoints.

---

## Missing Subsystems

### MS-1: Poke Ball Inventory Management
- **subsystem**: No integration between capture system and trainer inventory for Poke Ball consumption
- **actor**: both
- **ptu_basis**: PTU Chapter 9: throwing a Poke Ball consumes it from inventory. Different ball types have different costs. Trainers must possess the ball to throw it.
- **impact**: Ball type can be selected freely in the UI without inventory validation. No automatic Poke Ball deduction on throw. GM must manually track ball counts. The BallSelector shows all 25 ball types regardless of what the trainer actually has.

### MS-2: Post-Capture Pokemon Management
- **subsystem**: No UI flow for post-capture naming, party management, or PC box decisions
- **actor**: player
- **ptu_basis**: After capture, trainers can nickname their Pokemon and must decide whether to keep it in their active party or send it to storage if their party is full (PTU p.227).
- **impact**: Post-capture actions require manual database editing through the GM character management interface. No immediate prompt for the player to name or assign their new Pokemon.

### MS-3: Group View Capture Display
- **subsystem**: No dedicated Group View UI for displaying capture attempt results
- **actor**: group (TV/projector display)
- **ptu_basis**: Capture is a dramatic in-game event that all players at the table should see. The shared display should show the ball throw, accuracy check, and capture result.
- **impact**: The lastCaptureAttempt ref is populated via WebSocket (C050) but no Group View component consumes it for display. The capture event data is received but not rendered on the shared screen.

### MS-4: Capture During Non-Encounter Context
- **subsystem**: No capture interface for outside-of-encounter scenarios (overworld captures)
- **actor**: gm
- **ptu_basis**: PTU allows capturing Pokemon outside of formal encounters (e.g., a non-combat encounter or overworld interaction). The capture rate formula and ball modifiers still apply.
- **impact**: All capture UI is embedded within the encounter system (CombatantCard/CapturePanel). To capture outside an encounter, the GM would need to create a temporary encounter or use direct API calls.
