---
domain: capture
mapped_at: 2026-02-19T00:00:00Z
mapped_by: app-capability-mapper
total_capabilities: 25
files_read: 12
---

# App Capabilities: Capture

## Summary
- Total capabilities: 25
- Types: api-endpoint(2), service-function(0), composable-function(4), store-action(0), store-getter(0), component(2), constant(3), utility(3), websocket-event(0), prisma-model(2), prisma-field(8)
- Orphan capabilities: 0

---

## capture-C001: Pokemon Prisma Model

- **Type:** prisma-model
- **Location:** `prisma/schema.prisma:Pokemon`
- **Game Concept:** Pokemon entity that can be captured
- **Description:** Core data model for Pokemon. Stores ownership (`ownerId`), origin tracking (`origin`), HP, status conditions, injuries, shiny flag, and species — all fields used in capture rate calculation and post-capture linking.
- **Inputs:** N/A (schema definition)
- **Outputs:** Defines fields: `id`, `ownerId`, `origin`, `currentHp`, `maxHp`, `level`, `statusConditions`, `injuries`, `shiny`, `species`
- **Orphan:** false

## capture-C002: SpeciesData Prisma Model

- **Type:** prisma-model
- **Location:** `prisma/schema.prisma:SpeciesData`
- **Game Concept:** Species reference data for evolution stage lookup
- **Description:** Reference data model storing `evolutionStage` and `maxEvolutionStage` per species. Used by capture endpoints to determine evolution-based capture rate modifiers.
- **Inputs:** N/A (schema definition)
- **Outputs:** Defines fields: `name`, `evolutionStage`, `maxEvolutionStage`
- **Orphan:** false

## capture-C003: Pokemon.ownerId Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.ownerId`
- **Game Concept:** Pokemon ownership — links captured Pokemon to trainer
- **Description:** Nullable foreign key to `HumanCharacter`. Set to the capturing trainer's ID on successful capture. `null` indicates a wild (unowned) Pokemon.
- **Inputs:** HumanCharacter ID string
- **Outputs:** Establishes ownership relation
- **Orphan:** false

## capture-C004: Pokemon.origin Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.origin`
- **Game Concept:** Pokemon provenance tracking
- **Description:** String field tracking how a Pokemon was created. Set to `'captured'` on successful capture. Valid values: `'manual' | 'wild' | 'template' | 'import' | 'captured'`.
- **Inputs:** Origin string value
- **Outputs:** Origin classification for filtering/display
- **Orphan:** false

## capture-C005: Pokemon.currentHp Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.currentHp`
- **Game Concept:** Current HP — primary capture rate modifier
- **Description:** Integer tracking current HP. Used in capture rate calculation for HP percentage bracket determination. Pokemon at 0 HP cannot be captured.
- **Inputs:** Integer value
- **Outputs:** HP value for capture rate formula
- **Orphan:** false

## capture-C006: Pokemon.statusConditions Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.statusConditions`
- **Game Concept:** Status conditions — capture rate modifiers
- **Description:** JSON-serialized array of `StatusCondition` strings. Persistent conditions add +10 each, volatile conditions add +5 each to capture rate. Stuck/Trapped and Slowed have additional stacking bonuses.
- **Inputs:** JSON string of StatusCondition[]
- **Outputs:** Status condition list for capture rate formula
- **Orphan:** false

## capture-C007: Pokemon.injuries Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.injuries`
- **Game Concept:** Injury count — capture rate modifier
- **Description:** Integer tracking number of injuries. Each injury adds +5 to capture rate.
- **Inputs:** Integer value
- **Outputs:** Injury count for capture rate formula
- **Orphan:** false

## capture-C008: Pokemon.shiny Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:Pokemon.shiny`
- **Game Concept:** Shiny status — capture rate penalty
- **Description:** Boolean flag. Shiny Pokemon receive a -10 capture rate modifier.
- **Inputs:** Boolean value
- **Outputs:** Shiny flag for capture rate formula
- **Orphan:** false

## capture-C009: HumanCharacter.level Field

- **Type:** prisma-field
- **Location:** `prisma/schema.prisma:HumanCharacter.level`
- **Game Concept:** Trainer level — modifies capture roll
- **Description:** Integer tracking trainer level. Subtracted from the d100 capture roll (higher trainer level = easier capture).
- **Inputs:** Integer value
- **Outputs:** Trainer level for capture attempt roll modification
- **Orphan:** false

## capture-C010: PokemonOrigin Type

