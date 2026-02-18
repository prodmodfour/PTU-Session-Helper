import { prisma } from '~/server/utils/prisma'
import {
  canHealInjuryNaturally,
  shouldResetDailyCounters
} from '~/utils/restHealing'

/**
 * Heal one injury naturally (24 hours since last injury)
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

  if (pokemon.injuries <= 0) {
    return {
      success: false,
      message: 'No injuries to heal',
      data: { injuries: 0 }
    }
  }

  // Check if 24 hours have passed since last injury
  if (!canHealInjuryNaturally(pokemon.lastInjuryTime)) {
    const hoursSince = pokemon.lastInjuryTime
      ? Math.floor((new Date().getTime() - new Date(pokemon.lastInjuryTime).getTime()) / (1000 * 60 * 60))
      : 0
    const hoursRemaining = 24 - hoursSince

    return {
      success: false,
      message: `Cannot heal naturally yet. ${hoursRemaining} hours remaining.`,
      data: {
        injuries: pokemon.injuries,
        hoursSinceLastInjury: hoursSince,
        hoursRemaining
      }
    }
  }

  // Check daily injury healing limit
  let injuriesHealedToday = pokemon.injuriesHealedToday
  if (shouldResetDailyCounters(pokemon.lastRestReset)) {
    injuriesHealedToday = 0
  }

  if (injuriesHealedToday >= 3) {
    return {
      success: false,
      message: 'Daily injury healing limit reached (3/day)',
      data: {
        injuries: pokemon.injuries,
        injuriesHealedToday
      }
    }
  }

  const newInjuries = pokemon.injuries - 1

  const updated = await prisma.pokemon.update({
    where: { id },
    data: {
      injuries: newInjuries,
      injuriesHealedToday: injuriesHealedToday + 1,
      lastRestReset: new Date(),
      // Only clear timer when all injuries gone — healing is not gaining an injury
      ...(newInjuries === 0 ? { lastInjuryTime: null } : {})
    }
  })

  return {
    success: true,
    message: 'Healed 1 injury naturally.',
    data: {
      injuriesHealed: 1,
      injuries: updated.injuries,
      injuriesHealedToday: injuriesHealedToday + 1
    }
  }
})
