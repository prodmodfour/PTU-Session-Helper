import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')
  const combatantId = getRouterParam(event, 'combatantId')

  if (!encounterId || !combatantId) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID and Combatant ID are required'
    })
  }

  // Get encounter
  const encounter = await prisma.encounter.findUnique({
    where: { id: encounterId }
  })

  if (!encounter) {
    throw createError({
      statusCode: 404,
      message: 'Encounter not found'
    })
  }

  // Parse combatants
  const combatants = JSON.parse(encounter.combatants || '[]')
  const turnOrder = JSON.parse(encounter.turnOrder || '[]')

  // Find and remove combatant
  const combatantIndex = combatants.findIndex((c: any) => c.id === combatantId)

  if (combatantIndex === -1) {
    throw createError({
      statusCode: 404,
      message: 'Combatant not found in encounter'
    })
  }

  combatants.splice(combatantIndex, 1)

  // Remove from turn order
  const turnOrderIndex = turnOrder.indexOf(combatantId)
  if (turnOrderIndex !== -1) {
    turnOrder.splice(turnOrderIndex, 1)
  }

  // Adjust current turn index if needed
  let currentTurnIndex = encounter.currentTurnIndex
  if (currentTurnIndex >= turnOrder.length) {
    currentTurnIndex = 0
  }

  // Update encounter
  const updatedEncounter = await prisma.encounter.update({
    where: { id: encounterId },
    data: {
      combatants: JSON.stringify(combatants),
      turnOrder: JSON.stringify(turnOrder),
      currentTurnIndex
    }
  })

  // Parse response
  const parsedEncounter = {
    ...updatedEncounter,
    combatants: JSON.parse(updatedEncounter.combatants || '[]'),
    turnOrder: JSON.parse(updatedEncounter.turnOrder || '[]'),
    moveLog: JSON.parse(updatedEncounter.moveLog || '[]'),
    defeatedEnemies: JSON.parse(updatedEncounter.defeatedEnemies || '[]')
  }

  return { data: parsedEncounter }
})
