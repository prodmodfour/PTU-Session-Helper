/**
 * PTU 1.05 Pokemon Level-Up Checker
 *
 * Provides information about what happens at each level-up:
 * - +1 stat point (always, per Base Relations rule)
 * - New moves available from learnset
 * - Ability milestones (Level 20: 2nd ability, Level 40: 3rd ability)
 * - Tutor Point gains (Level 5, then every 5 levels)
 *
 * Reference: PTU Core Chapter 5 — Pokemon (pp. 201-202)
 *
 * Note: Evolution level detection and stat recalculation are not
 * automated here because evolution conditions vary (level, item,
 * trade, etc.) and the SpeciesData learnset doesn't encode evolution
 * triggers. The GM must manually check the Pokedex entry.
 */

export interface LearnsetEntry {
  level: number
  move: string
}

export interface LevelUpInfo {
  /** New level */
  newLevel: number
  /** Always 1 stat point per level */
  statPointsGained: number
  /** Moves newly available at this level from the learnset */
  newMoves: string[]
  /** Whether this level grants a new ability slot */
  abilityMilestone: 'second' | 'third' | null
  /** Message describing the ability milestone */
  abilityMessage: string | null
  /** Whether a tutor point is gained at this level */
  tutorPointGained: boolean
}

export interface LevelUpCheckInput {
  oldLevel: number
  newLevel: number
  learnset: LearnsetEntry[]
}

/**
 * Check what happens when a Pokemon levels from oldLevel to newLevel.
 * Returns an array of LevelUpInfo, one per level gained.
 * Pure function — no side effects.
 */
export function checkLevelUp(input: LevelUpCheckInput): LevelUpInfo[] {
  const { oldLevel, newLevel, learnset } = input

  if (newLevel <= oldLevel || oldLevel < 1) {
    return []
  }

  const results: LevelUpInfo[] = []

  for (let level = oldLevel + 1; level <= Math.min(newLevel, 100); level++) {
    // Moves available at exactly this level
    const newMoves = learnset
      .filter(entry => entry.level === level)
      .map(entry => entry.move)

    // Ability milestones: Level 20 = 2nd ability, Level 40 = 3rd ability
    let abilityMilestone: 'second' | 'third' | null = null
    let abilityMessage: string | null = null
    if (level === 20) {
      abilityMilestone = 'second'
      abilityMessage = 'This Pokemon can now gain a Second Ability (Basic or Advanced).'
    } else if (level === 40) {
      abilityMilestone = 'third'
      abilityMessage = 'This Pokemon can now gain a Third Ability (any category).'
    }

    // Tutor Points: gained at Level 5 and every 5 levels thereafter
    const tutorPointGained = level >= 5 && level % 5 === 0

    results.push({
      newLevel: level,
      statPointsGained: 1,
      newMoves,
      abilityMilestone,
      abilityMessage,
      tutorPointGained
    })
  }

  return results
}

/**
 * Summarize all level-up info into a single combined result.
 * Useful for displaying a single notification when multiple levels are gained at once.
 */
export function summarizeLevelUps(infos: LevelUpInfo[]): {
  totalStatPoints: number
  allNewMoves: string[]
  abilityMilestones: Array<{ level: number; type: 'second' | 'third'; message: string }>
  totalTutorPoints: number
} {
  const totalStatPoints = infos.length // 1 per level
  const allNewMoves = infos.flatMap(info => info.newMoves)
  const abilityMilestones = infos
    .filter(info => info.abilityMilestone !== null)
    .map(info => ({
      level: info.newLevel,
      type: info.abilityMilestone!,
      message: info.abilityMessage!
    }))
  const totalTutorPoints = infos.filter(info => info.tutorPointGained).length

  return {
    totalStatPoints,
    allNewMoves,
    abilityMilestones,
    totalTutorPoints
  }
}
