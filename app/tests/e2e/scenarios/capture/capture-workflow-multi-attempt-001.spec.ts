/**
 * P1 Workflow: Multi-Attempt Retry Capture
 *
 * A high-level wild Oddish L45 on Victory Road. Initial capture rate is -10
 * (nearly impossible). After weakening to 1 HP + injury + Paralysis, rate
 * improves to 65 (Easy). Trainer retries capture with a 70% per-attempt
 * success rate, looping up to 5 times.
 *
 * Oddish L45: HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3 (Grass/Poison)
 * maxHp = 45 + (5 x 3) + 10 = 70
 * Trainer L5
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createTrainer,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  applyStatus,
  getCaptureRate,
  attemptCapture,
  getPokemon,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './capture-helpers'

const ODDISH_L45: PokemonSetup = {
  species: 'Oddish',
  level: 45,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 6,
  baseSpAttack: 8,
  baseSpDefense: 7,
  baseSpeed: 3,
  types: ['Grass', 'Poison']
}

test.describe('P1 Workflow: Multi-Attempt Retry (capture-workflow-multi-attempt-001)', () => {
  test.describe.configure({ mode: 'serial' })

  let trainerId: string
  let oddishId: string
  let encounterId: string
  let oddishCombatantId: string
  let firstAttemptCaptured = false

  test('setup: create trainer, Oddish L45, encounter', async ({ request }) => {
    trainerId = await createTrainer(request, 'Trainer Red', 5)
    oddishId = await createPokemon(request, ODDISH_L45)

    encounterId = await createEncounter(request, 'Victory Road: Wild Oddish')
    oddishCombatantId = await addCombatant(request, encounterId, oddishId, 'enemies')
    await startEncounter(request, encounterId)
  })

  test('phase 1 — assertions 1-2: initial capture rate = -10 (Nearly Impossible)', async ({ request }) => {
    // base(100) + level(-90) + hp(-30) + evo(+10) = -10
    const res = await getCaptureRate(request, { pokemonId: oddishId })
    expect(res.success).toBe(true)

    // Assertion 1: captureRate = -10
    expect(res.data.captureRate).toBe(-10)

    // Assertion 2: difficulty label
    expect(res.data.difficulty).toBe('Nearly Impossible')
  })

  test('phase 2 — assertion 3: first attempt confirms low rate and relational check', async ({ request }) => {
    const res = await attemptCapture(request, {
      pokemonId: oddishId,
      trainerId: trainerId
    })
    expect(res.success).toBe(true)

    // Assertion 3: response confirms rate and roll math
    expect(res.data.captureRate).toBe(-10)
    expect(res.data.modifiedRoll).toBe(res.data.roll - 5) // trainerLevel = 5

    firstAttemptCaptured = res.data.captured
  })

  test('phase 3 — assertions 4-6: weaken Oddish to 1 HP + injury + Paralyzed', async ({ request }) => {
    // Skip if first attempt succeeded via nat 100 (proceed to phase 5)
    if (firstAttemptCaptured) {
      test.skip()
      return
    }

    // Step 3a: 69 damage, massive damage -> 1 injury
    const enc = await getEncounter(request, encounterId)
    const oddishBefore = findCombatantByEntityId(enc, oddishId)
    const dmg = await applyDamage(request, encounterId, oddishCombatantId, 69)

    // Assertion 4: HP after damage (server-computed)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, oddishBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )

    // Assertion 5: injury from massive damage (69/70 = 98.6% >= 50%)
    expect(dmg.damageResult.injuryGained).toBe(true)
    expect(dmg.damageResult.newInjuries).toBe(1)

    // Step 3b: Apply Paralyzed status
    await applyStatus(request, encounterId, oddishCombatantId, { add: ['Paralyzed'] })

    // Assertion 6: verify status applied via encounter data
    const encounter = await getEncounter(request, encounterId)
    const oddish = findCombatantByEntityId(encounter, oddishId)
    const statusConditions = oddish.entity.statusConditions || []
    expect(statusConditions).toContain('Paralyzed')
  })

  test('phase 4 — assertions 7-8: improved capture rate = 65 (Easy)', async ({ request }) => {
    if (firstAttemptCaptured) {
      test.skip()
      return
    }

    // base(100) + level(-90) + hp(+30) + evo(+10) + status(+10) + injury(+5) = 65
    const res = await getCaptureRate(request, { pokemonId: oddishId })
    expect(res.success).toBe(true)

    // Assertion 7: captureRate = 65 with correct breakdown
    expect(res.data.captureRate).toBe(65)
    expect(res.data.breakdown.hpModifier).toBe(30)
    expect(res.data.breakdown.statusModifier).toBe(10)
    expect(res.data.breakdown.injuryModifier).toBe(5)

    // Assertion 8: difficulty label
    expect(res.data.difficulty).toBe('Easy')
  })

  test('phase 5 — assertion 9: capture eventually succeeds, ownership verified', async ({ request }) => {
    if (!firstAttemptCaptured) {
      // Retry capture up to 5 times (P(success) per attempt = 70%, cumulative = 99.76%)
      let captured = false
      for (let i = 0; i < 5; i++) {
        const res = await attemptCapture(request, {
          pokemonId: oddishId,
          trainerId: trainerId
        })
        if (res.data?.captured) {
          captured = true
          break
        }
      }
      expect(captured).toBe(true)
    }

    // Verify ownership transfer
    const pokemon = await getPokemon(request, oddishId)
    expect(pokemon.ownerId).toBe(trainerId)
    expect(pokemon.origin).toBe('captured')
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, {
      encounterId,
      pokemonIds: [oddishId],
      trainerIds: [trainerId]
    })
  })
})
