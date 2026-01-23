import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string | undefined
  const limit = Math.min(parseInt(query.limit as string) || 100, 500)

  try {
    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive' as const
      }
    } : undefined

    const species = await prisma.speciesData.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type1: true,
        type2: true,
        baseHp: true,
        baseAttack: true,
        baseDefense: true,
        baseSpAtk: true,
        baseSpDef: true,
        baseSpeed: true,
        abilities: true,
        evolutionStage: true
      }
    })

    const parsed = species.map(s => ({
      id: s.id,
      name: s.name,
      types: [s.type1, s.type2].filter(Boolean) as string[],
      baseStats: {
        hp: s.baseHp,
        attack: s.baseAttack,
        defense: s.baseDefense,
        spAtk: s.baseSpAtk,
        spDef: s.baseSpDef,
        speed: s.baseSpeed
      },
      abilities: JSON.parse(s.abilities || '[]'),
      evolutionStage: s.evolutionStage
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch species'
    })
  }
})
