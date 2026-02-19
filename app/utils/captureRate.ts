/**
 * PTU 1.05 Capture Rate Calculator
 *
 * Capture Rate formula:
 * - Start with 100
 * - Subtract Level × 2
 * - Apply HP modifier based on current HP percentage
 * - Apply evolution stage modifier
 * - Apply rarity modifiers (Shiny, Legendary)
 * - Apply status condition and injury modifiers
 */

import type { StatusCondition } from '~/types'
import { PERSISTENT_CONDITIONS, VOLATILE_CONDITIONS } from '~/constants/statusConditions'

// Special conditions with specific modifiers
const STUCK_CONDITIONS: StatusCondition[] = ['Stuck']
const SLOW_CONDITIONS: StatusCondition[] = ['Slowed']

export interface CaptureRateInput {
  level: number
  currentHp: number
  maxHp: number
  evolutionStage: number  // 1, 2, or 3 (how many stages in the line, not remaining)
  maxEvolutionStage: number  // Total stages in evolution line (1, 2, or 3)
  statusConditions: StatusCondition[]
  injuries: number
  isShiny: boolean
  isLegendary?: boolean
}

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
}

/**
 * Calculate the capture rate for a wild Pokemon
 */
export function calculateCaptureRate(input: CaptureRateInput): CaptureRateResult {
  const {
    level,
    currentHp,
    maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions,
    injuries,
    isShiny,
    isLegendary = false
  } = input

  // Pokemon at 0 HP or less cannot be captured
  const canBeCaptured = currentHp > 0

  // Calculate HP percentage
  const hpPercentage = (currentHp / maxHp) * 100

  // Start with base 100
  const base = 100

  // Level modifier: subtract Level × 2
  const levelModifier = -(level * 2)

  // HP modifier based on percentage
  let hpModifier = 0
  if (currentHp === 1) {
    hpModifier = 30  // Exactly 1 HP: +30
  } else if (hpPercentage <= 25) {
    hpModifier = 15  // 25% or lower: +15
  } else if (hpPercentage <= 50) {
    hpModifier = 0   // 50% or lower: +0 (unmodified)
  } else if (hpPercentage <= 75) {
    hpModifier = -15 // 75% or lower: -15
  } else {
    hpModifier = -30 // Above 75%: -30
  }

  // Evolution stage modifier
  // evolutionsRemaining = maxEvolutionStage - evolutionStage
  const evolutionsRemaining = maxEvolutionStage - evolutionStage
  let evolutionModifier = 0
  if (evolutionsRemaining >= 2) {
    evolutionModifier = 10  // Two evolutions remaining: +10
  } else if (evolutionsRemaining === 1) {
    evolutionModifier = 0   // One evolution remaining: +0
  } else {
    evolutionModifier = -10 // No evolutions remaining (final form): -10
  }

  // Rarity modifiers
  const shinyModifier = isShiny ? -10 : 0
  const legendaryModifier = isLegendary ? -30 : 0

  // Status condition modifiers
  let statusModifier = 0
  let stuckModifier = 0
  let slowModifier = 0

  for (const condition of statusConditions) {
    if (PERSISTENT_CONDITIONS.includes(condition)) {
      statusModifier += 10
    } else if (VOLATILE_CONDITIONS.includes(condition)) {
      statusModifier += 5
    }

    // Special conditions stack with above
    if (STUCK_CONDITIONS.includes(condition)) {
      stuckModifier += 10
    }
    if (SLOW_CONDITIONS.includes(condition)) {
      slowModifier += 5
    }
  }

  // Injury modifier: +5 per injury
  const injuryModifier = injuries * 5

  // Calculate final capture rate
  const captureRate = base + levelModifier + hpModifier + evolutionModifier +
    shinyModifier + legendaryModifier + statusModifier + injuryModifier +
    stuckModifier + slowModifier

  return {
    captureRate,
    breakdown: {
      base,
      levelModifier,
      hpModifier,
      evolutionModifier,
      shinyModifier,
      legendaryModifier,
      statusModifier,
      injuryModifier,
      stuckModifier,
      slowModifier
    },
    canBeCaptured,
    hpPercentage
  }
}

/**
 * Simulate a capture attempt
 * @param captureRate The calculated capture rate
 * @param trainerLevel The trainer's level (subtracted from roll)
 * @param modifiers Any additional modifiers from equipment/features
 * @param criticalHit Whether the accuracy check was a natural 20
 * @returns Object with success status and roll details
 */
export function attemptCapture(
  captureRate: number,
  trainerLevel: number,
  modifiers: number = 0,
  criticalHit: boolean = false
): {
  success: boolean
  roll: number
  modifiedRoll: number
  effectiveCaptureRate: number
  naturalHundred: boolean
} {
  // Roll 1d100
  const roll = Math.floor(Math.random() * 100) + 1

  // Natural 100 always captures
  const naturalHundred = roll === 100

  // Apply modifiers to the capture rate if crit
  let effectiveCaptureRate = captureRate
  if (criticalHit) {
    effectiveCaptureRate += 10  // Crit subtracts 10 from roll, same as adding 10 to rate
  }

  // Modified roll = roll - trainer level - modifiers
  const modifiedRoll = roll - trainerLevel - modifiers

  // Success if modified roll <= capture rate, or natural 100
  const success = naturalHundred || modifiedRoll <= effectiveCaptureRate

  return {
    success,
    roll,
    modifiedRoll,
    effectiveCaptureRate,
    naturalHundred
  }
}

/**
 * Get a human-readable description of capture difficulty
 */
export function getCaptureDescription(captureRate: number): string {
  if (captureRate >= 80) return 'Very Easy'
  if (captureRate >= 60) return 'Easy'
  if (captureRate >= 40) return 'Moderate'
  if (captureRate >= 20) return 'Difficult'
  if (captureRate >= 1) return 'Very Difficult'
  return 'Nearly Impossible'
}
