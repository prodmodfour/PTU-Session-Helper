# P0 Specification: Poke Ball Catalog and Base Modifier Integration

P0 covers the foundational ball catalog constant, integration of the base modifier into the capture roll, the ballType parameter in the capture API endpoints, and updated composable. Conditional ball logic, round-dependent modifiers, and post-capture effects are deferred to P1/P2.

---

## A. Poke Ball Catalog Constants

### New File: `app/constants/pokeBalls.ts`

Define the complete PTU Poke Ball catalog with all 25 ball types. Each entry contains the base modifier and metadata. Condition functions and post-capture effects are `undefined` in P0 (added in P1/P2).

```typescript
import type { PokeBallDef, PokeBallCategory, BallConditionContext } from './pokeBalls'

/**
 * PTU 1.05 Poke Ball Catalog
 * All 25 ball types from Chapter 9, p.271-273.
 *
 * Modifier sign convention: negative = easier capture (subtract from roll).
 * Matches PTU book values directly.
 *
 * P0: Base modifiers only. Condition functions are undefined.
 * P1: Condition functions populated for conditional balls.
 * P2: Post-capture effects populated.
 */
export const POKE_BALL_CATALOG: Record<string, PokeBallDef> = {
  // === Basic Balls ===
  'Basic Ball': {
    id: 1,
    name: 'Basic Ball',
    category: 'basic',
    modifier: 0,
    description: 'Basic Poke Ball; often called just a "Poke Ball".',
    cost: 250,
  },
  'Great Ball': {
    id: 2,
    name: 'Great Ball',
    category: 'basic',
    modifier: -10,
    description: 'A better Poke Ball with no special effects.',
    cost: 400,
  },
  'Ultra Ball': {
    id: 3,
    name: 'Ultra Ball',
    category: 'basic',
    modifier: -15,
    description: 'The best generic Poke Ball.',
    cost: 800,
  },
  'Master Ball': {
    id: 4,
    name: 'Master Ball',
    category: 'basic',
    modifier: -100,
    description: 'Incredibly Rare. Guaranteed capture.',
    cost: 300000,
  },

  // === Safari Balls ===
  'Safari Ball': {
    id: 5,
    name: 'Safari Ball',
    category: 'safari',
    modifier: 0,
    description: 'Used during Safari hunts.',
    cost: 0,
  },
  'Sport Ball': {
    id: 13,
    name: 'Sport Ball',
    category: 'safari',
    modifier: 0,
    description: 'Used during Safari hunts.',
    cost: 0,
  },
  'Park Ball': {
    id: 25,
    name: 'Park Ball',
    category: 'safari',
    modifier: -15,
    description: 'Used during Safari hunts.',
    cost: 0,
  },

  // === Apricorn Balls (conditional modifiers in P1) ===
  'Level Ball': {
    id: 6,
    name: 'Level Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-20 if target is under half the level of your active Pokemon.',
    description: '-20 Modifier if target is under half your active Pokemon\'s level.',
    cost: 800,
  },
  'Lure Ball': {
    id: 7,
    name: 'Lure Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-20 if the target was baited into the encounter with food.',
    description: '-20 Modifier if the target was baited into the encounter.',
    cost: 800,
  },
  'Moon Ball': {
    id: 8,
    name: 'Moon Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-20 if the target evolves with an Evolution Stone.',
    description: '-20 Modifier if the target evolves with an Evolution Stone.',
    cost: 800,
  },
  'Friend Ball': {
    id: 9,
    name: 'Friend Ball',
    category: 'apricorn',
    modifier: -5,
    description: 'A caught Pokemon will start with +1 Loyalty.',
    cost: 800,
    postCaptureEffect: 'loyalty_plus_one',
    postCaptureDescription: 'Caught Pokemon starts with +1 Loyalty.',
  },
  'Love Ball': {
    id: 10,
    name: 'Love Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-30 if user has active Pokemon of same evo line and opposite gender. Does not work with genderless.',
    description: '-30 Modifier if same evolutionary line and opposite gender.',
    cost: 800,
  },
  'Heavy Ball': {
    id: 11,
    name: 'Heavy Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-5 for each Weight Class the target is above 1.',
    description: '-5 Modifier per Weight Class above 1.',
    cost: 800,
  },
  'Fast Ball': {
    id: 12,
    name: 'Fast Ball',
    category: 'apricorn',
    modifier: 0,
    conditionDescription: '-20 if the target has a Movement Capability above 7.',
    description: '-20 Modifier if target Movement Capability above 7.',
    cost: 800,
  },

  // === Special Balls ===
  'Premier Ball': {
    id: 14,
    name: 'Premier Ball',
    category: 'special',
    modifier: 0,
    description: 'Given as promotional balls during sales.',
    cost: 0,
  },
  'Repeat Ball': {
    id: 15,
    name: 'Repeat Ball',
    category: 'special',
    modifier: 0,
    conditionDescription: '-20 if you already own a Pokemon of the target\'s species.',
    description: '-20 Modifier if trainer already owns same species.',
    cost: 800,
  },
  'Timer Ball': {
    id: 16,
    name: 'Timer Ball',
    category: 'special',
    modifier: 5,
    conditionDescription: '-5 to Modifier per round since encounter start (until total is -20).',
    description: 'Starts at +5, improves -5 per round until -20.',
    cost: 800,
  },
  'Nest Ball': {
    id: 17,
    name: 'Nest Ball',
    category: 'special',
    modifier: 0,
    conditionDescription: '-20 if the target is under level 10.',
    description: '-20 Modifier if target is under level 10.',
    cost: 800,
  },
  'Net Ball': {
    id: 18,
    name: 'Net Ball',
    category: 'special',
    modifier: 0,
    conditionDescription: '-20 if the target is Water or Bug type.',
    description: '-20 Modifier if target is Water or Bug type.',
    cost: 800,
  },
  'Dive Ball': {
    id: 19,
    name: 'Dive Ball',
    category: 'special',
    modifier: 0,
    conditionDescription: '-20 if the target was found underwater or underground.',
    description: '-20 Modifier if found underwater or underground.',
    cost: 800,
  },
  'Luxury Ball': {
    id: 20,
    name: 'Luxury Ball',
    category: 'special',
    modifier: -5,
    description: 'Caught Pokemon starts with raised happiness.',
    cost: 800,
    postCaptureEffect: 'raised_happiness',
    postCaptureDescription: 'Caught Pokemon is easily pleased and starts with raised happiness.',
  },
  'Heal Ball': {
    id: 21,
    name: 'Heal Ball',
    category: 'special',
    modifier: -5,
    description: 'Caught Pokemon heals to Max HP immediately upon capture.',
    cost: 800,
    postCaptureEffect: 'heal_full',
    postCaptureDescription: 'Caught Pokemon heals to Max HP on capture.',
  },
  'Quick Ball': {
    id: 22,
    name: 'Quick Ball',
    category: 'special',
    modifier: -20,
    conditionDescription: '+5 after round 1, +10 after round 2, +20 after round 3 (degrades over time).',
    description: 'Best on round 1 (-20), degrades after each round.',
    cost: 800,
  },
  'Dusk Ball': {
    id: 23,
    name: 'Dusk Ball',
    category: 'special',
    modifier: 0,
    conditionDescription: '-20 if it is dark or very little light out.',
    description: '-20 Modifier in dark or low-light conditions.',
    cost: 800,
  },
  'Cherish Ball': {
    id: 24,
    name: 'Cherish Ball',
    category: 'special',
    modifier: -5,
    description: 'A decorative Poke Ball often given out during special events.',
    cost: 0,
  },
} as const

/**
 * Default ball type when none is specified.
 */
export const DEFAULT_BALL_TYPE = 'Basic Ball'

/**
 * Get all ball types grouped by category.
 */
export function getBallsByCategory(): Record<PokeBallCategory, PokeBallDef[]> {
  const grouped: Record<PokeBallCategory, PokeBallDef[]> = {
    basic: [],
    apricorn: [],
    special: [],
    safari: [],
  }
  for (const ball of Object.values(POKE_BALL_CATALOG)) {
    grouped[ball.category].push(ball)
  }
  return grouped
}

/**
 * Get a ball definition by name. Returns undefined if not found.
 */
export function getBallDef(ballType: string): PokeBallDef | undefined {
  return POKE_BALL_CATALOG[ballType]
}

/**
 * Calculate the total ball modifier (base + conditional).
 * P0: Returns base modifier only (no condition evaluation).
 * P1: Evaluates condition function if present.
 */
export function calculateBallModifier(
  ballType: string,
  _context?: Partial<BallConditionContext>
): { total: number; base: number; conditional: number; conditionMet: boolean } {
  const ball = POKE_BALL_CATALOG[ballType]
  if (!ball) {
    return { total: 0, base: 0, conditional: 0, conditionMet: false }
  }

  // P0: Base modifier only, no condition evaluation
  // P1: Will evaluate ball.condition(context) here
  return {
    total: ball.modifier,
    base: ball.modifier,
    conditional: 0,
    conditionMet: false,
  }
}

/**
 * Get ball names suitable for display (excluding Safari-only balls).
 */
export function getAvailableBallNames(includeSafari: boolean = false): string[] {
  return Object.values(POKE_BALL_CATALOG)
    .filter(ball => includeSafari || ball.category !== 'safari')
    .map(ball => ball.name)
}
```

