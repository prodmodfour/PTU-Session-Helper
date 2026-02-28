import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for POST /api/characters/[id]/new-day — per-character new-day reset.
 *
 * Verifies decree-016 / decree-028 compliance:
 *   - boundAp is NOT cleared (persists until binding effect ends)
 *   - currentAp = Math.max(0, maxAp - boundAp)
 *   - drainedAp IS cleared (daily counter per decree-019)
 *   - Response includes boundAp in data payload
 *
 * Pattern mirrors new-day.test.ts (global endpoint) but covers the
 * per-character code path which has different structure (single fetch + update,
 * 404 handling, inline Pokemon move reset).
 */

// Mock Prisma client
const mockPrisma = {
  humanCharacter: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  pokemon: {
    update: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

vi.mock('~/utils/moveFrequency', () => ({
  resetDailyUsage: vi.fn((moves: unknown[]) => moves)
}))

// Stub H3 auto-imports
vi.stubGlobal('getRouterParam', (_event: any, param: string) => {
  return _event._routerParams?.[param]
})
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as any
  err.statusCode = opts.statusCode
  return err
})
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

// Import after mocks are set up
import { calculateMaxAp } from '~/utils/restHealing'

// Helper to create a mock H3 event with router params
function createMockEvent(id: string | undefined) {
  return {
    _routerParams: id ? { id } : {},
    node: { req: {}, res: {} }
  } as any
}

// Factory for character with AP state
function createCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'char-1',
    level: 10,
    boundAp: 0,
    drainedAp: 0,
    currentAp: 7,
    restMinutesToday: 120,
    injuriesHealedToday: 1,
    lastRestReset: new Date('2026-02-27'),
    pokemon: [],
    ...overrides
  }
}

describe('POST /api/characters/[id]/new-day', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('boundAp preservation (decree-016, decree-028)', () => {
    it('does NOT clear boundAp on new day', async () => {
      const character = createCharacter({ boundAp: 3 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        drainedAp: 0,
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        currentAp: Math.max(0, calculateMaxAp(10) - 3)
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      // boundAp must NOT appear in the update data
      expect(updateCall.data).not.toHaveProperty('boundAp')
    })

    it('calculates currentAp as maxAp minus existing boundAp', async () => {
      const level = 10
      const boundAp = 2
      const expectedMaxAp = calculateMaxAp(level) // 5 + floor(10/5) = 7
      const expectedCurrentAp = expectedMaxAp - boundAp // 7 - 2 = 5

      const character = createCharacter({ level, boundAp })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        currentAp: expectedCurrentAp,
        drainedAp: 0
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      expect(updateCall.data.currentAp).toBe(expectedCurrentAp)
    })

    it('clamps currentAp to zero when boundAp exceeds maxAp', async () => {
      const level = 1
      const maxAp = calculateMaxAp(level) // 5 + floor(1/5) = 5
      const boundAp = maxAp + 3 // 8, far exceeds max

      const character = createCharacter({ level, boundAp })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        currentAp: 0,
        drainedAp: 0
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      expect(updateCall.data.currentAp).toBe(0)
    })

    it('sets currentAp to full maxAp when boundAp is zero', async () => {
      const level = 15
      const expectedMaxAp = calculateMaxAp(level) // 5 + floor(15/5) = 8

      const character = createCharacter({ level, boundAp: 0 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        currentAp: expectedMaxAp,
        drainedAp: 0
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      expect(updateCall.data.currentAp).toBe(expectedMaxAp)
    })
  })

  describe('daily counter reset (decree-019)', () => {
    it('clears drainedAp to zero', async () => {
      const character = createCharacter({ drainedAp: 4, boundAp: 1 })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        drainedAp: 0
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      expect(updateCall.data.drainedAp).toBe(0)
    })

    it('resets restMinutesToday and injuriesHealedToday', async () => {
      const character = createCharacter({
        restMinutesToday: 240,
        injuriesHealedToday: 2
      })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        drainedAp: 0
      })

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      await handler(createMockEvent('char-1'))

      const updateCall = mockPrisma.humanCharacter.update.mock.calls[0][0]
      expect(updateCall.data.restMinutesToday).toBe(0)
      expect(updateCall.data.injuriesHealedToday).toBe(0)
      expect(updateCall.data.lastRestReset).toBeInstanceOf(Date)
    })
  })

  describe('response payload', () => {
    it('includes boundAp in data payload', async () => {
      const character = createCharacter({ boundAp: 2, drainedAp: 1 })
      const updatedChar = {
        ...character,
        drainedAp: 0,
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        currentAp: Math.max(0, calculateMaxAp(10) - 2),
        boundAp: 2,
        lastRestReset: new Date()
      }
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue(updatedChar)

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      const result = await handler(createMockEvent('char-1'))

      expect(result.success).toBe(true)
      expect(result.data.boundAp).toBe(2)
      expect(result.data.drainedAp).toBe(0)
      expect(result.data.currentAp).toBe(Math.max(0, calculateMaxAp(10) - 2))
    })

    it('includes pokemonReset count', async () => {
      const pokemon = [
        { id: 'poke-1', moves: '[]' },
        { id: 'poke-2', moves: '[]' }
      ]
      const character = createCharacter({ pokemon })
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(character)
      mockPrisma.humanCharacter.update.mockResolvedValue({
        ...character,
        drainedAp: 0,
        restMinutesToday: 0,
        injuriesHealedToday: 0,
        lastRestReset: new Date()
      })
      mockPrisma.pokemon.update.mockResolvedValue({})

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')
      const result = await handler(createMockEvent('char-1'))

      expect(result.data.pokemonReset).toBe(2)
      expect(mockPrisma.pokemon.update).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('returns 400 when character ID is missing', async () => {
      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')

      await expect(handler(createMockEvent(undefined))).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('returns 404 when character does not exist', async () => {
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(null)

      const { default: handler } = await import('~/server/api/characters/[id]/new-day.post')

      await expect(handler(createMockEvent('non-existent'))).rejects.toMatchObject({
        statusCode: 404
      })
    })
  })
})
