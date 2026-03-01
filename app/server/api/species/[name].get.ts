/**
 * GET /api/species/:name
 *
 * Fetch a single species by name from SpeciesData.
 * Returns full species record including abilities and numBasicAbilities.
 */

import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')

  if (!name) {
    throw createError({ statusCode: 400, message: 'Species name is required' })
  }

  try {
    const species = await prisma.speciesData.findUnique({
      where: { name }
    })

    if (!species) {
      throw createError({
        statusCode: 404,
        message: `Species ${name} not found`
      })
    }

    return {
      success: true,
      data: {
        id: species.id,
        name: species.name,
        type1: species.type1,
        type2: species.type2,
        abilities: species.abilities,
        numBasicAbilities: species.numBasicAbilities,
        learnset: species.learnset,
        baseHp: species.baseHp,
        baseAttack: species.baseAttack,
        baseDefense: species.baseDefense,
        baseSpAtk: species.baseSpAtk,
        baseSpDef: species.baseSpDef,
        baseSpeed: species.baseSpeed,
        evolutionStage: species.evolutionStage,
        maxEvolutionStage: species.maxEvolutionStage
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to fetch species'
    throw createError({ statusCode: 500, message })
  }
})
