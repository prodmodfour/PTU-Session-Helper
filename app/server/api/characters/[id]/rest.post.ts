import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters
} from '~/utils/restHealing'

/**
 * Apply 30 minutes of rest to a human character
 * - Heals 1/16th max HP
 * - Cannot heal if 5+ injuries
 * - Max 8 hours (480 min) of rest healing per day
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

  // Calculate healing
  const result = calculateRestHealing({
    currentHp: character.currentHp,
    maxHp: character.maxHp,
    injuries: character.injuries,
    restMinutesToday
  })

  if (!result.canHeal) {
    return {
      success: false,
      message: result.reason,
      data: {
        hpHealed: 0,
        newHp: character.currentHp,
        restMinutesToday,
        restMinutesRemaining: Math.max(0, 480 - restMinutesToday)
      }
    }
  }

  // Apply healing
  const newHp = character.currentHp + result.hpHealed
  const newRestMinutes = restMinutesToday + 30

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      currentHp: newHp,
      restMinutesToday: newRestMinutes,
      injuriesHealedToday,
      lastRestReset: new Date()
    }
  })

  return {
    success: true,
    message: `Rested for 30 minutes. Healed ${result.hpHealed} HP.`,
    data: {
      hpHealed: result.hpHealed,
      newHp: updated.currentHp,
      maxHp: updated.maxHp,
      restMinutesToday: newRestMinutes,
      restMinutesRemaining: Math.max(0, 480 - newRestMinutes)
    }
  }
})
