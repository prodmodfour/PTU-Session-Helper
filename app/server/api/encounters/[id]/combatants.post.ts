import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id }
    })

    if (!encounter) {
      throw createError({
        statusCode: 404,
        message: 'Encounter not found'
      })
    }

    // Get the entity data
    let entity: any
    if (body.entityType === 'pokemon') {
      entity = await prisma.pokemon.findUnique({ where: { id: body.entityId } })
      if (!entity) {
        throw createError({ statusCode: 404, message: 'Pokemon not found' })
      }
      // Parse JSON fields
      entity = {
        id: entity.id,
        species: entity.species,
        nickname: entity.nickname,
        level: entity.level,
        types: entity.type2 ? [entity.type1, entity.type2] : [entity.type1],
        currentStats: {
          hp: entity.currentHp,
          attack: entity.currentAttack,
          defense: entity.currentDefense,
          specialAttack: entity.currentSpAtk,
          specialDefense: entity.currentSpDef,
          speed: entity.currentSpeed
        },
        currentHp: entity.currentHp,
        maxHp: entity.maxHp,
        stageModifiers: JSON.parse(entity.stageModifiers),
        abilities: JSON.parse(entity.abilities),
        moves: JSON.parse(entity.moves),
        statusConditions: JSON.parse(entity.statusConditions),
        spriteUrl: entity.spriteUrl,
        shiny: entity.shiny
      }
    } else {
      entity = await prisma.humanCharacter.findUnique({ where: { id: body.entityId } })
      if (!entity) {
        throw createError({ statusCode: 404, message: 'Character not found' })
      }
      entity = {
        id: entity.id,
        name: entity.name,
        level: entity.level,
        stats: {
          hp: entity.hp,
          attack: entity.attack,
          defense: entity.defense,
          specialAttack: entity.specialAttack,
          specialDefense: entity.specialDefense,
          speed: entity.speed
        },
        currentHp: entity.currentHp,
        maxHp: entity.hp,
        stageModifiers: JSON.parse(entity.stageModifiers),
        statusConditions: JSON.parse(entity.statusConditions),
        avatarUrl: entity.avatarUrl
      }
    }

    // Calculate initiative
    const speed = body.entityType === 'pokemon'
      ? entity.currentStats.speed
      : entity.stats.speed
    const initiative = speed + (body.initiativeBonus || 0)

    // Create combatant
    const newCombatant = {
      id: uuidv4(),
      type: body.entityType,
      entityId: body.entityId,
      side: body.side,
      initiative,
      initiativeBonus: body.initiativeBonus || 0,
      hasActed: false,
      actionsRemaining: 2,
      shiftActionsRemaining: 1,
      readyAction: null,
      entity
    }

    const combatants = JSON.parse(encounter.combatants)
    combatants.push(newCombatant)

    await prisma.encounter.update({
      where: { id },
      data: { combatants: JSON.stringify(combatants) }
    })

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants,
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder: JSON.parse(encounter.turnOrder),
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      moveLog: JSON.parse(encounter.moveLog),
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to add combatant'
    })
  }
})
