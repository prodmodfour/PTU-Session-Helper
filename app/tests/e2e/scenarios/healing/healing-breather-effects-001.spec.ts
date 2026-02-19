/**
 * P1 Healing Mechanic: Breather Effects
 *
 * Comprehensive test of Take a Breather in combat:
 *   - All 7 combat stages reset to 0 (even positive ones)
 *   - Volatile conditions cured (Enraged, Suppressed)
 *   - Slowed + Stuck cured (special breather rule, PTU p.245)
 *   - Persistent conditions survive (Paralyzed)
 *   - Tripped + Vulnerable applied as temp conditions
 *
 * Assertions:
 *   1. All combat stages reset to 0
 *   2. Volatile conditions cured
 *   3. Slowed + Stuck cured
 *   4. Persistent condition survives
 *   5. Tripped + Vulnerable applied
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyStages,
  applyStatus,
  takeBreather,
  getEncounter,
  findCombatantByEntityId,
  cleanupHealing,
  type PokemonSetup
} from './healing-helpers'

const geodudeSetup: PokemonSetup = {
  species: 'Geodude', level: 12, baseHp: 4, baseAttack: 8,
  baseDefense: 10, baseSpAtk: 3, baseSpDef: 3, baseSpeed: 2,
  types: ['Rock', 'Ground']
}

const bulbasaurSetup: PokemonSetup = {
  species: 'Bulbasaur', level: 15, baseHp: 5, baseAttack: 5,
  baseDefense: 5, baseSpAtk: 7, baseSpDef: 7, baseSpeed: 5,
  types: ['Grass', 'Poison']
}

test.describe('P1: Breather Effects', () => {
  const pokemonIds: string[] = []
  const encounterIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanupHealing(request, pokemonIds, [], encounterIds)
    pokemonIds.length = 0
    encounterIds.length = 0
  })

  test('breather resets stages, cures volatile+slowed+stuck, preserves persistent, applies tripped+vulnerable', async ({ request }) => {
    // Create Pokemon
    const geodudeId = await createPokemon(request, geodudeSetup)
    pokemonIds.push(geodudeId)
    const bulbasaurId = await createPokemon(request, bulbasaurSetup)
    pokemonIds.push(bulbasaurId)

    // Create encounter
    const encounterId = await createEncounter(request, 'Breather Effects Test')
    encounterIds.push(encounterId)
    const geodudeCombatantId = await addCombatant(request, encounterId, geodudeId, 'allies')
    await addCombatant(request, encounterId, bulbasaurId, 'enemies')
    await startEncounter(request, encounterId)

    // Apply comprehensive stages (including positive ones that will also be lost)
    await applyStages(request, encounterId, geodudeCombatantId, {
      attack: 2, defense: -3, specialDefense: -1,
      speed: -6, accuracy: -4, evasion: 1
    })

    // Apply conditions: volatile + other (slowed/stuck) + persistent
    await applyStatus(request, encounterId, geodudeCombatantId, {
      add: ['Enraged', 'Suppressed', 'Slowed', 'Stuck', 'Paralyzed']
    })

    // Verify pre-breather state
    const beforeEnc = await getEncounter(request, encounterId)
    const geodudeBefore = findCombatantByEntityId(beforeEnc, geodudeId)
    expect(geodudeBefore.entity.stageModifiers.attack).toBe(2)
    expect(geodudeBefore.entity.stageModifiers.speed).toBe(-6)
    expect(geodudeBefore.entity.statusConditions).toContain('Paralyzed')
    expect(geodudeBefore.entity.statusConditions).toContain('Enraged')

    // Take a Breather
    const { breatherResult } = await takeBreather(request, encounterId, geodudeCombatantId)

    // Assertion 1: All 7 combat stages reset to 0
    expect(breatherResult.stagesReset).toBe(true)
    const afterEnc = await getEncounter(request, encounterId)
    const geodudeAfter = findCombatantByEntityId(afterEnc, geodudeId)
    expect(geodudeAfter.entity.stageModifiers.attack).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.defense).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.specialAttack).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.specialDefense).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.speed).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.accuracy).toBe(0)
    expect(geodudeAfter.entity.stageModifiers.evasion).toBe(0)

    // Assertion 2: Volatile conditions cured
    expect(breatherResult.conditionsCured).toContain('Enraged')
    expect(breatherResult.conditionsCured).toContain('Suppressed')

    // Assertion 3: Slowed + Stuck cured (special breather rule)
    expect(breatherResult.conditionsCured).toContain('Slowed')
    expect(breatherResult.conditionsCured).toContain('Stuck')

    // Assertion 4: Persistent condition survives
    expect(breatherResult.conditionsCured).not.toContain('Paralyzed')
    expect(geodudeAfter.entity.statusConditions).toContain('Paralyzed')

    // Assertion 5: Tripped + Vulnerable applied as temp conditions
    expect(breatherResult.trippedApplied).toBe(true)
    expect(breatherResult.vulnerableApplied).toBe(true)
    const combatant = afterEnc.combatants.find((c: any) => c.entityId === geodudeId)
    expect(combatant.tempConditions).toContain('Tripped')
    expect(combatant.tempConditions).toContain('Vulnerable')
  })
})
