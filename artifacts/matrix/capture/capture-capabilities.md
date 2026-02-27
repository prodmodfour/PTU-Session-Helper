# Capture Domain — Application Capabilities

> Generated: 2026-02-28 | Source: deep-read of all capture source files

## Individual Capabilities

### capture-C001: Capture Rate Calculation
- **type**: utility
- **location**: `app/utils/captureRate.ts` → `calculateCaptureRate()`
- **game_concept**: PTU capture rate formula (base 100 adjusted by modifiers)
- **description**: Pure function calculating capture rate from base 100. Applies: level modifier (-level*2), HP modifier (1 HP: +30, <=25%: +15, <=50%: 0, <=75%: -15, >75%: -30), evolution stage modifier (+10/0/-10 based on evolutions remaining), rarity modifiers (shiny: -10, legendary: -30), status condition modifiers (persistent: +10, volatile: +5, Poison/Badly Poisoned deduplicated), Stuck: +10, Slowed: +5, injury modifier (+5 per injury).
- **inputs**: CaptureRateInput { level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary }
- **outputs**: CaptureRateResult { captureRate, breakdown, canBeCaptured, hpPercentage }
- **accessible_from**: gm, group, player (auto-imported utility)

### capture-C002: Capture Attempt Simulation
- **type**: utility
- **location**: `app/utils/captureRate.ts` → `attemptCapture()`
- **game_concept**: PTU capture roll (1d100 vs modified capture rate)
- **description**: Simulates a capture attempt. Rolls 1d100. Modified roll = roll - trainerLevel + modifiers (ball modifiers are negative, reducing roll to make capture easier). Crit adds +10 to effective capture rate. Natural 100 always captures. Success if modifiedRoll <= effectiveCaptureRate.
- **inputs**: captureRate, trainerLevel, modifiers, criticalHit
- **outputs**: { success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }
- **accessible_from**: gm, group, player

### capture-C003: Capture Difficulty Description
- **type**: utility
- **location**: `app/utils/captureRate.ts` → `getCaptureDescription()`
- **game_concept**: Human-readable capture difficulty label
- **description**: Maps capture rate to difficulty label: >=80 Very Easy, >=60 Easy, >=40 Moderate, >=20 Difficult, >=1 Very Difficult, <1 Nearly Impossible.
- **inputs**: captureRate (number)
- **outputs**: Difficulty description string
- **accessible_from**: gm, group, player

### capture-C004: Capture Rate API
- **type**: api-endpoint
- **location**: `app/server/api/capture/rate.post.ts`
- **game_concept**: Server-side capture rate calculation with DB lookup
- **description**: POST endpoint calculating capture rate. Accepts pokemonId (DB lookup for level, HP, status, injuries, species/evolution data) or raw data. Auto-detects legendary status from species name via isLegendarySpecies(). GM can override legendary status. Returns full breakdown with difficulty label.
- **inputs**: { pokemonId } OR { level, currentHp, maxHp, species, statusConditions, injuries, isShiny, isLegendary }
- **outputs**: { species, level, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown }
- **accessible_from**: gm (via useCapture composable)

### capture-C005: Capture Attempt API
- **type**: api-endpoint
- **location**: `app/server/api/capture/attempt.post.ts`
- **game_concept**: PTU capture attempt with auto-link on success
- **description**: POST endpoint performing a full capture attempt. Looks up Pokemon + Trainer from DB, fetches species data for evolution info, auto-detects legendary status, calculates capture rate, rolls attempt. On success: auto-links Pokemon to trainer (ownerId = trainerId, origin = 'captured'). Returns full result with roll details and breakdown.
- **inputs**: { pokemonId, trainerId, accuracyRoll, modifiers }
- **outputs**: CaptureAttemptResult { captured, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, breakdown, pokemon, trainer }
- **accessible_from**: gm (via useCapture composable)

### capture-C006: Legendary Species Detection
- **type**: utility
- **location**: `app/constants/legendarySpecies.ts` → `isLegendarySpecies()`
- **game_concept**: PTU legendary Pokemon capture penalty (-30)
- **description**: Checks if a species name is in the legendary species list for automatic legendary detection. Used by capture rate and attempt APIs.
- **inputs**: species name (string)
- **outputs**: boolean
- **accessible_from**: api-only (used by capture APIs)

