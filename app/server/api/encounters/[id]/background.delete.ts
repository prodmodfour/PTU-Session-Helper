import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Verify encounter exists
  const encounter = await prisma.encounter.findUnique({
    where: { id }
  })

  if (!encounter) {
    throw createError({
      statusCode: 404,
      message: 'Encounter not found'
    })
  }

  // Remove background image
  await prisma.encounter.update({
    where: { id },
    data: {
      gridBackground: null
    }
  })

  return {
    success: true,
    data: {
      background: null
    }
  }
})
