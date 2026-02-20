import { prisma } from '~/server/utils/prisma'
import { calculateMaxAp } from '~/utils/restHealing'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const character = await prisma.humanCharacter.findUnique({
      where: { id }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    // Reset daily healing counters (including drained and bound AP for trainers)
    // New day clears drained AP and bound AP, so currentAp goes back to full maxAp
    const maxAp = calculateMaxAp(character.level)
    const updated = await prisma.humanCharacter.update({
      where: { id },
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        drainedAp: 0,
        boundAp: 0,
        currentAp: maxAp,
        lastRestReset: new Date()
      }
    })

    return {
      success: true,
      message: 'Daily healing counters reset',
      data: {
        restMinutesToday: updated.restMinutesToday,
        injuriesHealedToday: updated.injuriesHealedToday,
        drainedAp: updated.drainedAp,
        boundAp: updated.boundAp,
        currentAp: updated.currentAp,
        lastRestReset: updated.lastRestReset
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to reset daily counters'
    })
  }
})
