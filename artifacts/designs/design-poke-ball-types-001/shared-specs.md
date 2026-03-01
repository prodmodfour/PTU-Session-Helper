# Shared Specifications

## Data Flow Diagram

```
GM THROWS POKE BALL AT WILD POKEMON:
  GM selects ball type from UI (P2) or enters ball type parameter
       |
       v
  Client calls POST /api/capture/rate with { pokemonId, ballType }
       |
       v
  Server calculates:
       |
       +---> Base capture rate (existing: level, HP%, evo, status, injuries)
       +---> Ball base modifier from POKE_BALL_CATALOG[ballType].modifier
       +---> (P1) Ball conditional modifier from evaluateCondition(ball, context)
       +---> Total ball modifier = base + conditional
       |
       v
  Return { captureRate, ballModifier, ballModifierBreakdown }
       |
       v
  GM reviews capture rate, clicks "Throw Ball"
       |
       v
  Client calls POST /api/capture/attempt with { pokemonId, trainerId, ballType }
       |
       v
  Server executes:
       |
       +---> Accuracy check (AC 6, existing)
       +---> Calculate capture rate (existing formula)
       +---> Calculate ball modifier (base + conditional)
       +---> Roll 1d100 (decree-013)
       +---> modifiedRoll = roll - trainerLevel + ballModifier
       +---> success = (modifiedRoll <= captureRate) || naturalHundred
       +---> (P2) If captured, apply post-capture effects (Heal Ball, etc.)
       +---> If captured, auto-link Pokemon to trainer (existing)
       |
       v
  Return capture result with ball info
       |
       v
  Client displays result (P2: ball-specific messaging)
```

---

## Poke Ball Catalog Type

### New File: `app/constants/pokeBalls.ts`

```typescript
/**
 * Category of Poke Ball for display grouping.
 * - 'basic': Poke Ball, Great Ball, Ultra Ball, Master Ball
 * - 'apricorn': Level, Lure, Moon, Friend, Love, Heavy, Fast (Apricorn balls)
 * - 'special': All other specialty balls
 * - 'safari': Safari Ball, Sport Ball, Park Ball (restricted use)
 */
export type PokeBallCategory = 'basic' | 'apricorn' | 'special' | 'safari'

/**
 * Context needed to evaluate conditional ball modifiers.
 * Passed to the ball's condition function at capture time.
 */
export interface BallConditionContext {
  /** Current round number in the encounter (1-based) */
  encounterRound: number
  /** Target Pokemon's level */
  targetLevel: number
  /** Active (user's) Pokemon's level (for Level Ball) */
  activePokemonLevel?: number
  /** Target Pokemon's type(s) */
  targetTypes: string[]
  /** Target Pokemon's gender ('M' | 'F' | 'N' for none/genderless) */
  targetGender: string
  /** Active Pokemon's gender */
  activePokemonGender?: string
  /** Target Pokemon's species name */
  targetSpecies: string
  /** Active Pokemon's evolutionary line species names (for Love Ball) */
  activePokemonEvoLine?: string[]
  /** Target's evolutionary line species names (for Love Ball) */
  targetEvoLine?: string[]
  /** Whether the target evolves via Evolution Stone (for Moon Ball) */
  targetEvolvesWithStone: boolean
  /** Target Pokemon's Weight Class (1-6, for Heavy Ball) */
  targetWeightClass: number
  /** Target Pokemon's highest Movement Capability value (for Fast Ball) */
  targetMovementSpeed: number
  /** Whether the target was baited into the encounter (for Lure Ball) */
  targetWasBaited: boolean
  /** Whether the trainer already owns a Pokemon of the target's species (for Repeat Ball) */
  trainerOwnsSpecies: boolean
  /** Whether it is dark or low-light (for Dusk Ball) */
  isDarkOrLowLight: boolean
  /** Whether the target was found underwater or underground (for Dive Ball) */
  isUnderwaterOrUnderground: boolean
}

/**
 * Definition for a single Poke Ball type from the PTU catalog.
 * Follows the same constant-catalog pattern as HEALING_ITEM_CATALOG.
 *
 * modifier: Applied to the capture roll. Negative = easier capture.
 * condition: Pure function returning additional modifier if conditions are met.
 * postCaptureEffect: Identifier for effects applied after successful capture.
 */
export interface PokeBallDef {
  /** Ball number from PTU chart (01-25) */
  readonly id: number
  /** Display name (matches PTU book exactly) */
  readonly name: string
  /** Category for UI grouping */
  readonly category: PokeBallCategory
  /** Base modifier to the capture roll (negative = easier capture) */
  readonly modifier: number
  /** Description of the ball's special effect */
  readonly description: string
  /** Cost in PokeDollars ($0 for unsold balls like Master Ball) */
  readonly cost: number
  /**
   * Pure function that evaluates a conditional modifier.
   * Returns a number to add to the base modifier.
   * Returns 0 if conditions are not met.
   * undefined means no conditional logic (use base modifier only).
   *
   * P0: All condition functions are undefined (base modifiers only).
   * P1: Condition functions are implemented per ball.
   */
  readonly condition?: (context: BallConditionContext) => number
  /**
   * Description of the condition for UI display.
   * e.g., "Target is under half the level of your active Pokemon"
   */
  readonly conditionDescription?: string
  /**
   * Post-capture effect identifier.
   * P0-P1: undefined (no post-capture effects).
   * P2: Implemented per ball.
   */
  readonly postCaptureEffect?: 'heal_full' | 'loyalty_plus_one' | 'raised_happiness'
  /** Human-readable description of post-capture effect */
  readonly postCaptureDescription?: string
}
```

