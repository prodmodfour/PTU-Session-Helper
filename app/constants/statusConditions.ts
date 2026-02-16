/**
 * PTU 1.05 Status Condition Categories
 * Extracted for reuse across components
 */
import type { StatusCondition } from '~/types'

export const PERSISTENT_CONDITIONS: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned'
]

export const VOLATILE_CONDITIONS: StatusCondition[] = [
  'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed', 'Disabled', 'Encored', 'Taunted', 'Tormented',
  'Enraged', 'Suppressed'
]

export const OTHER_CONDITIONS: StatusCondition[] = [
  'Fainted', 'Stuck', 'Slowed', 'Trapped', 'Tripped', 'Vulnerable'
]

export const ALL_STATUS_CONDITIONS: StatusCondition[] = [
  ...PERSISTENT_CONDITIONS,
  ...VOLATILE_CONDITIONS,
  ...OTHER_CONDITIONS
]

/**
 * Get CSS class for a status condition
 */
export function getConditionClass(condition: StatusCondition): string {
  const classMap: Record<string, string> = {
    'Burned': 'condition--burn',
    'Frozen': 'condition--freeze',
    'Paralyzed': 'condition--paralysis',
    'Poisoned': 'condition--poison',
    'Badly Poisoned': 'condition--poison',
    'Asleep': 'condition--sleep',
    'Confused': 'condition--confusion',
    'Fainted': 'condition--fainted',
    'Flinched': 'condition--flinch',
    'Infatuated': 'condition--infatuation'
  }
  return classMap[condition] || 'condition--default'
}
