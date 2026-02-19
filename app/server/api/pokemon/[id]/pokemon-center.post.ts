import { prisma } from '~/server/utils/prisma'
import {
  shouldResetDailyCounters,
  calculatePokemonCenterTime,
  calculatePokemonCenterInjuryHealing
} from '~/utils/restHealing'

/**
 * Apply Pokemon Center healing
 * - Full HP restoration
 * - All status conditions cleared
 * - Daily moves restored
 * - Injuries healed (max 3/day total)
 * - Time: 1 hour base + 30min/injury (or 1hr/injury if 5+)
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
  let injuriesHealedToday = pokemon.injuriesHealedToday

  if (shouldResetDailyCounters(pokemon.lastRestReset)) {
    injuriesHealedToday = 0
  }

  // Calculate healing time
  const timeResult = calculatePokemonCenterTime(pokemon.injuries)

  // Calculate injury healing
  const injuryResult = calculatePokemonCenterInjuryHealing({
    injuries: pokemon.injuries,
    injuriesHealedToday
  })

  // Heal HP to full
  const hpHealed = pokemon.maxHp - pokemon.currentHp

  // Clear ALL status conditions (not just persistent)
  const statusConditions: string[] = JSON.parse(pokemon.statusConditions || '[]')
  const clearedStatuses = [...statusConditions]

  // Reset all move usage
  const moves = JSON.parse(pokemon.moves || '[]')
  const restoredMoves: string[] = []

  for (const move of moves) {
    if (move.usedToday && move.usedToday > 0) {
      restoredMoves.push(move.name)
      move.usedToday = 0
    }
    if (move.usedThisScene && move.usedThisScene > 0) {
      move.usedThisScene = 0
    }
  }

  // Calculate new injury count and daily healed count
  const newInjuries = pokemon.injuries - injuryResult.injuriesHealed
  const newInjuriesHealedToday = injuriesHealedToday + injuryResult.injuriesHealed

  const updated = await prisma.pokemon.update({
    where: { id },
    data: {
      currentHp: pokemon.maxHp,
      injuries: newInjuries,
      injuriesHealedToday: newInjuriesHealedToday,
      lastRestReset: new Date(),
      statusConditions: JSON.stringify([]),
      moves: JSON.stringify(moves),
      // Clear last injury time if all injuries healed
      lastInjuryTime: newInjuries > 0 ? pokemon.lastInjuryTime : null
    }
  })

  return {
    success: true,
    message: `Pokemon Center healing complete (${timeResult.timeDescription}).`,
    data: {
      hpHealed,
      newHp: updated.currentHp,
      maxHp: updated.maxHp,
      injuriesHealed: injuryResult.injuriesHealed,
      injuriesRemaining: newInjuries,
      clearedStatuses,
      restoredMoves,
      healingTime: timeResult.totalTime,
      healingTimeDescription: timeResult.timeDescription,
      atDailyInjuryLimit: injuryResult.atDailyLimit,
      injuriesHealedToday: newInjuriesHealedToday
    }
  }
})
