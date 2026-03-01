/**
 * POST /api/moves/batch
 *
 * Fetch multiple move details by name from MoveData.
 *
 * Body: { names: string[] }
 * Returns: { success: true, data: MoveData[] }
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.names || !Array.isArray(body.names)) {
    throw createError({
      statusCode: 400,
      message: 'Body must contain a names array'
    })
  }

  if (body.names.length === 0) {
    return { success: true, data: [] }
  }

  if (body.names.length > 50) {
    throw createError({
      statusCode: 400,
      message: 'Maximum 50 move names per batch request'
    })
  }

  // Validate all entries are strings
  const names = body.names.filter((n: unknown) => typeof n === 'string') as string[]

  try {
    const moves = await prisma.moveData.findMany({
      where: { name: { in: names } }
    })

    return { success: true, data: moves }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch moves'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
