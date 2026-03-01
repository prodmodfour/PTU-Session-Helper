/**
 * POST /api/pokemon/:id/learn-move
 *
 * Add a move to a Pokemon's active move set.
 *
 * Body: {
 *   moveName: string,           // Name of the move to learn
 *   replaceIndex: number | null // Index (0-5) of move to replace, null to add to empty slot
 * }
 *
 * Validation:
 * 1. Pokemon must exist
 * 2. Move must exist in MoveData
 * 3. Pokemon must not already know this move
 * 4. If replaceIndex is null, Pokemon must have fewer than 6 moves
 * 5. If replaceIndex is set, it must be a valid index (0 to currentMoves.length - 1)
 *
 * PTU Core p.200: Maximum 6 moves from all sources combined.
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Pokemon ID is required' })
  }

  if (!body?.moveName || typeof body.moveName !== 'string') {
    throw createError({ statusCode: 400, message: 'moveName is required' })
  }

  const replaceIndex = body.replaceIndex !== undefined && body.replaceIndex !== null
    ? body.replaceIndex
    : null

  if (replaceIndex !== null && (typeof replaceIndex !== 'number' || !Number.isInteger(replaceIndex))) {
    throw createError({ statusCode: 400, message: 'replaceIndex must be an integer or null' })
  }

  try {
    // Fetch Pokemon
    const pokemon = await prisma.pokemon.findUnique({
      where: { id }
    })

    if (!pokemon) {
      throw createError({ statusCode: 404, message: 'Pokemon not found' })
    }

    const currentMoves = JSON.parse(pokemon.moves || '[]') as Array<Record<string, unknown>>

    // Validate not already known
    if (currentMoves.some((m) => m.name === body.moveName)) {
      throw createError({
        statusCode: 400,
        message: `Pokemon already knows ${body.moveName}`
      })
    }

    // Fetch move data
    const moveData = await prisma.moveData.findUnique({
      where: { name: body.moveName }
    })

    if (!moveData) {
      throw createError({
        statusCode: 404,
        message: `Move ${body.moveName} not found in MoveData`
      })
    }

    const newMove = {
      id: moveData.id,
      name: moveData.name,
      type: moveData.type,
      damageClass: moveData.damageClass,
      frequency: moveData.frequency,
      ac: moveData.ac,
      damageBase: moveData.damageBase,
      range: moveData.range,
      effect: moveData.effect
    }

    let updatedMoves: Array<Record<string, unknown>>

    if (replaceIndex !== null) {
      // Replace existing move
      if (replaceIndex < 0 || replaceIndex >= currentMoves.length) {
        throw createError({
          statusCode: 400,
          message: `Invalid move index ${replaceIndex}. Must be 0-${currentMoves.length - 1}.`
        })
      }
      updatedMoves = currentMoves.map((m, i) =>
        i === replaceIndex ? newMove : m
      )
    } else {
      // Add to empty slot
      if (currentMoves.length >= 6) {
        throw createError({
          statusCode: 400,
          message: 'Pokemon already has 6 moves. Specify replaceIndex to replace one.'
        })
      }
      updatedMoves = [...currentMoves, newMove]
    }

    // Update Pokemon
    const updated = await prisma.pokemon.update({
      where: { id },
      data: { moves: JSON.stringify(updatedMoves) }
    })

    return {
      success: true,
      data: {
        id: updated.id,
        learnedMove: newMove,
        replacedIndex: replaceIndex,
        totalMoves: updatedMoves.length
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to learn move'
    throw createError({ statusCode: 500, message })
  }
})