- **Type:** prisma-field
- **Location:** `types/character.ts:PokemonOrigin`
- **Game Concept:** Origin type union including 'captured'
- **Description:** TypeScript type `'manual' | 'wild' | 'template' | 'import' | 'captured'`. The `'captured'` value is set by the capture attempt endpoint on success.
- **Inputs:** N/A (type definition)
- **Outputs:** Type constraint for origin field
- **Orphan:** false

## capture-C011: calculateCaptureRate Utility

- **Type:** utility
- **Location:** `utils/captureRate.ts:calculateCaptureRate`
- **Game Concept:** PTU capture rate formula (complete calculation)
- **Description:** Pure function implementing the full PTU 1.05 capture rate formula. Starts at base 100, subtracts level×2, applies HP bracket modifier (1HP=+30, ≤25%=+15, ≤50%=0, ≤75%=-15, >75%=-30), evolution stage modifier (+10/0/-10 based on evolutions remaining), shiny (-10), legendary (-30), persistent status (+10 each), volatile status (+5 each), stuck/trapped (+10 each), slowed (+5 each), injuries (+5 each). Returns rate, breakdown, canBeCaptured flag, and hpPercentage.
- **Inputs:** `CaptureRateInput` — `{ level, currentHp, maxHp, evolutionStage, maxEvolutionStage, statusConditions, injuries, isShiny, isLegendary? }`
- **Outputs:** `CaptureRateResult` — `{ captureRate, breakdown, canBeCaptured, hpPercentage }`
- **Orphan:** false

## capture-C012: attemptCapture Utility

- **Type:** utility
- **Location:** `utils/captureRate.ts:attemptCapture`
- **Game Concept:** Capture roll resolution (d100 vs capture rate)
- **Description:** Rolls 1d100, applies trainer level and modifier subtraction to the roll, compares modified roll against capture rate. Natural 100 always captures. Critical hit (nat 20 on accuracy) adds +10 to effective capture rate. Returns success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred.
- **Inputs:** `captureRate: number, trainerLevel: number, modifiers?: number, criticalHit?: boolean`
- **Outputs:** `{ success, roll, modifiedRoll, effectiveCaptureRate, naturalHundred }`
- **Orphan:** false

## capture-C013: getCaptureDescription Utility

- **Type:** utility
- **Location:** `utils/captureRate.ts:getCaptureDescription`
- **Game Concept:** Capture difficulty label
- **Description:** Converts numeric capture rate to human-readable difficulty string. Thresholds: ≥80 "Very Easy", ≥60 "Easy", ≥40 "Moderate", ≥20 "Difficult", ≥1 "Very Difficult", <1 "Nearly Impossible".
- **Inputs:** `captureRate: number`
- **Outputs:** Difficulty string
- **Orphan:** false

