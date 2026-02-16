/**
 * P0 Workflow: Standard Capture
 *
 * A wild Oddish L8 appears. The trainer checks the capture rate (64 at full HP),
 * deals 32 damage to bring it to 1 HP (triggering massive damage injury),
 * then rechecks the rate (129 — guaranteed capture). The trainer throws a ball,
 * captures the Oddish, and ownership is verified.
 *
 * Oddish L8: HP 5, ATK 5, DEF 6, SpATK 8, SpDEF 7, SPD 3 (Grass/Poison)
 * maxHp = 8 + (5 x 3) + 10 = 33
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
  getCaptureRate,
  attemptCapture,
  getPokemon,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './capture-helpers'

const ODDISH_L8: PokemonSetup = {
  species: 'Oddish',
  level: 8,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 6,
  baseSpAttack: 8,
  baseSpDefense: 7,
  baseSpeed: 3,
  types: ['Grass', 'Poison']
}

test.describe('P0 Workflow: Standard Capture (capture-workflow-standard-capture-001)', () => {
  test.describe.configure({ mode: 'serial' })

  let trainerId: string
  let oddishId: string
  let encounterId: string
  let oddishCombatantId: string

  test('setup: create trainer, Oddish, encounter', async ({ request }) => {
    trainerId = await createTrainer(request, 'Trainer Ash', 5)
    oddishId = await createPokemon(request, ODDISH_L8)

    encounterId = await createEncounter(request, 'Route 3: Wild Oddish')
    oddishCombatantId = await addCombatant(request, encounterId, oddishId, 'enemies')
    await startEncounter(request, encounterId)
  })

  test('phase 1 — assertions 1-2: initial capture rate at full HP = 64 (Easy)', async ({ request }) => {
    // base(100) + level(-16) + hp(-30) + evo(+10) = 64
    const res = await getCaptureRate(request, { pokemonId: oddishId })
    expect(res.success).toBe(true)

    // Assertion 1: captureRate = 64 with correct breakdown
    expect(res.data.captureRate).toBe(64)
    expect(res.data.breakdown.levelModifier).toBe(-16)
    expect(res.data.breakdown.hpModifier).toBe(-30)
    expect(res.data.breakdown.evolutionModifier).toBe(10)

    // Assertion 2: difficulty label
    expect(res.data.difficulty).toBe('Easy')
  })

  test('phase 2 — assertion 3: deal 32 damage, weaken Oddish', async ({ request }) => {
    // Massive damage: 32 >= maxHp/2 -> 1 injury
    const enc = await getEncounter(request, encounterId)
    const oddishBefore = findCombatantByEntityId(enc, oddishId)
    const dmg = await applyDamage(request, encounterId, oddishCombatantId, 32)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, oddishBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.injuryGained).toBe(true)
  })

  test('phase 3 — assertions 4-5: improved capture rate at 1 HP = 129 (Very Easy)', async ({ request }) => {
    // base(100) + level(-16) + hp(+30) + evo(+10) + injury(+5) = 129
    const res = await getCaptureRate(request, { pokemonId: oddishId })
    expect(res.success).toBe(true)

    // Assertion 4: captureRate = 129 with updated breakdown
    expect(res.data.captureRate).toBe(129)
    expect(res.data.breakdown.hpModifier).toBe(30)
    expect(res.data.breakdown.injuryModifier).toBe(5)

    // Assertion 5: difficulty label
    expect(res.data.difficulty).toBe('Very Easy')
  })

  test('phase 4 — assertion 6: capture is mathematically guaranteed', async ({ request }) => {
    // captureRate=129, trainerLevel=5 -> max modifiedRoll = 95 <= 129 -> always captured
    const res = await attemptCapture(request, {
      pokemonId: oddishId,
      trainerId: trainerId
    })
    expect(res.success).toBe(true)
    expect(res.data.captured).toBe(true)
    expect(res.data.captureRate).toBe(129)
    expect(res.data.trainerLevel).toBe(5)
  })

  test('phase 5 — assertions 7-8: ownership transferred, HP preserved at 1', async ({ request }) => {
    const pokemon = await getPokemon(request, oddishId)

    // Assertion 7: ownership transferred
    expect(pokemon.ownerId).toBe(trainerId)
    expect(pokemon.origin).toBe('captured')

    // Assertion 8: combat state preserved — capture does not heal
    expect(pokemon.currentHp).toBe(1)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, {
      encounterId,
      pokemonIds: [oddishId],
      trainerIds: [trainerId]
    })
  })
})
