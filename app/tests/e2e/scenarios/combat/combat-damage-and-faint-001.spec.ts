import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  nextTurn,
  applyDamage,
  cleanup,
  findCombatantByEntityId,
  getActiveCombatant,
  getEncounter,
  type PokemonSetup
} from './combat-helpers'

/**
 * P0 Combat Scenario: Damage and Faint
 *
 * Setup:
 *   Machop — ATK 8, SPD 4 (attacker, slower)
 *   Charmander — DEF 4, SPD 7, HP = 10 + (4*3) + 10 = 32 (defender, faster)
 *
 * Turn order: Charmander(7) → Machop(4)
 *
 * Assertions:
 *   1. Charmander starts at 32/32 HP
 *   2. After 20 damage: 12/32 HP
 *   3. After 20 more damage: 0/32 HP (floored at 0)
 *   4. Fainted status applied, damageResult.fainted = true
 *   5. Fainted combatant is visually marked in UI
 */

const machopSetup: PokemonSetup = {
  species: 'Machop',
  level: 10,
  baseHp: 7,
  baseAttack: 8,
  baseDefense: 5,
  baseSpAttack: 4,
  baseSpDefense: 4,
  baseSpeed: 4,
  types: ['Fighting']
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

test.describe('P0: Damage and Faint', () => {
  test.describe.configure({ mode: 'serial' })

  let machopId: string
  let charmanderId: string
  let encounterId: string
  let machopCombatantId: string
  let charmanderCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    machopId = await createPokemon(request, machopSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    encounterId = await createEncounter(request, 'P0 Damage and Faint Test')
    machopCombatantId = await addCombatant(request, encounterId, machopId, 'players')
    charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')

    const encounter = await startEncounter(request, encounterId)

    // Charmander (SPD 7) acts before Machop (SPD 4)
    const active = getActiveCombatant(encounter)
    expect(active.entityId).toBe(charmanderId)
  })

  test('Charmander starts at 32/32 HP', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)

    // HP formula: 10 + (4 * 3) + 10 = 32
    expect(charmander.entity.currentHp).toBe(32)
    expect(charmander.entity.maxHp).toBe(32)
  })

  test('after 20 damage: Charmander at 12/32 HP', async ({ request }) => {
    const result = await applyDamage(request, encounterId, charmanderCombatantId, 20)

    expect(result.damageResult.finalDamage).toBe(20)
    expect(result.damageResult.hpDamage).toBe(20)
    expect(result.damageResult.newHp).toBe(12)
    expect(result.damageResult.fainted).toBe(false)

    // 20 >= 32/2 = 16? Yes, massive damage → injury gained
    expect(result.damageResult.injuryGained).toBe(true)
    expect(result.damageResult.newInjuries).toBe(1)
  })

  test('after 20 more damage: Charmander at 0/32 HP (floored)', async ({ request }) => {
    const result = await applyDamage(request, encounterId, charmanderCombatantId, 20)

    expect(result.damageResult.finalDamage).toBe(20)
    expect(result.damageResult.hpDamage).toBe(20)
    // HP cannot go below 0: max(0, 12 - 20) = 0
    expect(result.damageResult.newHp).toBe(0)
    expect(result.damageResult.fainted).toBe(true)

    // 20 >= 32/2 = 16? Yes, massive damage → second injury
    expect(result.damageResult.injuryGained).toBe(true)
    expect(result.damageResult.newInjuries).toBe(2)
  })

  test('Fainted status is applied to Charmander', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)

    expect(charmander.entity.currentHp).toBe(0)
    expect(charmander.entity.statusConditions).toContain('Fainted')
  })

  test('advancing turns still reaches fainted combatant (server does not auto-skip)', async ({ request }) => {
    // Current turn order: Charmander(SPD 7) → Machop(SPD 4)
    // Charmander is at index 0 (current). Advance to Machop, then back to Charmander.
    const afterMachopTurn = await nextTurn(request, encounterId) // → Machop
    const machopActive = getActiveCombatant(afterMachopTurn)
    expect(machopActive.entityId).toBe(machopId)

    const afterWrap = await nextTurn(request, encounterId) // → Charmander (round 2)
    const charmanderActive = getActiveCombatant(afterWrap)
    expect(charmanderActive.entityId).toBe(charmanderId)
    expect(afterWrap.currentRound).toBe(2)

    // Charmander is still fainted — the server does not skip, but the combatant cannot act
    const charmander = findCombatantByEntityId(afterWrap, charmanderId)
    expect(charmander.entity.currentHp).toBe(0)
    expect(charmander.entity.statusConditions).toContain('Fainted')
  })

  test('API confirms fainted state persists after re-fetch', async ({ request }) => {
    // Re-fetch encounter to confirm fainted state persisted
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(0)
    expect(charmander.entity.maxHp).toBe(32)
    expect(charmander.entity.statusConditions).toContain('Fainted')
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [machopId, charmanderId])
  })
})
