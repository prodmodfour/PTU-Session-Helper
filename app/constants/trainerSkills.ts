import type { SkillRank } from '~/types/character'

/** All 17 PTU trainer skills organized by category (PTU Core p. 33) */
export const PTU_SKILL_CATEGORIES = {
  Body: ['Acrobatics', 'Athletics', 'Combat', 'Intimidate', 'Stealth', 'Survival'] as const,
  Mind: ['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed', 'Guile', 'Perception'] as const,
  Spirit: ['Charm', 'Command', 'Focus', 'Intuition'] as const
} as const

export const PTU_ALL_SKILLS = [
  ...PTU_SKILL_CATEGORIES.Body,
  ...PTU_SKILL_CATEGORIES.Mind,
  ...PTU_SKILL_CATEGORIES.Spirit
] as const

export type PtuSkillName = typeof PTU_ALL_SKILLS[number]

/** Skill rank progression and dice rolls (PTU Core p. 33) */
export const SKILL_RANKS: { rank: SkillRank; value: number; dice: string }[] = [
  { rank: 'Pathetic', value: 1, dice: '1d6' },
  { rank: 'Untrained', value: 2, dice: '2d6' },
  { rank: 'Novice', value: 3, dice: '3d6' },
  { rank: 'Adept', value: 4, dice: '4d6' },
  { rank: 'Expert', value: 5, dice: '5d6' },
  { rank: 'Master', value: 6, dice: '6d6' }
]

/** Level prerequisites for skill ranks (PTU Core p. 34) */
export const SKILL_RANK_LEVEL_REQS: Partial<Record<SkillRank, number>> = {
  Adept: 2,
  Expert: 6,
  Master: 12
}

/** Default skill ranks before background (all Untrained) */
export function getDefaultSkills(): Record<PtuSkillName, SkillRank> {
  return Object.fromEntries(
    PTU_ALL_SKILLS.map(skill => [skill, 'Untrained' as SkillRank])
  ) as Record<PtuSkillName, SkillRank>
}