## capture-C014: Persistent Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:PERSISTENT_CONDITIONS`
- **Game Concept:** Persistent status conditions (+10 capture modifier each)
- **Description:** Array of persistent condition names: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned. Each adds +10 to capture rate.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]` — ['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned']
- **Orphan:** false

## capture-C015: Volatile Conditions Constant

- **Type:** constant
- **Location:** `constants/statusConditions.ts:VOLATILE_CONDITIONS`
- **Game Concept:** Volatile status conditions (+5 capture modifier each)
- **Description:** Array of volatile condition names: Asleep, Confused, Flinched, Infatuated, Cursed, Disabled, Enraged, Suppressed. Each adds +5 to capture rate.
- **Inputs:** N/A (constant)
- **Outputs:** `StatusCondition[]` — ['Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Enraged', 'Suppressed']
- **Orphan:** false

## capture-C016: Other Conditions Constant (Stuck/Slowed)

- **Type:** constant
- **Location:** `constants/statusConditions.ts:OTHER_CONDITIONS` + `utils/captureRate.ts:STUCK_CONDITIONS,SLOW_CONDITIONS`
- **Game Concept:** Stuck/Trapped (+10) and Slowed (+5) capture modifiers
- **Description:** `STUCK_CONDITIONS` ['Stuck', 'Trapped'] add +10 each (stacking with persistent/volatile). `SLOW_CONDITIONS` ['Slowed'] add +5 each. Defined as module-level constants in `captureRate.ts` using values from `OTHER_CONDITIONS`.
- **Inputs:** N/A (constants)
- **Outputs:** Condition arrays for capture rate formula
- **Orphan:** false

## capture-C017: Calculate Capture Rate API

- **Type:** api-endpoint
- **Location:** `server/api/capture/rate.post.ts:default`
- **Game Concept:** Server-side capture rate calculation
- **Description:** POST endpoint that calculates capture rate. Accepts either `pokemonId` (looks up Pokemon + SpeciesData from DB) or raw data (`level`, `currentHp`, `maxHp`, `species`, `statusConditions`, `injuries`, `isShiny`). Delegates to `calculateCaptureRate()` utility. Returns rate, difficulty description, canBeCaptured flag, hpPercentage, and full breakdown.
- **Inputs:** `{ pokemonId?: string } | { level, currentHp, maxHp, species?, statusConditions?, injuries?, isShiny? }`
- **Outputs:** `{ success, data: { species, level, currentHp, maxHp, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown } }`
- **Orphan:** false

## capture-C018: Attempt Capture API

- **Type:** api-endpoint
- **Location:** `server/api/capture/attempt.post.ts:default`
- **Game Concept:** Execute a capture attempt with roll resolution and DB update
- **Description:** POST endpoint that executes a full capture attempt. Looks up Pokemon, Trainer, and SpeciesData from DB. Calculates capture rate via `calculateCaptureRate()`, then rolls via `attemptCapture()`. On success, updates Pokemon record: sets `ownerId` to trainer ID and `origin` to 'captured'. Returns full result including roll details, rate breakdown, and updated pokemon/trainer info.
- **Inputs:** `{ pokemonId: string, trainerId: string, accuracyRoll?: number, modifiers?: number, pokeBallType?: string }`
- **Outputs:** `{ success, data: { captured, roll, modifiedRoll, captureRate, effectiveCaptureRate, naturalHundred, criticalHit, trainerLevel, modifiers, difficulty, breakdown, pokemon: {...}, trainer: {...} } }`
- **Orphan:** false

## capture-C019: useCapture Composable — getCaptureRate

- **Type:** composable-function
- **Location:** `composables/useCapture.ts:getCaptureRate`
- **Game Concept:** Client-side API call to get capture rate for a Pokemon
- **Description:** Async function that calls `POST /api/capture/rate` with a `pokemonId`. Returns `CaptureRateData` on success or `null` on failure. Manages `loading` and `error` reactive state.
- **Inputs:** `pokemonId: string`
- **Outputs:** `CaptureRateData | null` (species, level, HP, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown)
- **Orphan:** false

## capture-C020: useCapture Composable — calculateCaptureRateLocal

- **Type:** composable-function
- **Location:** `composables/useCapture.ts:calculateCaptureRateLocal`
- **Game Concept:** Client-side capture rate calculation (no API call)
- **Description:** Synchronous function that replicates the full capture rate formula client-side. Used by CombatantCard to show live capture rate without network round-trip. Takes Pokemon stats directly, returns `CaptureRateData`.
- **Inputs:** `{ level, currentHp, maxHp, evolutionStage?, maxEvolutionStage?, statusConditions?, injuries?, isShiny?, isLegendary? }`
- **Outputs:** `CaptureRateData` — `{ species, level, currentHp, maxHp, captureRate, difficulty, canBeCaptured, hpPercentage, breakdown }`
- **Orphan:** false

## capture-C021: useCapture Composable — attemptCapture

- **Type:** composable-function
- **Location:** `composables/useCapture.ts:attemptCapture`
- **Game Concept:** Client-side API call to execute a capture attempt
- **Description:** Async function that calls `POST /api/capture/attempt` with pokemonId, trainerId, optional accuracyRoll, modifiers, and pokeBallType. Returns `CaptureAttemptResult` on success or `null` on failure. Manages `loading` and `error` reactive state.
- **Inputs:** `{ pokemonId: string, trainerId: string, accuracyRoll?: number, modifiers?: number, pokeBallType?: string }`
- **Outputs:** `CaptureAttemptResult | null`
- **Orphan:** false

## capture-C022: useCapture Composable — rollAccuracyCheck

- **Type:** composable-function
- **Location:** `composables/useCapture.ts:rollAccuracyCheck`
- **Game Concept:** Poke Ball throw accuracy check (d20 vs AC 6)
- **Description:** Client-side function that rolls 1d20 for the Poke Ball throw accuracy check. Returns roll value, isNat20 flag, and total. Does not compare against AC 6 — caller must check. AC 6 and range (4 + Athletics rank) are documented in code comment but not enforced.
- **Inputs:** None
- **Outputs:** `{ roll: number, isNat20: boolean, total: number }`
- **Orphan:** false

## capture-C023: CaptureRateDisplay Component

- **Type:** component
- **Location:** `components/encounter/CaptureRateDisplay.vue`
- **Game Concept:** Visual capture rate display with breakdown tooltip
- **Description:** Presentational component showing capture rate percentage, difficulty label, color-coded border (green=easy through red=difficult), and hover breakdown tooltip showing all modifiers. Optional "Attempt Capture" button that emits an `attempt` event. Handles the "Fainted" impossible state.
- **Inputs:** Props: `captureRate: CaptureRateData`, `showBreakdown?: boolean`, `showAttemptButton?: boolean`
- **Outputs:** Visual display; emits `attempt` event
- **Orphan:** false

## capture-C024: CombatantCard Capture Rate Integration

- **Type:** component
- **Location:** `components/encounter/CombatantCard.vue:captureRate,isWildPokemon`
- **Game Concept:** Live capture rate on wild Pokemon combatant cards
- **Description:** CombatantCard computes `isWildPokemon` (enemy Pokemon with no `ownerId`) and a reactive `captureRate` via `calculateCaptureRateLocal()`. Renders `CaptureRateDisplay` for GM-only view on wild Pokemon. Currently passes hardcoded `evolutionStage: 1, maxEvolutionStage: 3` instead of looking up actual species data.
- **Inputs:** `combatant` prop with entity data (Pokemon fields: level, currentHp, maxHp, statusConditions, injuries, shiny, ownerId, side)
- **Outputs:** Renders CaptureRateDisplay within combatant card
- **Orphan:** false

## capture-C025: Origin Filter on Sheets Page

- **Type:** component
- **Location:** `pages/gm/sheets.vue`
- **Game Concept:** Filter Pokemon by origin including 'captured'
- **Description:** The GM sheets page includes an origin filter dropdown with options: All Origins, Manual, Wild, Captured, Template, Imported. Allows GMs to filter the Pokemon library to show only captured Pokemon.
- **Inputs:** User selection from dropdown
- **Outputs:** Filtered Pokemon list display
- **Orphan:** false

---

## Capability Chains

### Chain 1: Calculate Capture Rate (Server)
1. `capture-C023` (component — CaptureRateDisplay button or GM action) → 2. `capture-C019` (composable — getCaptureRate) → 3. `capture-C017` (api-endpoint — rate.post.ts) → 4. `capture-C011` (utility — calculateCaptureRate) → 5. `capture-C002` (prisma-model — SpeciesData lookup) + `capture-C001` (prisma-model — Pokemon lookup)
**Breaks at:** complete

### Chain 2: Calculate Capture Rate (Client-side, Live)
1. `capture-C024` (component — CombatantCard isWildPokemon check) → 2. `capture-C020` (composable — calculateCaptureRateLocal) → 3. `capture-C014` + `capture-C015` + `capture-C016` (constants — condition lists) → 4. `capture-C023` (component — CaptureRateDisplay renders result)
**Breaks at:** complete — but `capture-C024` uses hardcoded evolution stage (1/3) instead of querying actual SpeciesData, so evolution modifier is inaccurate for non-base-form Pokemon

### Chain 3: Execute Capture Attempt
1. `capture-C023` (component — CaptureRateDisplay "Attempt Capture" button) → 2. `capture-C021` (composable — attemptCapture) → 3. `capture-C018` (api-endpoint — attempt.post.ts) → 4. `capture-C011` (utility — calculateCaptureRate) + `capture-C012` (utility — attemptCapture roll) → 5. `capture-C001` (prisma-model — Pokemon update: ownerId, origin) + `capture-C002` (prisma-model — SpeciesData lookup)
**Breaks at:** `capture-C023` emits `attempt` event but `capture-C024` (CombatantCard) does not handle it — there is no `@attempt` listener wiring the button to the composable's `attemptCapture()` function. The UI button exists but is not connected to execution.

### Chain 4: Accuracy Check for Poke Ball Throw
1. (No UI trigger found) → 2. `capture-C022` (composable — rollAccuracyCheck) → 3. `capture-C018` (api-endpoint — attempt.post.ts receives accuracyRoll)
**Breaks at:** No component calls `rollAccuracyCheck()`. The function exists in the composable but no UI integrates it. The accuracy check (d20 vs AC 6) is not enforced anywhere.

### Chain 5: Post-Capture Origin Display
1. `capture-C018` (api-endpoint — sets origin to 'captured') → 2. `capture-C004` (prisma-field — origin stored) → 3. `capture-C025` (component — sheets page origin filter) + `capture-C010` (type — PokemonOrigin)
**Breaks at:** complete
