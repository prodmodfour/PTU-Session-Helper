import { prisma } from '~/server/utils/prisma'
import { calculateMaxAp } from '~/utils/restHealing'
import { resetDailyUsage } from '~/utils/moveFrequency'

export default defineEventHandler(async () => {
  try {
    const now = new Date()

    // Reset all Pokemon daily counters (scalar fields via bulk update)
    const pokemonResult = await prisma.pokemon.updateMany({
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        lastRestReset: now
      }
    })

    // Reset daily move usage counters inside each Pokemon's moves JSON
    // updateMany cannot touch JSON columns, so iterate individually
    const allPokemon = await prisma.pokemon.findMany({
      select: { id: true, moves: true }
    })

    let pokemonMovesReset = 0
    for (const pokemon of allPokemon) {
      const moves = JSON.parse(pokemon.moves || '[]')
      const resetMoves = resetDailyUsage(moves)

      // Only write back if something actually changed
      if (JSON.stringify(moves) !== JSON.stringify(resetMoves)) {
        await prisma.pokemon.update({
          where: { id: pokemon.id },
          data: { moves: JSON.stringify(resetMoves) }
        })
        pokemonMovesReset++
      }
    }

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
      message: 'New day! All daily healing counters and move usage have been reset.',
      data: {
        pokemonReset: pokemonResult.count,
        pokemonMovesReset,
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
