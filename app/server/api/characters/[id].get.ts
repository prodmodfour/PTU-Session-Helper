import { prisma } from '~/server/utils/prisma'

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
      where: { id },
      include: { pokemon: true }
    })

    if (!character) {
      throw createError({
        statusCode: 404,
        message: 'Character not found'
      })
    }

    const parsed = {
      id: character.id,
      name: character.name,
      characterType: character.characterType,
      level: character.level,
      stats: {
        hp: character.hp,
        attack: character.attack,
        defense: character.defense,
        specialAttack: character.specialAttack,
        specialDefense: character.specialDefense,
        speed: character.speed
      },
      currentHp: character.currentHp,
      maxHp: character.hp,
      trainerClasses: JSON.parse(character.trainerClasses),
      skills: JSON.parse(character.skills),
      inventory: JSON.parse(character.inventory),
      money: character.money,
      statusConditions: JSON.parse(character.statusConditions),
      stageModifiers: JSON.parse(character.stageModifiers),
      avatarUrl: character.avatarUrl,
      isInLibrary: character.isInLibrary,
      notes: character.notes,
      pokemonIds: character.pokemon.map(p => p.id)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch character'
    })
  }
})
