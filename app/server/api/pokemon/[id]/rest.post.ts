import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters
} from '~/utils/restHealing'

/**
 * Apply 30 minutes of rest to a Pokemon
 * - Heals 1/16th max HP
 * - Cannot heal if 5+ injuries
 * - Max 8 hours (480 min) of rest healing per day
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  const pokemon = await prisma.pokemon.findUnique({
    where: { id }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // Reset daily counters if new day
  let restMinutesToday = pokemon.restMinutesToday
  let injuriesHealedToday = pokemon.injuriesHealedToday

  if (shouldResetDailyCounters(pokemon.lastRestReset)) {
    restMinutesToday = 0
    injuriesHealedToday = 0
  }

  // Calculate healing
  const result = calculateRestHealing({
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    injuries: pokemon.injuries,
    restMinutesToday
  })

  if (!result.canHeal) {
    return {
      success: false,
      message: result.reason,
      data: {
        hpHealed: 0,
        newHp: pokemon.currentHp,
        restMinutesToday,
        restMinutesRemaining: Math.max(0, 480 - restMinutesToday)
      }
    }
  }

  // Apply healing
  const newHp = pokemon.currentHp + result.hpHealed
  const newRestMinutes = restMinutesToday + 30

  const updated = await prisma.pokemon.update({
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