**Design notes:**

- The catalog includes ALL 25 ball types from PTU p.271-273 upfront, but P0 only uses the `modifier` field. The `condition` function field is undefined in P0, populated in P1.
- Post-capture effect identifiers (`heal_full`, `loyalty_plus_one`, `raised_happiness`) are defined in P0 as string literals for the catalog data, but the actual post-capture processing is deferred to P2.
- The `BallConditionContext` interface is defined in shared-specs for P1 use. P0 ignores it entirely.
- `calculateBallModifier()` is the single entry point for computing the total ball modifier. P0 returns `ball.modifier` directly. P1 adds condition evaluation.

---

## B. Base Modifier Integration into Capture Rate

### No Change to `calculateCaptureRate()`

The `calculateCaptureRate()` function in `app/utils/captureRate.ts` remains unchanged. Ball modifiers affect the roll, not the capture rate target number. This matches the existing architecture where:

```typescript
// captureRate.ts (UNCHANGED)
captureRate = base + levelModifier + hpModifier + evolutionModifier + ...

// attemptCapture (P0 UPDATE)
modifiedRoll = roll - trainerLevel + totalModifiers  // totalModifiers now includes ball modifier
```

### Updated `attemptCapture()` Function

The existing `attemptCapture()` function signature is preserved. The ball modifier is computed upstream (in the API layer) and passed via the `modifiers` parameter. However, to provide better breakdown info, add an optional `ballModifier` tracking parameter:

