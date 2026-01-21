import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  try {
    const characters = await prisma.humanCharacter.findMany({
      where: { isInLibrary: true },
      orderBy: { name: 'asc' }
    })

    // Parse JSON fields
    const parsed = characters.map(char => ({
      id: char.id,
      name: char.name,
      characterType: char.characterType,
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
      maxHp: char.hp,
      trainerClasses: JSON.parse(char.trainerClasses),
      skills: JSON.parse(char.skills),
      inventory: JSON.parse(char.inventory),
      money: char.money,
      statusConditions: JSON.parse(char.statusConditions),
      stageModifiers: JSON.parse(char.stageModifiers),
      avatarUrl: char.avatarUrl,
      isInLibrary: char.isInLibrary,
      notes: char.notes,
      pokemonIds: []
    }))

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to fetch characters'
    })
  }
})
