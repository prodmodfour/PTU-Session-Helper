/**
 * POST /api/pokemon/:id/level-up-check
 *
 * Returns level-up information for a Pokemon transitioning from its current
 * level to a target level. Checks learnset for new moves, ability milestones,
 * tutor points, and stat point reminders.
 *
 * Body: { targetLevel: number }
 * Returns: { success: true, data: LevelUpSummary }
 */
import { prisma } from '~/server/utils/prisma'
import { checkLevelUp, summarizeLevelUps } from '~/utils/levelUpCheck'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Pokemon ID is required' })
  }

  const targetLevel = body?.targetLevel
  if (typeof targetLevel !== 'number' || targetLevel < 1 || targetLevel > 100) {
    throw createError({ statusCode: 400, message: 'targetLevel must be a number between 1 and 100' })
  }

  try {
    // Fetch the Pokemon's current level and species
    const pokemon = await prisma.pokemon.findUnique({
      where: { id },
      select: { level: true, species: true }
    })

    if (!pokemon) {
      throw createError({ statusCode: 404, message: 'Pokemon not found' })
    }

    if (targetLevel <= pokemon.level) {
      return {
        success: true,
        data: {
          currentLevel: pokemon.level,
          targetLevel,
          totalStatPoints: 0,
          allNewMoves: [],
          abilityMilestones: [],
          totalTutorPoints: 0,
          speciesFound: true
        }
      }
    }

    // Look up species data for learnset
    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species },
      select: { learnset: true }
    })

    const learnset = speciesData?.learnset
      ? JSON.parse(speciesData.learnset)
      : []

    const levelUpInfos = checkLevelUp({
      oldLevel: pokemon.level,
      newLevel: targetLevel,
      learnset
    })

    const summary = summarizeLevelUps(levelUpInfos)

    return {
      success: true,
      data: {
        currentLevel: pokemon.level,
        targetLevel,
        ...summary,
        speciesFound: !!speciesData
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to check level-up info'
    })
  }
})
