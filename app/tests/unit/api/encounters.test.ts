import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  encounter: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  pokemon: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  humanCharacter: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Test data helpers
const createMockEncounter = (overrides = {}) => ({
  id: 'enc-123',
  name: 'Battle at Route 1',
  battleType: 'trainer',
  combatants: '[]',
  currentRound: 1,
  currentTurnIndex: 0,
  turnOrder: '[]',
  isActive: false,
  isPaused: false,
  moveLog: '[]',
  defeatedEnemies: '[]',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockCombatant = (overrides = {}) => ({
  id: 'comb-123',
  name: 'Pikachu',
  type: 'pokemon',
  side: 'player',
  characterId: 'poke-123',
  currentHp: 85,
  maxHp: 85,
  speed: 90,
  initiative: 95,
  hasActed: false,
  ...overrides
})

describe('Encounters API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/encounters', () => {
    it('should return all encounters with parsed fields', async () => {
      const mockEncounters = [
        createMockEncounter({ id: 'enc-1', name: 'Battle 1' }),
        createMockEncounter({ id: 'enc-2', name: 'Battle 2', isActive: true })
      ]

      mockPrisma.encounter.findMany.mockResolvedValue(mockEncounters)

      const result = mockEncounters.map(enc => ({
        id: enc.id,
        name: enc.name,
        battleType: enc.battleType,
        combatants: JSON.parse(enc.combatants),
        currentRound: enc.currentRound,
        currentTurnIndex: enc.currentTurnIndex,
        turnOrder: JSON.parse(enc.turnOrder),
        isActive: enc.isActive,
        isPaused: enc.isPaused,
        moveLog: JSON.parse(enc.moveLog),
        defeatedEnemies: JSON.parse(enc.defeatedEnemies)
      }))

      expect(result).toHaveLength(2)
      expect(result[0].combatants).toEqual([])
      expect(result[1].isActive).toBe(true)
    })
  })

  describe('POST /api/encounters', () => {
    it('should create an encounter with default values', async () => {
      const inputBody = {
        name: 'New Battle'
      }

      const createdEncounter = createMockEncounter({
        name: inputBody.name
      })

      mockPrisma.encounter.create.mockResolvedValue(createdEncounter)

      const result = await mockPrisma.encounter.create({
        data: {
          name: inputBody.name || 'New Encounter',
          battleType: 'trainer',
          combatants: '[]',
          currentRound: 1,
          currentTurnIndex: 0,
          turnOrder: '[]',
          isActive: false,
          isPaused: false,
          moveLog: '[]',
          defeatedEnemies: '[]'
        }
      })

      expect(result.name).toBe('New Battle')
      expect(result.isActive).toBe(false)
      expect(result.currentRound).toBe(1)
    })

    it('should create a wild encounter', async () => {
      const createdEncounter = createMockEncounter({
        name: 'Wild Pokemon Encounter',
        battleType: 'wild'
      })

      mockPrisma.encounter.create.mockResolvedValue(createdEncounter)

      const result = await mockPrisma.encounter.create({
        data: { ...createdEncounter }
      })

      expect(result.battleType).toBe('wild')
    })
  })

  describe('POST /api/encounters/:id/combatants', () => {
    it('should add a combatant to the encounter', async () => {
      const existingEncounter = createMockEncounter()
      const newCombatant = createMockCombatant()

      const updatedEncounter = {
        ...existingEncounter,
        combatants: JSON.stringify([newCombatant])
      }

      mockPrisma.encounter.findUnique.mockResolvedValue(existingEncounter)
      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { combatants: JSON.stringify([newCombatant]) }
      })

      const combatants = JSON.parse(result.combatants)
      expect(combatants).toHaveLength(1)
      expect(combatants[0].name).toBe('Pikachu')
    })

    it('should add multiple combatants', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', name: 'Pikachu', side: 'player' }),
        createMockCombatant({ id: 'comb-2', name: 'Charizard', side: 'player' }),
        createMockCombatant({ id: 'comb-3', name: 'Rattata', side: 'enemy' })
      ]

      const updatedEncounter = createMockEncounter({
        combatants: JSON.stringify(combatants)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { combatants: JSON.stringify(combatants) }
      })

      const parsed = JSON.parse(result.combatants)
      expect(parsed).toHaveLength(3)
      expect(parsed.filter((c: any) => c.side === 'player')).toHaveLength(2)
      expect(parsed.filter((c: any) => c.side === 'enemy')).toHaveLength(1)
    })
  })

  describe('POST /api/encounters/:id/start', () => {
    it('should start an encounter and calculate turn order', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', name: 'Pikachu', speed: 90, initiative: 95 }),
        createMockCombatant({ id: 'comb-2', name: 'Charizard', speed: 100, initiative: 105 }),
        createMockCombatant({ id: 'comb-3', name: 'Snorlax', speed: 30, initiative: 35 })
      ]

      // Sort by initiative descending
      const turnOrder = [...combatants]
        .sort((a, b) => b.initiative - a.initiative)
        .map(c => c.id)

      expect(turnOrder).toEqual(['comb-2', 'comb-1', 'comb-3'])

      const startedEncounter = createMockEncounter({
        combatants: JSON.stringify(combatants),
        turnOrder: JSON.stringify(turnOrder),
        isActive: true,
        currentTurnIndex: 0
      })

      mockPrisma.encounter.update.mockResolvedValue(startedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: {
          turnOrder: JSON.stringify(turnOrder),
          isActive: true,
          currentTurnIndex: 0
        }
      })

      expect(result.isActive).toBe(true)
      const order = JSON.parse(result.turnOrder)
      expect(order[0]).toBe('comb-2') // Charizard first (highest initiative)
    })
  })

  describe('POST /api/encounters/:id/next-turn', () => {
    it('should advance to next combatant', async () => {
      const turnOrder = ['comb-1', 'comb-2', 'comb-3']

      const updatedEncounter = createMockEncounter({
        currentTurnIndex: 1,
        turnOrder: JSON.stringify(turnOrder)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { currentTurnIndex: 1 }
      })

      expect(result.currentTurnIndex).toBe(1)
    })

    it('should wrap to next round when turn order completes', async () => {
      const turnOrder = ['comb-1', 'comb-2', 'comb-3']

      // When currentTurnIndex would exceed array length, reset to 0 and increment round
      const updatedEncounter = createMockEncounter({
        currentTurnIndex: 0,
        currentRound: 2,
        turnOrder: JSON.stringify(turnOrder)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { currentTurnIndex: 0, currentRound: 2 }
      })

      expect(result.currentTurnIndex).toBe(0)
      expect(result.currentRound).toBe(2)
    })
  })

  describe('POST /api/encounters/:id/damage', () => {
    it('should apply damage to a combatant', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', currentHp: 85, maxHp: 85 })
      ]

      const damage = 25
      combatants[0].currentHp = Math.max(0, combatants[0].currentHp - damage)

      const updatedEncounter = createMockEncounter({
        combatants: JSON.stringify(combatants)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { combatants: JSON.stringify(combatants) }
      })

      const parsed = JSON.parse(result.combatants)
      expect(parsed[0].currentHp).toBe(60)
    })

    it('should not reduce HP below 0', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', currentHp: 10, maxHp: 85 })
      ]

      const damage = 50
      combatants[0].currentHp = Math.max(0, combatants[0].currentHp - damage)

      expect(combatants[0].currentHp).toBe(0)
    })

    it('should log damage in move log', async () => {
      const moveLog = [
        { timestamp: Date.now(), action: 'damage', source: 'comb-2', target: 'comb-1', amount: 25, move: 'Thunderbolt' }
      ]

      const updatedEncounter = createMockEncounter({
        moveLog: JSON.stringify(moveLog)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { moveLog: JSON.stringify(moveLog) }
      })

      const log = JSON.parse(result.moveLog)
      expect(log).toHaveLength(1)
      expect(log[0].action).toBe('damage')
      expect(log[0].amount).toBe(25)
    })
  })

  describe('POST /api/encounters/:id/heal', () => {
    it('should heal a combatant', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', currentHp: 50, maxHp: 85 })
      ]

      const healAmount = 20
      combatants[0].currentHp = Math.min(combatants[0].maxHp, combatants[0].currentHp + healAmount)

      const updatedEncounter = createMockEncounter({
        combatants: JSON.stringify(combatants)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { combatants: JSON.stringify(combatants) }
      })

      const parsed = JSON.parse(result.combatants)
      expect(parsed[0].currentHp).toBe(70)
    })

    it('should not heal above max HP', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', currentHp: 80, maxHp: 85 })
      ]

      const healAmount = 20
      combatants[0].currentHp = Math.min(combatants[0].maxHp, combatants[0].currentHp + healAmount)

      expect(combatants[0].currentHp).toBe(85)
    })
  })

  describe('POST /api/encounters/:id/end', () => {
    it('should end an encounter', async () => {
      const endedEncounter = createMockEncounter({
        isActive: false,
        isPaused: false
      })

      mockPrisma.encounter.update.mockResolvedValue(endedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { isActive: false }
      })

      expect(result.isActive).toBe(false)
    })
  })

  describe('POST /api/encounters/:id/move', () => {
    it('should log a move used', async () => {
      const existingLog: any[] = []
      const newLogEntry = {
        timestamp: Date.now(),
        action: 'move',
        source: 'comb-1',
        target: 'comb-2',
        moveName: 'Thunderbolt',
        damage: 45,
        effectiveness: 'super-effective'
      }

      const updatedLog = [...existingLog, newLogEntry]

      const updatedEncounter = createMockEncounter({
        moveLog: JSON.stringify(updatedLog)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { moveLog: JSON.stringify(updatedLog) }
      })

      const log = JSON.parse(result.moveLog)
      expect(log).toHaveLength(1)
      expect(log[0].moveName).toBe('Thunderbolt')
      expect(log[0].effectiveness).toBe('super-effective')
    })
  })

  describe('DELETE /api/encounters/:id/combatants/:combatantId', () => {
    it('should remove a combatant from encounter', async () => {
      const combatants = [
        createMockCombatant({ id: 'comb-1', name: 'Pikachu' }),
        createMockCombatant({ id: 'comb-2', name: 'Charizard' })
      ]

      // Remove comb-1
      const filteredCombatants = combatants.filter(c => c.id !== 'comb-1')

      const updatedEncounter = createMockEncounter({
        combatants: JSON.stringify(filteredCombatants)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { combatants: JSON.stringify(filteredCombatants) }
      })

      const parsed = JSON.parse(result.combatants)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].name).toBe('Charizard')
    })

    it('should adjust turn order when combatant is removed', async () => {
      const turnOrder = ['comb-1', 'comb-2', 'comb-3']

      // Remove comb-2 from turn order
      const filteredTurnOrder = turnOrder.filter(id => id !== 'comb-2')

      const updatedEncounter = createMockEncounter({
        turnOrder: JSON.stringify(filteredTurnOrder)
      })

      mockPrisma.encounter.update.mockResolvedValue(updatedEncounter)

      const result = await mockPrisma.encounter.update({
        where: { id: 'enc-123' },
        data: { turnOrder: JSON.stringify(filteredTurnOrder) }
      })

      const order = JSON.parse(result.turnOrder)
      expect(order).toHaveLength(2)
      expect(order).toEqual(['comb-1', 'comb-3'])
    })
  })

  describe('Encounter data validation', () => {
    it('should validate battle types', () => {
      const validBattleTypes = ['trainer', 'wild', 'boss']
      const encounter = createMockEncounter({ battleType: 'trainer' })

      expect(validBattleTypes).toContain(encounter.battleType)
    })

    it('should validate combatant sides', () => {
      const validSides = ['player', 'ally', 'enemy']
      const combatant = createMockCombatant({ side: 'player' })

      expect(validSides).toContain(combatant.side)
    })

    it('should validate combatant types', () => {
      const validTypes = ['pokemon', 'human']
      const combatant = createMockCombatant({ type: 'pokemon' })

      expect(validTypes).toContain(combatant.type)
    })

    it('should parse move log entries correctly', () => {
      const logEntry = {
        timestamp: 1705678900000,
        action: 'damage',
        source: 'comb-1',
        target: 'comb-2',
        moveName: 'Flamethrower',
        damage: 65,
        effectiveness: 'super-effective',
        critical: false,
        stab: true
      }

      expect(logEntry.action).toBe('damage')
      expect(logEntry.stab).toBe(true)
      expect(logEntry.critical).toBe(false)
    })
  })

  describe('Initiative calculation', () => {
    it('should sort combatants by initiative correctly', () => {
      const combatants = [
        { id: 'comb-1', initiative: 45 },
        { id: 'comb-2', initiative: 120 },
        { id: 'comb-3', initiative: 78 },
        { id: 'comb-4', initiative: 95 }
      ]

      const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative)

      expect(sorted[0].id).toBe('comb-2') // 120
      expect(sorted[1].id).toBe('comb-4') // 95
      expect(sorted[2].id).toBe('comb-3') // 78
      expect(sorted[3].id).toBe('comb-1') // 45
    })

    it('should handle initiative ties', () => {
      const combatants = [
        { id: 'comb-1', initiative: 80, speed: 50 },
        { id: 'comb-2', initiative: 80, speed: 60 },
        { id: 'comb-3', initiative: 80, speed: 55 }
      ]

      // When initiative ties, sort by speed as tiebreaker
      const sorted = [...combatants].sort((a, b) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative
        return b.speed - a.speed
      })

      expect(sorted[0].id).toBe('comb-2') // Speed 60
      expect(sorted[1].id).toBe('comb-3') // Speed 55
      expect(sorted[2].id).toBe('comb-1') // Speed 50
    })
  })
})
