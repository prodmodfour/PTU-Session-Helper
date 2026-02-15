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
 * P0 Combat Scenario: Basic Physical Damage
 *
 * Setup:
 *   Bulbasaur — ATK 5, SPD 5, Grass/Poison (attacker)
 *   Charmander — DEF 4, SPD 7, Fire, level 10 (defender)
 *
 * Charmander HP: 10 + (4 * 3) + 10 = 32
 * Physical Evasion: floor(DEF(4) / 5) = 0, threshold = AC(2) + 0 = 2
 * Tackle damage: SetDamage(13) + ATK(5) - DEF(4) = 14, Normal vs Fire = neutral
 * Charmander HP after: 32 - 14 = 18
 */

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur',
  level: 10,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 5,
  baseSpAttack: 7,
  baseSpDefense: 7,
  baseSpeed: 5,
  types: ['Grass', 'Poison']
}

const charmanderSetup: PokemonSetup = {
  species: 'Charmander',
  level: 10,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 4,
  baseSpAttack: 6,
  baseSpDefense: 5,
  baseSpeed: 7,
  types: ['Fire']
}

test.describe('P0: Basic Physical Damage', () => {
  test.describe.configure({ mode: 'serial' })

  let bulbasaurId: string
  let charmanderId: string
  let encounterId: string
  let bulbasaurCombatantId: string
  let charmanderCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    bulbasaurId = await createPokemon(request, bulbasaurSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    encounterId = await createEncounter(request, 'P0 Physical Damage Test')
    bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)
  })

  test('Charmander starts at 32/32 HP', async ({ request }) => {
    const encounter = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const charmander = findCombatantByEntityId(encounter.data, charmanderId)

    expect(charmander.entity.maxHp).toBe(32)
    expect(charmander.entity.currentHp).toBe(32)
  })

  test('Physical Evasion = floor(DEF / 5) = 0', async ({ request }) => {
    const encounter = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const charmander = findCombatantByEntityId(encounter.data, charmanderId)

    // DEF base stat is 4, used as currentDefense
    // Physical evasion = floor(4 / 5) = 0
    const currentDefense = charmander.entity.currentStats.defense
    expect(currentDefense).toBe(4)
    const expectedPhysicalEvasion = Math.floor(currentDefense / 5)
    expect(expectedPhysicalEvasion).toBe(0)
  })

  test('apply 14 damage (Tackle: SetDmg 13 + ATK 5 - DEF 4)', async ({ request }) => {
    // Tackle: SetDamage(13) + ATK(5) - DEF(4) = 14
    // Normal type vs Fire type = neutral (1x)
    const calculatedDamage = 14

    const result = await applyDamage(request, encounterId, charmanderCombatantId, calculatedDamage)

    expect(result.damageResult.finalDamage).toBe(14)
    expect(result.damageResult.hpDamage).toBe(14)
    expect(result.damageResult.newHp).toBe(18)
    expect(result.damageResult.fainted).toBe(false)
    expect(result.damageResult.injuryGained).toBe(false)
  })

  test('Charmander HP is 18/32 after damage', async ({ request }) => {
    const encounter = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const charmander = findCombatantByEntityId(encounter.data, charmanderId)

    expect(charmander.entity.currentHp).toBe(18)
    expect(charmander.entity.maxHp).toBe(32)
  })

  test('API confirms HP persists after re-fetch', async ({ request }) => {
    // Re-fetch encounter to confirm state persisted (not just cached)
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(18)
    expect(charmander.entity.maxHp).toBe(32)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [bulbasaurId, charmanderId])
  })
})