---

## API Types

### CaptureRateRequest (Updated for ball type)

```typescript
// In rate.post.ts request body:
export interface CaptureRateRequest {
  pokemonId?: string
  level?: number
  currentHp?: number
  maxHp?: number
  species?: string
  statusConditions?: StatusCondition[]
  injuries?: number
  isShiny?: boolean
  isLegendary?: boolean
  // P0: New field
  ballType?: string  // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  // P1: New field for conditional evaluation
  conditionContext?: Partial<BallConditionContext>
}
```

### CaptureAttemptRequest (Updated for ball type)

```typescript
// In attempt.post.ts request body:
export interface CaptureAttemptRequest {
  pokemonId: string
  trainerId: string
  accuracyRoll?: number
  // P0: ballType replaces manual modifiers for ball-related capture mods
  ballType?: string  // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  modifiers?: number // Additional non-ball modifiers (features, equipment)
  // P1: New field for conditional evaluation
  conditionContext?: Partial<BallConditionContext>
}
```

### CaptureRateResult (Updated breakdown)

```typescript
export interface CaptureRateResult {
  captureRate: number
  breakdown: {
    base: number
    levelModifier: number
    hpModifier: number
    evolutionModifier: number
    shinyModifier: number
    legendaryModifier: number
    statusModifier: number
    injuryModifier: number
    stuckModifier: number
    slowModifier: number
  }
  canBeCaptured: boolean
  hpPercentage: number
  // P0: New fields
  ballModifier: number       // Total ball modifier (base + conditional)
  ballName: string           // Display name
  ballBreakdown: {
    baseModifier: number     // Ball's base modifier
    conditionalModifier: number  // P1: conditional modifier (0 in P0)
    conditionMet: boolean    // P1: whether condition was met
    conditionDescription?: string  // P1: human-readable condition
  }
}
```

### CaptureAttemptResult (Updated response)

```typescript
// In attempt.post.ts response:
export interface CaptureAttemptResult {
  captured: boolean
  roll: number
  modifiedRoll: number
  captureRate: number
  effectiveCaptureRate: number
  naturalHundred: boolean
  criticalHit: boolean
  trainerLevel: number
  modifiers: number            // Non-ball modifiers
  ballModifier: number         // Total ball modifier applied
  ballType: string             // Ball type used
  difficulty: string
  breakdown: CaptureRateResult['breakdown']
  ballBreakdown: CaptureRateResult['ballBreakdown']
  pokemon: { ... }             // Existing fields
  trainer: { ... }             // Existing fields
  // P2: Post-capture effect applied
  postCaptureEffect?: {
    type: 'heal_full' | 'loyalty_plus_one' | 'raised_happiness'
    description: string
  }
}
```

