/**
 * P2 Mechanic: PTU Worked Examples
 *
 * Validates the three worked examples from the PTU rulebook (core/05-pokemon.md, p215).
 * Uses direct-data mode with species lookup for evolution stage.
 *
 * Example 1: Level 10 Pikachu, 70% HP, Confused -> 70
 * Example 2: Shiny Level 30 Caterpie, 40% HP, 1 Injury -> 45
 * Example 3: Level 80 Hydreigon, 1 HP, Burned + Poisoned + 1 Injury -> -15
 */
import { test, expect } from '@playwright/test'
import { getCaptureRate } from './capture-helpers'

test.describe('P2: PTU Worked Examples (capture-mechanic-worked-examples-001)', () => {

  test('example 1: L10 Pikachu, 70% HP, Confused -> captureRate = 70', async ({ request }) => {
    // Pikachu: stage 2 of 3, Math.max(3,2)=3, remaining 1 -> evoMod = 0
    // base(100) + level(-20) + hp(-15) + evo(0) + status(+5 Confused) = 70
    const res = await getCaptureRate(request, {
      level: 10,
      currentHp: 70,
      maxHp: 100,
      species: 'Pikachu',
      statusConditions: ['Confused']
    })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(70)
    expect(res.data.breakdown.levelModifier).toBe(-20)
    expect(res.data.breakdown.hpModifier).toBe(-15)
    expect(res.data.breakdown.evolutionModifier).toBe(0)
    expect(res.data.breakdown.statusModifier).toBe(5)
  })

  test('example 2: Shiny L30 Caterpie, 40% HP, 1 Injury -> captureRate = 45', async ({ request }) => {
    // Caterpie: stage 1 of 3, Math.max(3,1)=3, remaining 2 -> evoMod = +10
    // base(100) + level(-60) + hp(0) + evo(+10) + shiny(-10) + injury(+5) = 45
    const res = await getCaptureRate(request, {
      level: 30,
      currentHp: 40,
      maxHp: 100,
      species: 'Caterpie',
      isShiny: true,
      injuries: 1
    })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(45)
    expect(res.data.breakdown.levelModifier).toBe(-60)
    expect(res.data.breakdown.hpModifier).toBe(0)
    expect(res.data.breakdown.evolutionModifier).toBe(10)
    expect(res.data.breakdown.shinyModifier).toBe(-10)
    expect(res.data.breakdown.injuryModifier).toBe(5)
  })

  test('example 3: L80 Hydreigon, 1 HP, Burned + Poisoned + 1 Injury -> captureRate = -15', async ({ request }) => {
    // Hydreigon: stage 3 of 3, Math.max(3,3)=3, remaining 0 -> evoMod = -10
    // base(100) + level(-160) + hp(+30) + evo(-10) + status(+20) + injury(+5) = -15
    const res = await getCaptureRate(request, {
      level: 80,
      currentHp: 1,
      maxHp: 200,
      species: 'Hydreigon',
      statusConditions: ['Burned', 'Poisoned'],
      injuries: 1
    })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(-15)
    expect(res.data.breakdown.levelModifier).toBe(-160)
    expect(res.data.breakdown.hpModifier).toBe(30)
    expect(res.data.breakdown.evolutionModifier).toBe(-10)
    expect(res.data.breakdown.statusModifier).toBe(20)
    expect(res.data.breakdown.injuryModifier).toBe(5)
  })
})
