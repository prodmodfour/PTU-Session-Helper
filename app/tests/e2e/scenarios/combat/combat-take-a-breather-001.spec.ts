/**
 * P1 Combat Scenario: Take a Breather
 *
 * Setup: Bulbasaur and Charmander in encounter.
 * Pre-apply: ATK +3, DEF +2, Confused status to Bulbasaur.
 *
 * PTU Take a Breather Rules (Full Action):
 *   - Reset ALL combat stages to 0
 *   - Remove Temporary HP
 *   - Cure all Volatile conditions + Slowed and Stuck (PTU p.245)
 *   - Apply Tripped and Vulnerable as tempConditions (until next turn)
 *   - Consumes full action (standardActionUsed = true, hasActed = true)
 *
 * Assertions:
 *   1. Pre-breather state: ATK CS +3, DEF CS +2, Confused
 *   2. After breather: all stages reset to 0
 *   3. Confused removed (volatile)
 *   4. Tripped and Vulnerable applied (as tempConditions)
 *   5. Persistent conditions (e.g., Paralyzed) NOT removed
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStages,
  applyStatus,
  applyHeal,
  takeBreather,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

// Bulbasaur: the breather-taker
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

// Charmander: opponent
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

test.describe('P1: Take a Breather', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('breather resets stages, cures volatile conditions, applies Tripped+Vulnerable', async ({ request }) => {
    // Create Pokemon
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Take a Breather Test')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Pre-condition: Apply +3 ATK, +2 DEF stages
    await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 3, defense: 2 })

    // Pre-condition: Apply Confused (volatile)
    await applyStatus(request, encounterId, bulbasaurCombatantId, { add: ['Confused'] })

    // Verify pre-breather state
    const encounterBefore = await getEncounter(request, encounterId)
    const bulbasaurBefore = findCombatantByEntityId(encounterBefore, bulbasaurId)
    expect(bulbasaurBefore.entity.stageModifiers.attack).toBe(3)
    expect(bulbasaurBefore.entity.stageModifiers.defense).toBe(2)
    expect(bulbasaurBefore.entity.statusConditions).toContain('Confused')

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    // Verify breather result
    expect(breatherResult.combatantId).toBe(bulbasaurCombatantId)
    expect(breatherResult.stagesReset).toBe(true)
    expect(breatherResult.conditionsCured).toContain('Confused')
    expect(breatherResult.trippedApplied).toBe(true)
    expect(breatherResult.vulnerableApplied).toBe(true)

    // Verify post-breather state via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const bulbasaurAfter = findCombatantByEntityId(encounterAfter, bulbasaurId)

    // All stages reset to 0
    expect(bulbasaurAfter.entity.stageModifiers.attack).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.defense).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.specialAttack).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.specialDefense).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.speed).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.accuracy).toBe(0)
    expect(bulbasaurAfter.entity.stageModifiers.evasion).toBe(0)

    // Confused removed
    expect(bulbasaurAfter.entity.statusConditions).not.toContain('Confused')

    // Tripped and Vulnerable applied as temp conditions
    const combatant = encounterAfter.combatants.find((c: any) => c.entityId === bulbasaurId)
    expect(combatant.tempConditions).toContain('Tripped')
    expect(combatant.tempConditions).toContain('Vulnerable')
  })

  test('breather does not remove persistent conditions (Paralyzed)', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Persistent Conditions')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply both volatile (Confused) and persistent (Paralyzed) conditions
    await applyStatus(request, encounterId, bulbasaurCombatantId, {
      add: ['Confused', 'Paralyzed']
    })

    // Also apply some stages
    await applyStages(request, encounterId, bulbasaurCombatantId, { speed: -2 })

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    // Confused cured, Paralyzed remains
    expect(breatherResult.conditionsCured).toContain('Confused')
    expect(breatherResult.conditionsCured).not.toContain('Paralyzed')

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.statusConditions).not.toContain('Confused')
    expect(bulbasaur.entity.statusConditions).toContain('Paralyzed')

    // Stages still reset
    expect(bulbasaur.entity.stageModifiers.speed).toBe(0)
  })

  test('breather removes temporary HP', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Temp HP Removal')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Grant 10 temp HP
    await applyHeal(request, encounterId, bulbasaurCombatantId, { tempHp: 10 })

    // Verify temp HP
    const encounterBefore = await getEncounter(request, encounterId)
    const bulbasaurBefore = findCombatantByEntityId(encounterBefore, bulbasaurId)
    expect(bulbasaurBefore.entity.temporaryHp).toBe(10)

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    expect(breatherResult.tempHpRemoved).toBe(10)

    // Verify temp HP removed
    const encounterAfter = await getEncounter(request, encounterId)
    const bulbasaurAfter = findCombatantByEntityId(encounterAfter, bulbasaurId)
    expect(bulbasaurAfter.entity.temporaryHp).toBe(0)
  })

  test('breather cures Slowed and Stuck (non-volatile, PTU p.245)', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Slowed+Stuck')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Slowed and Stuck (Other Afflictions, not Volatile, but explicitly cured by breather)
    await applyStatus(request, encounterId, bulbasaurCombatantId, {
      add: ['Slowed', 'Stuck']
    })

    // Verify pre-breather state
    const encounterBefore = await getEncounter(request, encounterId)
    const bulbasaurBefore = findCombatantByEntityId(encounterBefore, bulbasaurId)
    expect(bulbasaurBefore.entity.statusConditions).toContain('Slowed')
    expect(bulbasaurBefore.entity.statusConditions).toContain('Stuck')

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    // Both should appear in conditionsCured
    expect(breatherResult.conditionsCured).toContain('Slowed')
    expect(breatherResult.conditionsCured).toContain('Stuck')

    // Verify neither remains after breather
    const encounterAfter = await getEncounter(request, encounterId)
    const bulbasaurAfter = findCombatantByEntityId(encounterAfter, bulbasaurId)
    expect(bulbasaurAfter.entity.statusConditions).not.toContain('Slowed')
    expect(bulbasaurAfter.entity.statusConditions).not.toContain('Stuck')
  })

  test('breather with no active buffs/debuffs still applies Tripped+Vulnerable', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Clean State')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Take a Breather with no pre-conditions
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    // No stages to reset
    expect(breatherResult.stagesReset).toBe(false)
    expect(breatherResult.tempHpRemoved).toBe(0)
    expect(breatherResult.conditionsCured).toHaveLength(0)

    // But Tripped and Vulnerable are still applied
    expect(breatherResult.trippedApplied).toBe(true)
    expect(breatherResult.vulnerableApplied).toBe(true)

    // Verify temp conditions
    const encounter = await getEncounter(request, encounterId)
    const combatant = encounter.combatants.find((c: any) => c.entityId === bulbasaurId)
    expect(combatant.tempConditions).toContain('Tripped')
    expect(combatant.tempConditions).toContain('Vulnerable')
  })

  test('breather does NOT cure Cursed (volatile exception, PTU p.245)', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Cursed Survives')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply Cursed (volatile but excluded from breather) + Confused (volatile, should be cured)
    await applyStatus(request, encounterId, bulbasaurCombatantId, {
      add: ['Cursed', 'Confused']
    })

    // Verify pre-breather state: both conditions present
    const encounterBefore = await getEncounter(request, encounterId)
    const bulbasaurBefore = findCombatantByEntityId(encounterBefore, bulbasaurId)
    expect(bulbasaurBefore.entity.statusConditions).toContain('Cursed')
    expect(bulbasaurBefore.entity.statusConditions).toContain('Confused')

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, bulbasaurCombatantId)

    // Cursed must NOT appear in conditionsCured (it requires GM adjudication)
    expect(breatherResult.conditionsCured).not.toContain('Cursed')

    // Confused should be cured normally
    expect(breatherResult.conditionsCured).toContain('Confused')

    // Verify post-breather state via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const bulbasaurAfter = findCombatantByEntityId(encounterAfter, bulbasaurId)

    // Cursed must still be present
    expect(bulbasaurAfter.entity.statusConditions).toContain('Cursed')

    // Confused must be gone
    expect(bulbasaurAfter.entity.statusConditions).not.toContain('Confused')
  })

  test('breather is logged in move log', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Breather - Move Log')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply some stages so there is something to log
    await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 2 })

    // Take a Breather
    await takeBreather(request, encounterId, bulbasaurCombatantId)

    // Verify move log entry
    const encounter = await getEncounter(request, encounterId)
    const breatherLog = encounter.moveLog.find(
      (entry: any) => entry.moveName === 'Take a Breather'
    )
    expect(breatherLog).toBeDefined()
    expect(breatherLog.actorId).toBe(bulbasaurCombatantId)
  })
})
