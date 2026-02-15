import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  serveEncounter,
  cleanup,
  getActiveCombatant,
  type PokemonSetup
} from './combat-helpers'

/**
 * P0 Combat Scenario: Initiative Order
 *
 * Setup: Three Pokemon with distinct speeds (no ties to avoid d20 roll-off randomness)
 *   Pikachu — SPD 9
 *   Charmander — SPD 7
 *   Bulbasaur — SPD 5
 *
 * Expected turn order: Pikachu(9) → Charmander(7) → Bulbasaur(5)
 * First active combatant should be Pikachu.
 * Initiative values should match Speed stats.
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

test.describe('P0: Initiative Order', () => {
  test.describe.configure({ mode: 'serial' })

  let pikachuId: string
  let charmanderId: string
  let bulbasaurId: string
  let encounterId: string
  let encounterData: any

  test('setup: create 3 Pokemon and start encounter', async ({ request }) => {
    pikachuId = await createPokemon(request, pikachuSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    bulbasaurId = await createPokemon(request, bulbasaurSetup)
    encounterId = await createEncounter(request, 'P0 Initiative Order Test')

    await addCombatant(request, encounterId, pikachuId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')

    encounterData = await startEncounter(request, encounterId)
  })

  test('turn order: Pikachu(9) → Charmander(7) → Bulbasaur(5)', async () => {
    const { turnOrder, combatants } = encounterData

    expect(turnOrder).toHaveLength(3)

    // Map turn order IDs to entity IDs for comparison
    const orderedEntityIds = turnOrder.map((combatantId: string) => {
      const combatant = combatants.find((c: any) => c.id === combatantId)
      return combatant.entityId
    })

    expect(orderedEntityIds[0]).toBe(pikachuId)
    expect(orderedEntityIds[1]).toBe(charmanderId)
    expect(orderedEntityIds[2]).toBe(bulbasaurId)
  })

  test('first active combatant is Pikachu', async () => {
    const active = getActiveCombatant(encounterData)

    expect(active.entityId).toBe(pikachuId)
    expect(active.initiative).toBe(9)
  })

  test('initiative values match Speed stats', async () => {
    const { combatants } = encounterData

    const pikachu = combatants.find((c: any) => c.entityId === pikachuId)
    const charmander = combatants.find((c: any) => c.entityId === charmanderId)
    const bulbasaur = combatants.find((c: any) => c.entityId === bulbasaurId)

    expect(pikachu.initiative).toBe(9)
    expect(charmander.initiative).toBe(7)
    expect(bulbasaur.initiative).toBe(5)
  })

  test('UI displays correct initiative order on GM page', async ({ request, page }) => {
    await serveEncounter(request, encounterId)
    await page.goto('/gm')
    await page.waitForLoadState('networkidle')

    // Verify current turn section shows Pikachu
    const currentTurnCard = page.locator('.current-turn .combatant-card')
    await expect(currentTurnCard).toBeVisible()
    const currentName = currentTurnCard.locator('.combatant-card__name')
    await expect(currentName).toHaveText(/Pikachu/)

    // Verify initiative values in the sides grid (avoids current-turn duplicates)
    const pikachuCard = page.locator('.sides-grid .combatant-card').filter({
      has: page.locator('.combatant-card__name', { hasText: 'Pikachu' })
    }).first()
    const pikachuInit = pikachuCard.locator('.combatant-card__initiative')
    await expect(pikachuInit).toHaveText(/9/)

    const charmanderCard = page.locator('.sides-grid .combatant-card').filter({
      has: page.locator('.combatant-card__name', { hasText: 'Charmander' })
    }).first()
    const charmanderInit = charmanderCard.locator('.combatant-card__initiative')
    await expect(charmanderInit).toHaveText(/7/)

    const bulbasaurCard = page.locator('.sides-grid .combatant-card').filter({
      has: page.locator('.combatant-card__name', { hasText: 'Bulbasaur' })
    }).first()
    const bulbasaurInit = bulbasaurCard.locator('.combatant-card__initiative')
    await expect(bulbasaurInit).toHaveText(/5/)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [pikachuId, charmanderId, bulbasaurId])
  })
})
