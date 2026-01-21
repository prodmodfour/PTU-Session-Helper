import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Import the store after mocking
import { useEncounterStore } from '~/stores/encounter'

// Test data helpers
const createMockCombatant = (overrides = {}) => ({
  id: 'comb-123',
  name: 'Pikachu',
  entityType: 'pokemon' as const,
  entityId: 'poke-123',
  side: 'players' as const,
  currentHp: 85,
  maxHp: 85,
  speed: 90,
  initiative: 95,
  hasActed: false,
  types: ['Electric'],
  moves: [{ name: 'Thunderbolt', type: 'Electric', damageBase: 9 }],
  ...overrides
})

const createMockEncounter = (overrides = {}) => ({
  id: 'enc-123',
  name: 'Battle at Route 1',
  battleType: 'trainer' as const,
  combatants: [],
  currentRound: 1,
  currentTurnIndex: 0,
  turnOrder: [],
  currentPhase: 'pokemon' as const,
  trainerTurnOrder: [],
  pokemonTurnOrder: [],
  sceneNumber: 1,
  isActive: false,
  isPaused: false,
  moveLog: [],
  defeatedEnemies: [],
  ...overrides
})

describe('Encounter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have null encounter and no errors', () => {
      const store = useEncounterStore()

      expect(store.encounter).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Getters - isActive and isPaused', () => {
    it('should return false when no encounter', () => {
      const store = useEncounterStore()

      expect(store.isActive).toBe(false)
      expect(store.isPaused).toBe(false)
    })

    it('should return encounter status', () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ isActive: true, isPaused: false })

      expect(store.isActive).toBe(true)
      expect(store.isPaused).toBe(false)
    })
  })

  describe('Getters - currentRound', () => {
    it('should return 0 when no encounter', () => {
      const store = useEncounterStore()

      expect(store.currentRound).toBe(0)
    })

    it('should return current round from encounter', () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ currentRound: 3 })

      expect(store.currentRound).toBe(3)
    })
  })

  describe('Getters - combatantsByInitiative', () => {
    it('should return empty array when no encounter', () => {
      const store = useEncounterStore()

      expect(store.combatantsByInitiative).toEqual([])
    })

    it('should return combatants in turn order', () => {
      const store = useEncounterStore()
      const combatants = [
        createMockCombatant({ id: 'comb-1', name: 'Pikachu', initiative: 95 }),
        createMockCombatant({ id: 'comb-2', name: 'Charizard', initiative: 105 }),
        createMockCombatant({ id: 'comb-3', name: 'Snorlax', initiative: 35 })
      ]

      store.encounter = createMockEncounter({
        combatants,
        turnOrder: ['comb-2', 'comb-1', 'comb-3'] // Pre-sorted by initiative
      })

      const sorted = store.combatantsByInitiative
      expect(sorted[0].name).toBe('Charizard')
      expect(sorted[1].name).toBe('Pikachu')
      expect(sorted[2].name).toBe('Snorlax')
    })
  })

  describe('Getters - currentCombatant', () => {
    it('should return null when no encounter', () => {
      const store = useEncounterStore()

      expect(store.currentCombatant).toBeNull()
    })

    it('should return null when turn order is empty', () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ turnOrder: [] })

      expect(store.currentCombatant).toBeNull()
    })

    it('should return current combatant based on turn index', () => {
      const store = useEncounterStore()
      const combatants = [
        createMockCombatant({ id: 'comb-1', name: 'First' }),
        createMockCombatant({ id: 'comb-2', name: 'Second' }),
        createMockCombatant({ id: 'comb-3', name: 'Third' })
      ]

      store.encounter = createMockEncounter({
        combatants,
        turnOrder: ['comb-1', 'comb-2', 'comb-3'],
        currentTurnIndex: 1
      })

      expect(store.currentCombatant?.name).toBe('Second')
    })
  })

  describe('Getters - combatants by side', () => {
    it('should filter combatants by side', () => {
      const store = useEncounterStore()
      const combatants = [
        createMockCombatant({ id: '1', name: 'Player Pokemon', side: 'players' }),
        createMockCombatant({ id: '2', name: 'Ally Pokemon', side: 'allies' }),
        createMockCombatant({ id: '3', name: 'Enemy Pokemon', side: 'enemies' }),
        createMockCombatant({ id: '4', name: 'Another Player', side: 'players' })
      ]

      store.encounter = createMockEncounter({ combatants })

      expect(store.playerCombatants).toHaveLength(2)
      expect(store.allyCombatants).toHaveLength(1)
      expect(store.enemyCombatants).toHaveLength(1)
    })

    it('should return empty arrays when no encounter', () => {
      const store = useEncounterStore()

      expect(store.playerCombatants).toEqual([])
      expect(store.allyCombatants).toEqual([])
      expect(store.enemyCombatants).toEqual([])
    })
  })

  describe('Getters - moveLog', () => {
    it('should return empty array when no encounter', () => {
      const store = useEncounterStore()

      expect(store.moveLog).toEqual([])
    })

    it('should return move log entries', () => {
      const store = useEncounterStore()
      const moveLog = [
        { timestamp: 1000, action: 'damage', source: 'comb-1', target: 'comb-2', damage: 45 },
        { timestamp: 2000, action: 'heal', source: 'comb-3', target: 'comb-1', amount: 20 }
      ]

      store.encounter = createMockEncounter({ moveLog })

      expect(store.moveLog).toHaveLength(2)
    })
  })

  describe('Actions - loadEncounter', () => {
    it('should load encounter from API', async () => {
      const store = useEncounterStore()
      const mockEncounter = createMockEncounter({ name: 'Loaded Battle' })

      mockFetch.mockResolvedValueOnce({ data: mockEncounter })

      await store.loadEncounter('enc-123')

      expect(store.encounter).toEqual(mockEncounter)
      expect(store.loading).toBe(false)
    })

    it('should handle load errors', async () => {
      const store = useEncounterStore()

      mockFetch.mockRejectedValueOnce(new Error('Not found'))

      await store.loadEncounter('bad-id')

      expect(store.error).toBe('Not found')
      expect(store.encounter).toBeNull()
    })
  })

  describe('Actions - createEncounter', () => {
    it('should create a new encounter', async () => {
      const store = useEncounterStore()
      const newEncounter = createMockEncounter({ name: 'New Battle' })

      mockFetch.mockResolvedValueOnce({ data: newEncounter })

      const result = await store.createEncounter('New Battle', 'trainer')

      expect(result.name).toBe('New Battle')
      expect(store.encounter).toEqual(newEncounter)
    })
  })

  describe('Actions - addCombatant', () => {
    it('should add combatant to encounter', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter()

      const updatedEncounter = createMockEncounter({
        combatants: [createMockCombatant()]
      })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.addCombatant('poke-123', 'pokemon', 'players', 5)

      expect(store.encounter?.combatants).toHaveLength(1)
    })

    it('should do nothing if no encounter', async () => {
      const store = useEncounterStore()

      await store.addCombatant('poke-123', 'pokemon', 'players')

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Actions - removeCombatant', () => {
    it('should remove combatant from encounter', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({
        combatants: [
          createMockCombatant({ id: 'comb-1' }),
          createMockCombatant({ id: 'comb-2' })
        ]
      })

      const updatedEncounter = createMockEncounter({
        combatants: [createMockCombatant({ id: 'comb-2' })]
      })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.removeCombatant('comb-1')

      expect(store.encounter?.combatants).toHaveLength(1)
      expect(store.encounter?.combatants[0].id).toBe('comb-2')
    })
  })

  describe('Actions - startEncounter', () => {
    it('should start the encounter', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter()

      const startedEncounter = createMockEncounter({
        isActive: true,
        turnOrder: ['comb-1', 'comb-2']
      })

      mockFetch.mockResolvedValueOnce({ data: startedEncounter })

      await store.startEncounter()

      expect(store.encounter?.isActive).toBe(true)
      expect(store.encounter?.turnOrder).toHaveLength(2)
    })
  })

  describe('Actions - nextTurn', () => {
    it('should advance to next turn', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ currentTurnIndex: 0 })

      const updatedEncounter = createMockEncounter({ currentTurnIndex: 1 })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.nextTurn()

      expect(store.encounter?.currentTurnIndex).toBe(1)
    })
  })

  describe('Actions - applyDamage', () => {
    it('should apply damage to combatant', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({
        combatants: [createMockCombatant({ id: 'comb-1', currentHp: 85 })]
      })

      const updatedEncounter = createMockEncounter({
        combatants: [createMockCombatant({ id: 'comb-1', currentHp: 60 })]
      })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.applyDamage('comb-1', 25)

      expect(store.encounter?.combatants[0].currentHp).toBe(60)
    })
  })

  describe('Actions - healCombatant', () => {
    it('should heal combatant', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({
        combatants: [createMockCombatant({ id: 'comb-1', currentHp: 50 })]
      })

      const updatedEncounter = createMockEncounter({
        combatants: [createMockCombatant({ id: 'comb-1', currentHp: 70 })]
      })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.healCombatant('comb-1', 20)

      expect(store.encounter?.combatants[0].currentHp).toBe(70)
    })
  })

  describe('Actions - executeMove', () => {
    it('should execute a move', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter()

      const updatedEncounter = createMockEncounter({
        moveLog: [{ action: 'move', source: 'comb-1', target: 'comb-2' }]
      })

      mockFetch.mockResolvedValueOnce({ data: updatedEncounter })

      await store.executeMove('comb-1', 'move-1', ['comb-2'], 45)

      expect(store.encounter?.moveLog).toHaveLength(1)
    })
  })

  describe('Actions - endEncounter', () => {
    it('should end the encounter', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ isActive: true })

      const endedEncounter = createMockEncounter({ isActive: false })

      mockFetch.mockResolvedValueOnce({ data: endedEncounter })

      await store.endEncounter()

      expect(store.encounter?.isActive).toBe(false)
    })
  })

  describe('Actions - endAndClear', () => {
    it('should end encounter and clear state', async () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter({ isActive: true })

      mockFetch.mockResolvedValueOnce({ data: createMockEncounter({ isActive: false }) })

      await store.endAndClear()

      expect(store.encounter).toBeNull()
    })
  })

  describe('Actions - updateFromWebSocket', () => {
    it('should update encounter from websocket data', () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter()

      const wsData = createMockEncounter({ currentRound: 5, currentTurnIndex: 3 })

      store.updateFromWebSocket(wsData)

      expect(store.encounter?.currentRound).toBe(5)
      expect(store.encounter?.currentTurnIndex).toBe(3)
    })
  })

  describe('Actions - clearEncounter', () => {
    it('should clear encounter and error', () => {
      const store = useEncounterStore()
      store.encounter = createMockEncounter()
      store.error = 'Some error'

      store.clearEncounter()

      expect(store.encounter).toBeNull()
      expect(store.error).toBeNull()
    })
  })
})
