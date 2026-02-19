import { prisma } from '~/server/utils/prisma'
import { serializeCharacterSummary } from '~/server/utils/serializers'

export default defineEventHandler(async () => {
  try {
    const characters = await prisma.humanCharacter.findMany({
      where: { isInLibrary: true },
      orderBy: { name: 'asc' },
      include: {
        pokemon: {
          select: {
            id: true,
            species: true,
            nickname: true
          }
        }
      }
    })

    const parsed = characters.map(serializeCharacterSummary)

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch characters'
    })
  }
})
