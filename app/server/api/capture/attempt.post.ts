import { prisma } from '~/server/utils/prisma'
import { calculateCaptureRate, attemptCapture, getCaptureDescription } from '~/utils/captureRate'
import { isLegendarySpecies } from '~/constants/legendarySpecies'
import { POKE_BALL_CATALOG, DEFAULT_BALL_TYPE, calculateBallModifier } from '~/constants/pokeBalls'
import { applyTrainerXp, isNewSpecies } from '~/utils/trainerExperience'
import type { TrainerXpResult } from '~/utils/trainerExperience'
import { broadcast } from '~/server/utils/websocket'
import type { StatusCondition } from '~/types'

interface CaptureAttemptRequest {
  pokemonId: string
  trainerId: string
  accuracyRoll?: number  // The accuracy check roll (to detect nat 20)
  ballType?: string      // Key in POKE_BALL_CATALOG (default: 'Basic Ball')
  modifiers?: number     // Additional non-ball modifiers (features, equipment)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CaptureAttemptRequest>(event)

  if (!body.pokemonId || !body.trainerId) {
    throw createError({
      statusCode: 400,
      message: 'pokemonId and trainerId are required'
    })
  }

  // Look up Pokemon
  const pokemon = await prisma.pokemon.findUnique({
    where: { id: body.pokemonId }
  })

  if (!pokemon) {
    throw createError({
      statusCode: 404,
      message: 'Pokemon not found'
    })
  }

  // PTU capture rules target wild Pokemon only — owned Pokemon cannot be captured
  if (pokemon.ownerId) {
    throw createError({
      statusCode: 400,
      message: 'Cannot capture an owned Pokemon'
    })
  }

  // Look up Trainer
  const trainer = await prisma.humanCharacter.findUnique({
    where: { id: body.trainerId }
  })

  if (!trainer) {
    throw createError({
      statusCode: 404,
      message: 'Trainer not found'
    })
  }

  // Get species data for evolution info
  const speciesData = await prisma.speciesData.findUnique({
    where: { name: pokemon.species }
  })

  const evolutionStage = speciesData?.evolutionStage || 1
  const maxEvolutionStage = speciesData?.maxEvolutionStage || evolutionStage

  // Legendary detection: auto-detect from species name
  const isLegendary = isLegendarySpecies(pokemon.species)

  // Calculate capture rate
  const rateResult = calculateCaptureRate({
    level: pokemon.level,
    currentHp: pokemon.currentHp,
    maxHp: pokemon.maxHp,
    evolutionStage,
    maxEvolutionStage,
    statusConditions: JSON.parse(pokemon.statusConditions || '[]') as StatusCondition[],
    injuries: pokemon.injuries || 0,
    isShiny: pokemon.shiny || false,
    isLegendary
  })

  // Check if capture is possible
  if (!rateResult.canBeCaptured) {
    return {
      success: false,
      data: {
        captured: false,
        reason: 'Pokemon is at 0 HP and cannot be captured',
        captureRate: rateResult.captureRate,
        difficulty: getCaptureDescription(rateResult.captureRate)
      }
    }
  }

  // Was the accuracy check a critical hit (natural 20)?
  const criticalHit = body.accuracyRoll === 20

  // Ball type resolution and validation
  const ballType = body.ballType || DEFAULT_BALL_TYPE
  const ballDef = POKE_BALL_CATALOG[ballType]

  if (body.ballType && !ballDef) {
    throw createError({
      statusCode: 400,
      message: `Unknown ball type: ${body.ballType}`
    })
  }

  const ballResult = calculateBallModifier(ballType)

  // Attempt capture with ball modifier separated from other modifiers
  const captureResult = attemptCapture(
    rateResult.captureRate,
    trainer.level,
    body.modifiers || 0,
    criticalHit,
    ballResult.total
  )

  // Track species XP data for the response
  let speciesXpAwarded = false
  let speciesXpResult: TrainerXpResult | null = null

  // If captured, auto-link Pokemon to trainer and update origin
  if (captureResult.success) {
    await prisma.pokemon.update({
      where: { id: body.pokemonId },
      data: {
        ownerId: body.trainerId,
        origin: 'captured'
      }
    })

    // Check for new species -> +1 trainer XP (PTU Core p.461)
    const trainerRecord = await prisma.humanCharacter.findUnique({
      where: { id: body.trainerId },
      select: { capturedSpecies: true, trainerXp: true, level: true, name: true }
    })

    if (trainerRecord) {
      const existingSpecies: string[] = JSON.parse(trainerRecord.capturedSpecies || '[]')
      const normalizedSpecies = pokemon.species.toLowerCase().trim()

      if (isNewSpecies(pokemon.species, existingSpecies)) {
        const updatedSpecies = [...existingSpecies, normalizedSpecies]

        const xpCalc = applyTrainerXp({
          currentXp: trainerRecord.trainerXp,
          currentLevel: trainerRecord.level,
          xpToAdd: 1
        })

        await prisma.humanCharacter.update({
          where: { id: body.trainerId },
          data: {
            capturedSpecies: JSON.stringify(updatedSpecies),
            trainerXp: xpCalc.newXp,
            level: xpCalc.newLevel
          }
        })

        speciesXpAwarded = true
        speciesXpResult = xpCalc

        if (xpCalc.levelsGained > 0) {
          broadcast({ type: 'character_update', data: { characterId: body.trainerId } })
        }
      }
    }
  }

  return {
    success: true,
    data: {
      captured: captureResult.success,
      roll: captureResult.roll,
      modifiedRoll: captureResult.modifiedRoll,
      captureRate: rateResult.captureRate,
      effectiveCaptureRate: captureResult.effectiveCaptureRate,
      naturalHundred: captureResult.naturalHundred,
      criticalHit,
      trainerLevel: trainer.level,
      modifiers: body.modifiers || 0,
      ballModifier: ballResult.total,
      ballType,
      difficulty: getCaptureDescription(rateResult.captureRate),
      breakdown: rateResult.breakdown,
      ballBreakdown: {
        baseModifier: ballResult.base,
        conditionalModifier: ballResult.conditional,
        conditionMet: ballResult.conditionMet,
        conditionDescription: ballDef?.conditionDescription,
      },
      pokemon: {
        id: pokemon.id,
        species: pokemon.species,
        level: pokemon.level,
        currentHp: pokemon.currentHp,
        maxHp: pokemon.maxHp,
        hpPercentage: Math.round(rateResult.hpPercentage),
        ownerId: captureResult.success ? body.trainerId : pokemon.ownerId,
        origin: captureResult.success ? 'captured' : pokemon.origin
      },
      trainer: {
        id: trainer.id,
        name: trainer.name,
        level: trainer.level
      },
      speciesXp: captureResult.success ? {
        awarded: speciesXpAwarded,
        species: pokemon.species,
        xpResult: speciesXpResult
      } : undefined
    }
  }
})
