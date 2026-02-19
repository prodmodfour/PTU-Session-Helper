/**
 * P1 Healing Mechanic: Daily Injury Healing Cap of 3
 *
 * Tests the PTU rule that no more than 3 injuries can be healed
 * from all sources in a single day.
 *
 * Pokemon: Geodude (level 15, baseHp 4, maxHp = 15 + 12 + 10 = 37)
 * Character: Trainer Oak (level 12, hp 5, maxHp = (12*2) + (5*3) + 10 = 49)
 *
 * Assertions:
 *   1. Pokemon injuries=5, healed=0 -> pokemon-center heals 3, remaining=2
 *   2. Pokemon injuries=4, healed=2 -> pokemon-center heals 1, remaining=3
 *   3. Pokemon injuries=3, healed=3 -> pokemon-center heals 0, atDailyInjuryLimit=true
 *   4. Character injuries=2, healed=3 -> heal-injury (drain_ap) fails
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  updatePokemon,
  pokemonCenterPokemon,
  createCharacter,
  updateCharacter,
  healInjuryCharacter,
  cleanupHealing,
  type PokemonSetup,
  type CharacterSetup
} from './healing-helpers'

// Geodude: maxHp = 15 + (4 * 3) + 10 = 37
const geodudeSetup: PokemonSetup = {
  species: 'Geodude', level: 15, baseHp: 4, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

// Trainer Oak: maxHp = (12 * 2) + (5 * 3) + 10 = 49
const trainerOakSetup: CharacterSetup = {
  name: 'Trainer Oak',
  level: 12,
  hp: 5,
  characterType: 'npc',
  maxHp: 49,
  currentHp: 49
}

test.describe('P1: Daily Injury Healing Cap (3/day)', () => {
  const pokemonIds: string[] = []
  const characterIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, characterIds)
    pokemonIds.length = 0
    characterIds.length = 0
  })

  test('pokemon injuries=5, healed=0: pokemon-center heals 3, remaining=2', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      injuries: 5,
      injuriesHealedToday: 0,
      lastRestReset: now,
      currentHp: 10
    })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.injuriesHealed).toBe(3)
    expect(result.data.injuriesRemaining).toBe(2)
  })

  test('pokemon injuries=4, healed=2: pokemon-center heals 1, remaining=3', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      injuries: 4,
      injuriesHealedToday: 2,
      lastRestReset: now,
      currentHp: 10
    })

    const result = await pokemonCenterPokemon(request, id)
    expect(result.success).toBe(true)
    expect(result.data.injuriesHealed).toBe(1)
    expect(result.data.injuriesRemaining).toBe(3)
  })

  test('pokemon injuries=3, healed=3: pokemon-center heals 0 injuries, atDailyInjuryLimit=true', async ({ request }) => {
    const id = await createPokemon(request, geodudeSetup)
    pokemonIds.push(id)

    const now = new Date().toISOString()
    await updatePokemon(request, id, {
      injuries: 3,
      injuriesHealedToday: 3,
      lastRestReset: now,
      currentHp: 10
    })

    const result = await pokemonCenterPokemon(request, id)
    // Pokemon Center still succeeds (heals HP and status), just can't heal injuries
    expect(result.success).toBe(true)
    expect(result.data.injuriesHealed).toBe(0)
    expect(result.data.injuriesRemaining).toBe(3)
    expect(result.data.atDailyInjuryLimit).toBe(true)
  })

  test('character injuries=2, healed=3: drain_ap fails at daily limit', async ({ request }) => {
    const charId = await createCharacter(request, trainerOakSetup)
    characterIds.push(charId)

    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    const now = new Date().toISOString()
    await updateCharacter(request, charId, {
      injuries: 2,
      injuriesHealedToday: 3,
      lastInjuryTime: twentyFiveHoursAgo,
      lastRestReset: now
    })

    const result = await healInjuryCharacter(request, charId, 'drain_ap')
    expect(result.success).toBe(false)
    expect(result.message.toLowerCase()).toMatch(/daily|3\/day|limit/)
  })
})
