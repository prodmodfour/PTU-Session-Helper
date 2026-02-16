/**
 * P0 Workflow Scenario: Wild Encounter Full Lifecycle
 *
 * Full wild encounter from spawn to faint to unserve. Growlithe fights a
 * wild Oddish over two rounds of combat. STAB Ember is super effective
 * against Grass/Poison Oddish. Oddish retaliates with STAB Acid.
 *
 * Setup:
 *   Growlithe L15 — HP=43, SpATK 7, SpDEF 5, SPD 6 (Fire) — created manually
 *   Oddish L10 — stats non-deterministic (wild-spawned, random point distribution)
 *
 * Damage calculations use dynamic stats read from the API after spawn.
 * Growlithe stats are deterministic (manually created with explicit base stats).
 */
import { test, expect } from '@playwright/test'
import {
  createPokemon,
  createEncounter,
  addCombatant,
  startEncounter,
  serveEncounter,
  unserveEncounter,
  endEncounter,
  applyDamage,
  nextTurn,
  getEncounter,
  getPokemon,
  findCombatantByEntityId,
  getActiveCombatant,
  deletePokemon,
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

test.describe('P0 Workflow: Wild Encounter Full Lifecycle', () => {
  test.describe.configure({ mode: 'serial' })

  let encounterId: string
  let growlitheId: string
  let oddishPokemonId: string
  let growlitheCombatantId: string
  let oddishCombatantId: string

  // Dynamic Oddish stats (read after wild-spawn)
  let oddishMaxHp: number
  let oddishSpAtk: number
  let oddishSpDef: number

  // Derived damage values (computed from actual stats)
  let emberDamage: number
  let acidDamage: number

  test('setup: create encounter, wild-spawn Oddish, add Growlithe, start', async ({ request }) => {
    encounterId = await createEncounter(request, 'Route Forest: Wild Oddish')
    growlitheId = await createPokemon(request, growlitheSetup)

    // Wild-spawn Oddish (stats non-deterministic due to random point distribution)
    const spawnRes = await request.post(`/api/encounters/${encounterId}/wild-spawn`, {
      data: { pokemon: [{ speciesName: 'Oddish', level: 10 }] }
    })
    const spawnBody = await spawnRes.json()
    expect(spawnBody.success).toBe(true)
    oddishPokemonId = spawnBody.data.addedPokemon[0].pokemonId
    oddishCombatantId = spawnBody.data.addedPokemon[0].combatantId

    // Read actual Oddish stats after spawn
    const oddish = await getPokemon(request, oddishPokemonId)
    oddishMaxHp = oddish.maxHp
    oddishSpAtk = oddish.currentStats.specialAttack
    oddishSpDef = oddish.currentStats.specialDefense

    // Pre-compute damage values
    // Ember: DB4+STAB2=DB6, set 15, raw=max(1, 15+7-spDef), x1.5 (Fire vs Grass/Poison)
    emberDamage = Math.floor(Math.max(1, 15 + 7 - oddishSpDef) * 1.5)
    // Acid: DB4+STAB2=DB6, set 15, raw=max(1, 15+spAtk-5), x1 (Poison vs Fire)
    acidDamage = Math.max(1, 15 + oddishSpAtk - 5)

    // Add Growlithe to players side
    growlitheCombatantId = await addCombatant(request, encounterId, growlitheId, 'players')

    await startEncounter(request, encounterId)
  })

  test('Phase 1: HP — Growlithe 43/43, Oddish at full HP', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)

    const growlithe = findCombatantByEntityId(encounter, growlitheId)
    expect(growlithe.entity.currentHp).toBe(43)
    expect(growlithe.entity.maxHp).toBe(43)

    const oddish = findCombatantByEntityId(encounter, oddishPokemonId)
    expect(oddish.entity.currentHp).toBe(oddishMaxHp)
    expect(oddish.entity.maxHp).toBe(oddishMaxHp)
    expect(oddishMaxHp).toBeGreaterThanOrEqual(35) // minimum: base stats only
  })

  test('Phase 1b: initiative — Growlithe (SPD 6) before Oddish', async ({ request }) => {
    const encounter = await getEncounter(request, encounterId)
    const active = getActiveCombatant(encounter)
    expect(active.entityId).toBe(growlitheId)
  })

  test('Phase 1c: serve encounter', async ({ request }) => {
    await serveEncounter(request, encounterId)

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isServed).toBe(true)
  })

  test('Phase 2: Growlithe STAB Ember -> Oddish — dynamic damage + injury check', async ({ request }) => {
    // Ember: Fire Special, DB4+STAB2=DB6, set 15
    // raw = max(1, 15+7-oddishSpDef), Fire vs Grass(x1.5) x Poison(x1) = x1.5
    // final = floor(raw x 1.5) = emberDamage
    const enc = await getEncounter(request, encounterId)
    const oddishBefore = findCombatantByEntityId(enc, oddishPokemonId)

    const dmg = await applyDamage(request, encounterId, oddishCombatantId, emberDamage)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, oddishBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.injuryGained).toBe(emberDamage >= oddishBefore.entity.maxHp / 2)
    if (dmg.damageResult.injuryGained) {
      expect(dmg.damageResult.newInjuries).toBe(1)
    }

    await nextTurn(request, encounterId)
  })

  test('Phase 3: Oddish STAB Acid -> Growlithe — dynamic damage + injury check', async ({ request }) => {
    // Acid: Poison Special, DB4+STAB2=DB6, set 15
    // raw = max(1, 15+oddishSpAtk-5), Poison vs Fire = x1
    // final = raw = acidDamage
    const enc = await getEncounter(request, encounterId)
    const growlitheBefore = findCombatantByEntityId(enc, growlitheId)

    const dmg = await applyDamage(request, encounterId, growlitheCombatantId, acidDamage)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, growlitheBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.injuryGained).toBe(acidDamage >= growlitheBefore.entity.maxHp / 2)

    await nextTurn(request, encounterId)
  })

  test('Phase 4: Growlithe Ember -> Oddish — second hit, check for faint', async ({ request }) => {
    // Same as Phase 2: emberDamage
    const enc = await getEncounter(request, encounterId)
    const oddishBefore = findCombatantByEntityId(enc, oddishPokemonId)

    const dmg = await applyDamage(request, encounterId, oddishCombatantId, emberDamage)
    expect(dmg.damageResult.newHp).toBe(
      Math.max(0, oddishBefore.entity.currentHp - dmg.damageResult.hpDamage)
    )
    expect(dmg.damageResult.fainted).toBe(dmg.damageResult.newHp === 0)

    if (shouldFaint) {
      const encounter = await getEncounter(request, encounterId)
      const oddish = findCombatantByEntityId(encounter, oddishPokemonId)
      expect(oddish.entity.statusConditions).toContain('Fainted')
    }
  })

  test('Phase 5: end and unserve — lifecycle complete', async ({ request }) => {
    await endEncounter(request, encounterId)
    await unserveEncounter(request, encounterId)

    const encounter = await getEncounter(request, encounterId)
    expect(encounter.isActive).toBe(false)
    expect(encounter.isServed).toBe(false)
  })

  test('teardown', async ({ request }) => {
    try { await deletePokemon(request, growlitheId) } catch { /* ignore */ }
    try { await deletePokemon(request, oddishPokemonId) } catch { /* ignore */ }
  })
})
