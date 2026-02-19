import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Character ID is required'
    })
  }

  try {
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.characterType !== undefined) updateData.characterType = body.characterType
    if (body.level !== undefined) updateData.level = body.level
    if (body.currentHp !== undefined) updateData.currentHp = body.currentHp
    if (body.money !== undefined) updateData.money = body.money
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl
    if (body.isInLibrary !== undefined) updateData.isInLibrary = body.isInLibrary
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.location !== undefined) updateData.location = body.location

    if (body.stats) {
      if (body.stats.hp !== undefined) updateData.hp = body.stats.hp
      if (body.stats.attack !== undefined) updateData.attack = body.stats.attack
      if (body.stats.defense !== undefined) updateData.defense = body.stats.defense
      if (body.stats.specialAttack !== undefined) updateData.specialAttack = body.stats.specialAttack
      if (body.stats.specialDefense !== undefined) updateData.specialDefense = body.stats.specialDefense
      if (body.stats.speed !== undefined) updateData.speed = body.stats.speed
    }

    if (body.trainerClasses !== undefined) updateData.trainerClasses = JSON.stringify(body.trainerClasses)
    if (body.skills !== undefined) updateData.skills = JSON.stringify(body.skills)
    if (body.inventory !== undefined) updateData.inventory = JSON.stringify(body.inventory)
    if (body.statusConditions !== undefined) updateData.statusConditions = JSON.stringify(body.statusConditions)
    if (body.stageModifiers !== undefined) updateData.stageModifiers = JSON.stringify(body.stageModifiers)

    // Healing-related fields
    if (body.maxHp !== undefined) updateData.maxHp = body.maxHp
    if (body.injuries !== undefined) updateData.injuries = body.injuries
    if (body.drainedAp !== undefined) updateData.drainedAp = body.drainedAp
    if (body.restMinutesToday !== undefined) updateData.restMinutesToday = body.restMinutesToday
    if (body.injuriesHealedToday !== undefined) updateData.injuriesHealedToday = body.injuriesHealedToday
    if (body.lastInjuryTime !== undefined) updateData.lastInjuryTime = body.lastInjuryTime ? new Date(body.lastInjuryTime) : null
    if (body.lastRestReset !== undefined) updateData.lastRestReset = body.lastRestReset ? new Date(body.lastRestReset) : null

    const character = await prisma.humanCharacter.update({
      where: { id },
      data: updateData
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
      maxHp: character.maxHp,
      trainerClasses: JSON.parse(character.trainerClasses),
      skills: JSON.parse(character.skills),
      inventory: JSON.parse(character.inventory),
      money: character.money,
      statusConditions: JSON.parse(character.statusConditions),
      stageModifiers: JSON.parse(character.stageModifiers),
      avatarUrl: character.avatarUrl,
      location: character.location,
      isInLibrary: character.isInLibrary,
      notes: character.notes,
      pokemonIds: []
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update character'
    })
  }
})
