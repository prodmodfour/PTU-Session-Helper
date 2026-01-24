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

    // Get existing combatants to calculate position
    const combatants = JSON.parse(encounter.combatants)
    const gridWidth = encounter.gridWidth || 20
    const gridHeight = encounter.gridHeight || 15

    // Auto-place based on side
    // Players: left side (x=1-3), Enemies: right side (x=width-4 to width-2), Allies: left-center (x=4-6)
    const sidePositions = {
      players: { startX: 1, endX: 3 },
      allies: { startX: 4, endX: 6 },
      enemies: { startX: gridWidth - 4, endX: gridWidth - 2 }
    }

    const sideConfig = sidePositions[body.side as keyof typeof sidePositions] || sidePositions.enemies
    const sameSideCombatants = combatants.filter((c: any) => c.side === body.side)

    // Find next available position
    let position = { x: sideConfig.startX, y: 1 }
    const usedPositions = new Set(
      combatants
        .filter((c: any) => c.position)
        .map((c: any) => `${c.position.x},${c.position.y}`)
    )

    // Place in a column pattern within the side's area
    const colWidth = sideConfig.endX - sideConfig.startX + 1
    for (let y = 1; y < gridHeight; y++) {
      for (let xOffset = 0; xOffset < colWidth; xOffset++) {
        const x = sideConfig.startX + xOffset
        if (!usedPositions.has(`${x},${y}`)) {
          position = { x, y }
          break
        }
      }
      if (!usedPositions.has(`${position.x},${position.y}`)) break
    }

    // Create combatant with position
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
      position,
      tokenSize: 1,
      entity
    }

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
      currentPhase: 'pokemon' as const,
      trainerTurnOrder: [],
      pokemonTurnOrder: [],
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      gridConfig: {
        enabled: encounter.gridEnabled,
        width: encounter.gridWidth,
        height: encounter.gridHeight,
        cellSize: encounter.gridCellSize,
        background: encounter.gridBackground ?? undefined
      },
      sceneNumber: 1,
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