```typescript
/**
 * Simulate a capture attempt (decree-013: 1d100 system).
 * @param captureRate The calculated capture rate (target number)
 * @param trainerLevel The trainer's level (subtracted from roll)
 * @param modifiers Non-ball modifiers from equipment/features
 * @param criticalHit Whether the accuracy check was a natural 20
 * @param ballModifier Ball-specific modifier (from POKE_BALL_CATALOG)
 */
export function attemptCapture(
  captureRate: number,
  trainerLevel: number,
  modifiers: number = 0,
  criticalHit: boolean = false,
  ballModifier: number = 0
): {
  success: boolean
  roll: number
  modifiedRoll: number
  effectiveCaptureRate: number
  naturalHundred: boolean
  ballModifier: number
} {
  const roll = Math.floor(Math.random() * 100) + 1
  const naturalHundred = roll === 100

  let effectiveCaptureRate = captureRate
  if (criticalHit) {
    effectiveCaptureRate += 10
  }

  // Ball modifier is additive with other modifiers on the roll
  const modifiedRoll = roll - trainerLevel + modifiers + ballModifier

  const success = naturalHundred || modifiedRoll <= effectiveCaptureRate

  return {
    success,
    roll,
    modifiedRoll,
    effectiveCaptureRate,
    naturalHundred,
    ballModifier
  }
}
```

**Breaking change mitigation:** The new `ballModifier` parameter is optional with a default of 0, so all existing call sites continue to work without modification. The return type adds `ballModifier` which is additive and non-breaking.

---

## C. Ball Type Parameter in Capture API

### Updated: `app/server/api/capture/rate.post.ts`

Add `ballType` to the request body and include ball modifier info in the response:

```typescript
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'

// In the handler, after calculating the base capture rate:

const ballType = body.ballType || DEFAULT_BALL_TYPE
const ballDef = POKE_BALL_CATALOG[ballType]

if (body.ballType && !ballDef) {
  throw createError({
    statusCode: 400,
    message: `Unknown ball type: ${body.ballType}`
  })
}

const ballResult = calculateBallModifier(ballType, body.conditionContext)

return {
  success: true,
  data: {
    species,
    level,
    currentHp,
    maxHp,
    captureRate: result.captureRate,
    difficulty: getCaptureDescription(result.captureRate),
    canBeCaptured: result.canBeCaptured,
    hpPercentage: Math.round(result.hpPercentage),
    breakdown: result.breakdown,
    // P0: New ball info
    ballType,
    ballModifier: ballResult.total,
    ballBreakdown: {
      baseModifier: ballResult.base,
      conditionalModifier: ballResult.conditional,
      conditionMet: ballResult.conditionMet,
      conditionDescription: ballDef?.conditionDescription,
    }
  }
}
```

