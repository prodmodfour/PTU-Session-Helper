/**
 * P1 Healing Mechanic: Extended Rest Status Clearing
 *
 * Tests that extended rest clears persistent status conditions
 * but preserves volatile and other conditions.
 *
 * PTU Status Classification:
 *   Persistent (cleared): Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned
 *   Volatile (kept): Confused, Enraged, Asleep, Flinched, Suppressed
 *   Other (kept): Slowed, Stuck, Trapped, Tripped, Vulnerable, Fainted
 *
 * Assertions:
 *   1. Mixed: Burned cleared, Confused survives
 *   2. All persistent: Frozen, Paralyzed, Poisoned all cleared
 *   3. No persistent: nothing cleared (Asleep, Flinched, Stuck survive)
 *   4. Badly Poisoned cleared, Enraged + Slowed survive
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  getPokemon,
  extendedRestPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur', level: 15, baseHp: 5, baseAttack: 5,
  baseDefense: 5, baseSpAtk: 7, baseSpDef: 7, baseSpeed: 5,
  types: ['Grass', 'Poison']
}

const oddishSetup: PokemonSetup = {
  species: 'Oddish', level: 10, baseHp: 5, baseAttack: 5,
  baseDefense: 6, baseSpAtk: 8, baseSpDef: 7, baseSpeed: 3,
  types: ['Grass', 'Poison']
}

const geodudeSetup: PokemonSetup = {
  species: 'Geodude', level: 12, baseHp: 4, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

const pikachuSetup: PokemonSetup = {
  species: 'Pikachu', level: 10, baseHp: 4, baseAttack: 6,
  baseDefense: 3, baseSpAtk: 5, baseSpDef: 4, baseSpeed: 9,
  types: ['Electric']
}

test.describe('P1: Extended Rest Status Clearing', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('Burned (persistent) cleared, Confused (volatile) survives', async ({ request }) => {
    const id = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { statusConditions: ['Burned', 'Confused'] })

    const result = await extendedRestPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.clearedStatuses).toContain('Burned')
    expect(result.data.clearedStatuses).not.toContain('Confused')

    // Verify via GET
    const pokemon = await getPokemon(request, id)
    expect(pokemon.statusConditions).toContain('Confused')
    expect(pokemon.statusConditions).not.toContain('Burned')
  })

  test('all three persistent conditions cleared', async ({ request }) => {
    const id = await createPokemon(request, oddishSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { statusConditions: ['Frozen', 'Paralyzed', 'Poisoned'] })

    const result = await extendedRestPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.clearedStatuses).toContain('Frozen')
    expect(result.data.clearedStatuses).toContain('Paralyzed')
    expect(result.data.clearedStatuses).toContain('Poisoned')

    const pokemon = await getPokemon(request, id)
    expect(pokemon.statusConditions).toHaveLength(0)
  })

  test('no persistent conditions: nothing cleared', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { statusConditions: ['Asleep', 'Flinched', 'Stuck'] })

    const result = await extendedRestPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.clearedStatuses).toHaveLength(0)

    const pokemon = await getPokemon(request, id)
    expect(pokemon.statusConditions).toContain('Asleep')
    expect(pokemon.statusConditions).toContain('Flinched')
    expect(pokemon.statusConditions).toContain('Stuck')
  })

  test('Badly Poisoned cleared, Enraged + Slowed survive', async ({ request }) => {
    const id = await createPokemon(request, pikachuSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { statusConditions: ['Badly Poisoned', 'Enraged', 'Slowed'] })

    const result = await extendedRestPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.clearedStatuses).toContain('Badly Poisoned')
    expect(result.data.clearedStatuses).not.toContain('Enraged')
    expect(result.data.clearedStatuses).not.toContain('Slowed')

    const pokemon = await getPokemon(request, id)
    expect(pokemon.statusConditions).toContain('Enraged')
    expect(pokemon.statusConditions).toContain('Slowed')
    expect(pokemon.statusConditions).not.toContain('Badly Poisoned')
  })
})
