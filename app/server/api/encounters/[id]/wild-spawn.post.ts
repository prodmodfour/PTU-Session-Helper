/**
 * Spawn wild Pokemon into an encounter
 */
import { prisma } from '~/server/utils/prisma'
import { loadEncounter, buildEncounterResponse } from '~/server/services/encounter.service'
import { generateAndCreatePokemon, buildPokemonCombatant } from '~/server/services/pokemon-generator.service'

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

    // Build a set of all occupied cells
    const occupiedCells = new Set<string>()
    for (const c of combatants) {
      if (!c.position) continue
      const size = c.tokenSize || 1
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          occupiedCells.add(`${c.position.x + dx},${c.position.y + dy}`)
        }
      }
    }

    // Check if a position can fit a token of given size
    const canFit = (x: number, y: number, size: number): boolean => {
      if (x + size > gridWidth || y + size > gridHeight) return false
      for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
          if (occupiedCells.has(`${x + dx},${y + dy}`)) return false
        }
      }
      return true
    }

    // Side positions for auto-placement
    const sidePositions = {
      players: { startX: 1, endX: 4 },
      allies: { startX: 5, endX: 8 },
      enemies: { startX: gridWidth - 5, endX: gridWidth - 1 }
    }

    // Process each wild Pokemon
    for (const wild of wildPokemon) {
      const created = await generateAndCreatePokemon({
        speciesName: wild.speciesName,
        level: wild.level,
        origin: 'wild',
        originLabel: 'Wild Pokemon - generated from encounter table'
      })

      const tokenSize = 1

      // Find position for this combatant
      const sideConfig = sidePositions[side as keyof typeof sidePositions] || sidePositions.enemies
      let position = { x: sideConfig.startX, y: 1 }
      let found = false

      for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
        for (let x = sideConfig.startX; x <= sideConfig.endX - tokenSize + 1 && !found; x++) {
          if (canFit(x, y, tokenSize)) {
            position = { x, y }
            found = true
          }
        }
      }

      // If no position found in designated area, try anywhere
      if (!found) {
        for (let y = 1; y < gridHeight - tokenSize + 1 && !found; y++) {
          for (let x = 1; x < gridWidth - tokenSize + 1 && !found; x++) {
            if (canFit(x, y, tokenSize)) {
              position = { x, y }
              found = true
            }
          }
        }
      }

      // Mark this position as occupied
      for (let dx = 0; dx < tokenSize; dx++) {
        for (let dy = 0; dy < tokenSize; dy++) {
          occupiedCells.add(`${position.x + dx},${position.y + dy}`)
        }
      }

      const combatant = buildPokemonCombatant(created, side, position, tokenSize)

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