### Updated: `app/server/api/capture/attempt.post.ts`

Add `ballType` to the request body and compute the ball modifier automatically:

```typescript
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'

// In the handler, after calculating the capture rate:

const ballType = body.ballType || DEFAULT_BALL_TYPE
const ballDef = POKE_BALL_CATALOG[ballType]

if (body.ballType && !ballDef) {
  throw createError({
    statusCode: 400,
    message: `Unknown ball type: ${body.ballType}`
  })
}

const ballResult = calculateBallModifier(ballType, body.conditionContext)

// Attempt capture with ball modifier separated from other modifiers
const captureResult = attemptCapture(
  rateResult.captureRate,
  trainer.level,
  body.modifiers || 0,
  criticalHit,
  ballResult.total
)

// In the response, add ball info:
return {
  success: true,
  data: {
    captured: captureResult.success,
    roll: captureResult.roll,
    modifiedRoll: captureResult.modifiedRoll,
    captureRate: rateResult.captureRate,
    effectiveCaptureRate: captureResult.effectiveCaptureRate,
    naturalHundred: captureResult.naturalHundred,
    criticalHit,
    trainerLevel: trainer.level,
    modifiers: body.modifiers || 0,
    ballModifier: ballResult.total,
    ballType,
    difficulty: getCaptureDescription(rateResult.captureRate),
    breakdown: rateResult.breakdown,
    ballBreakdown: {
      baseModifier: ballResult.base,
      conditionalModifier: ballResult.conditional,
      conditionMet: ballResult.conditionMet,
      conditionDescription: ballDef?.conditionDescription,
    },
    pokemon: { ... },  // existing
    trainer: { ... },   // existing
    speciesXp: ...,     // existing
  }
}
```

### Validation

- If `ballType` is omitted, default to `'Basic Ball'` (+0 modifier, no change from current behavior).
- If `ballType` is provided but not in `POKE_BALL_CATALOG`, return 400 error.
- The `modifiers` field continues to work for non-ball modifiers (equipment, features). Ball modifier is computed separately and stacked.

---

## D. Updated useCapture Composable

### Updated: `app/composables/useCapture.ts`

Add `ballType` to the composable's function parameters:

