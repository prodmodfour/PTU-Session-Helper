/**
 * P1 Healing Mechanic: Rest HP Calculation
 *
 * Tests the PTU rest healing formula: max(1, floor(maxHp / 16))
 * across 5 Pokemon with different maxHp values.
 *
 * Assertions:
 *   1. High HP (maxHp=60): heals 3
 *   2. Mid HP (maxHp=45): heals 2
 *   3. Low HP (maxHp=23): heals 1
 *   4. Min HP (maxHp=23): heals 1
 *   5. Near-cap (39/40): heals 1 (capped at deficit)
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  restPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

// Geodude: maxHp = 20 + 30 + 10 = 60
const highHpSetup: PokemonSetup = {
  species: 'Geodude', level: 20, baseHp: 10, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

// Oddish: maxHp = 20 + 15 + 10 = 45
const midHpSetup: PokemonSetup = {
  species: 'Oddish', level: 20, baseHp: 5, baseAttack: 5,
  baseDefense: 6, baseSpAtk: 8, baseSpDef: 7, baseSpeed: 3,
  types: ['Grass', 'Poison']
}

// Pikachu: maxHp = 1 + 12 + 10 = 23
const lowHpSetup: PokemonSetup = {
  species: 'Pikachu', level: 1, baseHp: 4, baseAttack: 6,
  baseDefense: 3, baseSpAtk: 5, baseSpDef: 4, baseSpeed: 9,
  types: ['Electric']
}

// Caterpie: maxHp = 1 + 12 + 10 = 23
const minHpSetup: PokemonSetup = {
  species: 'Caterpie', level: 1, baseHp: 4, baseAttack: 3,
  baseDefense: 4, baseSpAtk: 2, baseSpDef: 2, baseSpeed: 4,
  types: ['Bug']
}

// Bulbasaur: maxHp = 15 + 15 + 10 = 40
const capHpSetup: PokemonSetup = {
  species: 'Bulbasaur', level: 15, baseHp: 5, baseAttack: 5,
  baseDefense: 5, baseSpAtk: 7, baseSpDef: 7, baseSpeed: 5,
  types: ['Grass', 'Poison']
}

test.describe('P1: Rest HP Calculation', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('high HP (maxHp=60): heals 3 per rest', async ({ request }) => {
    const id = await createPokemon(request, highHpSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { currentHp: 40 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(60/16)) = max(1, 3) = 3
    expect(result.data.hpHealed).toBe(3)
    expect(result.data.newHp).toBe(43)
  })

  test('mid HP (maxHp=45): heals 2 per rest', async ({ request }) => {
    const id = await createPokemon(request, midHpSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { currentHp: 30 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(45/16)) = max(1, 2) = 2
    expect(result.data.hpHealed).toBe(2)
    expect(result.data.newHp).toBe(32)
  })

  test('low HP (maxHp=23): heals 1 per rest', async ({ request }) => {
    const id = await createPokemon(request, lowHpSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { currentHp: 15 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(23/16)) = max(1, 1) = 1
    expect(result.data.hpHealed).toBe(1)
    expect(result.data.newHp).toBe(16)
  })

  test('min HP (maxHp=23): heals minimum 1 per rest', async ({ request }) => {
    const id = await createPokemon(request, minHpSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { currentHp: 5 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(23/16)) = max(1, 1) = 1
    expect(result.data.hpHealed).toBe(1)
    expect(result.data.newHp).toBe(6)
  })

  test('near-cap HP (39/40): heals only 1 (capped at deficit)', async ({ request }) => {
    const id = await createPokemon(request, capHpSetup)
    pokemonIds.push(id)
    await updatePokemon(request, id, { currentHp: 39 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // formula says 2, but deficit is 1 → actual heal = min(2, 1) = 1
    expect(result.data.hpHealed).toBe(1)
    expect(result.data.newHp).toBe(40)
  })
})
