/**
 * POST /api/encounters/:id/living-weapon/disengage
 *
 * Break a wield relationship between a trainer and a Living Weapon Pokemon.
 * PTU pp.305-306: Disengage is a Swift Action during the turn of either
 * the wielder or weapon.
 *
 * The combatantId identifies one side of the relationship. The endpoint
 * resolves the full relationship from either side.
 *
 * Validates: active relationship exists, turn active, Swift Action available.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import { disengageLivingWeapon } from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { broadcastToEncounter } from '~/server/utils/websocket'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.combatantId) {
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
        message: 'Encounter must be active to disengage a Living Weapon'
      })
    }

    // Turn validation: the combatant must be the current turn combatant
    // (or holding an action). Follow use-item endpoint pattern.
    const turnOrder: string[] = JSON.parse(record.turnOrder || '[]')
    const currentTurnId = turnOrder[record.currentTurnIndex]
    const initiator = combatants.find(c => c.id === body.combatantId)

    if (!initiator) {
      throw createError({
        statusCode: 404,
        message: 'Combatant not found'
      })
    }

    const isInitiatorsTurn = currentTurnId === body.combatantId
    const hasHeldAction = initiator.holdAction?.isHolding === true
    if (!isInitiatorsTurn && !hasHeldAction) {
      throw createError({
        statusCode: 400,
        message: 'Can only disengage a Living Weapon on the combatant\'s turn (or with a held action)'
      })
    }

    // Action availability: combatant must have their Swift Action available
    if (initiator.turnState.swiftActionUsed) {
      throw createError({
        statusCode: 400,
        message: 'Disengaging a Living Weapon requires a Swift Action. Swift Action already used this turn.'
      })
    }

    // Reconstruct wield relationships from combatant flags
    const wieldRelationships = reconstructWieldRelationships(combatants)

    // Execute disengage (validates relationship exists, returns immutable updates)
    const result = disengageLivingWeapon(
      combatants,
      wieldRelationships,
      body.combatantId
    )

    // Mark Swift Action as used on the disengaging combatant
    const finalCombatants = result.combatants.map(c => {
      if (c.id === body.combatantId) {
        return {
          ...c,
          turnState: {
            ...c.turnState,
            swiftActionUsed: true,
          }
        }
      }
      return c
    })

    // Persist updated combatants
    await saveEncounterCombatants(id, finalCombatants)

    const response = buildEncounterResponse(record, finalCombatants)

    // Extract updated wielder/weapon from finalCombatants (not stale result)
    // so the swiftActionUsed flag is included in response
    const updatedWielder = finalCombatants.find(c => c.id === result.removedRelationship.wielderId)!
    const updatedWeapon = finalCombatants.find(c => c.id === result.removedRelationship.weaponId)!

    // Broadcast disengage event via WebSocket
    broadcastToEncounter(id, {
      type: 'living_weapon_disengage',
      data: {
        encounterId: id,
        wielderId: result.removedRelationship.wielderId,
        weaponId: result.removedRelationship.weaponId,
      }
    })

    // Broadcast full encounter update for state sync (C1 fix: send full response)
    broadcastToEncounter(id, {
      type: 'encounter_update',
      data: response
    })

    return {
      success: true,
      data: {
        encounter: response,
        removedRelationship: result.removedRelationship,
        wielder: updatedWielder,
        weapon: updatedWeapon,
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to disengage Living Weapon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
