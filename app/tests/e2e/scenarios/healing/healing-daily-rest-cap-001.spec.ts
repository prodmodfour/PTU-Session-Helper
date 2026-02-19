/**
 * P1 Healing Mechanic: Daily Rest Cap at 480 Minutes
 *
 * Tests the PTU rule that a Pokemon can only benefit from
 * 8 hours (480 minutes) of rest healing per day.
 *
 * Pokemon: Bulbasaur (level 15, baseHp 5, maxHp = 15 + 15 + 10 = 40)
 * Formula: max(1, floor(40/16)) = max(1, 2) = 2
 *
 * Assertions:
 *   1. restMinutesToday=450: rest succeeds, heals 2 HP, rest minutes = 480
 *   2. restMinutesToday=480: rest fails (at cap)
 *   3. restMinutesToday=510: rest fails (above cap)
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  restPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

// Bulbasaur: maxHp = 15 + 15 + 10 = 40
const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur', level: 15, baseHp: 5, baseAttack: 5,
  baseDefense: 5, baseSpAtk: 7, baseSpDef: 7, baseSpeed: 5,
  types: ['Grass', 'Poison']
}

test.describe('P1: Daily Rest Cap (480 minutes)', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('restMinutesToday=450: rest succeeds, caps at 480', async ({ request }) => {
    const id = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      currentHp: 20,
      restMinutesToday: 450,
      lastRestReset: now
    })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(40/16)) = max(1, 2) = 2
    expect(result.data.hpHealed).toBe(2)
    expect(result.data.restMinutesToday).toBe(480)
    expect(result.data.restMinutesRemaining).toBe(0)
  })

  test('restMinutesToday=480: rest fails (at cap)', async ({ request }) => {
    const id = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      currentHp: 20,
      restMinutesToday: 480,
      lastRestReset: now
    })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(false)
    expect(result.data.hpHealed).toBe(0)
    expect(result.message.toLowerCase()).toMatch(/8 hours|rest/)
  })

  test('restMinutesToday=510: rest fails (above cap)', async ({ request }) => {
    const id = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      currentHp: 20,
      restMinutesToday: 510,
      lastRestReset: now
    })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(false)
    expect(result.data.hpHealed).toBe(0)
    expect(result.message.toLowerCase()).toMatch(/8 hours|rest/)
  })
})
