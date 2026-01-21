import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  const { trainerId } = body

  if (!trainerId) {
    throw createError({
      statusCode: 400,
      message: 'Trainer ID is required'
    })
  }

  // Verify trainer exists
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: trainerId }
  })

  if (!trainer) {
    throw createError({
      statusCode: 404,
      message: 'Trainer not found'
    })
  }

  // Update Pokemon with owner
  const pokemon = await prisma.pokemon.update({
    where: { id },
    data: { ownerId: trainerId }
  })

  // Parse JSON fields
  const parsedPokemon = {
    ...pokemon,
    nature: JSON.parse(pokemon.nature || '{}'),
    stageModifiers: JSON.parse(pokemon.stageModifiers || '{}'),
    abilities: JSON.parse(pokemon.abilities || '[]'),
    moves: JSON.parse(pokemon.moves || '[]'),
    statusConditions: JSON.parse(pokemon.statusConditions || '[]'),
    types: [pokemon.type1, pokemon.type2].filter(Boolean),
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
    }
  }

  return { data: parsedPokemon }
})
