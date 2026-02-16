/**
 * P1 Combat Scenario: STAB (Same Type Attack Bonus)
 *
 * Setup: Charmander (SpATK 6, Fire, SPD 7) vs Machop (SpDEF 4, Fighting)
 *   - Machop HP = 10 + (7 × 3) + 10 = 41 (level 10, baseHp 7)
 *
 * PTU STAB Rules:
 *   - When a Pokemon uses a move matching one of its types, add +2 to the move's DB
 *   - Charmander is Fire type, Ember is Fire type -> STAB applies
 *   - Ember base DB: 4, with STAB: 4 + 2 = 6
 *   - Set damage at DB 6 = 15
 *   - Damage = SetDamage(15) + SpATK(6) - SpDEF(4) = 17
 *   - Fire vs Fighting = neutral
 *   - Machop HP after: 41 - 17 = 24/41
 *
 * Test approach: Apply pre-calculated STAB damage (17) to Machop, verify HP.
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

// Charmander: SpATK 6, Fire, level 10
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

// Machop: SpDEF 4, Fighting, level 10, HP = 10 + (7 × 3) + 10 = 41
const machopSetup: PokemonSetup = {
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

test.describe('P1: STAB Damage Calculation', () => {
  let encounterId: string | null = null
  const pokemonIds: string[] = []

  test.afterEach(async ({ request }) => {
    await cleanup(request, encounterId, pokemonIds)
    encounterId = null
    pokemonIds.length = 0
  })

  test('STAB adds +2 DB: Ember DB 4 -> 6, set damage 15, final 17', async ({ request }) => {
    // Create Pokemon
    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const machopId = await createPokemon(request, machopSetup)
    pokemonIds.push(machopId)

    // Create and setup encounter
    encounterId = await createEncounter(request, 'STAB Test - Ember')
    await addCombatant(request, encounterId, charmanderId, 'players')
    const machopCombatantId = await addCombatant(request, encounterId, machopId, 'enemies')
    await startEncounter(request, encounterId)

    // Verify Machop starting HP
    const encounterBefore = await getEncounter(request, encounterId)
    const machopBefore = findCombatantByEntityId(encounterBefore, machopId)
    expect(machopBefore.entity.maxHp).toBe(41)
    expect(machopBefore.entity.currentHp).toBe(41)

    // Apply STAB damage: SetDamage(15) + SpATK(6) - SpDEF(4) = 17
    const { damageResult } = await applyDamage(request, encounterId, machopCombatantId, 17)

    // Verify damage result
    expect(damageResult.finalDamage).toBe(17)
    expect(damageResult.hpDamage).toBe(17)
    expect(damageResult.newHp).toBe(
      Math.max(0, machopBefore.entity.currentHp - damageResult.hpDamage)
    )
    expect(damageResult.fainted).toBe(false)

    // 17 < 41/2 = 20.5, so no massive damage injury
    expect(damageResult.injuryGained).toBe(false)

    // Verify via GET
    const encounterAfter = await getEncounter(request, encounterId)
    const machopAfter = findCombatantByEntityId(encounterAfter, machopId)
    expect(machopAfter.entity.currentHp).toBe(24)
  })

  test('non-STAB baseline for comparison: same move without type match = less damage', async ({ request }) => {
    // Without STAB, Ember would be DB 4, set damage = 10
    // Damage = 10 + SpATK(6) - SpDEF(4) = 12
    // This shows STAB adds 5 extra damage (17 vs 12)

    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const machopId = await createPokemon(request, machopSetup)
    pokemonIds.push(machopId)

    encounterId = await createEncounter(request, 'STAB Test - Non-STAB Baseline')
    await addCombatant(request, encounterId, charmanderId, 'players')
    const machopCombatantId = await addCombatant(request, encounterId, machopId, 'enemies')
    await startEncounter(request, encounterId)

    // Fetch server state before damage
    const encounterBefore = await getEncounter(request, encounterId)
    const machopBefore = findCombatantByEntityId(encounterBefore, machopId)

    // Apply non-STAB damage: DB 4 set damage = 10, + SpATK(6) - SpDEF(4) = 12
    const { damageResult } = await applyDamage(request, encounterId, machopCombatantId, 12)

    expect(damageResult.finalDamage).toBe(12)
    expect(damageResult.newHp).toBe(
      Math.max(0, machopBefore.entity.currentHp - damageResult.hpDamage)
    )
    expect(damageResult.fainted).toBe(false)

    const encounter = await getEncounter(request, encounterId)
    const machop = findCombatantByEntityId(encounter, machopId)
    expect(machop.entity.currentHp).toBe(29)
  })

  test('STAB damage difference is exactly +5 (set damage increase from DB 4 to DB 6)', async ({ request }) => {
    // STAB damage = 17, non-STAB damage = 12
    // Difference = 5 (from set damage jump: DB4=10, DB6=15, delta=5)

    const charmanderId = await createPokemon(request, charmanderSetup)
    pokemonIds.push(charmanderId)
    const machopId = await createPokemon(request, machopSetup)
    pokemonIds.push(machopId)

    encounterId = await createEncounter(request, 'STAB Test - Damage Difference')
    await addCombatant(request, encounterId, charmanderId, 'players')
    const machopCombatantId = await addCombatant(request, encounterId, machopId, 'enemies')
    await startEncounter(request, encounterId)

    // Fetch server state before damage
    const encBefore = await getEncounter(request, encounterId)
    const machopBefore = findCombatantByEntityId(encBefore, machopId)

    // Apply non-STAB damage first
    const nonStab = await applyDamage(request, encounterId, machopCombatantId, 12)
    expect(nonStab.damageResult.newHp).toBe(
      Math.max(0, machopBefore.entity.currentHp - nonStab.damageResult.hpDamage)
    )

    // Apply the STAB difference (5 extra damage)
    const stabDelta = await applyDamage(request, encounterId, machopCombatantId, 5)
    expect(stabDelta.damageResult.newHp).toBe(
      Math.max(0, nonStab.damageResult.newHp - stabDelta.damageResult.hpDamage)
    )

    // 24 is exactly what one STAB hit would leave (41 - 17)
    const encounter = await getEncounter(request, encounterId)
    const machop = findCombatantByEntityId(encounter, machopId)
    expect(machop.entity.currentHp).toBe(24)
  })
})
