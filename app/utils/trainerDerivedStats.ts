/**
 * PTU 1.05 Trainer Derived Stats Calculator
 *
 * Computes trainer capabilities from skill ranks and weight.
 * Reference: PTU Core Chapter 2 — Character Creation (pp. 15-17)
 *
 * Formulas:
 * - Power = 4 base. +1 if Athletics >= Novice. +1 if Combat >= Adept.
 * - High Jump = 0 base. +1 if Acrobatics >= Adept. +1 more if Acrobatics >= Master.
 * - Long Jump = floor(Acrobatics rank / 2)
 * - Overland = 3 + floor((Athletics rank + Acrobatics rank) / 2)
 * - Swimming = floor(Overland / 2)
 * - Throwing Range = 4 + Athletics rank
 * - Weight Class = 3 (55-110 lbs), 4 (111-220 lbs), 5 (>220 lbs)
 *
 * Skill Ranks: Pathetic=1, Untrained=2, Novice=3, Adept=4, Expert=5, Master=6
 */

import type { SkillRank } from '~/types/character'

export interface TrainerDerivedStats {
  power: number
  highJump: number
  longJump: number
  overland: number
  swimming: number
  throwingRange: number
  weightClass: number | null // null if weight not set
}

export interface TrainerDerivedStatsInput {
  skills: Record<string, SkillRank>
  weightKg?: number | null // weight in kg (as stored in DB)
}

/** Map skill rank names to their numeric rank values (PTU Core p.34) */
const SKILL_RANK_VALUES: Record<SkillRank, number> = {
  Pathetic: 1,
  Untrained: 2,
  Novice: 3,
  Adept: 4,
  Expert: 5,
  Master: 6
}

/** Convert a SkillRank to its numeric value. Returns 2 (Untrained) for unknown ranks. */
export function skillRankToNumber(rank: SkillRank | undefined): number {
  if (!rank || !SKILL_RANK_VALUES[rank]) {
    return SKILL_RANK_VALUES.Untrained
  }
  return SKILL_RANK_VALUES[rank]
}

/** Convert kg to lbs (DB stores weight in kg, PTU uses lbs) */
function kgToLbs(kg: number): number {
  return kg * 2.20462
}

/**
 * Derive trainer Weight Class from weight in pounds.
 * PTU Core p.16: 55-110 lbs = WC 3, 111-220 lbs = WC 4, >220 lbs = WC 5
 * Trainers under 55 lbs are not specified; we default to WC 3.
 */
export function computeWeightClass(weightLbs: number): number {
  if (weightLbs > 220) return 5
  if (weightLbs >= 111) return 4
  return 3
}

/**
 * Compute all derived trainer stats from skills and weight.
 * Pure function — no side effects, no mutation.
 */
export function computeTrainerDerivedStats(input: TrainerDerivedStatsInput): TrainerDerivedStats {
  const { skills, weightKg } = input

  const athleticsRank = skillRankToNumber(skills.Athletics)
  const acrobaticsRank = skillRankToNumber(skills.Acrobatics)
  const combatRank = skillRankToNumber(skills.Combat)

  // Power = 4 base. +1 if Athletics >= Novice (rank 3). +1 if Combat >= Adept (rank 4).
  let power = 4
  if (athleticsRank >= SKILL_RANK_VALUES.Novice) {
    power += 1
  }
  if (combatRank >= SKILL_RANK_VALUES.Adept) {
    power += 1
  }

  // High Jump = 0 base. +1 if Acrobatics >= Adept (rank 4). +1 more if Acrobatics >= Master (rank 6).
  let highJump = 0
  if (acrobaticsRank >= SKILL_RANK_VALUES.Adept) {
    highJump += 1
  }
  if (acrobaticsRank >= SKILL_RANK_VALUES.Master) {
    highJump += 1
  }

  // Long Jump = floor(Acrobatics rank / 2)
  const longJump = Math.floor(acrobaticsRank / 2)

  // Overland = 3 + floor((Athletics rank + Acrobatics rank) / 2)
  const overland = 3 + Math.floor((athleticsRank + acrobaticsRank) / 2)

  // Swimming = floor(Overland / 2)
  const swimming = Math.floor(overland / 2)

  // Throwing Range = 4 + Athletics rank
  const throwingRange = 4 + athleticsRank

  // Weight Class from weight in lbs (convert from kg)
  const weightClass = weightKg != null ? computeWeightClass(kgToLbs(weightKg)) : null

  return {
    power,
    highJump,
    longJump,
    overland,
    swimming,
    throwingRange,
    weightClass
  }
}
