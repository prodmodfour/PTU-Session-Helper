/**
 * P1 Mechanic: Status Condition Modifiers
 *
 * Tests Persistent (+10), Volatile (+5), Stuck (+10), Slow (+5) modifiers
 * and stacking behavior. Verifies separate breakdown fields for status,
 * stuck, and slow modifiers.
 *
 * Uses direct-data mode. Oddish L10, 50% HP (20/40) -> hpModifier = 0.
 * Constant rate without status: base(100) + level(-20) + hp(0) + evo(+10) = 90
 *
 * PTU: "Persistent Conditions add +10"
 * PTU: "Injuries and Volatile Conditions add +5"
 * PTU: "Stuck adds +10, Slow adds +5"
 */
import { test, expect } from '@playwright/test'
import { getCaptureRate } from './capture-helpers'

const BASE_PARAMS = {
  level: 10,
  currentHp: 20,
  maxHp: 40,
  species: 'Oddish'
}

test.describe('P1: Status Condition Modifiers (capture-mechanic-status-modifiers-001)', () => {

  test('assertion 1: Paralyzed (Persistent) -> statusModifier +10, captureRate = 100', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Paralyzed'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(100)
    expect(res.data.breakdown.statusModifier).toBe(10)
  })

  test('assertion 2: Confused (Volatile) -> statusModifier +5, captureRate = 95', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Confused'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(95)
    expect(res.data.breakdown.statusModifier).toBe(5)
  })

  test('assertion 3: Stuck -> stuckModifier +10, statusModifier = 0, captureRate = 100', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Stuck'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(100)
    expect(res.data.breakdown.stuckModifier).toBe(10)
    expect(res.data.breakdown.statusModifier).toBe(0)
  })

  test('assertion 4: Slowed -> slowModifier +5, statusModifier = 0, captureRate = 95', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Slowed'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(95)
    expect(res.data.breakdown.slowModifier).toBe(5)
    expect(res.data.breakdown.statusModifier).toBe(0)
  })

  test('assertion 5: Asleep (Volatile) -> statusModifier +5, captureRate = 95', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Asleep'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(95)
    expect(res.data.breakdown.statusModifier).toBe(5)
  })

  test('assertion 6: Paralyzed + Confused stacked -> statusModifier = 15, captureRate = 105', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Paralyzed', 'Confused'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(105)
    expect(res.data.breakdown.statusModifier).toBe(15)
  })

  test('assertion 7: Burned + Stuck + Slowed -> status=10, stuck=10, slow=5, captureRate = 115', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, statusConditions: ['Burned', 'Stuck', 'Slowed'] })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(115)
    expect(res.data.breakdown.statusModifier).toBe(10)
    expect(res.data.breakdown.stuckModifier).toBe(10)
    expect(res.data.breakdown.slowModifier).toBe(5)
  })
})
