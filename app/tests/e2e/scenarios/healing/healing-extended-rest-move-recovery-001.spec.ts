/**
 * P1 Healing Mechanic: Extended Rest Move Recovery
 *
 * Tests that extended rest resets move usage counters:
 *   - All moves: usedToday reset to 0
 *   - Daily moves: usedThisScene ALSO reset to 0
 *   - Non-daily moves: usedThisScene preserved
 *
 * Assertions:
 *   1. Daily moves reported in restoredMoves
 *   2. All moves have usedToday = 0
 *   3. Daily moves have usedThisScene = 0, non-daily retain usedThisScene
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  getPokemon,
  extendedRestPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur',
  level: 15,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 5,
  baseSpAtk: 7,
  baseSpDef: 7,
  baseSpeed: 5,
  types: ['Grass', 'Poison'],
  moves: [
    { name: 'Tackle', type: 'Normal', frequency: 'At-Will', db: 5, ac: 2, damageClass: 'Physical', usedToday: 4, usedThisScene: 2 },
    { name: 'Leech Seed', type: 'Grass', frequency: 'EOT', db: 0, ac: 4, damageClass: 'Status', usedToday: 2, usedThisScene: 1 },
    { name: 'Sleep Powder', type: 'Grass', frequency: 'Daily x2', db: 0, ac: 6, damageClass: 'Status', usedToday: 2, usedThisScene: 1 },
    { name: 'Solar Beam', type: 'Grass', frequency: 'Daily x1', db: 12, ac: 2, damageClass: 'Special', usedToday: 1, usedThisScene: 1 }
  ]
}

test.describe('P1: Extended Rest Move Recovery', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('extended rest resets move usage: daily fully reset, non-daily preserve usedThisScene', async ({ request }) => {
    const pokemonId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(pokemonId)

    // Verify pre-rest state: moves have usage counters
    const preRest = await getPokemon(request, pokemonId)
    const preRestMoves = preRest.moves
    const preTackle = preRestMoves.find((m: any) => m.name === 'Tackle')
    const preSleepPowder = preRestMoves.find((m: any) => m.name === 'Sleep Powder')
    expect(preTackle.usedToday).toBe(4)
    expect(preSleepPowder.usedToday).toBe(2)

    // Apply extended rest
    const result = await extendedRestPokemon(request, pokemonId)
    expect(result.success).toBe(true)

    // Assertion 1: Daily moves reported in restoredMoves
    expect(result.data.restoredMoves).toContain('Sleep Powder')
    expect(result.data.restoredMoves).toContain('Solar Beam')

    // Verify via GET
    const postRest = await getPokemon(request, pokemonId)
    const moves = postRest.moves

    const tackle = moves.find((m: any) => m.name === 'Tackle')
    const leechSeed = moves.find((m: any) => m.name === 'Leech Seed')
    const sleepPowder = moves.find((m: any) => m.name === 'Sleep Powder')
    const solarBeam = moves.find((m: any) => m.name === 'Solar Beam')

    // Assertion 2: All moves have usedToday = 0
    expect(tackle.usedToday).toBe(0)
    expect(leechSeed.usedToday).toBe(0)
    expect(sleepPowder.usedToday).toBe(0)
    expect(solarBeam.usedToday).toBe(0)

    // Assertion 3: Daily moves also have usedThisScene = 0
    expect(sleepPowder.usedThisScene).toBe(0)
    expect(solarBeam.usedThisScene).toBe(0)

    // Non-daily moves retain usedThisScene
    expect(tackle.usedThisScene).toBe(2)
    expect(leechSeed.usedThisScene).toBe(1)
  })
})
