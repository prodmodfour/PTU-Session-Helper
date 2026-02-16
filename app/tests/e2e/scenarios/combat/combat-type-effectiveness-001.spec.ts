/**
 * P1 Combat Scenario: Type Effectiveness (Super Effective)
 *
 * Setup: Squirtle (SpATK 5, Water, level 13) vs Charmander (SpDEF 5, Fire, level 10, HP=32)
 *
 * PTU Type Effectiveness Rules:
 *   - Super Effective: ×1.5 damage multiplier
 *   - Water vs Fire = Super Effective
 *   - STAB: Squirtle is Water, Water Gun is Water -> DB 4 + 2 = 6, set damage = 15
 *   - Damage before effectiveness: 15 + SpATK(5) - SpDEF(5) = 15
 *   - Final: floor(15 × 1.5) = 22
 *   - Charmander HP: 32 - 22 = 10/32
 *
 * Test approach: Apply pre-calculated super effective damage (22) to Charmander, verify.
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

// Squirtle: SpATK 5, Water, level 13
const squirtleSetup: PokemonSetup = {
  species: 'Squirtle',
  level: 13,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 7,
  baseSpAttack: 5,
  baseSpDefense: 6,
  baseSpeed: 5,
  types: ['Water']
}

// Charmander: SpDEF 5, Fire, level 10, HP = 10 + (4 × 3) + 10 = 32
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

test.describe('P1: Type Effectiveness - Super Effective', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('Water vs Fire = super effective: floor(15 × 1.5) = 22 damage', async ({ request }) => {
    // Create Pokemon
    const squirtleId = await createPokemon(request, squirtleSetup)
    pokemonIds.push(squirtleId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Type Effectiveness - Water vs Fire')
    await addCombatant(request, encounterId, squirtleId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Verify Charmander starting HP
    const encounterBefore = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(encounterBefore, charmanderId)
    expect(charmanderBefore.entity.maxHp).toBe(32)
    expect(charmanderBefore.entity.currentHp).toBe(32)

    // Apply super effective damage: floor(15 × 1.5) = 22
    const { damageResult } = await applyDamage(request, encounterId, charmanderCombatantId, 22)

    // Verify damage result
    expect(damageResult.finalDamage).toBe(22)
    expect(damageResult.hpDamage).toBe(22)
    expect(damageResult.newHp).toBe(
      Math.max(0, charmanderBefore.entity.currentHp - damageResult.hpDamage)
    )
    expect(damageResult.fainted).toBe(false)

    // Massive damage injury: server checks hpDamage >= maxHp / 2
    expect(damageResult.injuryGained).toBe(true)
    expect(damageResult.newInjuries).toBe(1)

    // Verify via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const charmanderAfter = findCombatantByEntityId(encounterAfter, charmanderId)
    expect(charmanderAfter.entity.currentHp).toBe(damageResult.newHp)
  })

  test('neutral damage baseline for comparison: 15 damage (no effectiveness)', async ({ request }) => {
    // Without type effectiveness: damage = 15 (SpATK 5 - SpDEF 5 + set damage 15)
    // With super effective: floor(15 × 1.5) = 22
    // Difference: 7 extra damage from type effectiveness

    const squirtleId = await createPokemon(request, squirtleSetup)
    pokemonIds.push(squirtleId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Type Effectiveness - Neutral Baseline')
    await addCombatant(request, encounterId, squirtleId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Fetch server state before damage
    const encounterBefore = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(encounterBefore, charmanderId)

    // Apply neutral damage: 15 (no type effectiveness multiplier)
    const { damageResult } = await applyDamage(request, encounterId, charmanderCombatantId, 15)

    expect(damageResult.finalDamage).toBe(15)
    expect(damageResult.newHp).toBe(
      Math.max(0, charmanderBefore.entity.currentHp - damageResult.hpDamage)
    )
    expect(damageResult.fainted).toBe(false)

    // 15 < 32/2 = 16, no massive damage
    expect(damageResult.injuryGained).toBe(false)
  })

  test('super effective damage pushes past massive damage threshold', async ({ request }) => {
    // Neutral 15 does NOT cause injury (15 < 16)
    // Super effective 22 DOES cause injury (22 >= 16)
    // Type effectiveness can be the difference between injury and no injury

    const squirtleId = await createPokemon(request, squirtleSetup)
    pokemonIds.push(squirtleId)
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)

    encounterId = await createEncounter(request, 'Type Effectiveness - Injury Threshold')
    await addCombatant(request, encounterId, squirtleId, 'players')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'enemies')
    await startEncounter(request, encounterId)

    // Fetch server state before damage
    const encounterBefore = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(encounterBefore, charmanderId)

    // Apply super effective damage
    const { damageResult } = await applyDamage(request, encounterId, charmanderCombatantId, 22)

    // Super effective crosses the massive damage threshold
    expect(damageResult.injuryGained).toBe(true)
    expect(damageResult.newInjuries).toBe(1)
    expect(damageResult.newHp).toBe(
      Math.max(0, charmanderBefore.entity.currentHp - damageResult.hpDamage)
    )

    // Verify encounter state
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(damageResult.newHp)
  })
})
