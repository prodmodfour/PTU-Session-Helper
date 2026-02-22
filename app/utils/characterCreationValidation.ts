/**
 * Pure validation functions for PTU character creation rules.
 * Returns warning arrays, not errors -- the GM always has final say.
 *
 * Reference: PTU Core Chapter 2 (pp. 12-18)
 */

import {
  TOTAL_STAT_POINTS,
  MAX_POINTS_PER_STAT,
  getStatPointsForLevel,
  getMaxSkillRankForLevel,
  isSkillRankAboveCap,
  getExpectedEdgesForLevel,
  getExpectedFeaturesForLevel
} from '~/constants/trainerStats'

export interface CreationWarning {
  section: 'stats' | 'skills' | 'edges' | 'features' | 'classes'
  message: string
  severity: 'info' | 'warning'
}

/**
 * Validate stat point allocation against PTU rules.
 *
 * PTU Core p. 15, 19:
 * - Level 1: 10 points to distribute, max 5 per stat
 * - Each level grants +1 stat point (no per-stat cap beyond level 1)
 */
export function validateStatAllocation(
  statPoints: Record<string, number>,
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const total = Object.values(statPoints).reduce((s, v) => s + v, 0)
  const expectedPoints = getStatPointsForLevel(level)

  if (total !== expectedPoints) {
    const levelLabel = level === 1
      ? `Level 1 trainers should allocate exactly ${expectedPoints} stat points`
      : `Level ${level} trainers have ${expectedPoints} stat points to distribute (${TOTAL_STAT_POINTS} base + ${level - 1} from leveling)`
    warnings.push({
      section: 'stats',
      message: `${levelLabel} (currently ${total})`,
      severity: 'warning'
    })
  }

  // Per-stat cap only applies at level 1 (PTU Core p. 15)
  if (level === 1) {
    for (const [stat, points] of Object.entries(statPoints)) {
      if (points > MAX_POINTS_PER_STAT) {
        warnings.push({
          section: 'stats',
          message: `${stat} has ${points} added points (max ${MAX_POINTS_PER_STAT} per stat at level 1)`,
          severity: 'warning'
        })
      }
    }
  }

  // Informational message about stat point budget for higher-level characters
  if (level > 1) {
    warnings.push({
      section: 'stats',
      message: `Level ${level} trainer: ${expectedPoints} base stat points available. Milestone bonuses (Atk/SpAtk points from Amateur/Capable/Veteran/Elite/Champion) are not included -- add them manually if applicable.`,
      severity: 'info'
    })
  }

  return warnings
}

/**
 * Validate skill background allocation against PTU rules.
 *
 * PTU Core p. 14:
 * - Exactly 1 Adept, 1 Novice, 3 Pathetic
 * - Remaining skills stay Untrained
 *
 * When Skill Edges are present, rank counts may differ from the
 * background baseline. In that case, warnings are downgraded to
 * informational severity with clarifying text.
 */
export function validateSkillBackground(
  skills: Record<string, string>,
  level: number,
  edges: string[] = []
): CreationWarning[] {
  const warnings: CreationWarning[] = []
  const ranks = Object.values(skills)
  const adeptCount = ranks.filter(r => r === 'Adept').length
  const noviceCount = ranks.filter(r => r === 'Novice').length
  const patheticCount = ranks.filter(r => r === 'Pathetic').length
  const hasSkillEdges = edges.some(e => e.startsWith('Skill Edge:'))
  const skillEdgeSuffix = hasSkillEdges ? ', including Skill Edge modifications' : ''
  const severity = hasSkillEdges ? 'info' as const : 'warning' as const

  // Background baseline validation (always applies regardless of level)
  if (adeptCount !== 1) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 1 skill to Adept (found ${adeptCount}${skillEdgeSuffix})`,
      severity
    })
  }
  if (noviceCount !== 1) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 1 skill to Novice (found ${noviceCount}${skillEdgeSuffix})`,
      severity
    })
  }
  if (patheticCount !== 3) {
    warnings.push({
      section: 'skills',
      message: `Background should set exactly 3 skills to Pathetic (found ${patheticCount}${skillEdgeSuffix})`,
      severity
    })
  }

  // Skill rank cap validation based on level
  const maxRank = getMaxSkillRankForLevel(level)
  const overCapSkills: string[] = []
  for (const [skill, rank] of Object.entries(skills)) {
    if (isSkillRankAboveCap(rank, level)) {
      overCapSkills.push(`${skill} (${rank})`)
    }
  }

  if (overCapSkills.length > 0) {
    warnings.push({
      section: 'skills',
      message: `Skills exceed rank cap for level ${level} (max ${maxRank}): ${overCapSkills.join(', ')}`,
      severity: 'warning'
    })
  }

  // Informational: show skill rank cap at the current level
  if (level > 1) {
    warnings.push({
      section: 'skills',
      message: `Level ${level} skill rank cap: ${maxRank}. Bonus Skill Edges from milestones: ${level >= 2 ? 'Lv2' : ''}${level >= 6 ? ', Lv6' : ''}${level >= 12 ? ', Lv12' : ''} (cannot raise to the newly unlocked rank).`,
      severity: 'info'
    })
  }

  return warnings
}

/**
 * Validate edges, features, and class counts against PTU starting rules.
 *
 * PTU Core p. 13-14:
 * - 4 starting edges
 * - 4 features + 1 Training Feature = 5 total
 * - Max 4 trainer classes
 */
export function validateEdgesAndFeatures(
  edges: string[],
  features: string[],
  trainerClasses: string[],
  level: number
): CreationWarning[] {
  const warnings: CreationWarning[] = []

  if (level === 1 && edges.length !== 4) {
    warnings.push({
      section: 'edges',
      message: `Level 1 trainers start with 4 edges (have ${edges.length})`,
      severity: 'warning'
    })
  }
  if (level === 1 && features.length !== 5) {
    warnings.push({
      section: 'features',
      message: `Level 1 trainers start with 5 features (4 + 1 Training) (have ${features.length})`,
      severity: 'warning'
    })
  }
  if (trainerClasses.length > 4) {
    warnings.push({
      section: 'classes',
      message: `Maximum 4 trainer classes (have ${trainerClasses.length})`,
      severity: 'warning'
    })
  }

  return warnings
}
