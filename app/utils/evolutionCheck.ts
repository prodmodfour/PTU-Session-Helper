/**
 * PTU Evolution Eligibility Check
 *
 * Pure functions for determining which evolutions are available
 * for a Pokemon based on its current state and species triggers.
 *
 * No DB access — operates on pre-fetched data only.
 *
 * Reference: PTU Core Chapter 5, p.202
 */

import type { EvolutionTrigger } from '~/types/species'

// ============================================
// TYPES
// ============================================

export interface EvolutionCheckInput {
  currentLevel: number
  heldItem: string | null
  evolutionTriggers: EvolutionTrigger[]
}

export interface EvolutionAvailable {
  toSpecies: string
  trigger: EvolutionTrigger
}

export interface EvolutionIneligible {
  toSpecies: string
  trigger: EvolutionTrigger
  reason: string
}

export interface EvolutionEligibilityResult {
  available: EvolutionAvailable[]
  ineligible: EvolutionIneligible[]
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Check which evolutions are available for a Pokemon.
 * Pure function — does not query DB.
 *
 * Logic per trigger:
 * 1. If minimumLevel is set, check currentLevel >= minimumLevel
 * 2. If requiredItem is set and itemMustBeHeld is true, check heldItem matches
 * 3. If requiredItem is set and itemMustBeHeld is false (stone), mark as available
 *    with a note — the GM confirms stone inventory (P0 does not enforce stone inventory)
 * 4. A trigger is "available" if all level/held-item requirements are met.
 *    Stone-based triggers are listed as available since the GM is the authority
 *    on whether the player has the stone.
 */
export function checkEvolutionEligibility(input: EvolutionCheckInput): EvolutionEligibilityResult {
  const { currentLevel, heldItem, evolutionTriggers } = input
  const available: EvolutionAvailable[] = []
  const ineligible: EvolutionIneligible[] = []

  for (const trigger of evolutionTriggers) {
    const reasons: string[] = []

    // Check level requirement
    if (trigger.minimumLevel !== null && currentLevel < trigger.minimumLevel) {
      reasons.push(`Requires minimum level ${trigger.minimumLevel} (current: ${currentLevel})`)
    }

    // Check held item requirement
    if (trigger.requiredItem !== null && trigger.itemMustBeHeld) {
      if (!heldItem || heldItem.toLowerCase() !== trigger.requiredItem.toLowerCase()) {
        reasons.push(`Requires holding ${trigger.requiredItem}`)
      }
    }

    if (reasons.length === 0) {
      available.push({ toSpecies: trigger.toSpecies, trigger })
    } else {
      ineligible.push({
        toSpecies: trigger.toSpecies,
        trigger,
        reason: reasons.join('; ')
      })
    }
  }

  return { available, ineligible }
}

/**
 * Extract level-only evolution levels from triggers.
 * Used to feed into calculateLevelUps() for the canEvolve flag.
 * Only includes level-based triggers where no item is required.
 */
export function getEvolutionLevels(triggers: EvolutionTrigger[]): number[] {
  return triggers
    .filter(t => t.minimumLevel !== null && t.requiredItem === null)
    .map(t => t.minimumLevel!)
}

// ============================================
// EVOLUTION MOVE LEARNING (R033)
// ============================================

export interface LearnsetEntry {
  level: number
  move: string
}

export interface EvolutionMoveResult {
  /** Moves available to learn immediately upon evolution */
  availableMoves: Array<{
    name: string
    level: number
  }>
  /** Current move count */
  currentMoveCount: number
  /** Maximum moves allowed (PTU: 6) */
  maxMoves: number
  /** Slots available for new moves */
  slotsAvailable: number
}

/**
 * Get moves that become available upon evolution.
 *
 * PTU p.202: "When Pokemon Evolve, they can immediately learn any Moves
 * that their new form learns at a Level lower than their minimum Level
 * for Evolution but that their previous form could not learn."
 *
 * decree-036: For stone evolutions (no minimum level), use currentLevel
 * as the upper bound instead.
 *
 * Algorithm:
 * 1. Determine the level ceiling: minimumLevel if set, else currentLevel (decree-036)
 * 2. Get new-form moves at levels <= ceiling
 * 3. Exclude moves that appear anywhere in the old-form learnset
 * 4. Exclude moves the Pokemon already knows
 *
 * Pure function — no DB access.
 */
export function getEvolutionMoves(input: {
  oldLearnset: LearnsetEntry[]
  newLearnset: LearnsetEntry[]
  evolutionMinLevel: number | null
  currentLevel: number
  currentMoves: string[]
}): EvolutionMoveResult {
  const { oldLearnset, newLearnset, evolutionMinLevel, currentLevel, currentMoves } = input

  // Level ceiling: use minimumLevel if set, else currentLevel (decree-036 for stone evos)
  const levelCeiling = evolutionMinLevel ?? currentLevel

  // All move names from old species' learnset (any level)
  const oldMoveNames = new Set(
    oldLearnset.map(entry => entry.move.toLowerCase())
  )

  // Current moves the Pokemon knows (case-insensitive)
  const knownMoves = new Set(
    currentMoves.map(name => name.toLowerCase())
  )

  // Filter new learnset: at or below ceiling, not in old learnset, not already known
  const availableMoves = newLearnset
    .filter(entry => {
      if (entry.level > levelCeiling) return false
      if (oldMoveNames.has(entry.move.toLowerCase())) return false
      if (knownMoves.has(entry.move.toLowerCase())) return false
      return true
    })
    .map(entry => ({
      name: entry.move,
      level: entry.level
    }))

  // Deduplicate by name (a move might appear at multiple levels)
  const seen = new Set<string>()
  const deduped = availableMoves.filter(move => {
    const key = move.name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const currentMoveCount = currentMoves.length
  const maxMoves = 6

  return {
    availableMoves: deduped,
    currentMoveCount,
    maxMoves,
    slotsAvailable: Math.max(0, maxMoves - currentMoveCount)
  }
}

// ============================================
// STAT TYPES (shared between client and server)
// ============================================

export interface EvolutionStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

// ============================================
// BASE RELATIONS VALIDATION — re-exported from shared utility
// ============================================

import { validateBaseRelations as _validateBaseRelations } from '~/utils/baseRelations'
import type { Stats } from '~/types/character'

/**
 * Legacy wrapper: accepts EvolutionStats and returns string[] for backward compatibility.
 * New code should use validateBaseRelations from ~/utils/baseRelations directly.
 */
export function validateBaseRelations(
  natureAdjustedBase: EvolutionStats,
  statPoints: EvolutionStats
): string[] {
  const result = _validateBaseRelations(
    natureAdjustedBase as Stats,
    statPoints as Stats
  )
  return result.violations
}
