import { prisma } from '~/server/utils/prisma'
import { calculateMaxAp } from '~/utils/restHealing'

export default defineEventHandler(async () => {
  try {
    const now = new Date()

    // Reset all Pokemon daily counters
    const pokemonResult = await prisma.pokemon.updateMany({
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        lastRestReset: now
      }
    })

    // Reset all Character daily counters (including drained and bound AP)
    // Need per-character updates since maxAp depends on level
    const characters = await prisma.humanCharacter.findMany({
      select: { id: true, level: true }
    })

    for (const char of characters) {
      const maxAp = calculateMaxAp(char.level)
      await prisma.humanCharacter.update({
        where: { id: char.id },
        data: {
          restMinutesToday: 0,
          injuriesHealedToday: 0,
          drainedAp: 0,
          boundAp: 0,
          currentAp: maxAp,
          lastRestReset: now
        }
      })
    }

    return {
      success: true,
      message: 'New day! All daily healing counters have been reset.',
      data: {
        pokemonReset: pokemonResult.count,
        charactersReset: characters.length,
        timestamp: now
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to advance day'
    })
  }
})
