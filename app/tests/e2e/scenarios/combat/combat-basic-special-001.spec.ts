import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  cleanup,
  findCombatantByEntityId,
  getEncounter,
  type PokemonSetup
} from './combat-helpers'

/**
 * P0 Combat Scenario: Basic Special Damage
 *
 * Setup:
 *   Psyduck — SpATK 7, SPD 6, Water, level 11 (attacker)
 *   Charmander — SpDEF 5, SPD 7, Fire, level 11 (defender)
 *
 * Charmander HP: 11 + (4 * 3) + 10 = 33
 * Special Evasion: floor(SpDEF(5) / 5) = 1, threshold = AC(2) + 1 = 3
 * Confusion damage: SetDamage(13) + SpATK(7) - SpDEF(5) = 15, Psychic vs Fire = neutral
 * Charmander HP after: 33 - 15 = 18
 */

const psyduckSetup: PokemonSetup = {
  species: 'Psyduck',
  level: 11,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 5,
  baseSpAttack: 7,
  baseSpDefense: 5,
  baseSpeed: 6,
  types: ['Water']
}

const charmanderSetup: PokemonSetup = {
  species: 'Charmander',
  level: 11,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 4,
  baseSpAttack: 6,
  baseSpDefense: 5,
  baseSpeed: 7,
  types: ['Fire']
}

test.describe('P0: Basic Special Damage', () => {
  test.describe.configure({ mode: 'serial' })

  let psyduckId: string
  let charmanderId: string
  let encounterId: string
  let psyduckCombatantId: string
  let charmanderCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    psyduckId = await createPokemon(request, psyduckSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    encounterId = await createEncounter(request, 'P0 Special Damage Test')
    psyduckCombatantId = await addCombatant(request, encounterId, psyduckId, 'players')
    charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)
  })

  test('Charmander starts at 33/33 HP', async ({ request }) => {
    const encounter = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const charmander = findCombatantByEntityId(encounter.data, charmanderId)

    // HP formula: level(11) + baseHp(4) * 3 + 10 = 11 + 12 + 10 = 33
    expect(charmander.entity.maxHp).toBe(33)
    expect(charmander.entity.currentHp).toBe(33)
  })

  test('Special Evasion = floor(SpDEF / 5) = 1, threshold = AC(2) + 1 = 3', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)

    // Server computes evasion at combatant creation: floor(stat / 5)
    expect(charmander.entity.currentStats.specialDefense).toBe(5)
    expect(charmander.specialEvasion).toBe(1)

    // Physical evasion for comparison
    expect(charmander.entity.currentStats.defense).toBe(4)
    expect(charmander.physicalEvasion).toBe(0)

    // Accuracy threshold = MoveAC(2) + server-computed specialEvasion
    const accuracyThreshold = 2 + charmander.specialEvasion
    expect(accuracyThreshold).toBe(3)
  })

  test('apply 15 damage (Confusion: SetDmg 13 + SpATK 7 - SpDEF 5)', async ({ request }) => {
    // Confusion: SetDamage(13) + SpATK(7) - SpDEF(5) = 15
    // Psychic type vs Fire type = neutral (1x)
    const calculatedDamage = 15

    // Fetch server state before damage
    const enc = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(enc, charmanderId)

    const result = await applyDamage(request, encounterId, charmanderCombatantId, calculatedDamage)

    expect(result.damageResult.finalDamage).toBe(15)
    expect(result.damageResult.hpDamage).toBe(15)
    // Assert newHp using server-fetched prior HP instead of hardcoded value
    expect(result.damageResult.newHp).toBe(
      Math.max(0, charmanderBefore.entity.currentHp - result.damageResult.hpDamage)
    )
    expect(result.damageResult.fainted).toBe(false)
    expect(result.damageResult.injuryGained).toBe(false)
  })

  test('Charmander HP is 18/33 after damage', async ({ request }) => {
    const encounter = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const charmander = findCombatantByEntityId(encounter.data, charmanderId)

    expect(charmander.entity.currentHp).toBe(18)
    expect(charmander.entity.maxHp).toBe(33)
  })

  test('API confirms HP persists after re-fetch', async ({ request }) => {
    // Re-fetch encounter to confirm state persisted
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(18)
    expect(charmander.entity.maxHp).toBe(33)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [psyduckId, charmanderId])
  })
})
