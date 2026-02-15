/**
 * P1 Combat Scenario: Status Conditions
 *
 * Setup: Charmander (Fire) and Pikachu (Electric)
 *
 * PTU Status Condition Rules:
 *   - Status conditions can be added and removed via API
 *   - Duplicates are prevented (adding same condition twice = only one instance)
 *   - Type immunities are NOT enforced by the status API (GM decides)
 *     - Note: If the API does enforce type immunities (e.g., Fire immune to Burn,
 *       Electric immune to Paralysis), tests will document that behavior
 *
 * Assertions:
 *   1. Apply Paralyzed to Charmander -> succeeds
 *   2. Apply Burned to Charmander -> check if Fire type blocks it (document behavior)
 *   3. Apply Paralyzed to Pikachu -> check if Electric type blocks it (document behavior)
 *   4. Apply Paralyzed again to Charmander -> no duplicate
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStatus,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

// Charmander: Fire type
const charmanderSetup: PokemonSetup = {
  species: 'Charmander',
  level: 10,
  baseHp: 4,
  baseAttack: 6,
  baseDefense: 4,
  baseSpAttack: 6,
  baseSpDefense: 5,
  baseSpeed: 7,
  types: ['Fire']
}

// Pikachu: Electric type
const pikachuSetup: PokemonSetup = {
  species: 'Pikachu',
  level: 10,
  baseHp: 4,
  baseAttack: 6,
  baseDefense: 4,
  baseSpAttack: 5,
  baseSpDefense: 5,
  baseSpeed: 9,
  types: ['Electric']
}

test.describe('P1: Status Conditions', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('apply Paralyzed to Charmander succeeds', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - Paralyzed on Fire')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Paralyzed to Charmander (Fire is NOT immune to Paralysis)
    const { statusChange } = await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Paralyzed']
    })

    expect(statusChange.added).toContain('Paralyzed')
    expect(statusChange.current).toContain('Paralyzed')

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.statusConditions).toContain('Paralyzed')
  })

  test('apply Burned to Fire-type Charmander (API allows, GM decides immunity)', async ({ request }) => {
    // PTU rules: Fire types are immune to Burn
    // But the status API is a GM tool - it adds statuses without type checking
    // The GM is expected to enforce type immunity manually

    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - Burn on Fire')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Burned to Charmander
    const { statusChange } = await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Burned']
    })

    // The API does not enforce type immunity - it adds the status regardless
    // GM is responsible for checking type immunity before applying
    expect(statusChange.added).toContain('Burned')
    expect(statusChange.current).toContain('Burned')

    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.statusConditions).toContain('Burned')
  })

  test('apply Paralyzed to Electric-type Pikachu (API allows, GM decides immunity)', async ({ request }) => {
    // PTU rules: Electric types are immune to Paralysis
    // Same as Burn/Fire - the API is a GM tool without type checking

    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - Paralysis on Electric')
    await addCombatant(request, encounterId, charmanderId, 'players')
    const pikachuCombatantId = await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Paralyzed to Pikachu
    const { statusChange } = await applyStatus(request, encounterId, pikachuCombatantId, {
      add: ['Paralyzed']
    })

    // API adds without type checking
    expect(statusChange.added).toContain('Paralyzed')
    expect(statusChange.current).toContain('Paralyzed')

    const encounter = await getEncounter(request, encounterId)
    const pikachu = findCombatantByEntityId(encounter, pikachuId)
    expect(pikachu.entity.statusConditions).toContain('Paralyzed')
  })

  test('duplicate status condition is prevented', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - No Duplicates')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Paralyzed first time
    const first = await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Paralyzed']
    })
    expect(first.statusChange.added).toContain('Paralyzed')
    expect(first.statusChange.current).toEqual(['Paralyzed'])

    // Apply Paralyzed second time - should not duplicate
    const second = await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Paralyzed']
    })
    expect(second.statusChange.added).not.toContain('Paralyzed') // not added again
    expect(second.statusChange.added).toHaveLength(0)
    expect(second.statusChange.current).toEqual(['Paralyzed']) // still just one

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    const paralyzedCount = charmander.entity.statusConditions.filter(
      (s: string) => s === 'Paralyzed'
    ).length
    expect(paralyzedCount).toBe(1)
  })

  test('remove status condition', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - Remove')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Add Paralyzed and Confused
    await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Paralyzed', 'Confused']
    })

    // Remove Paralyzed
    const { statusChange } = await applyStatus(request, encounterId, charmanderCombatantId, {
      remove: ['Paralyzed']
    })

    expect(statusChange.removed).toContain('Paralyzed')
    expect(statusChange.current).not.toContain('Paralyzed')
    expect(statusChange.current).toContain('Confused') // Confused remains

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.statusConditions).not.toContain('Paralyzed')
    expect(charmander.entity.statusConditions).toContain('Confused')
  })

  test('multiple status conditions can coexist', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const pikachuId = await createPokemon(request, pikachuSetup)
    pokemonIds.push(pikachuId)

    encounterId = await createEncounter(request, 'Status Test - Multiple Conditions')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, pikachuId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply multiple conditions at once
    const { statusChange } = await applyStatus(request, encounterId, charmanderCombatantId, {
      add: ['Paralyzed', 'Confused', 'Slowed']
    })

    expect(statusChange.added).toContain('Paralyzed')
    expect(statusChange.added).toContain('Confused')
    expect(statusChange.added).toContain('Slowed')
    expect(statusChange.current).toHaveLength(3)

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.statusConditions).toContain('Paralyzed')
    expect(charmander.entity.statusConditions).toContain('Confused')
    expect(charmander.entity.statusConditions).toContain('Slowed')
  })
})
