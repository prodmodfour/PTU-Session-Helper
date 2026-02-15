/**
 * P0 Workflow Scenario: Setup from Template
 *
 * GM creates a source encounter, saves it as a template, loads the template
 * into a fresh encounter, adds a player, starts and serves.
 *
 * Setup:
 *   Charmander L12 — HP >= 34 (Fire) — template enemy (non-deterministic)
 *   Rattata L10 — HP >= 29 (Normal) — template enemy (non-deterministic)
 *   Squirtle L13 — HP = 35 (Water) — added after template load (deterministic)
 *
 * Initiative: Charmander SPD >= 7, Rattata SPD >= 7, Squirtle SPD 4
 *   -> Squirtle is last
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  serveEncounter,
  unserveEncounter,
  endEncounter,
  getEncounter,
  deletePokemon,
  type PokemonSetup
} from './combat-helpers'

const templateCharmanderSetup: PokemonSetup = {
  species: 'Charmander',
  level: 12,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 4,
  baseSpAttack: 6,
  baseSpDefense: 5,
  baseSpeed: 7,
  types: ['Fire']
}

const templateRattataSetup: PokemonSetup = {
  species: 'Rattata',
  level: 10,
  baseHp: 3,
  baseAttack: 6,
  baseDefense: 4,
  baseSpAttack: 3,
  baseSpDefense: 4,
  baseSpeed: 7,
  types: ['Normal']
}

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

test.describe('P0 Workflow: Setup from Template', () => {
  test.describe.configure({ mode: 'serial' })

  let sourceEncounterId: string
  let templateCharId: string
  let templateRatId: string
  let templateId: string
  let encounterId: string
  let squirtleId: string
  const loadedPokemonIds: string[] = []

  test('setup: create source encounter with 2 enemy combatants', async ({ request }) => {
    templateCharId = await createPokemon(request, templateCharmanderSetup)
    templateRatId = await createPokemon(request, templateRattataSetup)

    sourceEncounterId = await createEncounter(request, 'Gym Battle Template Source')
    await addCombatant(request, sourceEncounterId, templateCharId, 'enemies')
    await addCombatant(request, sourceEncounterId, templateRatId, 'enemies')
  })

  test('Phase 1: save as template — "Gym Battle: Fire Team"', async ({ request }) => {
    const res = await request.post('/api/encounter-templates/from-encounter', {
      data: {
        encounterId: sourceEncounterId,
        name: 'Gym Battle: Fire Team'
      }
    })
    const body = await res.json()
    expect(body.success).toBe(true)
    templateId = body.data.id
    expect(body.data.name).toBe('Gym Battle: Fire Team')
  })

  test('Phase 2: load template into new encounter', async ({ request }) => {
    const res = await request.post(`/api/encounter-templates/${templateId}/load`, { data: {} })
    const body = await res.json()
    expect(body.success).toBe(true)
    encounterId = body.data.id
    expect(encounterId).toBeTruthy()

    // Track loaded Pokemon for cleanup
    for (const c of body.data.combatants) {
      loadedPokemonIds.push(c.entityId)
    }
  })

  test('Phase 2b: template combatants — full HP, valid stats', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)
    const combatants = encounter.combatants
    expect(combatants.length).toBe(2)

    const charmander = combatants.find((c: any) => c.entity.species === 'Charmander')
    expect(charmander).toBeDefined()
    expect(charmander.entity.currentHp).toBe(charmander.entity.maxHp)
    expect(charmander.entity.maxHp).toBeGreaterThanOrEqual(34) // minimum: 12+(4x3)+10

    const rattata = combatants.find((c: any) => c.entity.species === 'Rattata')
    expect(rattata).toBeDefined()
    expect(rattata.entity.currentHp).toBe(rattata.entity.maxHp)
    expect(rattata.entity.maxHp).toBeGreaterThanOrEqual(29) // minimum: 10+(3x3)+10
  })

  test('Phase 3: add Squirtle as player — 3 total combatants', async ({ request }) => {
    squirtleId = await createPokemon(request, squirtleSetup)
    await addCombatant(request, encounterId, squirtleId, 'players')

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.combatants.length).toBe(3)

    const squirtle = encounter.combatants.find((c: any) => c.entity.species === 'Squirtle')
    expect(squirtle).toBeDefined()
    expect(squirtle.entity.currentHp).toBe(35)
    expect(squirtle.entity.maxHp).toBe(35)
    expect(squirtle.side).toBe('players')
  })

  test('Phase 4: start and serve — Squirtle last in initiative (SPD 4 < 7)', async ({ request }) => {
    const startedEncounter = await startEncounter(request, encounterId)
    expect(startedEncounter.isActive).toBe(true)

    await serveEncounter(request, encounterId)
    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isServed).toBe(true)

    // Squirtle (SPD 4) should be last (Charmander/Rattata SPD >= 7)
    const squirtleCombatant = encounter.combatants.find((c: any) => c.entity.species === 'Squirtle')
    const squirtleTurnIndex = encounter.turnOrder.indexOf(squirtleCombatant.id)
    expect(squirtleTurnIndex).toBe(encounter.turnOrder.length - 1)
  })

  test('teardown', async ({ request }) => {
    try { await endEncounter(request, encounterId) } catch { /* ignore */ }
    try { await unserveEncounter(request, encounterId) } catch { /* ignore */ }
    try { await deletePokemon(request, squirtleId) } catch { /* ignore */ }
    for (const id of loadedPokemonIds) {
      try { await deletePokemon(request, id) } catch { /* ignore */ }
    }
    try { await deletePokemon(request, templateCharId) } catch { /* ignore */ }
    try { await deletePokemon(request, templateRatId) } catch { /* ignore */ }
    try { await endEncounter(request, sourceEncounterId) } catch { /* ignore */ }
    try { await request.delete(`/api/encounter-templates/${templateId}`) } catch { /* ignore */ }
  })
})
