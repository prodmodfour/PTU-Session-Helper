import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma
const mockPrisma = {
  encounter: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Mock H3 event utilities
const mockEvent = {
  node: { req: {}, res: {} },
  context: {}
}

const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()
const mockCreateError = vi.fn((opts) => {
  const error = new Error(opts.message) as Error & { statusCode: number }
  error.statusCode = opts.statusCode
  return error
})

vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('createError', mockCreateError)
vi.stubGlobal('defineEventHandler', (fn: Function) => fn)

describe('Fog of War API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/encounters/[id]/fog', () => {
    it('should return fog state for an encounter', async () => {
      const mockEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: true,
        fogOfWarState: JSON.stringify({
          cells: [['0,0', 'revealed'], ['1,1', 'hidden']],
          defaultState: 'hidden'
        })
      }

      mockGetRouterParam.mockReturnValue('test-encounter-1')
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.get')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.enabled).toBe(true)
      expect(result.data.cells).toHaveLength(2)
      expect(result.data.defaultState).toBe('hidden')
    })

    it('should return 404 for non-existent encounter', async () => {
      mockGetRouterParam.mockReturnValue('non-existent')
      mockPrisma.encounter.findUnique.mockResolvedValue(null)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.get')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 404
      })
    })

    it('should handle empty fog state', async () => {
      const mockEncounter = {
        id: 'test-encounter-2',
        fogOfWarEnabled: false,
        fogOfWarState: '{}'
      }

      mockGetRouterParam.mockReturnValue('test-encounter-2')
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.get')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.enabled).toBe(false)
      expect(result.data.cells).toEqual([])
      expect(result.data.defaultState).toBe('hidden')
    })
  })

  describe('PUT /api/encounters/[id]/fog', () => {
    it('should update fog state', async () => {
      const mockEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: false,
        fogOfWarState: '{}'
      }

      const updatedEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: true,
        fogOfWarState: JSON.stringify({
          cells: [['2,2', 'revealed']],
          defaultState: 'revealed'
        })
      }

      mockGetRouterParam.mockReturnValue('test-encounter-1')
      mockReadBody.mockResolvedValue({
        enabled: true,
        cells: [['2,2', 'revealed']],
        defaultState: 'revealed'
      })
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter)
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.put')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.enabled).toBe(true)
      expect(result.data.cells).toContainEqual(['2,2', 'revealed'])
      expect(result.data.defaultState).toBe('revealed')
    })

    it('should reject invalid defaultState', async () => {
      const mockEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: false,
        fogOfWarState: '{}'
      }

      mockGetRouterParam.mockReturnValue('test-encounter-1')
      mockReadBody.mockResolvedValue({
        defaultState: 'invalid'
      })
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.put')

      await expect(handler(mockEvent as any)).rejects.toMatchObject({
        statusCode: 400
      })
    })

    it('should preserve existing state when only updating enabled', async () => {
      const existingState = {
        cells: [['0,0', 'revealed']],
        defaultState: 'hidden'
      }

      const mockEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: false,
        fogOfWarState: JSON.stringify(existingState)
      }

      const updatedEncounter = {
        id: 'test-encounter-1',
        fogOfWarEnabled: true,
        fogOfWarState: JSON.stringify(existingState)
      }

      mockGetRouterParam.mockReturnValue('test-encounter-1')
      mockReadBody.mockResolvedValue({ enabled: true })
      mockPrisma.encounter.findUnique.mockResolvedValue(mockEncounter)
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const { default: handler } = await import('~/server/api/encounters/[id]/fog.put')
      const result = await handler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.data.enabled).toBe(true)
      expect(result.data.cells).toContainEqual(['0,0', 'revealed'])
      expect(result.data.defaultState).toBe('hidden')
    })
  })
})
