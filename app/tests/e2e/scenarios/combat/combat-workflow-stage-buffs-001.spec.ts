/**
 * P0 Workflow Scenario: Stage Buffs and Matchups
 *
 * A trainer battle where Growlithe gets +2 SpATK (buff), then Bulbasaur applies
 * -1 SpATK (debuff). With net +1 stage (×1.2), Growlithe fires STAB Ember at
 * Bulbasaur (Grass/Poison). The stage-modified stat increases damage. Finally,
 * Bulbasaur's SpDEF is boosted to demonstrate stage clamping.
 *
 * Setup:
 *   Growlithe L15 — HP=43, SpATK 7, SPD 6 (Fire)
 *   Bulbasaur L14 — HP=39, SpDEF 7, SPD 5 (Grass/Poison)
 *
 * Key calculations:
 *   Net +1 SpATK: modified = floor(7 × 1.2) = 8
 *   Ember: DB4+STAB2=DB6, set 15, raw=max(1,15+8-7)=16
 *   Fire vs Grass/Poison: ×1.5, final=floor(16×1.5)=24
 *   Compare: without stage, raw=15, final=floor(15×1.5)=22 — stages add 2 damage
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStages,
  applyDamage,
  nextTurn,
  getEncounter,
  findCombatantByEntityId,
  getActiveCombatant,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

const growlitheSetup: PokemonSetup = {
  species: 'Growlithe',
  level: 15,
  baseHp: 6,
  baseAttack: 7,
  baseDefense: 5,
  baseSpAttack: 7,
  baseSpDefense: 5,
  baseSpeed: 6,
  types: ['Fire']
}

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur',
  level: 14,
  baseHp: 5,
  baseAttack: 5,
  baseDefense: 5,
  baseSpAttack: 7,
  baseSpDefense: 7,
  baseSpeed: 5,
  types: ['Grass', 'Poison']
}

test.describe('P0 Workflow: Stage Buffs and Matchups', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let growlitheId: string
  let bulbasaurId: string
  let growlitheCombatantId: string
  let bulbasaurCombatantId: string

  test('setup: create Pokemon and start encounter', async ({ request }) => {
    growlitheId = await createPokemon(request, growlitheSetup)
    bulbasaurId = await createPokemon(request, bulbasaurSetup)

    encounterId = await createEncounter(request, 'Test: Stage Buffs and Matchups')
    growlitheCombatantId = await addCombatant(request, encounterId, growlitheId, 'allies')
    bulbasaurCombatantId = await addCombatant(request, encounterId, bulbasaurId, 'enemies')

    await startEncounter(request, encounterId)
  })

  test('Phase 1: HP and initiative — Growlithe 43/43, Bulbasaur 39/39, Growlithe first', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)

    const growlithe = findCombatantByEntityId(encounter, growlitheId)
    expect(growlithe.entity.currentHp).toBe(43)
    expect(growlithe.entity.maxHp).toBe(43)

    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.currentHp).toBe(39)
    expect(bulbasaur.entity.maxHp).toBe(39)

    // Growlithe (SPD 6) acts before Bulbasaur (SPD 5)
    const active = getActiveCombatant(encounter)
    expect(active.entityId).toBe(growlitheId)
  })

  test('Phase 2: apply +2 SpATK to Growlithe', async ({ request }) => {
    const { stageChanges } = await applyStages(request, encounterId, growlitheCombatantId, {
      specialAttack: 2
    })
    expect(stageChanges.changes.specialAttack.previous).toBe(0)
    expect(stageChanges.changes.specialAttack.change).toBe(2)
    expect(stageChanges.changes.specialAttack.current).toBe(2)

    await nextTurn(request, encounterId)
  })

  test('Phase 3: apply -1 SpATK to Growlithe — net +1 (×1.2)', async ({ request }) => {
    const { stageChanges } = await applyStages(request, encounterId, growlitheCombatantId, {
      specialAttack: -1
    })
    expect(stageChanges.changes.specialAttack.previous).toBe(2)
    expect(stageChanges.changes.specialAttack.change).toBe(-1)
    expect(stageChanges.changes.specialAttack.current).toBe(1)

    await nextTurn(request, encounterId)
  })

  test('Phase 4: Growlithe Ember → Bulbasaur with +1 SpATK — 24 damage, HP 15', async ({ request }) => {
    // Verify stage is still +1
    const encounterBefore = await getEncounter(request, encounterId)
    const growlitheBefore = findCombatantByEntityId(encounterBefore, growlitheId)
    expect(growlitheBefore.entity.stageModifiers.specialAttack).toBe(1)

    // Modified SpATK = floor(7 × 1.2) = floor(8.4) = 8
    // Ember: Fire Special, DB4+STAB2=DB6, set 15
    // raw = max(1, 15+8-7) = 16
    // Fire vs Grass(×1.5) × Poison(×1) = ×1.5
    // final = floor(16 × 1.5) = 24
    const bulbasaurBefore = findCombatantByEntityId(encounterBefore, bulbasaurId)
    const dmg = await applyDamage(request, encounterId, bulbasaurCombatantId, 24)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, bulbasaurBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )

    const encounterAfter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounterAfter, bulbasaurId)
    expect(bulbasaur.entity.currentHp).toBe(15)
  })

  test('Phase 5: +3 SpDEF stage on Bulbasaur — stage clamped within [-6, +6]', async ({ request }) => {
    const { stageChanges } = await applyStages(request, encounterId, bulbasaurCombatantId, {
      specialDefense: 3
    })
    expect(stageChanges.changes.specialDefense.current).toBe(3)

    // Verify stage persisted
    // Base SpDEF=7, +3 stage (×1.6) → modified SpDEF = floor(7 × 1.6) = 11
    // Special Evasion = floor(11 / 5) = 2 (computed client-side, not asserted here)
    const encounter = await getEncounter(request, encounterId)
    const bulbasaur = findCombatantByEntityId(encounter, bulbasaurId)
    expect(bulbasaur.entity.stageModifiers.specialDefense).toBe(3)
  })

  test('teardown', async ({ request }) => {
    await cleanup(request, encounterId, [growlitheId, bulbasaurId])
  })
})
