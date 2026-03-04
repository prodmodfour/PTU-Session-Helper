/**
 * POST /api/encounters/:id/living-weapon/engage
 *
 * Establish a wield relationship between a trainer and a Living Weapon Pokemon.
 * PTU pp.305-306: Re-engaging is a Standard Action that may be taken by
 * EITHER the wielder or the weapon.
 *
 * Validates: capability, adjacency, not already wielding/wielded, turn active,
 *   Standard Action available on initiator.
 * Side effects: creates WieldRelationship, sets combatant flags,
 *   marks Standard Action as used on initiator, broadcasts WebSocket event.
 */
import { loadEncounter, buildEncounterResponse, saveEncounterCombatants } from '~/server/services/encounter.service'
import {
  engageLivingWeapon, refreshCombatantEquipmentBonuses,
  syncWeaponPosition, swapAegislashStance, isAegislashBladeForm
} from '~/server/services/living-weapon.service'
import { reconstructWieldRelationships } from '~/server/services/living-weapon-state'
import { broadcastToEncounter } from '~/server/utils/websocket'
import type { Pokemon } from '~/types/character'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  if (!body.wielderId || !body.weaponId) {
    throw createError({
      statusCode: 400,
      message: 'wielderId and weaponId are required'
    })
  }

  // initiatorId: who is spending the Standard Action (wielder or weapon).
  // PTU p.306: Re-engaging is a Standard Action that may be taken by EITHER party.
  // Defaults to wielder for backwards compatibility.
  const initiatorId: string = body.initiatorId || body.wielderId

  if (initiatorId !== body.wielderId && initiatorId !== body.weaponId) {
    throw createError({
      statusCode: 400,
      message: 'initiatorId must be either the wielderId or the weaponId'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(id)

    if (!record.isActive) {
      throw createError({
        statusCode: 400,
        message: 'Encounter must be active to engage a Living Weapon'
      })
    }

    // Turn validation: the initiator must be the current turn combatant
    // (or holding an action). Follow use-item endpoint pattern.
    const turnOrder: string[] = JSON.parse(record.turnOrder || '[]')
    const currentTurnId = turnOrder[record.currentTurnIndex]
    const initiator = combatants.find(c => c.id === initiatorId)

    if (!initiator) {
      throw createError({
        statusCode: 404,
        message: 'Initiator combatant not found'
      })
    }

    const isInitiatorsTurn = currentTurnId === initiatorId
    const hasHeldAction = initiator.holdAction?.isHolding === true
    if (!isInitiatorsTurn && !hasHeldAction) {
      throw createError({
        statusCode: 400,
        message: 'Can only engage a Living Weapon on the initiator\'s turn (or with a held action)'
      })
    }

    // Action availability: initiator must have their Standard Action available
    if (initiator.turnState.standardActionUsed) {
      throw createError({
        statusCode: 400,
        message: 'Engaging a Living Weapon requires a Standard Action. Standard Action already used this turn.'
      })
    }

    // Reconstruct wield relationships from combatant flags
    const wieldRelationships = reconstructWieldRelationships(combatants)

    // Execute engage (validates all preconditions, returns immutable updates)
    const result = engageLivingWeapon(
      combatants,
      wieldRelationships,
      body.wielderId,
      body.weaponId
    )

    // P2: Aegislash forced Blade forme (PTU p.306)
    // When Aegislash is engaged as a Living Weapon, force into Blade forme.
    let updatedWieldRelationship = result.wieldRelationship
    let updatedCombatantsPreAction = result.combatants
    if (result.wieldRelationship.weaponSpecies === 'Aegislash') {
      const weaponCombatant = result.combatants.find(c => c.id === body.weaponId)
      if (weaponCombatant && weaponCombatant.type === 'pokemon') {
        const pokemon = weaponCombatant.entity as Pokemon
        const isAlreadyBlade = isAegislashBladeForm(pokemon)

        // Track pre-engage forme for revert on disengage
        updatedWieldRelationship = {
          ...result.wieldRelationship,
          wasInBladeFormeOnEngage: isAlreadyBlade,
        }

        if (!isAlreadyBlade) {
          // Force into Blade forme by swapping stats
          const bladePokemon = swapAegislashStance(pokemon)
          updatedCombatantsPreAction = result.combatants.map(c => {
            if (c.id === body.weaponId) {
              return { ...c, entity: bladePokemon, wasInBladeFormeOnEngage: isAlreadyBlade }
            }
            return c
          })
        } else {
          // Already in Blade forme — just set the tracking flag
          updatedCombatantsPreAction = result.combatants.map(c => {
            if (c.id === body.weaponId) {
              return { ...c, wasInBladeFormeOnEngage: isAlreadyBlade }
            }
            return c
          })
        }
      }
    }

    // Update wield relationships with Aegislash tracking
    const updatedWieldRels = result.wieldRelationships.map(r =>
      r.wielderId === updatedWieldRelationship.wielderId
        ? updatedWieldRelationship
        : r
    )

    // P2: Sync weapon position to wielder's position (PTU p.306: shared position)
    const positionSyncedCombatants = syncWeaponPosition(
      updatedCombatantsPreAction,
      updatedWieldRels,
      body.wielderId
    )

    // Mark Standard Action as used on the initiator (wielder or weapon)
    // And refresh the wielder's evasion values with the Living Weapon equipment overlay
    const finalCombatants = positionSyncedCombatants.map(c => {
      let updated = c
      if (c.id === initiatorId) {
        updated = {
          ...updated,
          turnState: {
            ...updated.turnState,
            standardActionUsed: true,
          }
        }
      }
      // Refresh wielder's evasion values after wield relationship change
      if (c.id === body.wielderId) {
        updated = refreshCombatantEquipmentBonuses(updatedWieldRels, updated)
      }
      return updated
    })

    // Persist updated combatants
    await saveEncounterCombatants(id, finalCombatants)

    const response = buildEncounterResponse(record, finalCombatants)

    // Extract updated wielder/weapon from finalCombatants (not result) to
    // include the standardActionUsed flag applied after the service call
    const updatedWielder = finalCombatants.find(c => c.id === body.wielderId)!
    const updatedWeapon = finalCombatants.find(c => c.id === body.weaponId)!

    // Broadcast engage event via WebSocket
    broadcastToEncounter(id, {
      type: 'living_weapon_engage',
      data: {
        encounterId: id,
        wieldRelationship: updatedWieldRelationship,
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
        wieldRelationship: updatedWieldRelationship,
        wielder: updatedWielder,
        weapon: updatedWeapon,
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to engage Living Weapon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
