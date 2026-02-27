import { prisma } from '~/server/utils/prisma'
import { isDailyMoveRefreshable } from '~/utils/restHealing'
import type { Move } from '~/types/character'

/**
 * Result of refreshing daily moves on a single Pokemon.
 */
export interface DailyMoveRefreshResult {
  pokemonId: string
  pokemonName: string
  restoredMoves: string[]
  skippedMoves: string[]
}

/**
 * Refresh daily-frequency moves on a single Pokemon during Extended Rest.
 *
 * PTU Core p.252: "Daily-Frequency Moves are also regained during an
 * Extended Rest, if the Move hasn't been used since the previous day."
 *
 * Rolling window rule: A move used today cannot be refreshed by tonight's
 * Extended Rest. Only moves used before today are eligible.
 *
 * @param moves - The Pokemon's current moves array (parsed from JSON)
 * @returns Object with updated moves array and tracking of which were restored/skipped
 */
export function refreshDailyMoves(moves: Move[]): {
  updatedMoves: Move[]
  restoredMoves: string[]
  skippedMoves: string[]
} {
  const restoredMoves: string[] = []
  const skippedMoves: string[] = []

  const updatedMoves = moves.map(move => {
    const isDailyMove = move.frequency?.startsWith('Daily')

    if (isDailyMove && move.usedToday && move.usedToday > 0) {
      // Rolling window (PTU Core p.252): only refresh if not used today
      if (isDailyMoveRefreshable(move.lastUsedAt)) {
        restoredMoves.push(move.name)
        return {
          ...move,
          usedToday: 0,
          lastUsedAt: undefined,
          // Also reset scene usage for refreshed daily moves
          usedThisScene: 0
        }
      } else {
        skippedMoves.push(move.name)
        return move
      }
    }

    return move
  })

  return { updatedMoves, restoredMoves, skippedMoves }
}

/**
 * Refresh daily moves for all Pokemon owned by a character.
 *
 * Used by the character extended-rest endpoint: when a trainer rests,
 * their Pokemon's daily moves are also refreshed per PTU Core p.252.
 *
 * @param characterId - The owning character's ID
 * @returns Array of refresh results per Pokemon
 */
export async function refreshDailyMovesForOwnedPokemon(
  characterId: string
): Promise<DailyMoveRefreshResult[]> {
  const ownedPokemon = await prisma.pokemon.findMany({
    where: { ownerId: characterId },
    select: { id: true, species: true, nickname: true, moves: true }
  })

  if (ownedPokemon.length === 0) {
    return []
  }

  const results: DailyMoveRefreshResult[] = []
  const updatePromises: Promise<unknown>[] = []

  for (const pokemon of ownedPokemon) {
    const moves: Move[] = JSON.parse(pokemon.moves || '[]')
    const { updatedMoves, restoredMoves, skippedMoves } = refreshDailyMoves(moves)

    const pokemonName = pokemon.nickname || pokemon.species

    // Only write back if something actually changed
    if (restoredMoves.length > 0) {
      updatePromises.push(
        prisma.pokemon.update({
          where: { id: pokemon.id },
          data: { moves: JSON.stringify(updatedMoves) }
        })
      )
    }

    // Track results even if nothing changed (for reporting)
    if (restoredMoves.length > 0 || skippedMoves.length > 0) {
      results.push({
        pokemonId: pokemon.id,
        pokemonName,
        restoredMoves,
        skippedMoves
      })
    }
  }

  await Promise.all(updatePromises)

  return results
}
