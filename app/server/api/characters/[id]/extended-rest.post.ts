import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters,
  clearPersistentStatusConditions,
  getStatusesToClear,
  calculateMaxAp
} from '~/utils/restHealing'

/**
 * Apply extended rest (4+ hours) to a human character
 * - Heals HP for 8 rest periods (4 hours of 30-min rests)
 * - Clears all persistent status conditions
 * - Restores drained AP
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  const character = await prisma.humanCharacter.findUnique({
    where: { id }
  })

  if (!character) {
    throw createError({
      statusCode: 404,
      message: 'Character not found'
    })
  }

  // Reset daily counters if new day
  let restMinutesToday = character.restMinutesToday
  let injuriesHealedToday = character.injuriesHealedToday

  if (shouldResetDailyCounters(character.lastRestReset)) {
    restMinutesToday = 0
    injuriesHealedToday = 0
  }

  // Calculate HP healing (8 rest periods = 4 hours)
  let totalHpHealed = 0
  let currentHp = character.currentHp
  let currentRestMinutes = restMinutesToday

  // Apply up to 8 rest periods (240 minutes / 4 hours)
  for (let i = 0; i < 8; i++) {
    const result = calculateRestHealing({
      currentHp,
      maxHp: character.maxHp,
      injuries: character.injuries,
      restMinutesToday: currentRestMinutes
    })

    if (result.canHeal) {
      totalHpHealed += result.hpHealed
      currentHp += result.hpHealed
      currentRestMinutes += 30
    } else {
      break // Stop if can't heal anymore
    }
  }

  // Clear persistent status conditions
  const statusConditions: string[] = JSON.parse(character.statusConditions || '[]')
  const clearedStatuses = getStatusesToClear(statusConditions)
  const newStatusConditions = clearPersistentStatusConditions(statusConditions)

  // Restore drained AP and clear bound AP, set currentAp to full max
  const apRestored = character.drainedAp
  const boundApCleared = character.boundAp
  const maxAp = calculateMaxAp(character.level)

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      currentHp,
      restMinutesToday: currentRestMinutes,
      injuriesHealedToday,
      lastRestReset: new Date(),
      statusConditions: JSON.stringify(newStatusConditions),
      drainedAp: 0, // Restore all drained AP
      boundAp: 0, // Clear all bound AP (binding effects end)
      currentAp: maxAp // Full AP pool since drained and bound are now 0
    }
  })

  return {
    success: true,
    message: 'Extended rest complete.',
    data: {
      hpHealed: totalHpHealed,
      newHp: updated.currentHp,
      maxHp: updated.maxHp,
      clearedStatuses,
      apRestored,
      boundApCleared,
      restMinutesToday: currentRestMinutes,
      restMinutesRemaining: Math.max(0, 480 - currentRestMinutes)
    }
  }
})
