/**
 * P1 Mechanic: Capture Attempt Roll
 *
 * Tests the capture attempt API response shape, trainer level subtraction,
 * capture success logic, and critical accuracy bonus (+10).
 *
 * Uses two Oddish L50 (captureRate = -20 at full HP) and one trainer L8.
 * All assertions are relational (no exact roll values expected).
 *
 * PTU: "Roll 1d100, and subtract the Trainer's Level"
 * PTU: "If you roll a Natural 20 on this Accuracy Check, subtract -10"
 * PTU: "A natural roll of 100 always captures"
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createTrainer,
  attemptCapture,
  cleanup,
  type PokemonSetup
} from './capture-helpers'

const ODDISH_L50: PokemonSetup = {
  species: 'Oddish',
  level: 50,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 6,
  baseSpAttack: 8,
  baseSpDefense: 7,
  baseSpeed: 3,
  types: ['Grass', 'Poison']
}

test.describe('P1: Capture Attempt Roll (capture-mechanic-attempt-roll-001)', () => {
  test.describe.configure({ mode: 'serial' })

  let oddish1Id: string
  let oddish2Id: string
  let trainerId: string

  test('setup: create 2 Oddish and 1 trainer', async ({ request }) => {
    oddish1Id = await createPokemon(request, ODDISH_L50)
    oddish2Id = await createPokemon(request, ODDISH_L50)
    trainerId = await createTrainer(request, 'Trainer May', 8)
  })

  test('assertion 1: response includes all expected fields', async ({ request }) => {
    const res = await attemptCapture(request, {
      pokemonId: oddish1Id,
      trainerId: trainerId
    })
    expect(res.success).toBe(true)

    const d = res.data
    expect(d).toHaveProperty('captured')
    expect(d).toHaveProperty('roll')
    expect(d).toHaveProperty('modifiedRoll')
    expect(d).toHaveProperty('captureRate')
    expect(d).toHaveProperty('effectiveCaptureRate')
    expect(d).toHaveProperty('naturalHundred')
    expect(d).toHaveProperty('criticalHit')
    expect(d).toHaveProperty('trainerLevel')
    expect(d).toHaveProperty('modifiers')
    expect(d).toHaveProperty('difficulty')
    expect(d).toHaveProperty('breakdown')
    expect(d).toHaveProperty('pokemon')
    expect(d).toHaveProperty('trainer')
  })

  test('assertions 2-3: trainer level subtraction and capture logic (no crit)', async ({ request }) => {
    // Use oddish2 in case oddish1 was captured by nat 100
    const targetId = oddish2Id
    const res = await attemptCapture(request, {
      pokemonId: targetId,
      trainerId: trainerId
    })
    expect(res.success).toBe(true)

    const d = res.data

    // Assertion 2: modifiedRoll = roll - trainerLevel(8) - modifiers(0)
    expect(d.modifiedRoll).toBe(d.roll - 8)

    // Assertion 3: capture success matches roll logic
    const expectedCaptured = d.naturalHundred || d.modifiedRoll <= d.effectiveCaptureRate
    expect(d.captured).toBe(expectedCaptured)
    expect(d.criticalHit).toBe(false)
    expect(d.effectiveCaptureRate).toBe(d.captureRate)
  })

  test('assertions 4-5: critical accuracy (accuracyRoll: 20) detection and bonus', async ({ request }) => {
    // Create a fresh Oddish for critical test (previous ones may have been captured)
    const freshOddishId = await createPokemon(request, ODDISH_L50)

    const res = await attemptCapture(request, {
      pokemonId: freshOddishId,
      trainerId: trainerId,
      accuracyRoll: 20
    })
    expect(res.success).toBe(true)

    const d = res.data

    // Assertion 4: critical detected, +10 bonus applied
    expect(d.criticalHit).toBe(true)
    expect(d.effectiveCaptureRate).toBe(d.captureRate + 10)

    // Assertion 5: capture logic still applies with boosted rate
    const expectedCaptured = d.naturalHundred || d.modifiedRoll <= d.effectiveCaptureRate
    expect(d.captured).toBe(expectedCaptured)

    // Cleanup the extra Oddish
    try { await request.delete(`/api/pokemon/${freshOddishId}`) } catch { /* ignore */ }
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, {
      pokemonIds: [oddish1Id, oddish2Id],
      trainerIds: [trainerId]
    })
  })
})
