/**
 * P1 Healing Mechanic: Pokemon Center Healing Time Formula
 *
 * Tests the Pokemon Center time calculation:
 *   - Base time: 60 minutes (1 hour)
 *   - <5 injuries: +30 min per injury
 *   - 5+ injuries: +60 min per injury
 *
 * Assertions:
 *   1. No injuries (Bulbasaur): 60 min total, "1 hour"
 *   2. Low injuries (Oddish, 3): 60 + 90 = 150 min, "2 hours 30 min"
 *   3. Threshold (Geodude, 4): 60 + 120 = 180 min, "3 hours"
 *   4. High injuries (Machop, 5): 60 + 300 = 360 min, "6 hours"
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  pokemonCenterPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

// Bulbasaur: maxHp = 15 + 15 + 10 = 40
const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur', level: 15, baseHp: 5, baseAttack: 5,
  baseDefense: 5, baseSpAtk: 7, baseSpDef: 7, baseSpeed: 5,
  types: ['Grass', 'Poison']
}

// Oddish: maxHp = 10 + 15 + 10 = 35
const oddishSetup: PokemonSetup = {
  species: 'Oddish', level: 10, baseHp: 5, baseAttack: 5,
  baseDefense: 6, baseSpAtk: 8, baseSpDef: 7, baseSpeed: 3,
  types: ['Grass', 'Poison']
}

// Geodude: maxHp = 15 + 12 + 10 = 37
const geodudeSetup: PokemonSetup = {
  species: 'Geodude', level: 15, baseHp: 4, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

// Machop: maxHp = 12 + 21 + 10 = 43
const machopSetup: PokemonSetup = {
  species: 'Machop', level: 12, baseHp: 7, baseAttack: 8,
  baseDefense: 5, baseSpAtk: 4, baseSpDef: 4, baseSpeed: 4,
  types: ['Fighting']
}

test.describe('P1: Pokemon Center Healing Time', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('no injuries: base time 60 min, "1 hour"', async ({ request }) => {
    const id = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 0, currentHp: 20 })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.healingTime).toBe(60)
    expect(result.data.healingTimeDescription).toBe('1 hour')
  })

  test('3 injuries: 60 + 90 = 150 min, "2 hours 30 min"', async ({ request }) => {
    const id = await createPokemon(request, oddishSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 3, currentHp: 15 })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.healingTime).toBe(150)
    expect(result.data.healingTimeDescription).toBe('2 hours 30 min')
  })

  test('4 injuries (at threshold): 60 + 120 = 180 min, "3 hours"', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 4, currentHp: 10 })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.healingTime).toBe(180)
    expect(result.data.healingTimeDescription).toBe('3 hours')
  })

  test('5 injuries (above threshold): 60 + 300 = 360 min, "6 hours"', async ({ request }) => {
    const id = await createPokemon(request, machopSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 5, currentHp: 10 })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.healingTime).toBe(360)
    expect(result.data.healingTimeDescription).toBe('6 hours')
  })
})
