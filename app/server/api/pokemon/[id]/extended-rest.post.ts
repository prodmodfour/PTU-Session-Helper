import { prisma } from '~/server/utils/prisma'
import {
  calculateRestHealing,
  shouldResetDailyCounters,
  clearPersistentStatusConditions,
  getStatusesToClear
} from '~/utils/restHealing'

/**
 * Apply extended rest (4+ hours) to a Pokemon
 * - Heals HP for 8 rest periods (4 hours of 30-min rests)
 * - Clears all persistent status conditions
 * - Restores daily-frequency moves
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

  // Calculate HP healing (8 rest periods = 4 hours)
  let totalHpHealed = 0
  let currentHp = pokemon.currentHp
  let currentRestMinutes = restMinutesToday

  // Apply up to 8 rest periods (240 minutes / 4 hours)
  for (let i = 0; i < 8; i++) {
    const result = calculateRestHealing({
      currentHp,
      maxHp: pokemon.maxHp,
      injuries: pokemon.injuries,
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
  const statusConditions: string[] = JSON.parse(pokemon.statusConditions || '[]')
  const clearedStatuses = getStatusesToClear(statusConditions)
  const newStatusConditions = clearPersistentStatusConditions(statusConditions)

  // Reset daily move usage
  const moves = JSON.parse(pokemon.moves || '[]')
  const restoredMoves: string[] = []

  for (const move of moves) {
    if (move.usedToday && move.usedToday > 0) {
      restoredMoves.push(move.name)
      move.usedToday = 0
    }
    // Also reset scene usage if frequency is daily
    if (move.frequency?.startsWith('Daily') && move.usedThisScene) {
      move.usedThisScene = 0
    }
  }

  const updated = await prisma.pokemon.update({
    where: { id },
    data: {
      currentHp,
      restMinutesToday: currentRestMinutes,
      injuriesHealedToday,
      lastRestReset: new Date(),
      statusConditions: JSON.stringify(newStatusConditions),
      moves: JSON.stringify(moves)
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
      restoredMoves,
      restMinutesToday: currentRestMinutes,
      restMinutesRemaining: Math.max(0, 480 - currentRestMinutes)
    }
  }
})
