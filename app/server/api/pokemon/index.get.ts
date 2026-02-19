import { prisma } from '~/server/utils/prisma'
import { serializePokemon } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const origin = query.origin as string | undefined
    const includeArchived = query.includeArchived === 'true'

    // Build where clause: isInLibrary acts as archive flag
    const where: Record<string, unknown> = {}
    if (!includeArchived) {
      where.isInLibrary = true
    }
    if (origin && origin !== 'all') {
      where.origin = origin
    }

    const pokemon = await prisma.pokemon.findMany({
      where,
      orderBy: { species: 'asc' }
    })

    const parsed = pokemon.map(serializePokemon)

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch pokemon'
    })
  }
})
