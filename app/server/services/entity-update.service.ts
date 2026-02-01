/**
 * Entity Update Service
 * Handles syncing combatant changes to the database (Pokemon or HumanCharacter tables)
 */

import { prisma } from '~/server/utils/prisma'
import type { Combatant, StatusCondition, StageModifiers } from '~/types'

// Entity update data that can be synced to database
export interface EntityUpdateData {
  currentHp?: number
  temporaryHp?: number
  injuries?: number
  statusConditions?: StatusCondition[]
  stageModifiers?: StageModifiers
  lastInjuryTime?: Date
}

/**
 * Sync entity changes to the database
 * Only updates entities that have a database record (entityId is set)
 * Template-loaded combatants don't have entityId - their state is tracked in combatants JSON only
 */
export async function syncEntityToDatabase(
  combatant: Combatant,
  updates: EntityUpdateData
): Promise<void> {
  // Skip if no entityId (template-loaded combatants)
  if (!combatant.entityId) {
    return
  }

  // Build update data
  const data: Record<string, unknown> = {}

  if (updates.currentHp !== undefined) {
    data.currentHp = updates.currentHp
  }

  if (updates.temporaryHp !== undefined) {
    data.temporaryHp = updates.temporaryHp
  }

  if (updates.injuries !== undefined) {
    data.injuries = updates.injuries
  }

  if (updates.statusConditions !== undefined) {
    data.statusConditions = JSON.stringify(updates.statusConditions)
  }

  if (updates.stageModifiers !== undefined) {
    data.stageModifiers = JSON.stringify(updates.stageModifiers)
  }

  if (updates.lastInjuryTime !== undefined) {
    data.lastInjuryTime = updates.lastInjuryTime
  }

  // Skip if no updates to apply
  if (Object.keys(data).length === 0) {
    return
  }

  // Update the appropriate table based on combatant type
  if (combatant.type === 'pokemon') {
    await prisma.pokemon.update({
      where: { id: combatant.entityId },
      data
    })
  } else {
    await prisma.humanCharacter.update({
      where: { id: combatant.entityId },
      data
    })
  }
}

/**
 * Sync damage-related changes to database
 * Convenience method for damage operations
 */
export async function syncDamageToDatabase(
  combatant: Combatant,
  newHp: number,
  newTempHp: number,
  newInjuries: number,
  statusConditions: StatusCondition[],
  injuryGained: boolean
): Promise<void> {
  await syncEntityToDatabase(combatant, {
    currentHp: newHp,
    temporaryHp: newTempHp,
    injuries: newInjuries,
    statusConditions,
    lastInjuryTime: injuryGained ? new Date() : undefined
  })
}

/**
 * Sync healing-related changes to database
 * Convenience method for healing operations
 */
export async function syncHealingToDatabase(
  combatant: Combatant,
  currentHp: number,
  temporaryHp: number,
  injuries: number,
  statusConditions: StatusCondition[]
): Promise<void> {
  await syncEntityToDatabase(combatant, {
    currentHp,
    temporaryHp,
    injuries,
    statusConditions
  })
}

/**
 * Sync status condition changes to database
 */
export async function syncStatusToDatabase(
  combatant: Combatant,
  statusConditions: StatusCondition[]
): Promise<void> {
  await syncEntityToDatabase(combatant, {
    statusConditions
  })
}

/**
 * Sync stage modifier changes to database
 */
export async function syncStagesToDatabase(
  combatant: Combatant,
  stageModifiers: StageModifiers
): Promise<void> {
  await syncEntityToDatabase(combatant, {
    stageModifiers
  })
}
