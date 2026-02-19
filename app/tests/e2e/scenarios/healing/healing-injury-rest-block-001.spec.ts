/**
 * P1 Healing Mechanic: 5+ Injuries Blocks Rest Healing
 *
 * Tests the PTU rule that Pokemon with 5 or more injuries
 * cannot benefit from rest healing.
 *
 * Pokemon: Geodude (level 15, baseHp 4, maxHp = 15 + 12 + 10 = 37)
 * Formula: max(1, floor(37/16)) = max(1, 2) = 2
 *
 * Assertions:
 *   1. injuries=4: rest succeeds (below threshold), heals 2 HP
 *   2. injuries=5: rest fails (at threshold)
 *   3. injuries=7: rest fails (above threshold)
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  restPokemon,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

// Geodude: maxHp = 15 + (4 * 3) + 10 = 37
const geodudeSetup: PokemonSetup = {
  species: 'Geodude', level: 15, baseHp: 4, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

test.describe('P1: 5+ Injuries Blocks Rest Healing', () => {
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [])
    pokemonIds.length = 0
  })

  test('injuries=4: rest succeeds (below threshold), heals 2 HP', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 4, currentHp: 20 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(true)
    // max(1, floor(37/16)) = max(1, 2) = 2
    expect(result.data.hpHealed).toBe(2)
    expect(result.data.newHp).toBe(22)
  })

  test('injuries=5: rest fails (at threshold)', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 5, currentHp: 20, restMinutesToday: 0 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(false)
    expect(result.data.hpHealed).toBe(0)
    expect(result.message.toLowerCase()).toMatch(/injur/)
  })

  test('injuries=7: rest fails (well above threshold)', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    await updatePokemon(request, id, { injuries: 7, currentHp: 20, restMinutesToday: 0 })

    const result = await restPokemon(request, id)
    expect(result.success).toBe(false)
    expect(result.data.hpHealed).toBe(0)
    expect(result.message.toLowerCase()).toMatch(/injur/)
  })
})
