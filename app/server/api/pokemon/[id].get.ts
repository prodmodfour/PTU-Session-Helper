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

    const parsed = {
      id: pokemon.id,
      species: pokemon.species,
      nickname: pokemon.nickname,
      level: pokemon.level,
      experience: pokemon.experience,
      nature: JSON.parse(pokemon.nature),
      types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1],
      baseStats: {
        hp: pokemon.baseHp,
        attack: pokemon.baseAttack,
        defense: pokemon.baseDefense,
        specialAttack: pokemon.baseSpAtk,
        specialDefense: pokemon.baseSpDef,
        speed: pokemon.baseSpeed
      },
      currentStats: {
        hp: pokemon.currentHp,
        attack: pokemon.currentAttack,
        defense: pokemon.currentDefense,
        specialAttack: pokemon.currentSpAtk,
        specialDefense: pokemon.currentSpDef,
        speed: pokemon.currentSpeed
      },
      currentHp: pokemon.currentHp,
      maxHp: pokemon.maxHp,
      stageModifiers: JSON.parse(pokemon.stageModifiers),
      abilities: JSON.parse(pokemon.abilities),
      moves: JSON.parse(pokemon.moves),
      heldItem: pokemon.heldItem,
      capabilities: JSON.parse(pokemon.capabilities),
      skills: JSON.parse(pokemon.skills),
      tutorPoints: pokemon.tutorPoints,
      trainingExp: pokemon.trainingExp,
      eggGroups: JSON.parse(pokemon.eggGroups),
      statusConditions: JSON.parse(pokemon.statusConditions),
      ownerId: pokemon.ownerId,
      spriteUrl: pokemon.spriteUrl,
      shiny: pokemon.shiny,
      gender: pokemon.gender,
      isInLibrary: pokemon.isInLibrary,
      notes: pokemon.notes
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch pokemon'
    })
  }
})
