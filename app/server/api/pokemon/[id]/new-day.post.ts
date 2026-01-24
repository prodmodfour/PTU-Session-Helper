import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    const pokemon = await prisma.pokemon.findUnique({
      where: { id }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    // Reset daily healing counters
    const updated = await prisma.pokemon.update({
      where: { id },
      data: {
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        lastRestReset: new Date()
      }
    })

    return {
      success: true,
      message: 'Daily healing counters reset',
      data: {
        restMinutesToday: updated.restMinutesToday,
        injuriesHealedToday: updated.injuriesHealedToday,
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
