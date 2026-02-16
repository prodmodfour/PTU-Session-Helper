/**
 * P0 Workflow Scenario: Faint and Replacement
 *
 * Mid-combat, Pidgey attacks Caterpie twice with STAB Tackle. Before the second
 * hit, Burned is applied to Caterpie. The second Tackle KOs Caterpie — faint
 * clears Burned, only "Fainted" remains. Charmander enters as replacement.
 *
 * Setup:
 *   Caterpie L8 — HP = 8+(5×3)+10 = 33, ATK 3, DEF 4, SPD 5 (Bug)
 *   Pidgey L10 — HP = 10+(4×3)+10 = 32, ATK 5, DEF 4, SPD 6 (Normal/Flying)
 *   Charmander L13 — HP = 13+(4×3)+10 = 35, SpATK 6, SPD 7 (Fire)
 *
 * Damage calculations:
 *   Pidgey STAB Tackle: DB5+2=DB7, set 17, raw=max(1,17+5-4)=18, ×1=18
 *   Caterpie Tackle (no STAB): DB5, set 13, raw=max(1,13+3-4)=12, ×1=12
 *   Charmander STAB Ember: DB4+2=DB6, set 15, raw=max(1,15+6-4)=17, ×1=17
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  applyStatus,
  nextTurn,
  getEncounter,
  findCombatantByEntityId,
  getActiveCombatant,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

const caterpieSetup: PokemonSetup = {
  species: 'Caterpie',
  level: 8,
  baseHp: 5,
  baseAttack: 3,
  baseDefense: 4,
  baseSpAttack: 2,
  baseSpDefense: 2,
  baseSpeed: 5,
  types: ['Bug']
}

const pidgeySetup: PokemonSetup = {
  species: 'Pidgey',
  level: 10,
  baseHp: 4,
  baseAttack: 5,
  baseDefense: 4,
  baseSpAttack: 4,
  baseSpDefense: 4,
  baseSpeed: 6,
  types: ['Normal', 'Flying']
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

test.describe('P0 Workflow: Faint and Replacement', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let caterpieId: string
  let pidgeyId: string
  let charmanderId: string
  let caterpieCombatantId: string
  let pidgeyCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    caterpieId = await createPokemon(request, caterpieSetup)
    pidgeyId = await createPokemon(request, pidgeySetup)
    charmanderId = await createPokemon(request, charmanderSetup)

    encounterId = await createEncounter(request, 'Test: Faint and Replacement')
    caterpieCombatantId = await addCombatant(request, encounterId, caterpieId, 'allies')
    pidgeyCombatantId = await addCombatant(request, encounterId, pidgeyId, 'enemies')

    await startEncounter(request, encounterId)
  })

  test('Phase 1: HP and initiative — Caterpie 33/33, Pidgey 32/32, Pidgey first', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)

    const caterpie = findCombatantByEntityId(encounter, caterpieId)
    expect(caterpie.entity.currentHp).toBe(33)
    expect(caterpie.entity.maxHp).toBe(33)

    const pidgey = findCombatantByEntityId(encounter, pidgeyId)
    expect(pidgey.entity.currentHp).toBe(32)
    expect(pidgey.entity.maxHp).toBe(32)

    // Pidgey (SPD 6) acts before Caterpie (SPD 5)
    const active = getActiveCombatant(encounter)
    expect(active.entityId).toBe(pidgeyId)
  })

  test('Phase 2: Pidgey STAB Tackle → Caterpie — 18 dmg, injury', async ({ request }) => {
    // Tackle: Normal Physical DB5 + STAB 2 = DB7, set 17
    // raw = max(1, 17+5-4) = 18, Normal vs Bug = ×1, final = 18
    // Injury: 18 ≥ 33/2=16.5 → Massive Damage
    const enc = await getEncounter(request, encounterId)
    const caterpieBefore = findCombatantByEntityId(enc, caterpieId)
    const dmg = await applyDamage(request, encounterId, caterpieCombatantId, 18)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, caterpieBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.injuryGained).toBe(true)
    expect(dmg.damageResult.newInjuries).toBe(1)

    await nextTurn(request, encounterId)
  })

  test('Phase 3: Caterpie Tackle (no STAB) → Pidgey — 12 dmg', async ({ request }) => {
    // Tackle: Normal Physical DB5 (no STAB, Bug≠Normal), set 13
    // raw = max(1, 13+3-4) = 12, Normal vs Normal/Flying = ×1, final = 12
    const enc = await getEncounter(request, encounterId)
    const pidgeyBefore = findCombatantByEntityId(enc, pidgeyId)
    const dmg = await applyDamage(request, encounterId, pidgeyCombatantId, 12)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, pidgeyBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )

    await nextTurn(request, encounterId)
  })

  test('Phase 4: apply Burned to Caterpie', async ({ request }) => {
    // Bug is not immune to Burn (only Fire is immune)
    const { statusChange } = await applyStatus(request, encounterId, caterpieCombatantId, {
      add: ['Burned']
    })
    expect(statusChange.added).toContain('Burned')

    const encounter = await getEncounter(request, encounterId)
    const caterpie = findCombatantByEntityId(encounter, caterpieId)
    expect(caterpie.entity.statusConditions).toContain('Burned')
  })

  test('Phase 5: Pidgey Tackle → Caterpie again — faint, Burned cleared', async ({ request }) => {
    // Same damage as Phase 2: 18
    const enc = await getEncounter(request, encounterId)
    const caterpieBefore = findCombatantByEntityId(enc, caterpieId)
    const dmg = await applyDamage(request, encounterId, caterpieCombatantId, 18)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, caterpieBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.fainted).toBe(true)

    // Faint clears all persistent/volatile statuses — Burned removed, only Fainted remains
    const encounter = await getEncounter(request, encounterId)
    const caterpie = findCombatantByEntityId(encounter, caterpieId)
    expect(caterpie.entity.currentHp).toBe(0)
    expect(caterpie.entity.statusConditions).toContain('Fainted')
    expect(caterpie.entity.statusConditions).not.toContain('Burned')
  })

  test('Phase 6: add Charmander replacement — HP 35/35, enters turn order before Pidgey', async ({ request }) => {
    await addCombatant(request, encounterId, charmanderId, 'allies')

    const encounter = await getEncounter(request, encounterId)
    const charmander = findCombatantByEntityId(encounter, charmanderId)
    expect(charmander.entity.currentHp).toBe(35)
    expect(charmander.entity.maxHp).toBe(35)

    // Charmander (SPD 7) should be before Pidgey (SPD 6) in turn order
    const charmanderCombatant = encounter.combatants.find((c: any) => c.entityId === charmanderId)
    const pidgeyCombatant = encounter.combatants.find((c: any) => c.entityId === pidgeyId)
    const charmanderTurnIdx = encounter.turnOrder.indexOf(charmanderCombatant.id)
    const pidgeyTurnIdx = encounter.turnOrder.indexOf(pidgeyCombatant.id)
    expect(charmanderTurnIdx).toBeLessThan(pidgeyTurnIdx)
  })

  test('Phase 7: Charmander STAB Ember → Pidgey — 17 dmg', async ({ request }) => {
    // Ember: Fire Special DB4 + STAB 2 = DB6, set 15
    // raw = max(1, 15+6-4) = 17, Fire vs Normal/Flying = ×1, final = 17
    const enc = await getEncounter(request, encounterId)
    const pidgeyBefore = findCombatantByEntityId(enc, pidgeyId)
    const dmg = await applyDamage(request, encounterId, pidgeyCombatantId, 17)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, pidgeyBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )

    const encounter = await getEncounter(request, encounterId)
    const pidgey = findCombatantByEntityId(encounter, pidgeyId)
    expect(pidgey.entity.currentHp).toBe(3)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [caterpieId, pidgeyId, charmanderId])
  })
})
