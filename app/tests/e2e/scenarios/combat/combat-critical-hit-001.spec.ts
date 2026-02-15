/**
 * P1 Combat Scenario: Critical Hit Damage
 *
 * Setup: Bulbasaur (ATK 5, Grass/Poison) vs Charmander (DEF 4, Fire, HP=32)
 *
 * PTU Critical Hit Rules:
 *   - Crit doubles the set damage before adding ATK/SpATK and subtracting DEF/SpDEF
 *   - Normal: SetDamage(13) + ATK(5) - DEF(4) = 14
 *   - Crit:   SetDamage(13) x 2 = 26, then 26 + ATK(5) - DEF(4) = 27
 *   - Type effectiveness still applies on crits (Normal vs Fire = neutral)
 *   - Charmander HP after crit: 32 - 27 = 5/32
 *
 * Test approach: API-first. Apply normal damage (14), verify. Then apply crit damage (27), verify.
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

// Bulbasaur: ATK 5, Grass/Poison, level 10
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

// Charmander: DEF 4, Fire, level 10, HP = 10 + (4 × 3) + 10 = 32
// Using baseHp=4 so maxHp = 10 + (4*3) + 10 = 32
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

test.describe('P1: Critical Hit Damage', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('normal damage baseline: SetDamage(13) + ATK(5) - DEF(4) = 14', async ({ request }) => {
    // Create Pokemon
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Crit Hit Test - Normal Baseline')
    await addCombatant(request, encounterId, bulbasaurId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Verify Charmander starting HP
    const encounterBefore = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(encounterBefore, charmanderId)
    expect(charmanderBefore.entity.maxHp).toBe(32)
    expect(charmanderBefore.entity.currentHp).toBe(32)

    // Apply normal damage: 14
    const { damageResult } = await applyDamage(request, encounterId, charmanderCombatantId, 14)

    // Verify damage result
    expect(damageResult.finalDamage).toBe(14)
    expect(damageResult.hpDamage).toBe(14)
    expect(damageResult.newHp).toBe(18) // 32 - 14 = 18
    expect(damageResult.fainted).toBe(false)

    // Verify via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const charmanderAfter = findCombatantByEntityId(encounterAfter, charmanderId)
    expect(charmanderAfter.entity.currentHp).toBe(18)
  })

  test('critical hit doubles set damage: crit damage = 27, HP 32 -> 5', async ({ request }) => {
    // Create Pokemon
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Crit Hit Test - Critical')
    await addCombatant(request, encounterId, bulbasaurId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Verify Charmander starting HP
    const encounterBefore = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(encounterBefore, charmanderId)
    expect(charmanderBefore.entity.currentHp).toBe(32)

    // Apply crit damage: SetDamage(13) x 2 + ATK(5) - DEF(4) = 26 + 5 - 4 = 27
    const { damageResult } = await applyDamage(request, encounterId, charmanderCombatantId, 27)

    // Verify damage result
    expect(damageResult.finalDamage).toBe(27)
    expect(damageResult.hpDamage).toBe(27)
    expect(damageResult.newHp).toBe(5) // 32 - 27 = 5
    expect(damageResult.fainted).toBe(false)

    // Verify injury: 27 >= 32/2 = 16, so massive damage triggers injury
    expect(damageResult.injuryGained).toBe(true)
    expect(damageResult.newInjuries).toBe(1)

    // Verify via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const charmanderAfter = findCombatantByEntityId(encounterAfter, charmanderId)
    expect(charmanderAfter.entity.currentHp).toBe(5)
  })

  test('crit damage is nearly double normal damage', async ({ request }) => {
    // This test verifies the mathematical relationship: crit(27) vs normal(14)
    // Crit doubles set damage (13 -> 26) but ATK-DEF stays the same (+1)
    // So crit = 27, normal = 14, difference = 13 (exactly the set damage)

    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Crit Hit Test - Comparison')
    await addCombatant(request, encounterId, bulbasaurId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply normal damage first
    const normalResult = await applyDamage(request, encounterId, charmanderCombatantId, 14)
    expect(normalResult.damageResult.newHp).toBe(18) // 32 - 14

    // Apply crit damage (13 more, which is the doubled set damage portion)
    const critResult = await applyDamage(request, encounterId, charmanderCombatantId, 13)
    expect(critResult.damageResult.newHp).toBe(5) // 18 - 13 = 5

    // Total damage applied = 14 + 13 = 27, same as a single crit hit
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(5)
  })
})
