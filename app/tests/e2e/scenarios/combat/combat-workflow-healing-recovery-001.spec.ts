/**
 * P0 Workflow Scenario: Healing and Recovery
 *
 * Multi-phase healing workflow testing all recovery mechanics.
 *
 * Setup:
 *   Bulbasaur L15 — HP = 15 + (5×3) + 10 = 40
 *   Charmander L13 — HP = 13 + (4×3) + 10 = 35
 *   Squirtle L13 — HP = 13 + (4×3) + 10 = 35
 *   Rattata L10 — enemy placeholder
 *
 * Phases:
 *   1. Damage Bulbasaur (25 dmg → HP 15, injury) and faint Charmander (50 dmg → HP 0)
 *   2. Heal Bulbasaur 30 → capped at max 40
 *   3. Revive Charmander (heal 20 → HP 20, Fainted removed)
 *   4. Grant Squirtle 15 temp HP
 *   5. Damage Squirtle 20 (temp absorbs 15, real takes 5 → HP 30)
 *   6. Heal Bulbasaur's injury (1 → 0)
 *
 * PTU Rules:
 *   - Healing capped at maxHP: newHp = min(maxHp, currentHp + amount)
 *   - Faint recovery: healing from 0 HP removes Fainted status
 *   - Temp HP: always lost first from damage (core/07-combat.md p247)
 *   - Injury healing: reduces injury count
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

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur',
  level: 15,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 5,
  baseSpAttack: 7,
  baseSpDefense: 7,
  baseSpeed: 5,
  types: ['Grass', 'Poison']
}

const charmanderSetup: PokemonSetup = {
  species: 'Charmander',
  level: 13,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 4,
  baseSpAttack: 6,
  baseSpDefense: 5,
  baseSpeed: 7,
  types: ['Fire']
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

test.describe('P0 Workflow: Healing and Recovery', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let bulbasaurId: string
  let charmanderId: string
  let squirtleId: string
  let rattataId: string
  let bulbasaurCombatantId: string
  let charmanderCombatantId: string
  let squirtleCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    bulbasaurId = await createPokemon(request, bulbasaurSetup)
    charmanderId = await createPokemon(request, charmanderSetup)
    squirtleId = await createPokemon(request, squirtleSetup)
    rattataId = await createPokemon(request, rattataSetup)

    encounterId = await createEncounter(request, 'Test: Healing and Recovery')
    bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'allies')
    charmanderCombatantId = await addCombatant(request, encounterId, charmanderId, 'allies')
    squirtleCombatantId = await addCombatant(request, encounterId, squirtleId, 'allies')
    await addCombatant(request, encounterId, rattataId, 'enemies')

    await startEncounter(request, encounterId)
  })

  test('Phase 1: damage Bulbasaur (25, injury) and faint Charmander (50)', async ({ request }) => {
    const enc = await getEncounter(request, encounterId)
    const bulbasaurBefore = findCombatantByEntityId(enc, bulbasaurId)
    const charmanderBefore = findCombatantByEntityId(enc, charmanderId)

    // Bulbasaur: 25 damage, injury (25 ≥ maxHp/2)
    const bulbDmg = await applyDamage(request, encounterId, bulbasaurCombatantId, 25)
    expect(bulbDmg.damageResult.newHp).toBe(
      Math.max(0, bulbasaurBefore.entity.currentHp - bulbDmg.damageResult.hpDamage)
    )
    // Massive damage (25 >= 20) + crosses 50% marker at 20 = 2 injuries
    expect(bulbDmg.damageResult.injuryGained).toBe(true)
    expect(bulbDmg.damageResult.newInjuries).toBe(2)

    // Charmander: 50 damage → fainted
    const charDmg = await applyDamage(request, encounterId, charmanderCombatantId, 50)
    expect(charDmg.damageResult.newHp).toBe(
      Math.max(0, charmanderBefore.entity.currentHp - charDmg.damageResult.hpDamage)
    )
    expect(charDmg.damageResult.fainted).toBe(true)

    // Verify Fainted status via GET
    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.statusConditions).toContain('Fainted')
  })

  test('Phase 2: heal Bulbasaur 30 — capped at max HP 40', async ({ request }) => {
    // newHp = min(40, 15+30) = min(40, 45) = 40
    const heal = await applyHeal(request, encounterId, bulbasaurCombatantId, { amount: 30 })
    expect(heal.healResult.newHp).toBe(40)
    expect(heal.healResult.hpHealed).toBe(25) // only 25 of 30 applied

    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.currentHp).toBe(40)
    expect(bulbasaur.entity.maxHp).toBe(40)
  })

  test('Phase 3: revive Charmander (heal 20 from 0 HP) — Fainted removed', async ({ request }) => {
    // newHp = min(35, 0+20) = 20, Fainted removed
    const heal = await applyHeal(request, encounterId, charmanderCombatantId, { amount: 20 })
    expect(heal.healResult.newHp).toBe(20)
    expect(heal.healResult.faintedRemoved).toBe(true)

    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(20)
    expect(charmander.entity.statusConditions).not.toContain('Fainted')
  })

  test('Phase 4: grant Squirtle 15 temporary HP', async ({ request }) => {
    // Squirtle HP stays 35/35, temporaryHp = 15
    const heal = await applyHeal(request, encounterId, squirtleCombatantId, { tempHp: 15 })
    expect(heal.healResult.tempHpGained).toBe(15)
    expect(heal.healResult.newTempHp).toBe(15)

    const encounter = await getEncounter(request, encounterId)
    const squirtle = findCombatantByEntityId(encounter, squirtleId)
    expect(squirtle.entity.currentHp).toBe(35)
    expect(squirtle.entity.temporaryHp).toBe(15)
  })

  test('Phase 5: damage Squirtle 20 — temp HP absorbs 15, real HP takes 5', async ({ request }) => {
    const enc = await getEncounter(request, encounterId)
    const squirtleBefore = findCombatantByEntityId(enc, squirtleId)

    const dmg = await applyDamage(request, encounterId, squirtleCombatantId, 20)
    expect(dmg.damageResult.tempHpAbsorbed).toBe(15)
    expect(dmg.damageResult.hpDamage).toBe(5)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, squirtleBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.newTempHp).toBe(0)

    const encounter = await getEncounter(request, encounterId)
    const squirtle = findCombatantByEntityId(encounter, squirtleId)
    expect(squirtle.entity.currentHp).toBe(30)
    expect(squirtle.entity.temporaryHp).toBe(0)
  })

  test('Phase 6: heal Bulbasaur injury (2 → 1)', async ({ request }) => {
    // Previous injuries = 2 (massive damage + 50% marker), heal 1 → 1
    await applyHeal(request, encounterId, bulbasaurCombatantId, { healInjuries: 1 })

    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.injuries).toBe(1)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [bulbasaurId, charmanderId, squirtleId, rattataId])
  })
})
