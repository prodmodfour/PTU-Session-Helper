/**
 * P0 Workflow Scenario: Status Chain
 *
 * Tests status application, volatile vs persistent stacking,
 * Take a Breather mechanics, and status persistence after combat end.
 *
 * Setup:
 *   Eevee L13 — HP=41 (Normal)
 *   Pikachu L14 — HP=36 (Electric)
 *   Rattata L10 — enemy placeholder
 *
 * Phases:
 *   1. HP check
 *   2. Paralyzed -> Eevee + speed -4 CS
 *   3. Confused -> Eevee (stacks with Paralyzed)
 *   4. Eevee Takes a Breather: stages reset, Confused removed, Paralyzed stays
 *   5. End encounter: persistent Paralyzed survives
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStatus,
  applyStages,
  takeBreather,
  endEncounter,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

const eeveeSetup: PokemonSetup = {
  species: 'Eevee',
  level: 13,
  baseHp: 6,
  baseAttack: 6,
  baseDefense: 5,
  baseSpAttack: 5,
  baseSpDefense: 7,
  baseSpeed: 6,
  types: ['Normal']
}

const pikachuSetup: PokemonSetup = {
  species: 'Pikachu',
  level: 14,
  baseHp: 4,
  baseAttack: 6,
  baseDefense: 4,
  baseSpAttack: 5,
  baseSpDefense: 5,
  baseSpeed: 9,
  types: ['Electric']
}

const rattataSetup: PokemonSetup = {
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

test.describe('P0 Workflow: Status Chain', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let eeveeId: string
  let pikachuId: string
  let rattataId: string
  let eeveeCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    eeveeId = await createPokemon(request, eeveeSetup)
    pikachuId = await createPokemon(request, pikachuSetup)
    rattataId = await createPokemon(request, rattataSetup)

    encounterId = await createEncounter(request, 'Test: Status Chain')
    eeveeCombatantId = await addCombatant(request, encounterId, eeveeId, 'allies')
    await addCombatant(request, encounterId, pikachuId, 'allies')
    await addCombatant(request, encounterId, rattataId, 'enemies')

    await startEncounter(request, encounterId)
  })

  test('Phase 1: HP values — Eevee 41/41, Pikachu 36/36', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)

    const eevee = findCombatantByEntityId(encounter, eeveeId)
    expect(eevee.entity.currentHp).toBe(41)
    expect(eevee.entity.maxHp).toBe(41)

    const pikachu = findCombatantByEntityId(encounter, pikachuId)
    expect(pikachu.entity.currentHp).toBe(36)
    expect(pikachu.entity.maxHp).toBe(36)
  })

  test('Phase 2: Paralyzed applied to Eevee + speed stage -4', async ({ request }) => {
    // Eevee is Normal type — not immune to Paralysis
    const { statusChange } = await applyStatus(request, encounterId, eeveeCombatantId, {
      add: ['Paralyzed']
    })
    expect(statusChange.added).toContain('Paralyzed')

    // Apply speed stage penalty for Paralysis (-4 CS)
    const { stageChanges } = await applyStages(request, encounterId, eeveeCombatantId, {
      speed: -4
    })
    expect(stageChanges.changes.speed.current).toBe(-4)

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const eevee = findCombatantByEntityId(encounter, eeveeId)
    expect(eevee.entity.statusConditions).toContain('Paralyzed')
    expect(eevee.entity.stageModifiers.speed).toBe(-4)
  })

  test('Phase 3: Confused applied to Eevee (stacks with Paralyzed)', async ({ request }) => {
    const { statusChange } = await applyStatus(request, encounterId, eeveeCombatantId, {
      add: ['Confused']
    })
    expect(statusChange.added).toContain('Confused')

    // Both persistent (Paralyzed) and volatile (Confused) coexist
    const encounter = await getEncounter(request, encounterId)
    const eevee = findCombatantByEntityId(encounter, eeveeId)
    expect(eevee.entity.statusConditions).toContain('Paralyzed')
    expect(eevee.entity.statusConditions).toContain('Confused')
  })

  test('Phase 4: Eevee Takes a Breather — stages reset, volatile cleared, persistent stays', async ({ request }) => {
    const { breatherResult } = await takeBreather(request, encounterId, eeveeCombatantId)

    // Stages reset (speed was -4)
    expect(breatherResult.stagesReset).toBe(true)

    // Confused (volatile) cured
    expect(breatherResult.conditionsCured).toContain('Confused')

    const encounter = await getEncounter(request, encounterId)
    const eevee = findCombatantByEntityId(encounter, eeveeId)

    // Speed stage reset from -4 to 0
    expect(eevee.entity.stageModifiers.speed).toBe(0)

    // Paralyzed (persistent) remains, Confused (volatile) removed
    expect(eevee.entity.statusConditions).toContain('Paralyzed')
    expect(eevee.entity.statusConditions).not.toContain('Confused')

    // Tripped and Vulnerable applied as breather penalty
    const combatant = encounter.combatants.find((c: any) => c.entityId === eeveeId)
    expect(combatant.tempConditions).toContain('Tripped')
    expect(combatant.tempConditions).toContain('Vulnerable')
  })

  test('Phase 5: end encounter — persistent Paralyzed survives', async ({ request }) => {
    await endEncounter(request, encounterId)

    // After ending, persistent status (Paralyzed) remains on the entity
    // Volatile statuses (Tripped, Vulnerable) should be cleared
    const encounter = await getEncounter(request, encounterId)
    const eevee = findCombatantByEntityId(encounter, eeveeId)
    expect(eevee.entity.statusConditions).toContain('Paralyzed')
  })

  test('teardown', async ({ request }) => {
    // Encounter already ended — just clean up Pokemon
    await cleanup(request, null, [eeveeId, pikachuId, rattataId])
  })
})
