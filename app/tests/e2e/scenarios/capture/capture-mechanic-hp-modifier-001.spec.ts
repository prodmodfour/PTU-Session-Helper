/**
 * P1 Mechanic: HP Modifier Tiers
 *
 * Tests all 5 HP percentage tiers for the capture rate HP modifier,
 * plus the 0 HP canBeCaptured rejection.
 *
 * Uses direct-data mode (no DB records) with Oddish species lookup.
 * Constant components: base(100) + levelMod(-20) + evoMod(+10) = 90
 * Each test varies only currentHp against maxHp=40.
 *
 * PTU: "If the Pokemon is above 75% Hit Points, subtract 30...
 *       at 75% or lower, subtract 15...at 50% or lower, unmodified...
 *       at 25% or lower, add +15...at exactly 1 HP, add +30"
 */
import { test, expect } from '@playwright/test'
import { getCaptureRate } from './capture-helpers'

const BASE_PARAMS = {
  level: 10,
  maxHp: 40,
  species: 'Oddish'
}

test.describe('P1: HP Modifier Tiers (capture-mechanic-hp-modifier-001)', () => {

  test('assertion 1: full HP (100%) -> hpModifier = -30, captureRate = 60', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 40 })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(60)
    expect(res.data.breakdown.hpModifier).toBe(-30)
  })

  test('assertion 2: exactly 75% HP -> hpModifier = -15, captureRate = 75', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 30 })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(75)
    expect(res.data.breakdown.hpModifier).toBe(-15)
  })

  test('assertion 3: exactly 50% HP -> hpModifier = 0, captureRate = 90', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 20 })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(90)
    expect(res.data.breakdown.hpModifier).toBe(0)
  })

  test('assertion 4: exactly 25% HP -> hpModifier = +15, captureRate = 105', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 10 })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(105)
    expect(res.data.breakdown.hpModifier).toBe(15)
  })

  test('assertion 5: exactly 1 HP -> hpModifier = +30 (special case), captureRate = 120', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 1 })
    expect(res.success).toBe(true)
    expect(res.data.captureRate).toBe(120)
    expect(res.data.breakdown.hpModifier).toBe(30)
  })

  test('assertion 6: 0 HP -> canBeCaptured = false', async ({ request }) => {
    const res = await getCaptureRate(request, { ...BASE_PARAMS, currentHp: 0 })
    expect(res.success).toBe(true)
    expect(res.data.canBeCaptured).toBe(false)
  })
})
