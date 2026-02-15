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

/**
 * P2 Scenario: Massive Damage Injury
 *
 * PTU rule: A single attack dealing >= 50% of max HP triggers 1 injury.
 *
 * Setup:
 *   Machop (ATK 8, Fighting) attacks Charmander (DEF 4, Fire, HP=32)
 *   Karate Chop: SetDamage(13) + ATK(8) - DEF(4) = 17
 *   Massive damage threshold = 32 * 0.5 = 16
 *   17 >= 16 --> injury triggered
 */

const MACHOP: PokemonSetup = {
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

const CHARMANDER: PokemonSetup = {
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

// Charmander HP = level(10) + (baseHp(4) * 3) + 10 = 32
const CHARMANDER_MAX_HP = 32
const KARATE_CHOP_DAMAGE = 17 // SetDamage(13) + ATK(8) - DEF(4)
const MASSIVE_DAMAGE_THRESHOLD = CHARMANDER_MAX_HP * 0.5 // 16

test.describe('P2: Massive Damage Injury (combat-injury-massive-damage-001)', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('single hit >= 50% max HP triggers massive damage injury', async ({ request }) => {
    // --- Setup ---
    const attackerId = await createPokemon(request, MACHOP)
    pokemonIds.push(attackerId)

    const targetId = await createPokemon(request, CHARMANDER)
    pokemonIds.push(targetId)

    encounterId = await createEncounter(request, 'Test: Massive Damage Injury')
    const attackerCombatantId = await addCombatant(request, encounterId, attackerId, 'allies')
    const targetCombatantId = await addCombatant(request, encounterId, targetId, 'enemies')
    await startEncounter(request, encounterId)

    // --- Assertion 1: Charmander starts at 32/32 HP, 0 injuries ---
    const beforeEncounter = await getEncounter(request, encounterId)
    const charmanderBefore = findCombatantByEntityId(beforeEncounter, targetId)
    expect(charmanderBefore.entity.currentHp).toBe(CHARMANDER_MAX_HP)
    expect(charmanderBefore.entity.maxHp).toBe(CHARMANDER_MAX_HP)
    expect(charmanderBefore.entity.injuries ?? 0).toBe(0)

    // --- Verify threshold math ---
    expect(KARATE_CHOP_DAMAGE).toBeGreaterThanOrEqual(MASSIVE_DAMAGE_THRESHOLD)

    // --- Apply 17 damage (Karate Chop) ---
    const result = await applyDamage(request, encounterId, targetCombatantId, KARATE_CHOP_DAMAGE)
    const damageResult = result.damageResult

    // --- Assertion 2: Damage applied is 17 ---
    expect(damageResult.finalDamage).toBe(KARATE_CHOP_DAMAGE)
    expect(damageResult.hpDamage).toBe(KARATE_CHOP_DAMAGE)

    // --- Assertion 3: Massive damage triggers injury (0 -> 1) ---
    expect(damageResult.injuryGained).toBe(true)
    expect(damageResult.newInjuries).toBe(1)

    // --- Assertion 4: HP = 15/32, NOT fainted, injury count = 1 ---
    const expectedHp = CHARMANDER_MAX_HP - KARATE_CHOP_DAMAGE // 32 - 17 = 15
    expect(damageResult.newHp).toBe(expectedHp)
    expect(damageResult.fainted).toBe(false)

    // Verify via GET encounter as well
    const afterEncounter = await getEncounter(request, encounterId)
    const charmanderAfter = findCombatantByEntityId(afterEncounter, targetId)
    expect(charmanderAfter.entity.currentHp).toBe(expectedHp)
    expect(charmanderAfter.entity.injuries).toBe(1)
  })
})
