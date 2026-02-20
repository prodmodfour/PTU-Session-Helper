import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock $fetch globally
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Import the store after mocking
import { useLibraryStore } from '~/stores/library'

// Test data helpers
const createMockHuman = (overrides = {}) => ({
  id: 'human-123',
  name: 'Test Trainer',
  characterType: 'player' as const,
  level: 5,
  stats: { hp: 50, attack: 10, defense: 10, specialAttack: 10, specialDefense: 10, speed: 10 },
  currentHp: 45,
  maxHp: 50,
  trainerClasses: ['Ace Trainer'],
  skills: { 'Acrobatics': 'Untrained' as const, 'Athletics': 'Novice' as const },
  features: ['Basic Ball Competency'],
  edges: ['Instinctive Aptitude'],
  inventory: [],
  money: 1000,
  statusConditions: [],
  stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
  injuries: 0,
  temporaryHp: 0,
  restMinutesToday: 0,
  lastInjuryTime: null,
  injuriesHealedToday: 0,
  drainedAp: 0,
  currentAp: 5,
  avatarUrl: undefined,
  isInLibrary: true,
  notes: undefined,
  pokemonIds: [],
  ...overrides
})

const createMockPokemon = (overrides = {}) => ({
  id: 'poke-123',
  species: 'Pikachu',
  nickname: 'Sparky',
  level: 25,
  experience: 5000,
  nature: { name: 'Jolly', raisedStat: 'speed' as const, loweredStat: 'specialAttack' as const },
  types: ['Electric'] as ['Electric'],
  baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  currentStats: { hp: 85, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
  currentHp: 85,
  maxHp: 85,
  stageModifiers: { attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
  abilities: [{ id: 'a1', name: 'Static', effect: 'May paralyze on contact' }],
  moves: [{ id: 'm1', name: 'Thunderbolt', type: 'Electric' as const, damageClass: 'Special' as const, frequency: 'At-Will' as const, ac: 2, damageBase: 9, range: '6', effect: '' }],
  heldItem: 'Light Ball',
  capabilities: {
    overland: 6,
    swim: 2,
    sky: 0,
    burrow: 0,
    levitate: 0,
    jump: { high: 2, long: 2 },
    power: 3,
    weightClass: 1,
    size: 'Small' as const,
    naturewalk: [],
    otherCapabilities: ['Zapper']
  },
  skills: {
    'Acrobatics': '3d6+0',
    'Athletics': '2d6+1',
    'Stealth': '2d6+0'
  },
  statusConditions: [],
  injuries: 0,
  temporaryHp: 0,
  restMinutesToday: 0,
  lastInjuryTime: null,
  injuriesHealedToday: 0,
  tutorPoints: 2,
  trainingExp: 5,
  eggGroups: ['Field', 'Fairy'],
  ownerId: undefined,
  spriteUrl: undefined,
  shiny: false,
  gender: 'Male' as const,
  isInLibrary: true,
  origin: 'manual' as const,
  notes: undefined,
  ...overrides
})

describe('Library Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have empty arrays and default filters', () => {
      const store = useLibraryStore()

      expect(store.humans).toEqual([])
      expect(store.pokemon).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.filters.search).toBe('')
      expect(store.filters.type).toBe('all')
      expect(store.filters.sortBy).toBe('name')
      expect(store.filters.sortOrder).toBe('asc')
    })
  })

  describe('Getters - filteredHumans', () => {
    it('should filter humans by search term', () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: '1', name: 'Ash Ketchum' }),
        createMockHuman({ id: '2', name: 'Misty' }),
        createMockHuman({ id: '3', name: 'Brock' })
      ]

      store.filters.search = 'ash'
      expect(store.filteredHumans).toHaveLength(1)
      expect(store.filteredHumans[0].name).toBe('Ash Ketchum')
    })

    it('should filter humans by character type', () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: '1', name: 'Player 1', characterType: 'player' }),
        createMockHuman({ id: '2', name: 'NPC 1', characterType: 'npc' }),
        createMockHuman({ id: '3', name: 'Player 2', characterType: 'player' })
      ]

      store.filters.characterType = 'player'
      expect(store.filteredHumans).toHaveLength(2)
    })

    it('should sort humans by name ascending', () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: '1', name: 'Zebra' }),
        createMockHuman({ id: '2', name: 'Apple' }),
        createMockHuman({ id: '3', name: 'Mango' })
      ]

      store.filters.sortBy = 'name'
      store.filters.sortOrder = 'asc'

      expect(store.filteredHumans[0].name).toBe('Apple')
      expect(store.filteredHumans[1].name).toBe('Mango')
      expect(store.filteredHumans[2].name).toBe('Zebra')
    })

    it('should sort humans by level descending', () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: '1', name: 'Low', level: 5 }),
        createMockHuman({ id: '2', name: 'High', level: 20 }),
        createMockHuman({ id: '3', name: 'Mid', level: 10 })
      ]

      store.filters.sortBy = 'level'
      store.filters.sortOrder = 'desc'

      expect(store.filteredHumans[0].level).toBe(20)
      expect(store.filteredHumans[1].level).toBe(10)
      expect(store.filteredHumans[2].level).toBe(5)
    })
  })

  describe('Getters - filteredPokemon', () => {
    it('should filter Pokemon by search (species)', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: '1', species: 'Pikachu' }),
        createMockPokemon({ id: '2', species: 'Charizard' }),
        createMockPokemon({ id: '3', species: 'Pikipek' })
      ]

      store.filters.search = 'pik'
      expect(store.filteredPokemon).toHaveLength(2)
    })

    it('should filter Pokemon by search (nickname)', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: '1', species: 'Pikachu', nickname: 'Sparky' }),
        createMockPokemon({ id: '2', species: 'Charizard', nickname: 'Flame' }),
        createMockPokemon({ id: '3', species: 'Raichu', nickname: 'Spark' })
      ]

      store.filters.search = 'spark'
      expect(store.filteredPokemon).toHaveLength(2)
    })

    it('should filter Pokemon by type', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: '1', species: 'Pikachu', types: ['Electric'] }),
        createMockPokemon({ id: '2', species: 'Charizard', types: ['Fire', 'Flying'] }),
        createMockPokemon({ id: '3', species: 'Jolteon', types: ['Electric'] })
      ]

      store.filters.pokemonType = 'Electric'
      expect(store.filteredPokemon).toHaveLength(2)
    })

    it('should sort Pokemon by name', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: '1', species: 'Zebstrika', nickname: null }),
        createMockPokemon({ id: '2', species: 'Absol', nickname: null }),
        createMockPokemon({ id: '3', species: 'Pikachu', nickname: 'Zeus' })
      ]

      store.filters.sortBy = 'name'
      store.filters.sortOrder = 'asc'

      // Sort by nickname if present, else species
      expect(store.filteredPokemon[0].species).toBe('Absol')
      expect(store.filteredPokemon[1].species).toBe('Zebstrika')
      expect(store.filteredPokemon[2].nickname).toBe('Zeus')
    })
  })

  describe('Getters - ID lookups', () => {
    it('should get human by ID', () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: 'human-1', name: 'Ash' }),
        createMockHuman({ id: 'human-2', name: 'Misty' })
      ]

      const found = store.getHumanById('human-1')
      expect(found).toBeDefined()
      expect(found?.name).toBe('Ash')

      const notFound = store.getHumanById('non-existent')
      expect(notFound).toBeUndefined()
    })

    it('should get Pokemon by ID', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: 'poke-1', species: 'Pikachu' }),
        createMockPokemon({ id: 'poke-2', species: 'Charizard' })
      ]

      const found = store.getPokemonById('poke-1')
      expect(found).toBeDefined()
      expect(found?.species).toBe('Pikachu')
    })

    it('should get Pokemon by owner', () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: 'poke-1', ownerId: 'trainer-1' }),
        createMockPokemon({ id: 'poke-2', ownerId: 'trainer-2' }),
        createMockPokemon({ id: 'poke-3', ownerId: 'trainer-1' })
      ]

      const owned = store.getPokemonByOwner('trainer-1')
      expect(owned).toHaveLength(2)
    })
  })

  describe('Actions - loadLibrary', () => {
    it('should load humans and Pokemon from API', async () => {
      const store = useLibraryStore()
      const mockHumans = [createMockHuman()]
      const mockPokemon = [createMockPokemon()]

      mockFetch
        .mockResolvedValueOnce({ data: mockHumans })
        .mockResolvedValueOnce({ data: mockPokemon })

      await store.loadLibrary()

      expect(store.humans).toEqual(mockHumans)
      expect(store.pokemon).toEqual(mockPokemon)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle errors when loading library', async () => {
      const store = useLibraryStore()

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await store.loadLibrary()

      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })
  })

  describe('Actions - CRUD operations', () => {
    it('should create a human character', async () => {
      const store = useLibraryStore()
      const newHuman = createMockHuman({ id: 'new-human', name: 'New Trainer' })

      mockFetch.mockResolvedValueOnce({ data: newHuman })

      const result = await store.createHuman({ name: 'New Trainer' })

      expect(result).toEqual(newHuman)
      expect(store.humans).toContainEqual(newHuman)
    })

    it('should update a human character', async () => {
      const store = useLibraryStore()
      const existingHuman = createMockHuman({ id: 'human-1', name: 'Original' })
      store.humans = [existingHuman]

      const updatedHuman = { ...existingHuman, name: 'Updated' }
      mockFetch.mockResolvedValueOnce({ data: updatedHuman })

      await store.updateHuman('human-1', { name: 'Updated' })

      expect(store.humans[0].name).toBe('Updated')
    })

    it('should delete a human character', async () => {
      const store = useLibraryStore()
      store.humans = [
        createMockHuman({ id: 'human-1' }),
        createMockHuman({ id: 'human-2' })
      ]

      mockFetch.mockResolvedValueOnce({})

      await store.deleteHuman('human-1')

      expect(store.humans).toHaveLength(1)
      expect(store.humans[0].id).toBe('human-2')
    })

    it('should create a Pokemon', async () => {
      const store = useLibraryStore()
      const newPokemon = createMockPokemon({ id: 'new-poke', species: 'Bulbasaur' })

      mockFetch.mockResolvedValueOnce({ data: newPokemon })

      const result = await store.createPokemon({ species: 'Bulbasaur' })

      expect(result.species).toBe('Bulbasaur')
      expect(store.pokemon).toContainEqual(newPokemon)
    })

    it('should update a Pokemon', async () => {
      const store = useLibraryStore()
      const existingPokemon = createMockPokemon({ id: 'poke-1', currentHp: 85 })
      store.pokemon = [existingPokemon]

      const updatedPokemon = { ...existingPokemon, currentHp: 50 }
      mockFetch.mockResolvedValueOnce({ data: updatedPokemon })

      await store.updatePokemon('poke-1', { currentHp: 50 })

      expect(store.pokemon[0].currentHp).toBe(50)
    })

    it('should delete a Pokemon', async () => {
      const store = useLibraryStore()
      store.pokemon = [
        createMockPokemon({ id: 'poke-1' }),
        createMockPokemon({ id: 'poke-2' })
      ]

      mockFetch.mockResolvedValueOnce({})

      await store.deletePokemon('poke-1')

      expect(store.pokemon).toHaveLength(1)
      expect(store.pokemon[0].id).toBe('poke-2')
    })
  })

  describe('Actions - Pokemon linking', () => {
    it('should link Pokemon to trainer', async () => {
      const store = useLibraryStore()
      const pokemon = createMockPokemon({ id: 'poke-1', ownerId: null })
      store.pokemon = [pokemon]

      const linkedPokemon = { ...pokemon, ownerId: 'trainer-1' }
      mockFetch.mockResolvedValueOnce({ data: linkedPokemon })

      await store.linkPokemonToTrainer('poke-1', 'trainer-1')

      expect(store.pokemon[0].ownerId).toBe('trainer-1')
    })

    it('should unlink Pokemon from trainer', async () => {
      const store = useLibraryStore()
      const pokemon = createMockPokemon({ id: 'poke-1', ownerId: 'trainer-1' })
      store.pokemon = [pokemon]

      const unlinkedPokemon = { ...pokemon, ownerId: null }
      mockFetch.mockResolvedValueOnce({ data: unlinkedPokemon })

      await store.unlinkPokemon('poke-1')

      expect(store.pokemon[0].ownerId).toBeNull()
    })
  })

  describe('Actions - Filters', () => {
    it('should update filters', () => {
      const store = useLibraryStore()

      store.setFilters({ search: 'pikachu', sortBy: 'level' })

      expect(store.filters.search).toBe('pikachu')
      expect(store.filters.sortBy).toBe('level')
      expect(store.filters.type).toBe('all') // Unchanged
    })

    it('should reset filters', () => {
      const store = useLibraryStore()

      store.filters.search = 'test'
      store.filters.pokemonType = 'Electric'
      store.filters.sortOrder = 'desc'

      store.resetFilters()

      expect(store.filters.search).toBe('')
      expect(store.filters.pokemonType).toBe('all')
      expect(store.filters.sortOrder).toBe('asc')
    })
  })
})
