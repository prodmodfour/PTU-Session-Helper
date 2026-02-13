import { prisma } from '~/server/utils/prisma'

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

    const parsed = pokemon.map(p => ({
      id: p.id,
      species: p.species,
      nickname: p.nickname,
      level: p.level,
      experience: p.experience,
      nature: JSON.parse(p.nature),
      types: p.type2 ? [p.type1, p.type2] : [p.type1],
      baseStats: {
        hp: p.baseHp,
        attack: p.baseAttack,
        defense: p.baseDefense,
        specialAttack: p.baseSpAtk,
        specialDefense: p.baseSpDef,
        speed: p.baseSpeed
      },
      currentStats: {
        hp: p.currentHp,
        attack: p.currentAttack,
        defense: p.currentDefense,
        specialAttack: p.currentSpAtk,
        specialDefense: p.currentSpDef,
        speed: p.currentSpeed
      },
      currentHp: p.currentHp,
      maxHp: p.maxHp,
      stageModifiers: JSON.parse(p.stageModifiers),
      abilities: JSON.parse(p.abilities),
      moves: JSON.parse(p.moves),
      heldItem: p.heldItem,
      statusConditions: JSON.parse(p.statusConditions),
      ownerId: p.ownerId,
      spriteUrl: p.spriteUrl,
      shiny: p.shiny,
      gender: p.gender,
      isInLibrary: p.isInLibrary,
      origin: p.origin,
      location: p.location,
      notes: p.notes
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch pokemon'
    })
  }
})
