import { prisma } from '~/server/utils/prisma'

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

    // Reset all Character daily counters (including drained AP)
    const characterResult = await prisma.humanCharacter.updateMany({
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        drainedAp: 0,
        lastRestReset: now
      }
    })

    return {
      success: true,
      message: 'New day! All daily healing counters have been reset.',
      data: {
        pokemonReset: pokemonResult.count,
        charactersReset: characterResult.count,
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
