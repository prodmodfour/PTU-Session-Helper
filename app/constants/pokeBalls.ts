/**
 * PTU 1.05 Poke Ball Catalog
 *
 * All 25 ball types from Chapter 9, p.271-273.
 *
 * Modifier sign convention: negative = easier capture (subtract from roll).
 * Matches PTU book values directly.
 *
 * P0: Base modifiers only. Condition functions are undefined.
 * P1: Condition functions populated for conditional balls.
 * P2: Post-capture effects populated.
 */

import { evaluateBallCondition } from '~/utils/pokeBallConditions'

// ============================================
// TYPE DEFINITIONS
// ============================================

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
 *
 * P0: Defined but unused (condition functions are undefined).
 * P1: Used by conditional ball evaluators.
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

// ============================================
// POKE BALL CATALOG
// ============================================

export const POKE_BALL_CATALOG = {
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
} as const satisfies Record<string, PokeBallDef>

/**
 * Default ball type when none is specified.
 */
export const DEFAULT_BALL_TYPE = 'Basic Ball'

// ============================================
// HELPER FUNCTIONS
// ============================================

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
 * Evaluates the ball's condition function if one exists.
 *
 * @param ballType Key in POKE_BALL_CATALOG
 * @param context Optional context for evaluating conditional modifiers
 * @returns Breakdown of base + conditional modifiers with description
 */
export function calculateBallModifier(
  ballType: string,
  context?: Partial<BallConditionContext>
): { total: number; base: number; conditional: number; conditionMet: boolean; description?: string } {
  const ball = POKE_BALL_CATALOG[ballType]
  if (!ball) {
    return { total: 0, base: 0, conditional: 0, conditionMet: false }
  }

  // Evaluate conditional modifier via the condition engine
  const condResult = evaluateBallCondition(ballType, context ?? {})

  const total = ball.modifier + condResult.modifier

  return {
    total,
    base: ball.modifier,
    conditional: condResult.modifier,
    conditionMet: condResult.conditionMet,
    description: condResult.description,
  }
}

/**
 * Get ball names suitable for display (excluding Safari-only balls by default).
 */
export function getAvailableBallNames(includeSafari: boolean = false): string[] {
  return Object.values(POKE_BALL_CATALOG)
    .filter(ball => includeSafari || ball.category !== 'safari')
    .map(ball => ball.name)
}
