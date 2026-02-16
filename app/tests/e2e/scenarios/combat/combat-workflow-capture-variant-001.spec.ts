/**
 * P1 Workflow Scenario: Wild Encounter Capture Variant
 *
 * Instead of KO-ing the wild Pokemon, the trainer weakens it and captures it.
 * Squirtle uses STAB Water Gun to reduce Rattata to low HP, then a Poke Ball
 * is thrown with the capture rate calculated.
 *
 * Setup:
 *   Squirtle L13 — HP=35, SpATK 5, DEF 7, SPD 4 (Water) — player
 *   Rattata L10 — HP=29, ATK 6, SpDEF 4, SPD 7 (Normal) — wild-spawned
 *
 * Damage calculations:
 *   Rattata STAB Tackle → Squirtle: DB5+2=DB7, set 17, raw=17+6-7=16, ×1=16
 *   Squirtle STAB Water Gun → Rattata: DB6+2=DB8, set 19, raw=19+5-4=20, ×1=20
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  nextTurn,
  endEncounter,
  getEncounter,
  findCombatantByEntityId,
  deletePokemon,
  type PokemonSetup
} from './combat-helpers'

const squirtleSetup: PokemonSetup = {
  species: 'Squirtle',
  level: 13,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 7,
  baseSpAttack: 5,
  baseSpDefense: 6,
  baseSpeed: 4,
  types: ['Water']
}

test.describe('P1 Workflow: Wild Encounter Capture Variant', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let squirtleId: string
  let rattataId: string
  let squirtleCombatantId: string
  let rattataCombatantId: string
  let trainerId: string

  test('setup: create encounter, wild-spawn Rattata, add Squirtle, create trainer', async ({ request }) => {
    encounterId = await createEncounter(request, 'Route: Wild Rattata Capture')
    squirtleId = await createPokemon(request, squirtleSetup)

    // Wild-spawn Rattata (stats from species DB: HP 3, ATK 6, DEF 4, SpATK 3, SpDEF 4, SPD 7)
    const spawnRes = await request.post(`/api/encounters/${encounterId}/wild-spawn`, {
      data: { pokemon: [{ speciesName: 'Rattata', level: 10 }] }
    })
    const spawnBody = await spawnRes.json()
    expect(spawnBody.success).toBe(true)
    rattataId = spawnBody.data.addedPokemon[0].pokemonId
    rattataCombatantId = spawnBody.data.addedPokemon[0].combatantId

    squirtleCombatantId = await addCombatant(request, encounterId, squirtleId, 'players')

    // Create a trainer character for the capture attempt
    const charRes = await request.post('/api/characters', {
      data: {
        name: 'Test Trainer',
        characterType: 'player',
        level: 10
      }
    })
    const charBody = await charRes.json()
    expect(charBody.success).toBe(true)
    trainerId = charBody.data.id

    await startEncounter(request, encounterId)
  })

  test('Phase 1: Rattata STAB Tackle → Squirtle — 16 dmg', async ({ request }) => {
    // Tackle: Normal Physical, DB5+STAB2=DB7, set 17
    // raw = max(1, 17+6-7) = 16, Normal vs Water = ×1, final = 16
    const enc = await getEncounter(request, encounterId)
    const squirtleBefore = findCombatantByEntityId(enc, squirtleId)
    const dmg = await applyDamage(request, encounterId, squirtleCombatantId, 16)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, squirtleBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )

    await nextTurn(request, encounterId)
  })

  test('Phase 2: Squirtle STAB Water Gun → Rattata — 20 dmg, injury', async ({ request }) => {
    // Water Gun: Water Special, DB6+STAB2=DB8, set 19
    // raw = max(1, 19+5-4) = 20, Water vs Normal = ×1, final = 20
    // Injury: 20 ≥ 29/2=14.5 → Massive Damage
    const enc = await getEncounter(request, encounterId)
    const rattataBefore = findCombatantByEntityId(enc, rattataId)
    const dmg = await applyDamage(request, encounterId, rattataCombatantId, 20)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, rattataBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.injuryGained).toBe(true)
    expect(dmg.damageResult.newInjuries).toBe(1)
  })

  test('Phase 3a: capture rate calculated — rate > 0', async ({ request }) => {
    // Rattata HP at 9/29 ≈ 31%, under 50% threshold
    const rateRes = await request.post('/api/capture/rate', {
      data: { pokemonId: rattataId }
    })
    const rateBody = await rateRes.json()
    expect(rateBody.success).toBe(true)
    expect(rateBody.data.captureRate).toBeGreaterThan(0)
    expect(rateBody.data.hpPercentage).toBeLessThanOrEqual(50)
  })

  test('Phase 3b: capture attempt succeeds — origin "captured"', async ({ request }) => {
    // Use high modifiers to guarantee capture for test reliability
    const attemptRes = await request.post('/api/capture/attempt', {
      data: {
        pokemonId: rattataId,
        trainerId: trainerId,
        modifiers: 100
      }
    })
    const attemptBody = await attemptRes.json()
    expect(attemptBody.success).toBe(true)
    expect(attemptBody.data.captured).toBe(true)
    expect(attemptBody.data.pokemon.origin).toBe('captured')
  })

  test('Phase 3c: Rattata linked to trainer', async ({ request }) => {
    // Verify Pokemon is linked to the capturing trainer
    const pokemonRes = await request.get(`/api/pokemon/${rattataId}`)
    const pokemonBody = await pokemonRes.json()
    expect(pokemonBody.success).toBe(true)
    expect(pokemonBody.data.ownerId).toBe(trainerId)
  })

  test('teardown', async ({ request }) => {
    try { await endEncounter(request, encounterId) } catch { /* ignore */ }
    try { await deletePokemon(request, squirtleId) } catch { /* ignore */ }
    try { await deletePokemon(request, rattataId) } catch { /* ignore */ }
    try { await request.delete(`/api/characters/${trainerId}`) } catch { /* ignore */ }
  })
})
