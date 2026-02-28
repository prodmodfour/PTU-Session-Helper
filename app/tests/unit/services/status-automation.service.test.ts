import { describe, it, expect, vi } from 'vitest'

// Mock prisma to avoid DB initialization when importing service dependencies
vi.mock('~/server/utils/prisma', () => ({
  prisma: {}
}))

// Mock uuid for deterministic IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}))

import {
  calculateTickDamage,
  calculateBadlyPoisonedDamage,
  getTickDamageEntries,
  getCombatantName
} from '~/server/services/status-automation.service'
import type { Combatant, Pokemon, HumanCharacter, StageModifiers } from '~/types'

// --- Helpers ---

function makeDefaultStageModifiers(): StageModifiers {
  return {
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0,
    accuracy: 0,
    evasion: 0
  }
}

function makePokemonEntity(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 'poke-001',
    species: 'Pikachu',
    nickname: null,
    level: 10,
    experience: 0,
    nature: { name: 'Hardy', raise: null, lower: null },
    types: ['Electric'],
    baseStats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
    currentStats: { hp: 45, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
    currentHp: 45,
    maxHp: 45,
    stageModifiers: makeDefaultStageModifiers(),
    abilities: [],
    moves: [],
    capabilities: {},
    skills: {},
    statusConditions: [],
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    tutorPoints: 0,
    trainingExp: 0,
    eggGroups: [],
    shiny: false,
    gender: 'Male',
    isInLibrary: true,
    origin: 'manual',
    ...overrides
  } as Pokemon
}

function makeHumanEntity(overrides: Partial<HumanCharacter> = {}): HumanCharacter {
  return {
    id: 'human-001',
    name: 'Ash',
    characterType: 'player',
    level: 5,
    stats: { hp: 10, attack: 5, defense: 5, specialAttack: 5, specialDefense: 5, speed: 10 },
    currentHp: 60,
    maxHp: 60,
    trainerClasses: [],
    skills: {},
    features: [],
    edges: [],
    capabilities: [],
    pokemonIds: [],
    statusConditions: [],
    stageModifiers: makeDefaultStageModifiers(),
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    drainedAp: 0,
    boundAp: 0,
    currentAp: 0,
    equipment: {},
    inventory: [],
    money: 0,
    isInLibrary: true,
    ...overrides
  } as HumanCharacter
}

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: 'comb-001',
    type: 'pokemon',
    entityId: 'poke-001',
    side: 'players',
    initiative: 90,
    initiativeBonus: 0,
    hasActed: false,
    actionsRemaining: 2,
    shiftActionsRemaining: 1,
    turnState: {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    },
    badlyPoisonedRound: 0,
    injuries: { count: 0, sources: [] },
    physicalEvasion: 4,
    specialEvasion: 5,
    speedEvasion: 9,
    tokenSize: 1,
    entity: makePokemonEntity(),
    ...overrides
  } as Combatant
}

// ============================================
// TESTS
// ============================================

