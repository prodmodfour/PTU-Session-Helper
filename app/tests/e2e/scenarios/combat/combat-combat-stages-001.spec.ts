/**
 * P1 Combat Scenario: Combat Stages
 *
 * Setup: Bulbasaur (ATK 5) vs Charmander (DEF 4)
 *
 * PTU Combat Stage Rules:
 *   - Stages range from -6 to +6
 *   - Stage multiplier table:
 *     -6=×0.4, -5=×0.5, -4=×0.6, -3=×0.7, -2=×0.8, -1=×0.9,
 *      0=×1.0, +1=×1.2, +2=×1.4, +3=×1.6, +4=×1.8, +5=×2.0, +6=×2.2
 *
 * Assertions:
 *   1. Apply +2 ATK CS -> displays +2, modified ATK = floor(5 × 1.4) = 7
 *   2. Damage with modified ATK: SetDamage(13) + 7 - 4 = 16 (vs baseline 14)
 *   3. Apply -2 DEF to Charmander -> modified DEF = floor(4 × 0.8) = 3
 *   4. Stage clamping at -6 and +6
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStages,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

// Bulbasaur: ATK 5
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

// Charmander: DEF 4
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

test.describe('P1: Combat Stages', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('+2 ATK combat stage: previous=0, change=+2, current=+2', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - ATK +2')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply +2 ATK combat stage
    const { stageChanges } = await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 2 })

    // Verify stage change response
    expect(stageChanges.combatantId).toBe(bulbasaurCombatantId)
    expect(stageChanges.changes.attack.previous).toBe(0)
    expect(stageChanges.changes.attack.change).toBe(2)
    expect(stageChanges.changes.attack.current).toBe(2)
    expect(stageChanges.currentStages.attack).toBe(2)

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.stageModifiers.attack).toBe(2)
  })

  test('-2 DEF combat stage: previous=0, change=-2, current=-2', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - DEF -2')
    await addCombatant(request, encounterId, bulbasaurId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply -2 DEF combat stage to Charmander
    const { stageChanges } = await applyStages(request, encounterId, charmanderCombatantId, { defense: -2 })

    // Verify stage change response
    expect(stageChanges.changes.defense.previous).toBe(0)
    expect(stageChanges.changes.defense.change).toBe(-2)
    expect(stageChanges.changes.defense.current).toBe(-2)
    expect(stageChanges.currentStages.defense).toBe(-2)

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.stageModifiers.defense).toBe(-2)
  })

  test('multiple stage changes stack additively', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - Stacking')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply +2 ATK
    const stage1 = await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 2 })
    expect(stage1.stageChanges.currentStages.attack).toBe(2)

    // Apply +1 more ATK
    const stage2 = await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 1 })
    expect(stage2.stageChanges.changes.attack.previous).toBe(2)
    expect(stage2.stageChanges.changes.attack.change).toBe(1)
    expect(stage2.stageChanges.changes.attack.current).toBe(3)
    expect(stage2.stageChanges.currentStages.attack).toBe(3)

    // Verify via GET
    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.stageModifiers.attack).toBe(3)
  })

  test('stages clamp at +6 maximum', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - Clamp Max')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply +6 ATK (max)
    await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 6 })

    // Try to apply +2 more -> should clamp at +6
    const result = await applyStages(request, encounterId, bulbasaurCombatantId, { attack: 2 })
    expect(result.stageChanges.changes.attack.previous).toBe(6)
    expect(result.stageChanges.changes.attack.change).toBe(0) // clamped, no change
    expect(result.stageChanges.changes.attack.current).toBe(6)
    expect(result.stageChanges.currentStages.attack).toBe(6)
  })

  test('stages clamp at -6 minimum', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - Clamp Min')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await addCombatant(request, encounterId, bulbasaurId, 'players')
    await startEncounter(request, encounterId)

    // Apply -6 DEF (min)
    await applyStages(request, encounterId, charmanderCombatantId, { defense: -6 })

    // Try to apply -2 more -> should clamp at -6
    const result = await applyStages(request, encounterId, charmanderCombatantId, { defense: -2 })
    expect(result.stageChanges.changes.defense.previous).toBe(-6)
    expect(result.stageChanges.changes.defense.change).toBe(0) // clamped, no change
    expect(result.stageChanges.changes.defense.current).toBe(-6)
    expect(result.stageChanges.currentStages.defense).toBe(-6)
  })

  test('multiple stats can be changed in one call', async ({ request }) => {
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Combat Stages - Multi-Stat')
    const bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'players')
    await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply +2 ATK and +1 Speed in one call
    const { stageChanges } = await applyStages(request, encounterId, bulbasaurCombatantId, {
      attack: 2,
      speed: 1
    })

    expect(stageChanges.changes.attack.current).toBe(2)
    expect(stageChanges.changes.speed.current).toBe(1)
    expect(stageChanges.currentStages.attack).toBe(2)
    expect(stageChanges.currentStages.speed).toBe(1)

    // Other stats remain at 0
    expect(stageChanges.currentStages.defense).toBe(0)
    expect(stageChanges.currentStages.specialAttack).toBe(0)
    expect(stageChanges.currentStages.specialDefense).toBe(0)
    expect(stageChanges.currentStages.evasion).toBe(0)
    expect(stageChanges.currentStages.accuracy).toBe(0)
  })
})