```typescript
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import type { PokeBallDef } from '~/constants/pokeBalls'

export interface CaptureRateData {
  species: string
  level: number
  currentHp: number
  maxHp: number
  captureRate: number
  difficulty: string
  canBeCaptured: boolean
  hpPercentage: number
  breakdown: { ... }  // existing
  // P0: New fields
  ballType: string
  ballModifier: number
  ballBreakdown: {
    baseModifier: number
    conditionalModifier: number
    conditionMet: boolean
    conditionDescription?: string
  }
}

export interface CaptureAttemptResult {
  captured: boolean
  roll: number
  modifiedRoll: number
  captureRate: number
  effectiveCaptureRate: number
  naturalHundred: boolean
  criticalHit: boolean
  trainerLevel: number
  modifiers: number
  ballModifier: number    // P0: New
  ballType: string        // P0: New
  difficulty: string
  breakdown: CaptureRateData['breakdown']
  ballBreakdown: CaptureRateData['ballBreakdown']  // P0: New
  pokemon: { ... }
  trainer: { ... }
  reason?: string
}

export function useCapture() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const warning = ref<string | null>(null)

  /**
   * Get the capture rate for a Pokemon by ID, with optional ball type.
   */
  async function getCaptureRate(
    pokemonId: string,
    ballType: string = DEFAULT_BALL_TYPE
  ): Promise<CaptureRateData | null> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureRateData }>('/api/capture/rate', {
        method: 'POST',
        body: { pokemonId, ballType }
      })

      if (response.success) {
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to get capture rate'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Calculate capture rate locally with ball modifier.
   */
  function calculateCaptureRateLocal(params: {
    level: number
    currentHp: number
    maxHp: number
    evolutionStage?: number
    maxEvolutionStage?: number
    statusConditions?: StatusCondition[]
    injuries?: number
    isShiny?: boolean
    isLegendary?: boolean
    ballType?: string
  }): CaptureRateData {
    const result = calculateCaptureRate({
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      evolutionStage: params.evolutionStage ?? 1,
      maxEvolutionStage: params.maxEvolutionStage ?? 3,
      statusConditions: params.statusConditions ?? [],
      injuries: params.injuries ?? 0,
      isShiny: params.isShiny ?? false,
      isLegendary: params.isLegendary ?? false
    })

    const ballType = params.ballType || DEFAULT_BALL_TYPE
    const ballResult = calculateBallModifier(ballType)
    const ballDef = POKE_BALL_CATALOG[ballType]

    return {
      species: '',
      level: params.level,
      currentHp: params.currentHp,
      maxHp: params.maxHp,
      captureRate: result.captureRate,
      difficulty: getCaptureDescription(result.captureRate),
      canBeCaptured: result.canBeCaptured,
      hpPercentage: Math.round(result.hpPercentage),
      breakdown: result.breakdown,
      ballType,
      ballModifier: ballResult.total,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballDef?.conditionDescription,
      }
    }
  }

  /**
   * Attempt to capture a Pokemon with a specific ball type.
   */
  async function attemptCapture(params: {
    pokemonId: string
    trainerId: string
    accuracyRoll?: number
    ballType?: string
    modifiers?: number
    encounterContext?: {
      encounterId: string
      trainerCombatantId: string
    }
  }): Promise<CaptureAttemptResult | null> {
    loading.value = true
    error.value = null
    warning.value = null

    try {
      const response = await $fetch<{ success: boolean; data: CaptureAttemptResult }>('/api/capture/attempt', {
        method: 'POST',
        body: {
          pokemonId: params.pokemonId,
          trainerId: params.trainerId,
          accuracyRoll: params.accuracyRoll,
          ballType: params.ballType || DEFAULT_BALL_TYPE,
          modifiers: params.modifiers
        }
      })

      if (response.success) {
        if (params.encounterContext) {
          const { encounterId, trainerCombatantId } = params.encounterContext
          try {
            await $fetch(`/api/encounters/${encounterId}/action`, {
              method: 'POST',
              body: {
                combatantId: trainerCombatantId,
                actionType: 'standard'
              }
            })
          } catch (actionError: any) {
            warning.value = 'Capture succeeded but standard action was not consumed -- please adjust action economy manually'
          }
        }
        return response.data
      }
      return null
    } catch (e: any) {
      error.value = e.message || 'Failed to attempt capture'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all available ball types for the selection UI (P2).
   */
  function getAvailableBalls(includeSafari: boolean = false): PokeBallDef[] {
    return Object.values(POKE_BALL_CATALOG)
      .filter(ball => includeSafari || ball.category !== 'safari')
  }

  // Existing function preserved:
  function rollAccuracyCheck(): { roll: number; isNat20: boolean; total: number } {
    const roll = Math.floor(Math.random() * 20) + 1
    return {
      roll,
      isNat20: roll === 20,
      total: roll
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    warning: readonly(warning),
    getCaptureRate,
    calculateCaptureRateLocal,
    attemptCapture,
    rollAccuracyCheck,
    getAvailableBalls,  // P0: New
  }
}
```

**Design notes:**

- `getCaptureRate()` gains a `ballType` parameter (default: 'Basic Ball'). Backward compatible.
- `calculateCaptureRateLocal()` gains `ballType` in its params object. Returns ball breakdown.
- `attemptCapture()` gains `ballType` in its params object. Sends it to the API.
- `getAvailableBalls()` returns all ball defs for UI (P2 uses this, but exposed in P0).
- All existing callers continue to work because new parameters are optional with defaults matching current behavior (+0 modifier from Basic Ball).

---

## Backward Compatibility

P0 is fully backward compatible:

| Call site | Before | After |
|-----------|--------|-------|
| `getCaptureRate(pokemonId)` | Works | Works (defaults to Basic Ball, +0) |
| `attemptCapture({ pokemonId, trainerId })` | Works | Works (defaults to Basic Ball, +0) |
| `calculateCaptureRateLocal({ level, ... })` | Works | Works (defaults to Basic Ball, +0) |
| `attemptCapture(rate, level, mods, crit)` | Works | Works (ballModifier defaults to 0) |
| API: POST /api/capture/rate without ballType | Works | Works (defaults to Basic Ball) |
| API: POST /api/capture/attempt without ballType | Works | Works (defaults to Basic Ball) |

No existing behavior changes. The only additions are new optional parameters and new response fields.
