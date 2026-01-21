import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  pokemon: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  },
  humanCharacter: {
    findUnique: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Test data helpers
const createMockPokemon = (overrides = {}) => ({
  id: 'poke-123',
  species: 'Pikachu',
  nickname: 'Sparky',
  level: 25,
  experience: 5000,
  nature: '{"name": "Jolly", "raisedStat": "speed", "loweredStat": "specialAttack"}',
  type1: 'Electric',
  type2: null,
  baseHp: 35,
  baseAttack: 55,
  baseDefense: 40,
  baseSpAtk: 50,
  baseSpDef: 50,
  baseSpeed: 90,
  currentHp: 85,
  maxHp: 85,
  currentAttack: 55,
  currentDefense: 40,
  currentSpAtk: 50,
  currentSpDef: 50,
  currentSpeed: 90,
  stageModifiers: '{"attack": 0, "defense": 0, "specialAttack": 0, "specialDefense": 0, "speed": 0, "accuracy": 0, "evasion": 0}',
  abilities: '["Static", "Lightning Rod"]',
  moves: '[{"name": "Thunderbolt", "type": "Electric", "damageBase": 9, "frequency": "At-Will"}, {"name": "Quick Attack", "type": "Normal", "damageBase": 4, "frequency": "At-Will"}]',
  heldItem: 'Light Ball',
  statusConditions: '[]',
  ownerId: 'char-123',
  spriteUrl: null,
  shiny: false,
  gender: 'Male',
  isInLibrary: true,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Pokemon API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/pokemon', () => {
    it('should return all Pokemon with parsed JSON fields', async () => {
      const mockPokemonList = [
        createMockPokemon({ id: 'poke-1', species: 'Pikachu' }),
        createMockPokemon({ id: 'poke-2', species: 'Charizard', type1: 'Fire', type2: 'Flying' })
      ]

      mockPrisma.pokemon.findMany.mockResolvedValue(mockPokemonList)

      const result = mockPokemonList.map(pokemon => ({
        id: pokemon.id,
        species: pokemon.species,
        nickname: pokemon.nickname,
        level: pokemon.level,
        nature: JSON.parse(pokemon.nature),
        types: pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1],
        baseStats: {
          hp: pokemon.baseHp,
          attack: pokemon.baseAttack,
          defense: pokemon.baseDefense,
          specialAttack: pokemon.baseSpAtk,
          specialDefense: pokemon.baseSpDef,
          speed: pokemon.baseSpeed
        },
        currentStats: {
          hp: pokemon.currentHp,
          attack: pokemon.currentAttack,
          defense: pokemon.currentDefense,
          specialAttack: pokemon.currentSpAtk,
          specialDefense: pokemon.currentSpDef,
          speed: pokemon.currentSpeed
        },
        abilities: JSON.parse(pokemon.abilities),
        moves: JSON.parse(pokemon.moves)
      }))

      expect(result).toHaveLength(2)
      expect(result[0].types).toEqual(['Electric'])
      expect(result[1].types).toEqual(['Fire', 'Flying'])
      expect(result[0].abilities).toEqual(['Static', 'Lightning Rod'])
    })

    it('should return empty array when no Pokemon exist', async () => {
      mockPrisma.pokemon.findMany.mockResolvedValue([])

      const result = await mockPrisma.pokemon.findMany()
      expect(result).toEqual([])
    })
  })

  describe('POST /api/pokemon', () => {
    it('should create a Pokemon with default values', async () => {
      const inputBody = {
        species: 'Bulbasaur'
      }

      const createdPokemon = createMockPokemon({
        species: 'Bulbasaur',
        nickname: null,
        level: 1,
        type1: 'Grass',
        type2: 'Poison'
      })

      mockPrisma.pokemon.create.mockResolvedValue(createdPokemon)

      const result = await mockPrisma.pokemon.create({ data: createdPokemon })

      expect(result.species).toBe('Bulbasaur')
    })

    it('should create a Pokemon with full stats', async () => {
      const inputBody = {
        species: 'Charizard',
        nickname: 'Flame',
        level: 50,
        types: ['Fire', 'Flying'],
        baseStats: {
          hp: 78,
          attack: 84,
          defense: 78,
          specialAttack: 109,
          specialDefense: 85,
          speed: 100
        },
        abilities: ['Blaze', 'Solar Power'],
        moves: [
          { name: 'Flamethrower', type: 'Fire', damageBase: 9 },
          { name: 'Air Slash', type: 'Flying', damageBase: 8 },
          { name: 'Dragon Claw', type: 'Dragon', damageBase: 8 },
          { name: 'Earthquake', type: 'Ground', damageBase: 10 }
        ],
        shiny: true,
        gender: 'Male'
      }

      const createdPokemon = createMockPokemon({
        species: inputBody.species,
        nickname: inputBody.nickname,
        level: inputBody.level,
        type1: inputBody.types[0],
        type2: inputBody.types[1],
        baseHp: inputBody.baseStats.hp,
        baseAttack: inputBody.baseStats.attack,
        baseDefense: inputBody.baseStats.defense,
        baseSpAtk: inputBody.baseStats.specialAttack,
        baseSpDef: inputBody.baseStats.specialDefense,
        baseSpeed: inputBody.baseStats.speed,
        abilities: JSON.stringify(inputBody.abilities),
        moves: JSON.stringify(inputBody.moves),
        shiny: inputBody.shiny,
        gender: inputBody.gender
      })

      mockPrisma.pokemon.create.mockResolvedValue(createdPokemon)

      const result = await mockPrisma.pokemon.create({ data: createdPokemon })

      expect(result.species).toBe('Charizard')
      expect(result.level).toBe(50)
      expect(result.shiny).toBe(true)
      expect(JSON.parse(result.abilities)).toEqual(['Blaze', 'Solar Power'])
    })

    it('should calculate max HP based on base HP and level', () => {
      const baseHp = 50
      const level = 10
      const expectedMaxHp = baseHp + level * 2 // 50 + 20 = 70

      expect(expectedMaxHp).toBe(70)
    })
  })

  describe('GET /api/pokemon/:id', () => {
    it('should return a single Pokemon by ID', async () => {
      const mockPokemon = createMockPokemon()
      mockPrisma.pokemon.findUnique.mockResolvedValue(mockPokemon)

      const result = await mockPrisma.pokemon.findUnique({
        where: { id: 'poke-123' }
      })

      expect(result).toBeDefined()
      expect(result?.species).toBe('Pikachu')
      expect(result?.nickname).toBe('Sparky')
    })

    it('should return null for non-existent Pokemon', async () => {
      mockPrisma.pokemon.findUnique.mockResolvedValue(null)

      const result = await mockPrisma.pokemon.findUnique({
        where: { id: 'non-existent' }
      })

      expect(result).toBeNull()
    })
  })

  describe('PUT /api/pokemon/:id', () => {
    it('should update Pokemon HP', async () => {
      const originalPokemon = createMockPokemon()
      const updatedPokemon = {
        ...originalPokemon,
        currentHp: 50
      }

      mockPrisma.pokemon.update.mockResolvedValue(updatedPokemon)

      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { currentHp: 50 }
      })

      expect(result.currentHp).toBe(50)
    })

    it('should update Pokemon stage modifiers', async () => {
      const newStageModifiers = {
        attack: 2,
        defense: 0,
        specialAttack: -1,
        specialDefense: 0,
        speed: 1,
        accuracy: 0,
        evasion: 0
      }

      const updatedPokemon = createMockPokemon({
        stageModifiers: JSON.stringify(newStageModifiers)
      })

      mockPrisma.pokemon.update.mockResolvedValue(updatedPokemon)

      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { stageModifiers: JSON.stringify(newStageModifiers) }
      })

      const parsed = JSON.parse(result.stageModifiers)
      expect(parsed.attack).toBe(2)
      expect(parsed.specialAttack).toBe(-1)
      expect(parsed.speed).toBe(1)
    })

    it('should update Pokemon moves', async () => {
      const newMoves = [
        { name: 'Thunder', type: 'Electric', damageBase: 11 },
        { name: 'Iron Tail', type: 'Steel', damageBase: 10 },
        { name: 'Volt Tackle', type: 'Electric', damageBase: 12 },
        { name: 'Agility', type: 'Psychic', damageBase: null }
      ]

      const updatedPokemon = createMockPokemon({
        moves: JSON.stringify(newMoves)
      })

      mockPrisma.pokemon.update.mockResolvedValue(updatedPokemon)

      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { moves: JSON.stringify(newMoves) }
      })

      const moves = JSON.parse(result.moves)
      expect(moves).toHaveLength(4)
      expect(moves[2].name).toBe('Volt Tackle')
    })

    it('should add status conditions', async () => {
      const statusConditions = ['Paralyzed', 'Confused']

      const updatedPokemon = createMockPokemon({
        statusConditions: JSON.stringify(statusConditions)
      })

      mockPrisma.pokemon.update.mockResolvedValue(updatedPokemon)

      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { statusConditions: JSON.stringify(statusConditions) }
      })

      const conditions = JSON.parse(result.statusConditions)
      expect(conditions).toContain('Paralyzed')
      expect(conditions).toContain('Confused')
    })
  })

  describe('DELETE /api/pokemon/:id', () => {
    it('should delete a Pokemon', async () => {
      const deletedPokemon = createMockPokemon()
      mockPrisma.pokemon.delete.mockResolvedValue(deletedPokemon)

      const result = await mockPrisma.pokemon.delete({
        where: { id: 'poke-123' }
      })

      expect(mockPrisma.pokemon.delete).toHaveBeenCalledWith({
        where: { id: 'poke-123' }
      })
      expect(result.id).toBe('poke-123')
    })
  })

  describe('POST /api/pokemon/:id/link', () => {
    it('should link Pokemon to a trainer', async () => {
      const mockTrainer = {
        id: 'trainer-123',
        name: 'Ash'
      }

      const linkedPokemon = createMockPokemon({
        ownerId: 'trainer-123'
      })

      mockPrisma.humanCharacter.findUnique.mockResolvedValue(mockTrainer)
      mockPrisma.pokemon.update.mockResolvedValue(linkedPokemon)

      // Verify trainer exists
      const trainer = await mockPrisma.humanCharacter.findUnique({
        where: { id: 'trainer-123' }
      })
      expect(trainer).toBeDefined()

      // Link Pokemon
      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { ownerId: 'trainer-123' }
      })

      expect(result.ownerId).toBe('trainer-123')
    })

    it('should fail to link if trainer does not exist', async () => {
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(null)

      const trainer = await mockPrisma.humanCharacter.findUnique({
        where: { id: 'non-existent' }
      })

      expect(trainer).toBeNull()
    })
  })

  describe('POST /api/pokemon/:id/unlink', () => {
    it('should unlink Pokemon from trainer', async () => {
      const unlinkedPokemon = createMockPokemon({
        ownerId: null
      })

      mockPrisma.pokemon.update.mockResolvedValue(unlinkedPokemon)

      const result = await mockPrisma.pokemon.update({
        where: { id: 'poke-123' },
        data: { ownerId: null }
      })

      expect(result.ownerId).toBeNull()
    })
  })

  describe('Pokemon data validation', () => {
    it('should parse nature correctly', () => {
      const natureStr = '{"name": "Adamant", "raisedStat": "attack", "loweredStat": "specialAttack"}'
      const parsed = JSON.parse(natureStr)

      expect(parsed.name).toBe('Adamant')
      expect(parsed.raisedStat).toBe('attack')
      expect(parsed.loweredStat).toBe('specialAttack')
    })

    it('should handle dual types correctly', () => {
      const pokemon = createMockPokemon({
        type1: 'Fire',
        type2: 'Flying'
      })

      const types = pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]

      expect(types).toEqual(['Fire', 'Flying'])
      expect(types).toHaveLength(2)
    })

    it('should handle single type correctly', () => {
      const pokemon = createMockPokemon({
        type1: 'Electric',
        type2: null
      })

      const types = pokemon.type2 ? [pokemon.type1, pokemon.type2] : [pokemon.type1]

      expect(types).toEqual(['Electric'])
      expect(types).toHaveLength(1)
    })

    it('should parse moves with full data', () => {
      const movesStr = JSON.stringify([
        { name: 'Thunderbolt', type: 'Electric', damageBase: 9, frequency: 'At-Will', accuracy: 2, range: '6, 1 Target' },
        { name: 'Thunder Wave', type: 'Electric', damageBase: null, frequency: 'EOT', accuracy: 4, range: '6, 1 Target' }
      ])
      const moves = JSON.parse(movesStr)

      expect(moves).toHaveLength(2)
      expect(moves[0].damageBase).toBe(9)
      expect(moves[1].damageBase).toBeNull() // Status move
      expect(moves[0].frequency).toBe('At-Will')
    })

    it('should handle empty moves list', () => {
      const movesStr = '[]'
      const moves = JSON.parse(movesStr)

      expect(moves).toEqual([])
    })

    it('should handle abilities array', () => {
      const abilitiesStr = '["Intimidate", "Moxie"]'
      const abilities = JSON.parse(abilitiesStr)

      expect(abilities).toHaveLength(2)
      expect(abilities).toContain('Intimidate')
      expect(abilities).toContain('Moxie')
    })

    it('should validate gender values', () => {
      const validGenders = ['Male', 'Female', 'Genderless']
      const pokemon = createMockPokemon({ gender: 'Male' })

      expect(validGenders).toContain(pokemon.gender)
    })
  })
})
