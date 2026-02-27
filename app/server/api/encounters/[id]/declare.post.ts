/**
 * POST /api/encounters/:id/declare
 *
 * Records a trainer's declared action during the League Battle declaration phase.
 * Per decree-021: trainers declare low-to-high speed, resolve high-to-low.
 * Does NOT execute the action — only records the declaration for later resolution.
 */
import { prisma } from '~/server/utils/prisma'
import { buildEncounterResponse } from '~/server/services/encounter.service'
import type { TrainerDeclaration } from '~/types/combat'
import type { Combatant } from '~/types'

const VALID_ACTION_TYPES = [
  'command_pokemon', 'switch_pokemon', 'use_item', 'use_feature', 'orders', 'pass'
] as const

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  const body = await readBody(event)
  const { combatantId, actionType, description, targetIds } = body

  if (!combatantId || !actionType || !description) {
    throw createError({
      statusCode: 400,
      message: 'combatantId, actionType, and description are required'
    })
  }

  if (!VALID_ACTION_TYPES.includes(actionType)) {
    throw createError({
      statusCode: 400,
      message: `Invalid actionType. Must be one of: ${VALID_ACTION_TYPES.join(', ')}`
    })
  }

  try {
    const encounter = await prisma.encounter.findUnique({ where: { id } })
    if (!encounter) {
      throw createError({ statusCode: 404, message: 'Encounter not found' })
    }
    if (!encounter.isActive) {
      throw createError({ statusCode: 400, message: 'Encounter is not active' })
    }
    if (encounter.currentPhase !== 'trainer_declaration') {
      throw createError({
        statusCode: 400,
        message: 'Can only declare actions during the trainer declaration phase'
      })
    }

    const combatants: Combatant[] = JSON.parse(encounter.combatants)
    const turnOrder: string[] = JSON.parse(encounter.turnOrder)
    const declarations: TrainerDeclaration[] = JSON.parse(encounter.declarations || '[]')

    // Verify the declaring combatant is the current turn's combatant
    const currentCombatantId = turnOrder[encounter.currentTurnIndex]
    if (combatantId !== currentCombatantId) {
      throw createError({
        statusCode: 400,
        message: 'Only the current turn\'s combatant can declare an action'
      })
    }

    // Verify it's a trainer (human type)
    const combatant = combatants.find(c => c.id === combatantId)
    if (!combatant || combatant.type !== 'human') {
      throw createError({
        statusCode: 400,
        message: 'Only trainers can declare actions in League Battle declaration phase'
      })
    }

    // Check for duplicate declaration this round
    const alreadyDeclared = declarations.some(
      d => d.combatantId === combatantId && d.round === encounter.currentRound
    )
    if (alreadyDeclared) {
      throw createError({
        statusCode: 400,
        message: 'This trainer has already declared an action this round'
      })
    }

    // Build the declaration (immutable — new object, not mutating existing array)
    const entityName = (combatant.entity as { name: string }).name
    const declaration: TrainerDeclaration = {
      combatantId,
      trainerName: entityName,
      actionType,
      description,
      ...(targetIds && { targetIds }),
      round: encounter.currentRound
    }

    const updatedDeclarations = [...declarations, declaration]

    // Persist — does NOT advance turn (next-turn.post.ts handles that separately)
    await prisma.encounter.update({
      where: { id },
      data: {
        declarations: JSON.stringify(updatedDeclarations)
      }
    })

    const response = buildEncounterResponse(encounter, combatants, {
      declarations: updatedDeclarations
    })

    return { success: true, data: response }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to record declaration'
    throw createError({ statusCode: 500, message })
  }
})
