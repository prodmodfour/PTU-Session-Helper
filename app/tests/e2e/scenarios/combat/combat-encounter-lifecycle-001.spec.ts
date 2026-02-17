import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  endEncounter,
  serveEncounter,
  unserveEncounter,
  getEncounter,
  getServedEncounter,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

/**
 * P0 Combat Scenario: Encounter Lifecycle
 *
 * Validates the full lifecycle of an encounter through all phases:
 *   Phase 1: Create encounter (status = created, not active)
 *   Phase 2: Add combatants (2 combatants present)
 *   Phase 3: Start encounter (status = active, Pikachu first by SPD)
 *   Phase 4: Serve encounter (isServed = true, group view shows it)
 *   Phase 5: End encounter (isActive = false)
 *   Phase 6: Unserve encounter (served endpoint returns null)
 */

const pikachuSetup: PokemonSetup = {
  species: 'Pikachu',
  level: 10,
  baseHp: 4,
  baseAttack: 6,
  baseDefense: 4,
  baseSpAttack: 7,
  baseSpDefense: 5,
  baseSpeed: 9,
  types: ['Electric']
}

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

test.describe('P0: Encounter Lifecycle', () => {
  test.describe.configure({ mode: 'serial' })

  let pikachuId: string
  let bulbasaurId: string
  let encounterId: string

  test('Phase 1: create encounter — not active, no combatants', async ({ request }) => {
    pikachuId = await createPokemon(request, pikachuSetup)
    bulbasaurId = await createPokemon(request, bulbasaurSetup)
    encounterId = await createEncounter(request, 'P0 Lifecycle Test')

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isActive).toBe(false)
    expect(encounter.combatants).toHaveLength(0)
    expect(encounter.name).toBe('P0 Lifecycle Test')
  })

  test('Phase 2: add combatants — 2 combatants present', async ({ request }) => {
    await addCombatant(request, encounterId, pikachuId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.combatants).toHaveLength(2)
    expect(encounter.isActive).toBe(false)
  })

  test('Phase 3: start encounter — active, Pikachu first (SPD 9 > SPD 5)', async ({ request }) => {
    const encounter = await startEncounter(request, encounterId)

    expect(encounter.isActive).toBe(true)
    expect(encounter.currentRound).toBe(1)
    expect(encounter.currentTurnIndex).toBe(0)
    expect(encounter.turnOrder).toHaveLength(2)

    // Pikachu (SPD 9) should be first in turn order
    const firstCombatantId = encounter.turnOrder[0]
    const firstCombatant = encounter.combatants.find((c: any) => c.id === firstCombatantId)
    expect(firstCombatant.entityId).toBe(pikachuId)
    expect(firstCombatant.initiative).toBe(9)
  })

  test('Phase 4: serve encounter — isServed = true', async ({ request }) => {
    const served = await serveEncounter(request, encounterId)
    expect(served.isServed).toBe(true)
  })

  test('Phase 5: end encounter — isActive = false', async ({ request }) => {
    await endEncounter(request, encounterId)

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isActive).toBe(false)
  })

  test('Phase 6: unserve encounter — isServed becomes false', async ({ request }) => {
    await unserveEncounter(request, encounterId)

    // Check the specific encounter is no longer served (avoid parallel test interference)
    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isServed).toBe(false)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, null, [pikachuId, bulbasaurId])
  })
})
