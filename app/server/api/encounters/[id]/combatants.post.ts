import { prisma } from '~/server/utils/prisma'
import { v4 as uuidv4 } from 'uuid'

// Map PTU size to grid token size
const sizeToTokenSize = (size: string | undefined): number => {
  switch (size) {
    case 'Small':
    case 'Medium':
      return 1
    case 'Large':
      return 2
    case 'Huge':
      return 3
    case 'Gigantic':
      return 4
    default:
      return 1
  }
}

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
    let tokenSize = 1
    if (body.entityType === 'pokemon') {
      entity = await prisma.pokemon.findUnique({ where: { id: body.entityId } })
      if (!entity) {
        throw createError({ statusCode: 404, message: 'Pokemon not found' })
      }
      // Parse JSON fields
      const capabilities = entity.capabilities ? JSON.parse(entity.capabilities) : {}
      tokenSize = sizeToTokenSize(capabilities.size)

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
        capabilities,
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

    // Build a set of all occupied cells (accounting for multi-cell tokens)
    const occupiedCells = new Set<string>()
    for (const c of combatants) {
      if (!c.position) continue
      const size = c.tokenSize || 1
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          occupiedCells.add(`${c.position.x + dx},${c.position.y + dy}`)
        }
      }
    }

    // Check if a position can fit a token of given size
    const canFit = (x: number, y: number, size: number): boolean => {
      // Check bounds
      if (x + size > gridWidth || y + size > gridHeight) return false
      // Check all cells the token would occupy
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
        }
      }
      return true
    }

    // Auto-place based on side
    // Players: left side (x=1-3), Enemies: right side (x=width-4 to width-2), Allies: left-center (x=4-6)
    const sidePositions = {
      players: { startX: 1, endX: 4 },
      allies: { startX: 5, endX: 8 },
      enemies: { startX: gridWidth - 5, endX: gridWidth - 1 }
    }

    const sideConfig = sidePositions[body.side as keyof typeof sidePositions] || sidePositions.enemies

    // Find next available position that can fit the token
    let position = { x: sideConfig.startX, y: 1 }
    let found = false

    // Place in a column pattern within the side's area
    for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
      for (let x = sideConfig.startX; x <= sideConfig.endX - tokenSize + 1 && !found; x++) {
        if (canFit(x, y, tokenSize)) {
          position = { x, y }
          found = true
        }
      }
    }

    // If no position found in designated area, try anywhere on the grid
    if (!found) {
      for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
        for (let x = 1; x < gridWidth - tokenSize + 1 && !found; x++) {
          if (canFit(x, y, tokenSize)) {
            position = { x, y }
            found = true
          }
        }
      }
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
      tokenSize,
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
      weather: encounter.weather ?? null,
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
