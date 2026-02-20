/**
 * Move Frequency Validation Utility
 *
 * Pure functions for PTU move frequency enforcement:
 * - At-Will: unlimited uses
 * - EOT (Every Other Turn): can only be used every other turn
 * - Scene / Scene x2 / Scene x3: limited uses per scene
 * - Daily / Daily x2 / Daily x3: limited uses per day
 * - Static: passive, not actively used
 *
 * PTU p.247: "Suppressed" condition downgrades frequencies:
 *   At-Will → EOT, EOT/Scene x2 → Scene
 */

import type { Move } from '~/types/character'
import type { MoveFrequency } from '~/types/combat'

// ============================================
// FREQUENCY PARSING
// ============================================

/**
 * Parse the per-scene usage limit from a frequency string.
 * Returns null if the frequency has no scene limit (At-Will, Daily, Static, EOT).
 */
export function getSceneLimit(frequency: MoveFrequency): number | null {
  switch (frequency) {
    case 'Scene':
      return 1
    case 'Scene x2':
      return 2
    case 'Scene x3':
      return 3
    default:
      return null
  }
}

/**
 * Parse the per-day usage limit from a frequency string.
 * Returns null if the frequency has no daily limit.
 */
export function getDailyLimit(frequency: MoveFrequency): number | null {
  switch (frequency) {
    case 'Daily':
      return 1
    case 'Daily x2':
      return 2
    case 'Daily x3':
      return 3
    default:
      return null
  }
}

/**
 * Check if a frequency is EOT (Every Other Turn).
 */
export function isEotFrequency(frequency: MoveFrequency): boolean {
  return frequency === 'EOT'
}

/**
 * Check if a frequency has a scene-based limit (Scene, Scene x2, Scene x3).
 */
export function isSceneFrequency(frequency: MoveFrequency): boolean {
  return getSceneLimit(frequency) !== null
}

/**
 * Check if a frequency has a daily limit (Daily, Daily x2, Daily x3).
 */
export function isDailyFrequency(frequency: MoveFrequency): boolean {
  return getDailyLimit(frequency) !== null
}

// ============================================
// FREQUENCY VALIDATION
// ============================================

export interface FrequencyCheckResult {
  canUse: boolean
  reason?: string
  /** Remaining uses this scene (only for scene-frequency moves) */
  remainingSceneUses?: number
  /** Remaining uses today (only for daily-frequency moves) */
  remainingDailyUses?: number
}

/**
 * Check if a move can be used based on its frequency restrictions.
 *
 * @param move - The move to check
 * @param currentRound - The current combat round (1-based)
 * @returns FrequencyCheckResult indicating if the move can be used and why not
 */
