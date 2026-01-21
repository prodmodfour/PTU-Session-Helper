import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const character = await prisma.humanCharacter.create({
      data: {
        name: body.name,
        characterType: body.characterType || 'npc',
        level: body.level || 1,
        hp: body.stats?.hp || body.hp || 10,
        attack: body.stats?.attack || body.attack || 5,
        defense: body.stats?.defense || body.defense || 5,
        specialAttack: body.stats?.specialAttack || body.specialAttack || 5,
        specialDefense: body.stats?.specialDefense || body.specialDefense || 5,
        speed: body.stats?.speed || body.speed || 5,
        currentHp: body.currentHp || body.stats?.hp || body.hp || 10,
        trainerClasses: JSON.stringify(body.trainerClasses || []),
        skills: JSON.stringify(body.skills || {}),
        inventory: JSON.stringify(body.inventory || []),
        money: body.money || 0,
        statusConditions: JSON.stringify(body.statusConditions || []),
        stageModifiers: JSON.stringify(body.stageModifiers || {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }),
        avatarUrl: body.avatarUrl,
        isInLibrary: body.isInLibrary !== false,
        notes: body.notes
      }
    })

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
      pokemonIds: []
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create character'
    })
  }
})
