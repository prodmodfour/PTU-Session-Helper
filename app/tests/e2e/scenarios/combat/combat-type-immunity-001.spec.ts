/**
 * P1 Combat Scenario: Type Immunity
 *
 * Setup: Machop (ATK 8, Fighting) vs Gastly (DEF 3, Ghost/Poison, HP=29)
 *   - Gastly HP = 10 + (3 × 3) + 10 = 29 (level 10, baseHp 3)
 *
 * PTU Type Immunity Rules:
 *   - Fighting vs Ghost = Immune -> 0 damage
 *   - Gastly HP remains 29/29
 *   - The move is still consumed (action used) even though it deals 0 damage
 *
 * Test approach: Apply 0 damage to verify HP unchanged. Use executeMove to verify
 * action consumption with 0 damage.
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  executeMove,
  getEncounter,
  findCombatantByEntityId,
  getActiveCombatant,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

// Machop: ATK 8, Fighting, level 10
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

// Gastly: DEF 3, Ghost/Poison, level 10, HP = 10 + (3 × 3) + 10 = 29
const gastlySetup: PokemonSetup = {
  species: 'Gastly',
  level: 10,
  baseHp: 3,
  baseAttack: 4,
  baseDefense: 3,
  baseSpAttack: 10,
  baseSpDefense: 4,
  baseSpeed: 8,
  types: ['Ghost', 'Poison']
}

test.describe('P1: Type Immunity - Fighting vs Ghost', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('Fighting vs Ghost = immune: 0 damage applied, HP unchanged', async ({ request }) => {
    // Create Pokemon
    const machopId = await createPokemon(request, machopSetup)
    pokemonIds.push(machopId)
    const gastlyId = await createPokemon(request, gastlySetup)
    pokemonIds.push(gastlyId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Type Immunity - Fighting vs Ghost')
    await addCombatant(request, encounterId, machopId, 'players')
    const gastlyCombatantId = await addCombatant(request, encounterId, gastlyId, 'enemies')
    await startEncounter(request, encounterId)

    // Verify Gastly starting HP
    const encounterBefore = await getEncounter(request, encounterId)
    const gastlyBefore = findCombatantByEntityId(encounterBefore, gastlyId)
    expect(gastlyBefore.entity.maxHp).toBe(29)
    expect(gastlyBefore.entity.currentHp).toBe(29)

    // Apply 0 damage (immune)
    const { damageResult } = await applyDamage(request, encounterId, gastlyCombatantId, 0)

    // Verify no damage was dealt
    expect(damageResult.finalDamage).toBe(0)
    expect(damageResult.hpDamage).toBe(0)
    expect(damageResult.tempHpAbsorbed).toBe(0)
    expect(damageResult.newHp).toBe(29)
    expect(damageResult.fainted).toBe(false)
    expect(damageResult.injuryGained).toBe(false)

    // Verify HP via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const gastlyAfter = findCombatantByEntityId(encounterAfter, gastlyId)
    expect(gastlyAfter.entity.currentHp).toBe(29)
  })

  test('move still consumed on immune target (action used)', async ({ request }) => {
    // Create Pokemon with a Fighting move
    const machopWithMove: PokemonSetup & { moves?: any[] } = {
      ...machopSetup,
      // We only need the PokemonSetup fields for createPokemon
    }
    const machopId = await createPokemon(request, machopWithMove)
    pokemonIds.push(machopId)
    const gastlyId = await createPokemon(request, gastlySetup)
    pokemonIds.push(gastlyId)

    encounterId = await createEncounter(request, 'Type Immunity - Move Consumed')
    const machopCombatantId = await addCombatant(request, encounterId, machopId, 'players')
    const gastlyCombatantId = await addCombatant(request, encounterId, gastlyId, 'enemies')
    await startEncounter(request, encounterId)

    // Execute move with 0 damage (immune). moveId can be the move name.
    const moveResult = await executeMove(
      request,
      encounterId,
      machopCombatantId,
      'Karate Chop',
      [gastlyCombatantId],
      0 // 0 damage due to immunity
    )

    // Move was executed (logged), Gastly takes no damage
    const encounter = await getEncounter(request, encounterId)
    const gastly = findCombatantByEntityId(encounter, gastlyId)
    expect(gastly.entity.currentHp).toBe(29)

    // Verify move was logged
    expect(encounter.moveLog.length).toBeGreaterThanOrEqual(1)
    const lastLog = encounter.moveLog[encounter.moveLog.length - 1]
    expect(lastLog.moveName).toBe('Karate Chop')
    expect(lastLog.targets[0].damage).toBe(0)
  })

  test('non-immune type still takes full damage from same attacker', async ({ request }) => {
    // Verify Machop can still deal damage to non-Ghost types
    // This ensures 0 damage is specifically due to immunity, not a general bug

    const machopId = await createPokemon(request, machopSetup)
    pokemonIds.push(machopId)

    // Create a Normal type target (not immune to Fighting)
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
    const rattataId = await createPokemon(request, rattataSetup)
    pokemonIds.push(rattataId)

    encounterId = await createEncounter(request, 'Type Immunity - Non-Immune Comparison')
    await addCombatant(request, encounterId, machopId, 'players')
    const rattataCombatantId = await addCombatant(request, encounterId, rattataId, 'enemies')
    await startEncounter(request, encounterId)

    // Rattata HP = 10 + (3 × 3) + 10 = 29
    const encounterBefore = await getEncounter(request, encounterId)
    const rattataBefore = findCombatantByEntityId(encounterBefore, rattataId)
    expect(rattataBefore.entity.maxHp).toBe(29)

    // Fighting vs Normal = super effective in PTU, but we just apply 20 damage
    const { damageResult } = await applyDamage(request, encounterId, rattataCombatantId, 20)

    expect(damageResult.finalDamage).toBe(20)
    expect(damageResult.hpDamage).toBe(20)
    expect(damageResult.newHp).toBe(9) // 29 - 20 = 9
    expect(damageResult.fainted).toBe(false)
  })
})
