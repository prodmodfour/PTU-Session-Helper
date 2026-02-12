/**
 * Bulk actions on Pokemon: archive or delete.
 * Archive sets isInLibrary = false (hidden from sheets but preserved in DB).
 * Delete permanently removes records.
 */
import { prisma } from '~/server/utils/prisma'
import type { PokemonOrigin } from '~/types/character'

interface BulkActionRequest {
  action: 'archive' | 'delete'
  pokemonIds?: string[]
  filter?: {
    origin?: PokemonOrigin
    hasOwner?: boolean
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<BulkActionRequest>(event)

  if (!body.action || !['archive', 'delete'].includes(body.action)) {
    throw createError({
      statusCode: 400,
      message: 'action must be "archive" or "delete"'
    })
  }

  if (!body.pokemonIds && !body.filter) {
    throw createError({
      statusCode: 400,
      message: 'Either pokemonIds or filter is required'
    })
  }

  try {
    // Build where clause from either IDs or filter
    const where: Record<string, unknown> = {}

    if (body.pokemonIds && body.pokemonIds.length > 0) {
      where.id = { in: body.pokemonIds }
    } else if (body.filter) {
      if (body.filter.origin) {
        where.origin = body.filter.origin
      }
      if (body.filter.hasOwner === true) {
        where.ownerId = { not: null }
      } else if (body.filter.hasOwner === false) {
        where.ownerId = null
      }
    }

    // Safety: check for Pokemon in active encounters before deleting
    if (body.action === 'delete') {
      const activeEncounters = await prisma.encounter.findMany({
        where: { isActive: true },
        select: { combatants: true }
      })

      const activeEntityIds = new Set<string>()
      for (const encounter of activeEncounters) {
        const combatants = JSON.parse(encounter.combatants) as Array<{ entityId?: string }>
        for (const c of combatants) {
          if (c.entityId) activeEntityIds.add(c.entityId)
        }
      }

      // Find Pokemon that match the where clause
      const candidates = await prisma.pokemon.findMany({
        where,
        select: { id: true }
      })

      const inActiveEncounter = candidates.filter(p => activeEntityIds.has(p.id))
      if (inActiveEncounter.length > 0) {
        throw createError({
          statusCode: 409,
          message: `Cannot delete ${inActiveEncounter.length} Pokemon that are in active encounters`
        })
      }
    }

    let count = 0

    if (body.action === 'archive') {
      const result = await prisma.pokemon.updateMany({
        where,
        data: { isInLibrary: false }
      })
      count = result.count
    } else {
      const result = await prisma.pokemon.deleteMany({ where })
      count = result.count
    }

    return {
      success: true,
      data: {
        action: body.action,
        count
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to perform bulk action'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
