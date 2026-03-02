/**
 * POST /api/encounters/:id/release-hold
 *
 * Release a held action, inserting the combatant at the current turn position.
 * Called when:
 * 1. The held combatant's target initiative is reached (auto-release from next-turn)
 * 2. The GM manually releases a held action
 *
 * PTU p.227: The held combatant gets a full turn when released.
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { releaseHeldAction, removeFromHoldQueue } from '~/server/services/out-of-turn.service'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const body = await readBody(event)
  const { combatantId } = body as { combatantId: string }

  if (!combatantId) {
    throw createError({
      statusCode: 400,
      message: 'combatantId is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter is not active'
      })
    }

    // Find the combatant
    const combatant = combatants.find(c => c.id === combatantId)
    if (!combatant) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    // Verify this combatant is in the hold queue
    const holdQueue = JSON.parse(record.holdQueue || '[]') as Array<{
      combatantId: string
      holdUntilInitiative: number | null
    }>
    const holdEntry = holdQueue.find(e => e.combatantId === combatantId)
    if (!holdEntry) {
      throw createError({
        statusCode: 400,
        message: 'Combatant is not in the hold queue'
      })
    }

    // Release the held action — grant full action economy
    const releasedCombatant = releaseHeldAction(combatant)

    // Update combatants array
    const updatedCombatants = combatants.map(c =>
      c.id === combatantId ? releasedCombatant : c
    )

    // Remove from hold queue
    const updatedHoldQueue = removeFromHoldQueue(holdQueue, combatantId)

    // Insert the combatant into the turn order at the current position
    const turnOrder: string[] = JSON.parse(record.turnOrder)
    let currentTurnIndex = record.currentTurnIndex

    // Remove the original entry BEFORE inserting to prevent duplicate turns (bug-042).
    // For hold-release, the original entry is typically BEFORE currentTurnIndex
    // (combatant held at an earlier turn, released at a later one), so the
    // post-insert indexOf(id, currentTurnIndex+1) pattern cannot find it.
    const originalIndex = turnOrder.indexOf(combatantId)
    if (originalIndex !== -1) {
      turnOrder.splice(originalIndex, 1)
      // Adjust currentTurnIndex if the removal shifted it
      if (originalIndex < currentTurnIndex) {
        currentTurnIndex--
      }
    }

    // Splice the held combatant in at the (possibly adjusted) current index
    // This makes them the active combatant immediately
    turnOrder.splice(currentTurnIndex, 0, combatantId)

    // Save to database
    await prisma.encounter.update({
      where: { id },
      data: {
        combatants: JSON.stringify(updatedCombatants),
        holdQueue: JSON.stringify(updatedHoldQueue),
        turnOrder: JSON.stringify(turnOrder),
        currentTurnIndex
      }
    })

    // Broadcast hold released via WebSocket
    broadcastToEncounter(id, {
      type: 'hold_released',
      data: {
        encounterId: id,
        combatantId
      }
    })

    const response = buildEncounterResponse(record, updatedCombatants, {
      holdQueue: updatedHoldQueue,
      turnOrder,
      currentTurnIndex
    })

    return {
      success: true,
      data: response
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to release held action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