### capture-C007: Capture Composable
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` → `useCapture()`
- **game_concept**: Client-side capture interface
- **description**: Composable providing capture functionality: getCaptureRate (API call), calculateCaptureRateLocal (client-side calculation), attemptCapture (API call with optional encounter context for Standard Action consumption), rollAccuracyCheck (d20 for Poke Ball AC 6). Manages loading/error/warning state.
- **inputs**: Various (pokemonId, trainerId, encounter context)
- **outputs**: { loading, error, warning, getCaptureRate, calculateCaptureRateLocal, attemptCapture, rollAccuracyCheck }
- **accessible_from**: gm (used in CaptureModal component)

### capture-C008: Client-Side Capture Rate Calculation
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` → `calculateCaptureRateLocal()`
- **game_concept**: PTU capture rate preview without API call
- **description**: Calculates capture rate locally using the utility function. Used for real-time preview as the GM adjusts parameters without server round-trips.
- **inputs**: { level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary }
- **outputs**: CaptureRateData
- **accessible_from**: gm

### capture-C009: Poke Ball Accuracy Roll
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` → `rollAccuracyCheck()`
- **game_concept**: PTU Poke Ball throw accuracy (AC 6)
- **description**: Rolls d20 for Poke Ball accuracy check. Returns roll value, natural 20 detection, and total.
- **inputs**: None
- **outputs**: { roll, isNat20, total }
- **accessible_from**: gm

### capture-C010: Encounter Context Action Consumption
- **type**: composable-function
- **location**: `app/composables/useCapture.ts` → `attemptCapture()` (encounter context branch)
- **game_concept**: PTU p.227: throwing a Poke Ball is a Standard Action
- **description**: When capture is attempted from within an encounter context, consumes the trainer's Standard Action by calling the encounter action API. If action consumption fails, sets warning but does not block the capture result.
- **inputs**: encounterContext { encounterId, trainerCombatantId }
- **outputs**: Action consumed or warning set
- **accessible_from**: gm

## Capability Chains

### Chain 1: Full Capture Flow (In-Encounter)
**Components**: CaptureModal (gm) → useCapture.attemptCapture → capture/attempt.post.ts → captureRate.ts + legendarySpecies + Prisma (Pokemon lookup, SpeciesData, auto-link) → encounter action API (Standard Action consumed)
**Accessibility**: gm-only

### Chain 2: Capture Rate Preview
**Components**: CaptureModal (gm) → useCapture.getCaptureRate → capture/rate.post.ts → captureRate.ts + legendarySpecies + Prisma (Pokemon + SpeciesData lookup)
**Accessibility**: gm-only

### Chain 3: Client-Side Rate Preview
**Components**: CaptureModal (gm) → useCapture.calculateCaptureRateLocal → captureRate.ts (no API call)
**Accessibility**: gm-only

## Accessibility Summary

| Access Level | Capabilities |
|-------------|-------------|
| **gm-only** | C004-C005 (APIs via composable), C007-C010 (capture composable methods) |
| **gm+group+player** | C001-C003 (pure utility functions) |
| **api-only** | C006 (legendary detection — internal to APIs) |
| **group** | No capture capabilities |
| **player** | No capture capabilities |

## Missing Subsystems

### MS-1: Player Capture Interface
- **subsystem**: No player-facing UI for initiating capture attempts (selecting Poke Ball, choosing target wild Pokemon, rolling accuracy)
- **actor**: player
- **ptu_basis**: PTU p.227: "Throwing a Poke Ball to try to capture a Pokemon is a Standard Action." Trainers choose which ball to throw and at which target — this is a player decision.
- **impact**: All capture attempts must be GM-initiated. Players cannot independently attempt captures during their turns, requiring verbal coordination and GM proxy action.

### MS-2: Poke Ball Inventory Integration
- **subsystem**: No integration between capture system and trainer inventory for Poke Ball selection and consumption
- **actor**: both
- **ptu_basis**: PTU has multiple Poke Ball types (Great Ball, Ultra Ball, etc.) with different modifiers. Throwing a ball consumes it from inventory. The capture system accepts raw modifiers but has no UI for ball type selection or automatic inventory deduction.
- **impact**: GM must manually track ball modifiers and inventory changes. No automatic Poke Ball consumption on capture attempt.

### MS-3: Post-Capture Pokemon Management
- **subsystem**: No UI flow for post-capture actions (naming, party management, PC box decisions)
- **actor**: player
- **ptu_basis**: After capture, trainers can nickname their Pokemon and must decide whether to keep it in their active party or send it to storage if their party is full.
- **impact**: Post-capture actions require manual database editing through the GM character management interface.