describe('status-automation.service', () => {
  describe('calculateTickDamage', () => {
    it('should calculate 1/10 of max HP, rounded down', () => {
      expect(calculateTickDamage(100)).toBe(10)
      expect(calculateTickDamage(45)).toBe(4)
      expect(calculateTickDamage(73)).toBe(7)
      expect(calculateTickDamage(200)).toBe(20)
    })

    it('should return minimum of 1 for very low HP', () => {
      expect(calculateTickDamage(1)).toBe(1)
      expect(calculateTickDamage(5)).toBe(1)
      expect(calculateTickDamage(9)).toBe(1)
    })

    it('should return minimum of 1 for 0 or negative maxHp (edge case)', () => {
      expect(calculateTickDamage(0)).toBe(1)
    })

    it('should handle standard Pokemon HP values', () => {
      // Level 10 Pikachu: 10 + (35 * 3) + 10 = 125
      expect(calculateTickDamage(125)).toBe(12)
      // Level 50 Blissey: 50 + (255 * 3) + 10 = 825
      expect(calculateTickDamage(825)).toBe(82)
      // Level 5 Magikarp: 5 + (20 * 3) + 10 = 75
      expect(calculateTickDamage(75)).toBe(7)
    })
  })

  describe('calculateBadlyPoisonedDamage', () => {
    it('should calculate 5 * 2^(round-1)', () => {
      expect(calculateBadlyPoisonedDamage(1)).toBe(5)
      expect(calculateBadlyPoisonedDamage(2)).toBe(10)
      expect(calculateBadlyPoisonedDamage(3)).toBe(20)
      expect(calculateBadlyPoisonedDamage(4)).toBe(40)
      expect(calculateBadlyPoisonedDamage(5)).toBe(80)
      expect(calculateBadlyPoisonedDamage(6)).toBe(160)
    })

    it('should handle round 0 or negative (clamped to round 1)', () => {
      expect(calculateBadlyPoisonedDamage(0)).toBe(5)
      expect(calculateBadlyPoisonedDamage(-1)).toBe(5)
    })
  })

  describe('getTickDamageEntries', () => {
    it('should return empty array for combatant with no tick conditions', () => {
      const combatant = makeCombatant()
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toEqual([])
    })

    it('should return empty array for fainted combatant (HP = 0)', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          currentHp: 0,
          statusConditions: ['Burned', 'Fainted']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toEqual([])
    })

    // --- Burn ---

    it('should return tick damage for Burned combatant', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Burned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Burned')
      expect(entries[0].damage).toBe(10)
      expect(entries[0].formula).toBe('1/10 max HP (10)')
    })

    it('should fire Burn tick even when Standard Action was NOT taken (prevented)', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Burned']
        })
      })
      const entries = getTickDamageEntries(combatant, false)
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Burned')
    })

    // --- Poison ---

    it('should return tick damage for Poisoned combatant', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 50,
          currentHp: 30,
          statusConditions: ['Poisoned']
        })
      })
      const entries = getTickDamageEntries(combatant, false)
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Poisoned')
      expect(entries[0].damage).toBe(5)
    })

    // --- Badly Poisoned ---

    it('should return escalating damage for Badly Poisoned combatant', () => {
      const combatant = makeCombatant({
        badlyPoisonedRound: 3,
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 60,
          statusConditions: ['Badly Poisoned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Badly Poisoned')
      expect(entries[0].damage).toBe(20) // 5 * 2^(3-1) = 20
      expect(entries[0].escalationRound).toBe(3)
    })

    it('should default to round 1 if badlyPoisonedRound is 0', () => {
      const combatant = makeCombatant({
        badlyPoisonedRound: 0,
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 60,
          statusConditions: ['Badly Poisoned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries[0].damage).toBe(5) // Round 1
      expect(entries[0].escalationRound).toBe(1)
    })

    it('should supersede Poisoned when Badly Poisoned is present (E3)', () => {
      const combatant = makeCombatant({
        badlyPoisonedRound: 2,
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 60,
          statusConditions: ['Poisoned', 'Badly Poisoned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      // Should only have Badly Poisoned, not both
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Badly Poisoned')
      expect(entries[0].damage).toBe(10) // 5 * 2^(2-1)
    })

    // --- Cursed ---

    it('should return 2 ticks for Cursed when Standard Action was taken', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Cursed']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toHaveLength(1)
      expect(entries[0].condition).toBe('Cursed')
      expect(entries[0].damage).toBe(20) // 2 * tick(100) = 2 * 10
      expect(entries[0].formula).toBe('2 ticks (20)')
    })

    it('should NOT fire Cursed tick when Standard Action was prevented (decree-032)', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Cursed']
        })
      })
      const entries = getTickDamageEntries(combatant, false)
      expect(entries).toEqual([])
    })

    // --- Multiple conditions (E1) ---

    it('should stack Burn and Cursed independently', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Burned', 'Cursed']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toHaveLength(2)
      expect(entries[0].condition).toBe('Burned')
      expect(entries[0].damage).toBe(10) // 1 tick
      expect(entries[1].condition).toBe('Cursed')
      expect(entries[1].damage).toBe(20) // 2 ticks
    })

    it('should stack Burn and Poison independently', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 60,
          currentHp: 40,
          statusConditions: ['Burned', 'Poisoned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries).toHaveLength(2)
      expect(entries[0].condition).toBe('Burned')
      expect(entries[0].damage).toBe(6)
      expect(entries[1].condition).toBe('Poisoned')
      expect(entries[1].damage).toBe(6)
    })

    it('should stack Burned, Badly Poisoned, and Cursed (not Poisoned)', () => {
      const combatant = makeCombatant({
        badlyPoisonedRound: 1,
        entity: makePokemonEntity({
          maxHp: 100,
          currentHp: 80,
          statusConditions: ['Burned', 'Poisoned', 'Badly Poisoned', 'Cursed']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      // Burned + Badly Poisoned (supersedes Poisoned) + Cursed = 3 entries
      expect(entries).toHaveLength(3)
      expect(entries[0].condition).toBe('Burned')
      expect(entries[1].condition).toBe('Badly Poisoned')
      expect(entries[2].condition).toBe('Cursed')
    })

    // --- Minimum tick = 1 ---

    it('should apply minimum tick of 1 for low maxHp entities', () => {
      const combatant = makeCombatant({
        entity: makePokemonEntity({
          maxHp: 5,
          currentHp: 3,
          statusConditions: ['Burned']
        })
      })
      const entries = getTickDamageEntries(combatant, true)
      expect(entries[0].damage).toBe(1)
    })
  })

  describe('getCombatantName', () => {
    it('should return Pokemon species when no nickname', () => {
      const combatant = makeCombatant({
        type: 'pokemon',
        entity: makePokemonEntity({ species: 'Charizard', nickname: null })
      })
      expect(getCombatantName(combatant)).toBe('Charizard')
    })

    it('should return Pokemon nickname when available', () => {
      const combatant = makeCombatant({
        type: 'pokemon',
        entity: makePokemonEntity({ species: 'Pikachu', nickname: 'Sparky' })
      })
      expect(getCombatantName(combatant)).toBe('Sparky')
    })

    it('should return human name', () => {
      const combatant = makeCombatant({
        type: 'human',
        entity: makeHumanEntity({ name: 'Brock' })
      })
      expect(getCombatantName(combatant)).toBe('Brock')
    })
  })
})
