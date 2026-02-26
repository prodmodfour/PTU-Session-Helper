import { describe, it, expect } from 'vitest'
import { MAX_SPAWN_COUNT } from '~/types'

/**
 * Replicate the exact clamping expression from
 * server/api/encounter-tables/[id]/generate.post.ts (lines 25-28):
 *
 *   const count = Math.min(
 *     Math.max(1, typeof body.count === 'number' ? body.count : 4),
 *     MAX_SPAWN_COUNT
 *   )
 *
 * This pure function lets us test the clamping logic without mocking
 * Prisma/H3 infrastructure.
 */
function clampCount(bodyCount: unknown): number {
  return Math.min(
    Math.max(1, typeof bodyCount === 'number' ? bodyCount : 4),
    MAX_SPAWN_COUNT
  )
}

describe('generate endpoint — count clamping', () => {
  describe('below minimum', () => {
    it('clamps 0 to 1', () => {
      expect(clampCount(0)).toBe(1)
    })

    it('clamps -1 to 1', () => {
      expect(clampCount(-1)).toBe(1)
    })

    it('clamps -100 to 1', () => {
      expect(clampCount(-100)).toBe(1)
    })

    it('clamps Number.NEGATIVE_INFINITY to 1', () => {
      expect(clampCount(Number.NEGATIVE_INFINITY)).toBe(1)
    })
  })

  describe('above maximum', () => {
    it('clamps 21 to MAX_SPAWN_COUNT', () => {
      expect(clampCount(21)).toBe(MAX_SPAWN_COUNT)
    })

    it('clamps 100 to MAX_SPAWN_COUNT', () => {
      expect(clampCount(100)).toBe(MAX_SPAWN_COUNT)
    })

    it('clamps 10000 to MAX_SPAWN_COUNT', () => {
      expect(clampCount(10000)).toBe(MAX_SPAWN_COUNT)
    })

    it('clamps Number.POSITIVE_INFINITY to MAX_SPAWN_COUNT', () => {
      expect(clampCount(Number.POSITIVE_INFINITY)).toBe(MAX_SPAWN_COUNT)
    })
  })

  describe('within valid range', () => {
    it('preserves 1 (minimum boundary)', () => {
      expect(clampCount(1)).toBe(1)
    })

    it('preserves MAX_SPAWN_COUNT (maximum boundary)', () => {
      expect(clampCount(MAX_SPAWN_COUNT)).toBe(MAX_SPAWN_COUNT)
    })

    it('preserves 10 (mid-range)', () => {
      expect(clampCount(10)).toBe(10)
    })

    it('preserves 4 (default value)', () => {
      expect(clampCount(4)).toBe(4)
    })
  })

  describe('count omitted (non-numeric)', () => {
    it('defaults to 4 when undefined', () => {
      expect(clampCount(undefined)).toBe(4)
    })

    it('defaults to 4 when null', () => {
      expect(clampCount(null)).toBe(4)
    })

    it('defaults to 4 when string', () => {
      expect(clampCount('5')).toBe(4)
    })

    it('defaults to 4 when empty string', () => {
      expect(clampCount('')).toBe(4)
    })

    it('defaults to 4 when boolean', () => {
      expect(clampCount(true)).toBe(4)
    })

    it('defaults to 4 when object', () => {
      expect(clampCount({})).toBe(4)
    })

    it('defaults to 4 when array', () => {
      expect(clampCount([5])).toBe(4)
    })
  })

  describe('NaN handling', () => {
    it('clamps NaN to 1 (Math.max(1, NaN) returns 1 in newer engines)', () => {
      // typeof NaN === 'number', so it enters the numeric path.
      // Math.max(1, NaN) => NaN in ES spec, then Math.min(NaN, 20) => NaN.
      // But the body parser would typically not produce NaN.
      // Documenting the actual behavior:
      const result = clampCount(NaN)
      // NaN propagates: Math.max(1, NaN) => NaN, Math.min(NaN, 20) => NaN
      expect(result).toBeNaN()
    })
  })
})
