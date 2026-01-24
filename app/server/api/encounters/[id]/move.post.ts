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

    const combatants = JSON.parse(encounter.combatants)
    const moveLog = JSON.parse(encounter.moveLog)

    // Find actor
    const actor = combatants.find((c: any) => c.id === body.actorId)
    if (!actor) {
      throw createError({
        statusCode: 404,
        message: 'Actor not found'
      })
    }

    // Get actor name
    const actorName = actor.type === 'pokemon'
      ? (actor.entity.nickname || actor.entity.species)
      : actor.entity.name

    // Find move
    let move = null
    if (actor.type === 'pokemon' && actor.entity.moves) {
      move = actor.entity.moves.find((m: any) => m.id === body.moveId || m.name === body.moveId)
    }
    const moveName = move?.name || body.moveId || 'Unknown Move'

    // Process targets and collect database updates
    const dbUpdates: Promise<any>[] = []
    const targets = body.targetIds.map((targetId: string) => {
      const target = combatants.find((c: any) => c.id === targetId)
      if (!target) return null

      const targetName = target.type === 'pokemon'
        ? (target.entity.nickname || target.entity.species)
        : target.entity.name

      // Apply damage if provided
      if (body.damage && body.damage > 0) {
        const newHp = Math.max(0, target.entity.currentHp - body.damage)
        target.entity.currentHp = newHp

        // Also update the actual entity in database
        if (target.type === 'pokemon') {
          dbUpdates.push(prisma.pokemon.update({
            where: { id: target.entityId },
            data: { currentHp: newHp }
          }))
        } else {
          dbUpdates.push(prisma.humanCharacter.update({
            where: { id: target.entityId },
            data: { currentHp: newHp }
          }))
        }
      }

      return {
        id: targetId,
        name: targetName,
        damage: body.damage || 0,
        effect: body.effect || null,
        hit: true
      }
    }).filter(Boolean)

    // Execute all database updates for damaged targets
    if (dbUpdates.length > 0) {
      await Promise.all(dbUpdates)
    }

    // Create log entry
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      round: encounter.currentRound,
      actorId: body.actorId,
      actorName,
      moveName,
      moveType: move?.type || null,
      targets,
      notes: body.notes || null
    }

    moveLog.push(logEntry)

    // Use an action
    if (actor.actionsRemaining > 0) {
      actor.actionsRemaining--
    }

    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(combatants),
        moveLog: JSON.stringify(moveLog)
      }
    })

    const turnOrder = JSON.parse(encounter.turnOrder)

    const parsed = {
      id: encounter.id,
      name: encounter.name,
      battleType: encounter.battleType,
      combatants,
      currentRound: encounter.currentRound,
      currentTurnIndex: encounter.currentTurnIndex,
      turnOrder,
      isActive: encounter.isActive,
      isPaused: encounter.isPaused,
      isServed: encounter.isServed,
      moveLog,
      defeatedEnemies: JSON.parse(encounter.defeatedEnemies),
      gridConfig: encounter.gridConfig ? JSON.parse(encounter.gridConfig) : null,
      createdAt: encounter.createdAt,
      updatedAt: encounter.updatedAt
    }

    return { success: true, data: parsed }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to execute move'
    })
  }
})
