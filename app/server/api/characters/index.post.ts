import { prisma } from '~/server/utils/prisma'
import { serializeCharacter } from '~/server/utils/serializers'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    const character = await prisma.humanCharacter.create({
      data: {
        name: body.name,
        characterType: body.characterType || 'npc',
        // Player info
        playedBy: body.playedBy,
        age: body.age,
        gender: body.gender,
        height: body.height,
        weight: body.weight,
        // Stats
        level: body.level || 1,
        hp: body.stats?.hp || body.hp || 10,
        attack: body.stats?.attack || body.attack || 5,
        defense: body.stats?.defense || body.defense || 5,
        specialAttack: body.stats?.specialAttack || body.specialAttack || 5,
        specialDefense: body.stats?.specialDefense || body.specialDefense || 5,
        speed: body.stats?.speed || body.speed || 5,
        currentHp: body.currentHp || body.maxHp || 10,
        maxHp: body.maxHp || body.currentHp || 10,
        // Classes, skills, features, edges
        trainerClasses: JSON.stringify(body.trainerClasses || []),
        skills: JSON.stringify(body.skills || {}),
        features: JSON.stringify(body.features || []),
        edges: JSON.stringify(body.edges || []),
        // Inventory
        inventory: JSON.stringify(body.inventory || []),
        money: body.money || 0,
        // Status
        statusConditions: JSON.stringify(body.statusConditions || []),
        stageModifiers: JSON.stringify(body.stageModifiers || {
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }),
        // Display
        avatarUrl: body.avatarUrl,
        // Background
        background: body.background,
        personality: body.personality,
        goals: body.goals,
        location: body.location || null,
        // Library
        isInLibrary: body.isInLibrary !== false,
        notes: body.notes
      },
      include: { pokemon: true }
    })

    return { success: true, data: serializeCharacter(character) }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to create character'
    })
  }
})