---

## Modifier Sign Convention

**Critical design decision:** PTU ball modifiers are expressed as modifiers to the capture roll. The existing `attemptCapture()` function uses:

```typescript
const modifiedRoll = roll - trainerLevel + modifiers
```

Where `modifiers` is currently a pre-calculated number the GM enters. Ball modifiers in PTU are:
- Great Ball: -10 (subtract 10 from the roll, making capture easier)
- Timer Ball starts at +5 (add 5 to the roll, making capture harder initially)

So the sign convention in `POKE_BALL_CATALOG` matches PTU directly:
- Negative modifier = easier capture (lower roll)
- Positive modifier = harder capture (higher roll)

The ball modifier is added to the existing `modifiers` parameter in `attemptCapture()`:

```typescript
const totalModifiers = (bodyModifiers || 0) + ballModifier
const captureResult = attemptCapture(captureRate, trainerLevel, totalModifiers, criticalHit)
```

---

## Existing Code Integration Points

### Capture Rate Calculator: `app/utils/captureRate.ts`

The `calculateCaptureRate()` function calculates the target number that the modified roll must be <= to succeed. **Ball modifiers do NOT change the capture rate** -- they change the roll. This is already how the system works:

```typescript
// Existing: modifiedRoll = roll - trainerLevel + modifiers
// Ball modifier goes into `modifiers`, NOT into captureRate
```

So `calculateCaptureRate()` does NOT need to change for P0. Only `attemptCapture()` and the API layer need updates to auto-populate the ball modifier from the catalog.

### Capture Rate API: `app/server/api/capture/rate.post.ts`

Currently returns `captureRate` and `breakdown`. P0 adds `ballModifier` and `ballBreakdown` to the response by looking up the ball type in the catalog.

### Capture Attempt API: `app/server/api/capture/attempt.post.ts`

Currently calls `attemptCapture(captureRate, trainerLevel, modifiers, criticalHit)`. P0 changes to:

```typescript
const ballDef = POKE_BALL_CATALOG[body.ballType || 'Basic Ball']
const ballModifier = ballDef?.modifier || 0
const totalModifiers = (body.modifiers || 0) + ballModifier
const captureResult = attemptCapture(captureRate, trainerLevel, totalModifiers, criticalHit)
```

### useCapture Composable: `app/composables/useCapture.ts`

Updated to accept `ballType` parameter and include ball info in the request/response.

---

## Existing Code Paths to Preserve

The existing manual `modifiers` parameter is preserved for non-ball modifiers (Trainer features, equipment bonuses). The ball modifier is computed separately and stacked additively:

| Source | Mechanism | Preserved? |
|--------|-----------|-----------|
| Manual modifiers (features/equipment) | `modifiers` body param | YES -- unchanged |
| Ball type modifier | **NEW** -- `ballType` body param, auto-calculated | NEW |
| Trainer level subtraction | `roll - trainerLevel` | YES -- unchanged |
| Capture rate (target number) | `calculateCaptureRate()` | YES -- unchanged |
| Natural 100 auto-capture | `naturalHundred` check | YES -- unchanged |
| Critical hit (+10 to rate) | `criticalHit` param | YES -- unchanged |

---

## Poke Ball Catalog (Full Reference)

All 25 balls from PTU Core p.271-273:

