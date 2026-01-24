import { prisma } from '~/server/utils/prisma'

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

    // Parse JSON fields
    const parsed = characters.map(char => ({
      id: char.id,
      name: char.name,
      characterType: char.characterType,
      // Player info
      playedBy: char.playedBy,
      age: char.age,
      gender: char.gender,
      height: char.height,
      weight: char.weight,
      // Stats
      level: char.level,
      stats: {
        hp: char.hp,
        attack: char.attack,
        defense: char.defense,
        specialAttack: char.specialAttack,
        specialDefense: char.specialDefense,
        speed: char.speed
      },
      currentHp: char.currentHp,
      maxHp: char.maxHp,
      // Classes, skills, features, edges
      trainerClasses: JSON.parse(char.trainerClasses),
      skills: JSON.parse(char.skills),
      features: JSON.parse(char.features),
      edges: JSON.parse(char.edges),
      // Inventory
      inventory: JSON.parse(char.inventory),
      money: char.money,
      // Status
      statusConditions: JSON.parse(char.statusConditions),
      stageModifiers: JSON.parse(char.stageModifiers),
      // Display
      avatarUrl: char.avatarUrl,
      // Background
      background: char.background,
      personality: char.personality,
      goals: char.goals,
      // Library
      isInLibrary: char.isInLibrary,
      notes: char.notes,
      pokemonIds: char.pokemon.map(p => p.id),
      pokemon: char.pokemon
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch characters'
    })
  }
})