export function checkMoveFrequency(
  move: Move,
  currentRound: number
): FrequencyCheckResult {
  const frequency = move.frequency

  // Static moves are passive — cannot be actively used
  if (frequency === 'Static') {
    return { canUse: false, reason: 'Static moves cannot be actively used' }
  }

  // At-Will: always usable
  if (frequency === 'At-Will') {
    return { canUse: true }
  }

  // EOT (Every Other Turn): cannot use on consecutive turns
  if (isEotFrequency(frequency)) {
    const lastUsed = move.lastTurnUsed ?? 0
    if (lastUsed > 0 && currentRound <= lastUsed + 1) {
      return {
        canUse: false,
        reason: `EOT move was used on round ${lastUsed}, must wait until round ${lastUsed + 2}`
      }
    }
    return { canUse: true }
  }

  // Scene-frequency moves: check scene usage limit
  // PTU p.337: Scene x2/x3 moves still enforce EOT (every other turn) between uses
  const sceneLimit = getSceneLimit(frequency)
  if (sceneLimit !== null) {
    const used = move.usedThisScene ?? 0
    const remaining = Math.max(0, sceneLimit - used)
    if (remaining <= 0) {
      return {
        canUse: false,
        reason: `${frequency} move has been used ${used}/${sceneLimit} times this scene`,
        remainingSceneUses: 0
      }
    }
    // Scene x2/x3: enforce EOT between uses (Scene x1 is implicitly safe — only 1 use total)
    if (sceneLimit > 1) {
      const lastUsed = move.lastTurnUsed ?? 0
      if (lastUsed > 0 && currentRound <= lastUsed + 1) {
        return {
          canUse: false,
          reason: `${frequency} move was used on round ${lastUsed}, must wait until round ${lastUsed + 2} (EOT restriction)`,
          remainingSceneUses: remaining
        }
      }
    }
    return { canUse: true, remainingSceneUses: remaining }
  }

  // Daily-frequency moves: check daily usage limit
  // PTU p.337: Daily x2/x3 moves can still only be used once per scene
  const dailyLimit = getDailyLimit(frequency)
  if (dailyLimit !== null) {
    const used = move.usedToday ?? 0
    const remaining = Math.max(0, dailyLimit - used)
    if (remaining <= 0) {
      return {
        canUse: false,
        reason: `${frequency} move has been used ${used}/${dailyLimit} times today`,
        remainingDailyUses: 0
      }
    }
    // Daily x2/x3: enforce 1-use-per-scene cap (Daily x1 is implicitly safe — only 1 use total)
    if (dailyLimit > 1) {
      const usedScene = move.usedThisScene ?? 0
      if (usedScene >= 1) {
        return {
          canUse: false,
          reason: `${frequency} move already used this scene (1 use per scene limit)`,
          remainingDailyUses: remaining
        }
      }
    }
    return { canUse: true, remainingDailyUses: remaining }
  }

  // Unknown frequency — allow by default
  return { canUse: true }
}

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Create an updated move with incremented usage tracking.
 * Returns a new move object (no mutation).
 *
 * @param move - The move that was used
 * @param currentRound - The current combat round
 * @returns New move object with updated usage counters
 */
export function incrementMoveUsage(move: Move, currentRound: number): Move {
  const frequency = move.frequency
  const updates: Partial<Move> = {}

  // Track EOT: record the round it was used
  if (isEotFrequency(frequency)) {
    updates.lastTurnUsed = currentRound
  }

  // Track scene-frequency usage + EOT round tracking for Scene x2/x3
  if (isSceneFrequency(frequency)) {
    updates.usedThisScene = (move.usedThisScene ?? 0) + 1
    const sceneLimit = getSceneLimit(frequency)
    if (sceneLimit !== null && sceneLimit > 1) {
      updates.lastTurnUsed = currentRound
    }
  }

  // Track daily-frequency usage
  // Note: usedThisScene is read by checkMoveFrequency for the Daily x2/x3
  // per-scene cap (PTU p.337: Daily x2/x3 can only be used once per scene)
  if (isDailyFrequency(frequency)) {
    updates.usedToday = (move.usedToday ?? 0) + 1
    updates.usedThisScene = (move.usedThisScene ?? 0) + 1
    updates.lastUsedAt = new Date().toISOString()
  }

  // No tracking needed for At-Will or Static
  if (Object.keys(updates).length === 0) {
    return move
  }

  return { ...move, ...updates }
}

/**
 * Reset scene-frequency usage on all moves in a list.
 * Returns a new array (no mutation).
 */
export function resetSceneUsage(moves: Move[]): Move[] {
  return moves.map(move => {
    const needsReset = (move.usedThisScene ?? 0) > 0 || (move.lastTurnUsed ?? 0) > 0
    if (!needsReset) {
      return move
    }
    return {
      ...move,
      usedThisScene: 0,
      lastTurnUsed: 0
    }
  })
}

/**
 * Reset daily move usage counters on all moves in a list.
 * Used by new-day endpoints to clear yesterday's usage.
 * Returns a new array (no mutation).
 */
export function resetDailyUsage(moves: Move[]): Move[] {
  return moves.map(move => {
    const needsReset = (move.usedToday ?? 0) > 0 || move.lastUsedAt !== undefined
    if (!needsReset) {
      return move
    }
    return {
      ...move,
      usedToday: 0,
      lastUsedAt: undefined
    }
  })
}
