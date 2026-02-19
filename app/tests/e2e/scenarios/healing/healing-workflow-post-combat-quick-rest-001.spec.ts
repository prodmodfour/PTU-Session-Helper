/**
 * P0 Healing Workflow: Post-Combat Quick Rest
 *
 * Setup: Bulbasaur (level 15, baseHp 5) → maxHp = 15 + 15 + 10 = 40
 * Damage to currentHp 30 (10 HP lost).
 *
 * PTU Rest Rules:
 *   - 30-minute rest heals max(1, floor(maxHp / 16)) HP
 *   - Tracks restMinutesToday (cumulative)
 *   - Daily cap: 480 minutes (16 rests)
 *
 * Assertions:
 *   1. Pre-rest state: currentHp=30, maxHp=40
 *   2. First rest: heals 2 HP → 32/40
 *   3. Rest minutes tracked: 30 used, 450 remaining
 *   4. Second rest: heals 2 HP → 34/40
 *   5. Cumulative rest minutes: 60 used, 420 remaining
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  getPokemon,
  restPokemon,
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
  types: ['Grass', 'Poison']
}

test.describe('P0: Post-Combat Quick Rest', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('two consecutive 30-minute rests heal correctly and track minutes', async ({ request }) => {
    // Create Bulbasaur (maxHp = 15 + 15 + 10 = 40)
    const pokemonId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(pokemonId)

    // Simulate post-combat damage: reduce to 30 HP
    await updatePokemon(request, pokemonId, { currentHp: 30 })

    // Assertion 1: Pre-rest state
    const preRest = await getPokemon(request, pokemonId)
    expect(preRest.currentHp).toBe(30)
    expect(preRest.maxHp).toBe(40)

    // Assertion 2: First 30-minute rest
    // healAmount = max(1, floor(40 / 16)) = max(1, 2) = 2
    const rest1 = await restPokemon(request, pokemonId)
    expect(rest1.success).toBe(true)
    expect(rest1.data.hpHealed).toBe(2)
    expect(rest1.data.newHp).toBe(32)

    // Assertion 3: Rest minutes tracked
    expect(rest1.data.restMinutesToday).toBe(30)
    expect(rest1.data.restMinutesRemaining).toBe(450)

    // Assertion 4: Second 30-minute rest
    const rest2 = await restPokemon(request, pokemonId)
    expect(rest2.success).toBe(true)
    expect(rest2.data.hpHealed).toBe(2)
    expect(rest2.data.newHp).toBe(34)

    // Assertion 5: Cumulative rest minutes
    expect(rest2.data.restMinutesToday).toBe(60)
    expect(rest2.data.restMinutesRemaining).toBe(420)

    // Post-rest verification via GET
    const postRest = await getPokemon(request, pokemonId)
    expect(postRest.currentHp).toBe(34)
  })
})
