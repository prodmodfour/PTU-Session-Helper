import { prisma } from '~/server/utils/prisma'
import {
  shouldResetDailyCounters,
  calculatePokemonCenterTime,
  calculatePokemonCenterInjuryHealing
} from '~/utils/restHealing'

/**
 * Apply Pokemon Center healing to a human character
 * - Full HP restoration
 * - All status conditions cleared
 * - Injuries healed (max 3/day total)
 * - Drained AP restored
 * - Time: 1 hour base + 30min/injury (or 1hr/injury if 5+)
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
  let injuriesHealedToday = character.injuriesHealedToday

  if (shouldResetDailyCounters(character.lastRestReset)) {
    injuriesHealedToday = 0
  }

  // Calculate healing time
  const timeResult = calculatePokemonCenterTime(character.injuries)

  // Calculate injury healing
  const injuryResult = calculatePokemonCenterInjuryHealing({
    injuries: character.injuries,
    injuriesHealedToday
  })

  // Heal HP to full
  const hpHealed = character.maxHp - character.currentHp

  // Clear ALL status conditions
  const statusConditions: string[] = JSON.parse(character.statusConditions || '[]')
  const clearedStatuses = [...statusConditions]

  // Restore drained AP
  const apRestored = character.drainedAp

  // Calculate new injury count and daily healed count
  const newInjuries = character.injuries - injuryResult.injuriesHealed
  const newInjuriesHealedToday = injuriesHealedToday + injuryResult.injuriesHealed

  const updated = await prisma.humanCharacter.update({
    where: { id },
    data: {
      currentHp: character.maxHp,
      injuries: newInjuries,
      injuriesHealedToday: newInjuriesHealedToday,
      lastRestReset: new Date(),
      restMinutesToday: 480, // Max out rest for the day
      statusConditions: JSON.stringify([]),
      drainedAp: 0,
      // Clear last injury time if all injuries healed
      lastInjuryTime: newInjuries > 0 ? character.lastInjuryTime : null
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
      apRestored,
      healingTime: timeResult.totalTime,
      healingTimeDescription: timeResult.timeDescription,
      atDailyInjuryLimit: injuryResult.atDailyLimit,
      injuriesHealedToday: newInjuriesHealedToday
    }
  }
})
