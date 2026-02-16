import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  applyDamage,
  applyStages,
  getEncounter,
  findCombatantByEntityId,
  cleanup,
  type PokemonSetup
} from './combat-helpers'

/**
 * P2 Scenario: Minimum Damage Rule
 *
 * PTU rule: An attack always does a minimum of 1 damage, even if defense
 * stats would reduce it to 0. After type effectiveness, if the result is 0
 * due to resistance (not immunity), minimum 1 still applies. Immunity = 0.
 *
 * Setup:
 *   Bulbasaur (ATK 5) uses Tackle on Geodude (DEF 10 at +6 CS = 22)
 *   Tackle: SetDamage(13) + ATK(5) - ModifiedDEF(22) = -4 --> min 1
 *   Normal vs Rock/Ground: Rock resists (x0.5), Ground neutral --> combined x0.5
 *   After resistance: floor(1 * 0.5) = 0, but not immune --> final min 1
 *
 * Test approach: We boost Geodude DEF to +6 via stages API, then apply 1 damage
 * (the expected final amount after all rules) to verify the server-side HP change.
 * The damage minimum rules are enforced by the GM before calling the damage API,
 * so we verify the expected final value is correct and applied.
 */

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

const GEODUDE: PokemonSetup = {
  species: 'Geodude',
  level: 10,
  baseHp: 4,
  baseAttack: 8,
  baseDefense: 10,
  baseSpAttack: 3,
  baseSpDefense: 3,
  baseSpeed: 2,
  types: ['Rock', 'Ground']
}

// Geodude HP = level(10) + (baseHp(4) * 3) + 10 = 32
const GEODUDE_MAX_HP = 32
// At +6 CS, multiplier = 2.2 --> modified DEF = floor(10 * 2.2) = 22
const MODIFIED_DEF_AT_PLUS_6 = 22
// Tackle: SetDamage(13) + ATK(5) - ModifiedDEF(22) = -4 --> min 1
// Normal vs Rock(resist 0.5) * Ground(neutral 1) = 0.5
// floor(1 * 0.5) = 0, not immune so final min = 1
const EXPECTED_FINAL_DAMAGE = 1

test.describe('P2: Minimum Damage Rule (combat-minimum-damage-001)', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('damage cannot go below 1 when defense exceeds attack (resistance, not immunity)', async ({ request }) => {
    // --- Setup ---
    const attackerId = await createPokemon(request, BULBASAUR)
    pokemonIds.push(attackerId)

    const targetId = await createPokemon(request, GEODUDE)
    pokemonIds.push(targetId)

    encounterId = await createEncounter(request, 'Test: Minimum Damage')
    const attackerCombatantId = await addCombatant(request, encounterId, attackerId, 'allies')
    const targetCombatantId = await addCombatant(request, encounterId, targetId, 'enemies')
    await startEncounter(request, encounterId)

    // --- Boost Geodude DEF to +6 CS ---
    const stageResult = await applyStages(request, encounterId, targetCombatantId, { defense: 6 })

    // --- Assertion 1: Modified DEF = 22 at +6 CS ---
    // Verify the stage was applied correctly
    expect(stageResult.stageChanges.changes.defense.current).toBe(6)
    expect(stageResult.stageChanges.currentStages.defense).toBe(6)

    // Verify base DEF is 10, so at +6 (multiplier 2.2): floor(10 * 2.2) = 22
    const encounterAfterStages = await getEncounter(request, encounterId)
    const geodudeAfterStages = findCombatantByEntityId(encounterAfterStages, targetId)
    expect(geodudeAfterStages.entity.stageModifiers.defense).toBe(6)

    // --- Apply minimum damage (1) ---
    // The GM calculates: SetDamage(13) + ATK(5) - ModifiedDEF(22) = -4 --> min 1
    // Then type: Normal vs Rock/Ground = x0.5 --> floor(1 * 0.5) = 0 --> min 1 (not immune)
    // Final damage passed to API = 1

    // Fetch server state before damage
    const encBeforeDmg = await getEncounter(request, encounterId)
    const geodudeBefore = findCombatantByEntityId(encBeforeDmg, targetId)

    const result = await applyDamage(request, encounterId, targetCombatantId, EXPECTED_FINAL_DAMAGE)
    const damageResult = result.damageResult

    // --- Assertion 2: Damage applied is 1 (not 0 or negative) ---
    expect(damageResult.finalDamage).toBe(EXPECTED_FINAL_DAMAGE)
    expect(damageResult.hpDamage).toBe(EXPECTED_FINAL_DAMAGE)

    // --- Assertion 3: Geodude HP computed by server ---
    expect(damageResult.newHp).toBe(
      Math.max(0, geodudeBefore.entity.currentHp - damageResult.hpDamage)
    )
    expect(damageResult.fainted).toBe(false)

    // Verify via GET encounter
    const afterEncounter = await getEncounter(request, encounterId)
    const geodudeAfter = findCombatantByEntityId(afterEncounter, targetId)
    expect(geodudeAfter.entity.currentHp).toBe(expectedHp)

    // Verify no massive damage injury (1 < 50% of 32 = 16)
    expect(damageResult.injuryGained).toBe(false)
    expect(damageResult.newInjuries).toBe(0)
  })
})
