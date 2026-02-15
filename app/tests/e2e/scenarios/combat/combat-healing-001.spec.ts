/**
 * P1 Combat Scenario: Healing Mechanics
 *
 * Setup: Charmander (HP=32) and Bulbasaur (opponent)
 *
 * PTU Healing Rules:
 *   - HP healed is capped at max HP
 *   - Cannot overheal beyond maxHp
 *   - Healing from 0 HP removes Fainted status
 *
 * Test flow:
 *   1. Starting HP: 32/32
 *   2. After 20 damage: 12/32
 *   3. After 15 heal: 27/32
 *   4. After 10 more heal: capped at 32/32 (only 5 effective)
 */
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

// Charmander: HP = 10 + (4 × 3) + 10 = 32
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

// Bulbasaur: opponent (just needs to exist in encounter)
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

test.describe('P1: Healing Mechanics', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('full healing flow: damage -> heal -> overheal capped at max', async ({ request }) => {
    // Create Pokemon
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'Healing Test - Full Flow')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')
    await startEncounter(request, encounterId)

    // Step 1: Verify starting HP = 32/32
    const encounter1 = await getEncounter(request, encounterId)
    const charmander1 = findCombatantByEntityId(encounter1, charmanderId)
    expect(charmander1.entity.currentHp).toBe(32)
    expect(charmander1.entity.maxHp).toBe(32)

    // Step 2: Apply 20 damage -> 12/32
    const dmgResult = await applyDamage(request, encounterId, charmanderCombatantId, 20)
    expect(dmgResult.damageResult.newHp).toBe(12)
    expect(dmgResult.damageResult.hpDamage).toBe(20)

    // Step 3: Heal 15 -> 27/32
    const heal1 = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 15 })
    expect(heal1.healResult.hpHealed).toBe(15)
    expect(heal1.healResult.newHp).toBe(27)
    expect(heal1.healResult.faintedRemoved).toBe(false)

    // Step 4: Heal 10 more -> capped at 32/32 (only 5 effective)
    const heal2 = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 10 })
    expect(heal2.healResult.hpHealed).toBe(5) // only 5 of 10 applied (capped)
    expect(heal2.healResult.newHp).toBe(32) // at max

    // Verify final state
    const encounterFinal = await getEncounter(request, encounterId)
    const charmanderFinal = findCombatantByEntityId(encounterFinal, charmanderId)
    expect(charmanderFinal.entity.currentHp).toBe(32)
  })

  test('healing at full HP heals 0', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)

    encounterId = await createEncounter(request, 'Healing Test - Already Full')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')
    await startEncounter(request, encounterId)

    // Heal at full HP
    const heal = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 20 })
    expect(heal.healResult.hpHealed).toBe(0) // no healing needed
    expect(heal.healResult.newHp).toBe(32) // unchanged

    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(32)
  })

  test('healing from 0 HP removes Fainted status', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)

    encounterId = await createEncounter(request, 'Healing Test - Revive from Fainted')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')
    await startEncounter(request, encounterId)

    // KO Charmander: apply 32 damage -> 0/32
    const dmg = await applyDamage(request, encounterId, charmanderCombatantId, 32)
    expect(dmg.damageResult.newHp).toBe(0)
    expect(dmg.damageResult.fainted).toBe(true)

    // Verify Fainted status is present
    const encounterKO = await getEncounter(request, encounterId)
    const charmanderKO = findCombatantByEntityId(encounterKO, charmanderId)
    expect(charmanderKO.entity.currentHp).toBe(0)
    expect(charmanderKO.entity.statusConditions).toContain('Fainted')

    // Heal from 0
    const heal = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 10 })
    expect(heal.healResult.newHp).toBe(10)
    expect(heal.healResult.hpHealed).toBe(10)
    expect(heal.healResult.faintedRemoved).toBe(true)

    // Verify Fainted status removed
    const encounterHealed = await getEncounter(request, encounterId)
    const charmanderHealed = findCombatantByEntityId(encounterHealed, charmanderId)
    expect(charmanderHealed.entity.currentHp).toBe(10)
    expect(charmanderHealed.entity.statusConditions).not.toContain('Fainted')
  })

  test('temporary HP stacks with heal', async ({ request }) => {
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)

    encounterId = await createEncounter(request, 'Healing Test - Temp HP')
    const charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'players')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')
    await startEncounter(request, encounterId)

    // Damage Charmander to 22/32
    await applyDamage(request, encounterId, charmanderCombatantId, 10)

    // Heal 5 HP -> 27/32
    const heal = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 5 })
    expect(heal.healResult.newHp).toBe(27)

    // Grant 8 temp HP
    const tempHeal = await applyHeal(request, encounterId, charmanderCombatantId, { tempHp: 8 })
    expect(tempHeal.healResult.tempHpGained).toBe(8)
    expect(tempHeal.healResult.newTempHp).toBe(8)

    // Verify state: 27/32 HP + 8 temp HP
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(27)
    expect(charmander.entity.temporaryHp).toBe(8)
  })
})
