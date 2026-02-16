/**
 * P1 Workflow Scenario: Wild Encounter Capture Variant
 * Corrected by: correction-005 (dynamic query-then-compute assertions)
 *
 * Wild-spawn Rattata (non-deterministic stats), weaken with Squirtle's
 * STAB Water Gun, then capture. All combat assertions are derived
 * dynamically from Rattata's actual stats after spawn.
 *
 * Deterministic:
 *   Squirtle L13 — maxHp=35, SpATK=5, DEF=7, SPD=4 (Water)
 *
 * Non-deterministic (queried after spawn):
 *   Rattata L10 — base stats from species DB, +9 random stat points
 *
 * Phase 1: Rattata STAB Tackle → Squirtle
 *   DB5+STAB2=DB7, set=17, damage=max(1, 17+rattataATK-7)
 *
 * Phase 2: Squirtle STAB Water Gun → Rattata
 *   DB6+STAB2=DB8, set=19, damage=max(1, 19+5-rattataSpDEF)
 *
 * Phase 3: Capture with accuracyRoll=20 (crit) + trainer level 30
 *   Guarantees success for all stat configurations.
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  getPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  nextTurn,
  endEncounter,
  getEncounter,
  deletePokemon,
  cleanup,
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
  let trainerId: string
  let squirtleId: string
  let rattataId: string
  let squirtleCombatantId: string
  let rattataCombatantId: string

  // Dynamic Rattata stats (queried after wild-spawn)
  let rattataMaxHp: number
  let rattataAttack: number
  let rattataSpDefense: number
  let rattataSpeed: number

  // Computed damage values (derived from actual stats)
  let phase1Damage: number
  let phase2Damage: number

  test('setup: create encounter, trainer, Squirtle, wild-spawn Rattata, query stats', async ({ request }) => {
    // Create encounter
    encounterId = await createEncounter(request, 'Route: Wild Rattata Capture')

    // Create trainer at level 30 (guarantees capture — see Phase 3 derivation)
    const charRes = await request.post('/api/characters', {
      data: { name: 'Ash', characterType: 'player', level: 30 }
    })
    const charBody = await charRes.json()
    expect(charBody.success).toBe(true)
    trainerId = charBody.data.id

    // Create Squirtle with explicit/deterministic stats
    squirtleId = await createPokemon(request, squirtleSetup)

    // Wild-spawn Rattata via generateAndCreatePokemon (non-deterministic stats)
    const spawnRes = await request.post(`/api/encounters/${encounterId}/wild-spawn`, {
      data: {
        pokemon: [{ speciesName: 'Rattata', level: 10 }],
        side: 'enemies'
      }
    })
    const spawnBody = await spawnRes.json()
    expect(spawnBody.success).toBe(true)
    rattataId = spawnBody.data.addedPokemon[0].pokemonId
    rattataCombatantId = spawnBody.data.addedPokemon[0].combatantId

    // Query Rattata's actual stats (dynamic assertion setup)
    const rattata = await getPokemon(request, rattataId)
    rattataMaxHp = rattata.maxHp
    rattataAttack = rattata.currentStats.attack
    rattataSpDefense = rattata.currentStats.specialDefense
    rattataSpeed = rattata.currentStats.speed

    // Pre-compute expected damage from actual stats
    // Phase 1: Rattata Tackle → Squirtle (DB5+STAB2=DB7, set=17)
    //   raw = max(1, 17 + rattataAttack - 7), Normal vs Water = ×1
    phase1Damage = Math.max(1, 17 + rattataAttack - 7)
    // Phase 2: Squirtle Water Gun → Rattata (DB6+STAB2=DB8, set=19)
    //   raw = max(1, 19 + 5 - rattataSpDefense), Water vs Normal = ×1
    phase2Damage = Math.max(1, 19 + 5 - rattataSpDefense)

    // Add Squirtle as player combatant
    squirtleCombatantId = await addCombatant(request, encounterId, squirtleId, 'players')

    // Start encounter (sorts initiative by speed)
    await startEncounter(request, encounterId)
  })

  test('assertion 1: Rattata acts first — speed >= 7 > 4 = Squirtle', async ({ request }) => {
    expect(rattataSpeed).toBeGreaterThanOrEqual(7)

    const enc = await getEncounter(request, encounterId)
    const firstTurnId = enc.turnOrder[0]
    const firstCombatant = enc.combatants.find((c: any) => c.id === firstTurnId)
    expect(firstCombatant.entityId).toBe(rattataId)
  })

  test('assertion 2: Squirtle HP after Rattata STAB Tackle — dynamic', async ({ request }) => {
    // Phase 1: Rattata Tackle → Squirtle
    // damage = max(1, 10 + rattataAttack), range [16, 25]
    const dmg = await applyDamage(request, encounterId, squirtleCombatantId, phase1Damage)

    const expectedHp = 35 - phase1Damage
    expect(dmg.damageResult.newHp).toBe(expectedHp)
    expect(dmg.damageResult.newHp).toBeGreaterThan(0) // Squirtle survives (worst case: 35-25=10)

    await nextTurn(request, encounterId)
  })

  test('assertions 3-4: Rattata HP and injury after Squirtle STAB Water Gun — dynamic', async ({ request }) => {
    // Phase 2: Squirtle Water Gun → Rattata
    // damage = max(1, 24 - rattataSpDefense), range [11, 20]
    const dmg = await applyDamage(request, encounterId, rattataCombatantId, phase2Damage)

    // Assertion 3: Rattata HP after damage
    const expectedHp = rattataMaxHp - phase2Damage
    expect(dmg.damageResult.newHp).toBe(expectedHp)
    expect(dmg.damageResult.newHp).toBeGreaterThan(0) // Rattata survives (worst case: 29-20=9)

    // Assertion 4: Injury check (dynamic conditional)
    // Massive Damage (damage >= maxHp / 2) + HP marker crossing (50% marker)
    // When starting from full HP, massive damage always also crosses the 50% marker
    const injuryExpected = phase2Damage >= rattataMaxHp / 2
    expect(dmg.damageResult.injuryGained).toBe(injuryExpected)
    if (injuryExpected) {
      expect(dmg.damageResult.newInjuries).toBe(2)
    } else {
      expect(dmg.damageResult.newInjuries).toBe(0)
    }
  })

  test('assertion 5: capture rate is positive', async ({ request }) => {
    const rateRes = await request.post('/api/capture/rate', {
      data: { pokemonId: rattataId }
    })
    const rateBody = await rateRes.json()
    expect(rateBody.success).toBe(true)
    expect(rateBody.data.captureRate).toBeGreaterThan(0)
  })

  test('assertions 6-7: capture succeeds, Pokemon linked to trainer', async ({ request }) => {
    // accuracyRoll=20 → criticalHit → +10 to effectiveCaptureRate
    // Trainer level 30 → modifiedRoll = d100 - 30
    // Worst case: effectiveCaptureRate = 60+10 = 70; success if d100 <= 100 → always
    const attemptRes = await request.post('/api/capture/attempt', {
      data: {
        pokemonId: rattataId,
        trainerId: trainerId,
        accuracyRoll: 20
      }
    })
    const attemptBody = await attemptRes.json()
    expect(attemptBody.success).toBe(true)

    // Assertion 6: Capture succeeds
    expect(attemptBody.data.captured).toBe(true)

    // Assertion 7: Pokemon linked to trainer with origin "captured"
    const pokemon = await getPokemon(request, rattataId)
    expect(pokemon.origin).toBe('captured')
    expect(pokemon.ownerId).toBe(trainerId)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [squirtleId, rattataId])
    try { await request.delete(`/api/characters/${trainerId}`) } catch { /* ignore */ }
  })
})
