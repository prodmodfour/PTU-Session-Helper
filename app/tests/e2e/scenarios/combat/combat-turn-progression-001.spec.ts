import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  nextTurn,
  serveEncounter,
  cleanup,
  getActiveCombatant,
  type PokemonSetup
} from './combat-helpers'

/**
 * P0 Combat Scenario: Turn Progression
 *
 * Setup: Three Pokemon with distinct speeds
 *   Pikachu — SPD 9
 *   Charmander — SPD 7
 *   Bulbasaur — SPD 5
 *
 * Assertions:
 *   After start: Pikachu active, round 1
 *   After 1st next-turn: Charmander active, round 1
 *   After 2nd next-turn: Bulbasaur active, round 1
 *   After 3rd next-turn: Pikachu active, round 2 (wraps)
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

test.describe('P0: Turn Progression', () => {
  test.describe.configure({ mode: 'serial' })

  let pikachuId: string
  let charmanderId: string
  let bulbasaurId: string
  let encounterId: string

  test('setup: create 3 Pokemon and start encounter', async ({ request }) => {
    pikachuId = await createPokemon(request, pikachuSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    bulbasaurId = await createPokemon(request, bulbasaurSetup)
    encounterId = await createEncounter(request, 'P0 Turn Progression Test')

    await addCombatant(request, encounterId, pikachuId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')

    const encounter = await startEncounter(request, encounterId)

    // Verify initial state
    expect(encounter.currentRound).toBe(1)
    expect(encounter.currentTurnIndex).toBe(0)
    const active = getActiveCombatant(encounter)
    expect(active.entityId).toBe(pikachuId)
  })

  test('after start: Pikachu active, round 1', async ({ request }) => {
    const res = await (await request.get(`/api/encounters/${encounterId}`)).json()
    const encounter = res.data
    const active = getActiveCombatant(encounter)

    expect(active.entityId).toBe(pikachuId)
    expect(encounter.currentRound).toBe(1)
    expect(encounter.currentTurnIndex).toBe(0)
  })

  test('after 1st next-turn: Charmander active, round 1', async ({ request }) => {
    const encounter = await nextTurn(request, encounterId)
    const active = getActiveCombatant(encounter)

    expect(active.entityId).toBe(charmanderId)
    expect(encounter.currentRound).toBe(1)
    expect(encounter.currentTurnIndex).toBe(1)
  })

  test('after 2nd next-turn: Bulbasaur active, round 1', async ({ request }) => {
    const encounter = await nextTurn(request, encounterId)
    const active = getActiveCombatant(encounter)

    expect(active.entityId).toBe(bulbasaurId)
    expect(encounter.currentRound).toBe(1)
    expect(encounter.currentTurnIndex).toBe(2)
  })

  test('after 3rd next-turn: Pikachu active, round 2 (wrap-around)', async ({ request }) => {
    const encounter = await nextTurn(request, encounterId)
    const active = getActiveCombatant(encounter)

    expect(active.entityId).toBe(pikachuId)
    expect(encounter.currentRound).toBe(2)
    expect(encounter.currentTurnIndex).toBe(0)
  })

  test('UI shows round 2 and Pikachu as current on GM page', async ({ request, page }) => {
    await serveEncounter(request, encounterId)
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')

    // Check current turn section shows Pikachu
    const currentTurnCard = page.locator('.current-turn .combatant-card')
    await expect(currentTurnCard).toBeVisible()
    const currentName = currentTurnCard.locator('.combatant-card__name')
    await expect(currentName).toHaveText(/Pikachu/)

    // Check round counter shows 2
    const roundBadge = page.locator('.badge--gray')
    await expect(roundBadge).toHaveText(/Round 2/)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [pikachuId, charmanderId, bulbasaurId])
  })
})
