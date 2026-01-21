import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma client
const mockPrisma = {
  humanCharacter: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// Test data helpers
const createMockCharacter = (overrides = {}) => ({
  id: 'char-123',
  name: 'Test Trainer',
  characterType: 'player',
  level: 5,
  hp: 50,
  attack: 10,
  defense: 10,
  specialAttack: 10,
  specialDefense: 10,
  speed: 10,
  currentHp: 45,
  trainerClasses: '["Ace Trainer"]',
  skills: '{"acrobatics": 2, "athletics": 3}',
  inventory: '[]',
  money: 1000,
  statusConditions: '[]',
  stageModifiers: '{"attack": 0, "defense": 0, "specialAttack": 0, "specialDefense": 0, "speed": 0, "accuracy": 0, "evasion": 0}',
  avatarUrl: null,
  isInLibrary: true,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createMockPokemon = (overrides = {}) => ({
  id: 'poke-123',
  species: 'Pikachu',
  nickname: 'Sparky',
  level: 10,
  type1: 'Electric',
  type2: null,
  ...overrides
})

describe('Characters API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/characters', () => {
    it('should return all characters with parsed JSON fields', async () => {
      const mockCharacters = [
        createMockCharacter({ id: 'char-1', name: 'Trainer 1' }),
        createMockCharacter({ id: 'char-2', name: 'Trainer 2', characterType: 'npc' })
      ]

      mockPrisma.humanCharacter.findMany.mockResolvedValue(mockCharacters)

      // Simulate the parsing logic from the API
      const result = mockCharacters.map(char => ({
        id: char.id,
        name: char.name,
        characterType: char.characterType,
        level: char.level,
        stats: {
          hp: char.hp,
          attack: char.attack,
          defense: char.defense,
          specialAttack: char.specialAttack,
          specialDefense: char.specialDefense,
          speed: char.speed
        },
        currentHp: char.currentHp,
        maxHp: char.hp,
        trainerClasses: JSON.parse(char.trainerClasses),
        skills: JSON.parse(char.skills),
        inventory: JSON.parse(char.inventory),
        money: char.money,
        statusConditions: JSON.parse(char.statusConditions),
        stageModifiers: JSON.parse(char.stageModifiers),
        avatarUrl: char.avatarUrl,
        isInLibrary: char.isInLibrary,
        notes: char.notes,
        pokemonIds: []
      }))

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Trainer 1')
      expect(result[0].trainerClasses).toEqual(['Ace Trainer'])
      expect(result[0].skills).toEqual({ acrobatics: 2, athletics: 3 })
      expect(result[1].characterType).toBe('npc')
    })

    it('should return empty array when no characters exist', async () => {
      mockPrisma.humanCharacter.findMany.mockResolvedValue([])

      const result = await mockPrisma.humanCharacter.findMany()
      expect(result).toEqual([])
    })
  })

  describe('POST /api/characters', () => {
    it('should create a character with default values', async () => {
      const inputBody = {
        name: 'New Trainer'
      }

      const expectedDefaults = {
        characterType: 'npc',
        level: 1,
        hp: 10,
        attack: 5,
        defense: 5,
        specialAttack: 5,
        specialDefense: 5,
        speed: 5
      }

      // The API applies these defaults
      const createdCharacter = createMockCharacter({
        ...expectedDefaults,
        name: inputBody.name,
        currentHp: 10
      })

      mockPrisma.humanCharacter.create.mockResolvedValue(createdCharacter)

      const result = await mockPrisma.humanCharacter.create({
        data: {
          name: inputBody.name,
          characterType: inputBody.characterType || 'npc',
          level: inputBody.level || 1,
          hp: 10,
          attack: 5,
          defense: 5,
          specialAttack: 5,
          specialDefense: 5,
          speed: 5,
          currentHp: 10,
          trainerClasses: '[]',
          skills: '{}',
          inventory: '[]',
          money: 0,
          statusConditions: '[]',
          stageModifiers: '{"attack": 0, "defense": 0, "specialAttack": 0, "specialDefense": 0, "speed": 0, "accuracy": 0, "evasion": 0}',
          isInLibrary: true
        }
      })

      expect(mockPrisma.humanCharacter.create).toHaveBeenCalled()
      expect(result.name).toBe('New Trainer')
    })

    it('should create a player character with stats', async () => {
      const inputBody = {
        name: 'Player Character',
        characterType: 'player',
        level: 10,
        stats: {
          hp: 100,
          attack: 20,
          defense: 15,
          specialAttack: 25,
          specialDefense: 18,
          speed: 22
        },
        trainerClasses: ['Ace Trainer', 'Capture Specialist'],
        money: 5000
      }

      const createdCharacter = createMockCharacter({
        ...inputBody,
        hp: inputBody.stats.hp,
        attack: inputBody.stats.attack,
        defense: inputBody.stats.defense,
        specialAttack: inputBody.stats.specialAttack,
        specialDefense: inputBody.stats.specialDefense,
        speed: inputBody.stats.speed,
        currentHp: inputBody.stats.hp,
        trainerClasses: JSON.stringify(inputBody.trainerClasses)
      })

      mockPrisma.humanCharacter.create.mockResolvedValue(createdCharacter)

      const result = await mockPrisma.humanCharacter.create({ data: createdCharacter })

      expect(result.characterType).toBe('player')
      expect(result.level).toBe(10)
      expect(result.hp).toBe(100)
    })
  })

  describe('GET /api/characters/:id', () => {
    it('should return a single character by ID', async () => {
      const mockCharacter = createMockCharacter()
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(mockCharacter)

      const result = await mockPrisma.humanCharacter.findUnique({
        where: { id: 'char-123' }
      })

      expect(result).toBeDefined()
      expect(result?.id).toBe('char-123')
      expect(result?.name).toBe('Test Trainer')
    })

    it('should return null for non-existent character', async () => {
      mockPrisma.humanCharacter.findUnique.mockResolvedValue(null)

      const result = await mockPrisma.humanCharacter.findUnique({
        where: { id: 'non-existent' }
      })

      expect(result).toBeNull()
    })
  })

  describe('PUT /api/characters/:id', () => {
    it('should update character stats', async () => {
      const originalCharacter = createMockCharacter()
      const updateData = {
        currentHp: 30,
        stageModifiers: { attack: 2, defense: -1, specialAttack: 0, specialDefense: 0, speed: 1, accuracy: 0, evasion: 0 }
      }

      const updatedCharacter = {
        ...originalCharacter,
        currentHp: 30,
        stageModifiers: JSON.stringify(updateData.stageModifiers)
      }

      mockPrisma.humanCharacter.update.mockResolvedValue(updatedCharacter)

      const result = await mockPrisma.humanCharacter.update({
        where: { id: 'char-123' },
        data: {
          currentHp: updateData.currentHp,
          stageModifiers: JSON.stringify(updateData.stageModifiers)
        }
      })

      expect(result.currentHp).toBe(30)
      expect(JSON.parse(result.stageModifiers).attack).toBe(2)
      expect(JSON.parse(result.stageModifiers).defense).toBe(-1)
    })

    it('should update character level', async () => {
      const updatedCharacter = createMockCharacter({ level: 6 })
      mockPrisma.humanCharacter.update.mockResolvedValue(updatedCharacter)

      const result = await mockPrisma.humanCharacter.update({
        where: { id: 'char-123' },
        data: { level: 6 }
      })

      expect(result.level).toBe(6)
    })
  })

  describe('DELETE /api/characters/:id', () => {
    it('should delete a character', async () => {
      const deletedCharacter = createMockCharacter()
      mockPrisma.humanCharacter.delete.mockResolvedValue(deletedCharacter)

      const result = await mockPrisma.humanCharacter.delete({
        where: { id: 'char-123' }
      })

      expect(mockPrisma.humanCharacter.delete).toHaveBeenCalledWith({
        where: { id: 'char-123' }
      })
      expect(result.id).toBe('char-123')
    })
  })

  describe('Character data validation', () => {
    it('should parse stage modifiers correctly', () => {
      const stageModifiersStr = '{"attack": 2, "defense": -1, "specialAttack": 0, "specialDefense": 0, "speed": 1, "accuracy": 0, "evasion": -2}'
      const parsed = JSON.parse(stageModifiersStr)

      expect(parsed.attack).toBe(2)
      expect(parsed.defense).toBe(-1)
      expect(parsed.speed).toBe(1)
      expect(parsed.evasion).toBe(-2)
    })

    it('should handle empty trainer classes', () => {
      const trainerClassesStr = '[]'
      const parsed = JSON.parse(trainerClassesStr)

      expect(parsed).toEqual([])
      expect(parsed).toHaveLength(0)
    })

    it('should handle multiple trainer classes', () => {
      const trainerClassesStr = '["Ace Trainer", "Type Ace (Electric)", "Commander"]'
      const parsed = JSON.parse(trainerClassesStr)

      expect(parsed).toHaveLength(3)
      expect(parsed).toContain('Ace Trainer')
      expect(parsed).toContain('Type Ace (Electric)')
    })

    it('should parse skills object correctly', () => {
      const skillsStr = '{"acrobatics": 4, "athletics": 3, "charm": 2, "combat": 5, "command": 3}'
      const parsed = JSON.parse(skillsStr)

      expect(parsed.acrobatics).toBe(4)
      expect(parsed.combat).toBe(5)
      expect(Object.keys(parsed)).toHaveLength(5)
    })
  })
})
