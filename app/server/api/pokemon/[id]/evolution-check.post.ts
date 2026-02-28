/**
 * POST /api/pokemon/:id/evolution-check
 *
 * Check which evolutions are available for a Pokemon based on its
 * current state (level, held item) and species evolution triggers.
 *
 * Returns available and ineligible evolutions with reasons.
 * No side effects — read-only check.
 *
 * PTU Core Chapter 5, p.202
 */
import { prisma } from '~/server/utils/prisma'
import { checkEvolutionEligibility } from '~/utils/evolutionCheck'
import type { EvolutionTrigger } from '~/types/species'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Pokemon ID is required'
    })
  }

  try {
    // Fetch Pokemon
    const pokemon = await prisma.pokemon.findUnique({
      where: { id },
      select: {
        id: true,
        species: true,
        level: true,
        heldItem: true
      }
    })

    if (!pokemon) {
      throw createError({
        statusCode: 404,
        message: 'Pokemon not found'
      })
    }

    // Fetch SpeciesData for evolution triggers
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species },
      select: { evolutionTriggers: true }
    })

    if (!speciesData) {
      throw createError({
        statusCode: 404,
        message: `Species data not found for ${pokemon.species}`
      })
    }

    // Parse triggers
    let triggers: EvolutionTrigger[] = []
    try {
      triggers = JSON.parse(speciesData.evolutionTriggers || '[]')
    } catch {
      triggers = []
    }

    // Check eligibility
    const result = checkEvolutionEligibility({
      currentLevel: pokemon.level,
      heldItem: pokemon.heldItem,
      evolutionTriggers: triggers
    })

    return {
      success: true,
      data: {
        pokemonId: pokemon.id,
        currentSpecies: pokemon.species,
        currentLevel: pokemon.level,
        heldItem: pokemon.heldItem,
        available: result.available.map(a => ({
          toSpecies: a.toSpecies,
          targetStage: a.trigger.targetStage,
          minimumLevel: a.trigger.minimumLevel,
          requiredItem: a.trigger.requiredItem,
          itemMustBeHeld: a.trigger.itemMustBeHeld
        })),
        ineligible: result.ineligible.map(i => ({
          toSpecies: i.toSpecies,
          reason: i.reason
        }))
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to check evolution eligibility'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
