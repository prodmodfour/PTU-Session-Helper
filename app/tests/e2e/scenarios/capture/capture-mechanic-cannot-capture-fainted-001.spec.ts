/**
 * P2 Mechanic: Cannot Capture Fainted Pokemon
 *
 * Tests that both the rate API and attempt API reject capture of fainted
 * (0 HP) Pokemon. Verifies the early-return response shape differs from
 * normal attempts (no roll field).
 *
 * PTU: "Pokemon reduced to 0 Hit Points or less cannot be captured.
 *       Poke Balls will simply fail to attempt to energize them."
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createTrainer,
  updatePokemon,
  getCaptureRate,
  attemptCapture,
  cleanup,
  type PokemonSetup
} from './capture-helpers'

const ODDISH_L5: PokemonSetup = {
  species: 'Oddish',
  level: 5,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 6,
  baseSpAttack: 8,
  baseSpDefense: 7,
  baseSpeed: 3,
  types: ['Grass', 'Poison']
}

test.describe('P2: Cannot Capture Fainted Pokemon (capture-mechanic-cannot-capture-fainted-001)', () => {
  test.describe.configure({ mode: 'serial' })

  let oddishId: string
  let trainerId: string

  test('setup: create Oddish and set HP to 0', async ({ request }) => {
    oddishId = await createPokemon(request, ODDISH_L5)
    trainerId = await createTrainer(request, 'Trainer Dawn', 5)

    // Set HP to 0 to simulate fainted state
    await updatePokemon(request, oddishId, { currentHp: 0 })
  })

  test('assertion 1: rate API returns canBeCaptured = false', async ({ request }) => {
    const res = await getCaptureRate(request, { pokemonId: oddishId })
    expect(res.success).toBe(true)
    expect(res.data.canBeCaptured).toBe(false)
  })

  test('assertion 2: attempt API rejects with reason — no roll made', async ({ request }) => {
    const res = await attemptCapture(request, {
      pokemonId: oddishId,
      trainerId: trainerId
    })

    expect(res.data.captured).toBe(false)
    expect(res.data.reason).toBe('Pokemon is at 0 HP and cannot be captured')
  })

  test('assertion 3: no capture roll field in fainted-rejection response', async ({ request }) => {
    const res = await attemptCapture(request, {
      pokemonId: oddishId,
      trainerId: trainerId
    })

    // The fainted-rejection response has a different shape: no roll/modifiedRoll fields
    expect(res.data.roll).toBeUndefined()
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, {
      pokemonIds: [oddishId],
      trainerIds: [trainerId]
    })
  })
})
