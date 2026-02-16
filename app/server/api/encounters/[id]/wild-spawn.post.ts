/**
 * Spawn wild Pokemon into an encounter
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { generateAndCreatePokemon, buildPokemonCombatant } from '~/server/services/pokemon-generator.service'
import { sizeToTokenSize, buildOccupiedCellsSet, findPlacementPosition } from '~/server/services/grid-placement.service'

interface WildPokemonInput {
  speciesId?: string
  speciesName: string
  level: number
}

export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!encounterId) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  const wildPokemon: WildPokemonInput[] = body.pokemon || []
  const side = body.side || 'enemies'

  if (wildPokemon.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one Pokemon is required'
    })
  }

  try {
    const { record, combatants } = await loadEncounter(encounterId)
    const createdPokemon: Array<{
      pokemonId: string
      combatantId: string
      species: string
      level: number
    }> = []

    // Grid dimensions for auto-placement
    const gridWidth = record.gridWidth || 20
    const gridHeight = record.gridHeight || 15
    const occupiedCells = buildOccupiedCellsSet(combatants)

    // Process each wild Pokemon
    for (const wild of wildPokemon) {
      const created = await generateAndCreatePokemon({
        speciesName: wild.speciesName,
        level: wild.level,
        origin: 'wild',
        originLabel: 'Wild Pokemon - generated from encounter table'
      })

      const tokenSize = sizeToTokenSize(created.data.size)
      const position = findPlacementPosition(occupiedCells, side, tokenSize, gridWidth, gridHeight)

      const combatant = buildPokemonCombatant(created, side, position)

      ;(combatants as unknown[]).push(combatant)
      createdPokemon.push({
        pokemonId: created.id,
        combatantId: combatant.id,
        species: created.species,
        level: created.level
      })
    }

    // Update encounter with new combatants
    await prisma.encounter.update({
      where: { id: encounterId },
      data: { combatants: JSON.stringify(combatants) }
    })

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: {
        encounter: response,
        addedPokemon: createdPokemon
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to spawn wild Pokemon'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
