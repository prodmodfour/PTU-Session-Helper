/**
 * Encounter Service
 * Handles common encounter operations: loading, validation, saving, and response building
 */

import { prisma } from '~/server/utils/prisma'
import type { Combatant, Encounter, GridConfig } from '~/types'

// Prisma encounter record type (matches Prisma schema)
interface EncounterRecord {
  id: string
  name: string
  battleType: string
  combatants: string
  currentRound: number
  currentTurnIndex: number
  turnOrder: string
  isActive: boolean
  isPaused: boolean
  isServed: boolean
  moveLog: string
  defeatedEnemies: string
  gridEnabled: boolean
  gridWidth: number
  gridHeight: number
  gridCellSize: number
  gridBackground: string | null
  fogOfWarEnabled: boolean
  fogOfWarState: string
  terrainEnabled: boolean
  terrainState: string
  createdAt: Date
  updatedAt: Date
}

// Parsed encounter with combatants as objects
export interface ParsedEncounter {
  id: string
  name: string
  battleType: string
  combatants: Combatant[]
  currentRound: number
  currentTurnIndex: number
  turnOrder: string[]
  isActive: boolean
  isPaused: boolean
  isServed: boolean
  moveLog: unknown[]
  defeatedEnemies: { species: string; level: number }[]
  sceneNumber: number // Derived from currentRound for now
  gridConfig: GridConfig | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Load an encounter by ID with validation
 * @throws H3Error if encounter not found
 */
export async function loadEncounter(id: string): Promise<{
  record: EncounterRecord
  combatants: Combatant[]
}> {
  const encounter = await prisma.encounter.findUnique({
    where: { id }
  })

  if (!encounter) {
    throw createError({
      statusCode: 404,
      message: 'Encounter not found'
    })
  }

  const combatants = JSON.parse(encounter.combatants) as Combatant[]

  return { record: encounter, combatants }
}

/**
 * Find a combatant in the combatants array
 * @throws H3Error if combatant not found
 */
export function findCombatant(combatants: Combatant[], combatantId: string): Combatant {
  const combatant = combatants.find(c => c.id === combatantId)

  if (!combatant) {
    throw createError({
      statusCode: 404,
      message: 'Combatant not found'
    })
  }

  return combatant
}

/**
 * Build a standardized encounter response object
 */
export function buildEncounterResponse(
  record: EncounterRecord,
  combatants: Combatant[],
  options?: {
    moveLog?: unknown[]
    defeatedEnemies?: { species: string; level: number }[]
  }
): ParsedEncounter {
  const turnOrder = JSON.parse(record.turnOrder) as string[]
  const moveLog = options?.moveLog ?? JSON.parse(record.moveLog)
  const defeatedEnemies = options?.defeatedEnemies ?? JSON.parse(record.defeatedEnemies)

  const gridConfig: GridConfig | null = record.gridEnabled ? {
    enabled: record.gridEnabled,
    width: record.gridWidth,
    height: record.gridHeight,
    cellSize: record.gridCellSize,
    background: record.gridBackground ?? undefined
  } : null

  return {
    id: record.id,
    name: record.name,
    battleType: record.battleType,
    combatants,
    currentRound: record.currentRound,
    currentTurnIndex: record.currentTurnIndex,
    turnOrder,
    isActive: record.isActive,
    isPaused: record.isPaused,
    isServed: record.isServed,
    moveLog,
    defeatedEnemies,
    sceneNumber: 1, // Scene number not stored in DB, default to 1
    gridConfig,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

/**
 * Save encounter combatants to database
 */
export async function saveEncounterCombatants(
  id: string,
  combatants: Combatant[],
  additionalData?: {
    defeatedEnemies?: { species: string; level: number }[]
    moveLog?: unknown[]
  }
): Promise<void> {
  const data: Record<string, unknown> = {
    combatants: JSON.stringify(combatants)
  }

  if (additionalData?.defeatedEnemies) {
    data.defeatedEnemies = JSON.stringify(additionalData.defeatedEnemies)
  }

  if (additionalData?.moveLog) {
    data.moveLog = JSON.stringify(additionalData.moveLog)
  }

  await prisma.encounter.update({
    where: { id },
    data
  })
}

/**
 * Get entity display name (Pokemon species/nickname or Human name)
 */
export function getEntityName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const entity = combatant.entity as { nickname?: string; species: string }
    return entity.nickname || entity.species
  }
  const entity = combatant.entity as { name: string }
  return entity.name
}
