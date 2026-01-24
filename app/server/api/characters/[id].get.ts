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

    // Parse linked Pokemon
    const parsedPokemon = character.pokemon.map(p => ({
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
      abilities: JSON.parse(p.abilities),
      moves: JSON.parse(p.moves),
      heldItem: p.heldItem,
      capabilities: JSON.parse(p.capabilities),
      skills: JSON.parse(p.skills),
      tutorPoints: p.tutorPoints,
      trainingExp: p.trainingExp,
      eggGroups: JSON.parse(p.eggGroups),
      shiny: p.shiny,
      gender: p.gender,
      spriteUrl: p.spriteUrl
    }))

    const parsed = {
      id: character.id,
      name: character.name,
      characterType: character.characterType,
      // Player info
      playedBy: character.playedBy,
      age: character.age,
      gender: character.gender,
      height: character.height,
      weight: character.weight,
      // Stats
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
      // Classes, skills, features, edges
      trainerClasses: JSON.parse(character.trainerClasses),
      skills: JSON.parse(character.skills),
      features: JSON.parse(character.features),
      edges: JSON.parse(character.edges),
      // Inventory
      inventory: JSON.parse(character.inventory),
      money: character.money,
      // Status
      statusConditions: JSON.parse(character.statusConditions),
      stageModifiers: JSON.parse(character.stageModifiers),
      // Display
      avatarUrl: character.avatarUrl,
      // Background
      background: character.background,
      personality: character.personality,
      goals: character.goals,
      // Library
      isInLibrary: character.isInLibrary,
      notes: character.notes,
      // Linked Pokemon
      pokemonIds: character.pokemon.map(p => p.id),
      pokemon: parsedPokemon
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