| # | Ball | Category | Base Mod | Conditional | Post-Capture | Cost |
|---|------|----------|----------|-------------|--------------|------|
| 01 | Basic Ball | basic | +0 | -- | -- | $250 |
| 02 | Great Ball | basic | -10 | -- | -- | $400 |
| 03 | Ultra Ball | basic | -15 | -- | -- | $800 |
| 04 | Master Ball | basic | -100 | -- | -- | $300,000 |
| 05 | Safari Ball | safari | +0 | -- | Safari hunts | $0 |
| 06 | Level Ball | apricorn | +0 | -20 if target < half user's Pokemon level | -- | $800 |
| 07 | Lure Ball | apricorn | +0 | -20 if target was baited | -- | $800 |
| 08 | Moon Ball | apricorn | +0 | -20 if target evolves with Evo Stone | -- | $800 |
| 09 | Friend Ball | apricorn | -5 | -- | +1 Loyalty | $800 |
| 10 | Love Ball | apricorn | +0 | -30 if same evo line + opposite gender | -- | $800 |
| 11 | Heavy Ball | apricorn | +0 | -5 per Weight Class above 1 | -- | $800 |
| 12 | Fast Ball | apricorn | +0 | -20 if target Movement > 7 | -- | $800 |
| 13 | Sport Ball | safari | +0 | -- | Safari hunts | $0 |
| 14 | Premier Ball | special | +0 | -- | Promotional | $0 |
| 15 | Repeat Ball | special | +0 | -20 if trainer owns same species | -- | $800 |
| 16 | Timer Ball | special | +5 | -5 per round (until total -20) | -- | $800 |
| 17 | Nest Ball | special | +0 | -20 if target under level 10 | -- | $800 |
| 18 | Net Ball | special | +0 | -20 if target is Water or Bug type | -- | $800 |
| 19 | Dive Ball | special | +0 | -20 if underwater or underground | -- | $800 |
| 20 | Luxury Ball | special | -5 | -- | Raised happiness | $800 |
| 21 | Heal Ball | special | -5 | -- | Heal to Max HP | $800 |
| 22 | Quick Ball | special | -20 | +5 after R1, +10 after R2, +20 after R3 | -- | $800 |
| 23 | Dusk Ball | special | +0 | -20 if dark or low-light | -- | $800 |
| 24 | Cherish Ball | special | -5 | -- | Decorative | $0 |
| 25 | Park Ball | safari | -15 | -- | Safari hunts | $0 |

---

## Timer Ball and Quick Ball: Round Scaling Details

**Timer Ball (PTU p.272):** "Timer Ball: +5. -5 to the Modifier after every round since the beginning of the encounter, until the Modifier is -20."

Interpretation: The base modifier is +5. After each round, -5 is applied cumulatively:
- Round 1: +5 (base, no rounds elapsed)
- Round 2: +5 - 5 = 0
- Round 3: 0 - 5 = -5
- Round 4: -5 - 5 = -10
- Round 5: -10 - 5 = -15
- Round 6+: -15 - 5 = -20 (capped)

Formula: `modifier = Math.max(-20, 5 - (5 * (round - 1)))` where round is 1-based.

**Quick Ball (PTU p.273):** "Quick Ball: -20. +5 to Modifier after 1 round of the encounter, +10 to Modifier after round 2, +20 to modifier after round 3."

Interpretation: The base is -20. After specific rounds, the modifier increases:
- Round 1: -20 (base)
- Round 2: -20 + 5 = -15
- Round 3: -15 + 10 = -5 (cumulative: -20 + 5 + 10 = -5)
- Round 4+: -5 + 20 = +15 ... No, re-reading: "+20 to modifier after round 3" -- this reads as setting the degradation to +20 total from the base after round 3.

Alternate interpretation: The modifiers are not cumulative but absolute decay steps:
- Round 1: -20 (base, best)
- After round 1: -20 + 5 = -15
- After round 2: -20 + 10 = -10
- After round 3+: -20 + 20 = 0

Formula:
```
round 1: -20
round 2: -15
round 3: -10
round 4+: 0
```

The "after round N" phrasing means: once round N has completed. So if thrown in round 1, the Quick Ball is at its best (-20). After round 1 completes, it degrades. Formula: `modifier = round === 1 ? -20 : round === 2 ? -15 : round === 3 ? -10 : 0`

---

## Non-Combat Capture

The ball type system works identically for in-combat and out-of-combat capture. The `conditionContext.encounterRound` is set to 1 for out-of-combat throws (no round tracking). Timer Ball and Quick Ball use their round-1 values in this case.
