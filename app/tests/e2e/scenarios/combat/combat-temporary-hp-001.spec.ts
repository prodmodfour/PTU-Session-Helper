import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  applyHeal,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

/**
 * P2 Scenario: Temporary HP Absorption
 *
 * PTU rule: "Temporary Hit Points are always lost first from damage"
 *
 * Setup:
 *   Charmander (HP=32) granted 10 Temp HP
 *   1st hit: 15 damage --> Temp HP absorbs 10, remaining 5 hits real HP --> HP=27, TempHP=0
 *   2nd hit: 8 damage --> no Temp HP --> HP=19, TempHP=0
 */

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

const BULBASAUR: PokemonSetup = {
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

// Charmander HP = level(10) + (baseHp(4) * 3) + 10 = 32
const CHARMANDER_MAX_HP = 32
const TEMP_HP_GRANTED = 10
const FIRST_HIT_DAMAGE = 15
const SECOND_HIT_DAMAGE = 8

test.describe('P2: Temporary HP Absorption (combat-temporary-hp-001)', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('Temp HP absorbs damage before real HP', async ({ request }) => {
    // --- Setup ---
    const charmanderPokemonId = await createPokemon(request, CHARMANDER)
    pokemonIds.push(charmanderPokemonId)

    const opponentId = await createPokemon(request, BULBASAUR)
    pokemonIds.push(opponentId)

    encounterId = await createEncounter(request, 'Test: Temporary HP')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderPokemonId, 'allies')
    await addCombatant(request, encounterId, opponentId, 'enemies')
    await startEncounter(request, encounterId)

    // Grant 10 Temp HP to Charmander
    const healResult = await applyHeal(request, encounterId, charmanderCombatantId, { tempHp: TEMP_HP_GRANTED })

    // --- Assertion 1: Before damage, HP 32/32, Temp HP = 10 ---
    expect(healResult.healResult.tempHpGained).toBe(TEMP_HP_GRANTED)
    expect(healResult.healResult.newTempHp).toBe(TEMP_HP_GRANTED)
    expect(healResult.healResult.newHp).toBe(CHARMANDER_MAX_HP)

    // Verify via GET encounter
    const beforeDamageEncounter = await getEncounter(request, encounterId)
    const charmanderBeforeDamage = findCombatantByEntityId(beforeDamageEncounter, charmanderPokemonId)
    expect(charmanderBeforeDamage.entity.currentHp).toBe(CHARMANDER_MAX_HP)
    expect(charmanderBeforeDamage.entity.temporaryHp).toBe(TEMP_HP_GRANTED)

    // --- Apply first hit: 15 damage ---
    const firstHitResult = await applyDamage(request, encounterId, charmanderCombatantId, FIRST_HIT_DAMAGE)
    const firstDamageResult = firstHitResult.damageResult

    // --- Assertion 2: Temp HP absorbs 10, remaining 5 goes to real HP ---
    // Server computes: tempHpAbsorbed, hpDamage, newHp, newTempHp
    expect(firstDamageResult.tempHpAbsorbed).toBe(TEMP_HP_GRANTED) // 10
    expect(firstDamageResult.hpDamage).toBe(FIRST_HIT_DAMAGE - TEMP_HP_GRANTED) // 5
    expect(firstDamageResult.newHp).toBe(
      Math.max(0, charmanderBeforeDamage.entity.currentHp - firstDamageResult.hpDamage)
    )
    expect(firstDamageResult.newTempHp).toBe(0)
    expect(firstDamageResult.fainted).toBe(false)

    // Verify via GET encounter
    const afterFirstHitEncounter = await getEncounter(request, encounterId)
    const charmanderAfterFirstHit = findCombatantByEntityId(afterFirstHitEncounter, charmanderPokemonId)
    expect(charmanderAfterFirstHit.entity.currentHp).toBe(27)
    expect(charmanderAfterFirstHit.entity.temporaryHp).toBe(0)

    // --- Apply second hit: 8 damage (no Temp HP remaining) ---
    const secondHitResult = await applyDamage(request, encounterId, charmanderCombatantId, SECOND_HIT_DAMAGE)
    const secondDamageResult = secondHitResult.damageResult

    // --- Assertion 3: No Temp HP, all damage to real HP ---
    // Server computes: no temp HP to absorb, full damage to real HP
    expect(secondDamageResult.tempHpAbsorbed).toBe(0)
    expect(secondDamageResult.hpDamage).toBe(SECOND_HIT_DAMAGE)
    expect(secondDamageResult.newHp).toBe(
      Math.max(0, charmanderAfterFirstHit.entity.currentHp - secondDamageResult.hpDamage)
    )
    expect(secondDamageResult.newTempHp).toBe(0)
    expect(secondDamageResult.fainted).toBe(false)

    // Verify via GET encounter
    const afterSecondHitEncounter = await getEncounter(request, encounterId)
    const charmanderAfterSecondHit = findCombatantByEntityId(afterSecondHitEncounter, charmanderPokemonId)
    expect(charmanderAfterSecondHit.entity.currentHp).toBe(19)
    expect(charmanderAfterSecondHit.entity.temporaryHp).toBe(0)
  })
})
