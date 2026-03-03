import { describe, it, expect, vi } from 'vitest'

// Mock prisma to avoid DB initialization when importing the service module
vi.mock('~/server/utils/prisma', () => ({
  prisma: {}
}))

// Mock uuid for deterministic IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}))

import {
  validateForcedSwitch,
  validateSwitch
} from '~/server/services/switching.service'
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
    nature: { name: 'Hardy', raisedStat: null, loweredStat: null },
    types: ['Electric'],
    baseStats: { hp: 35, attack: 55, defense: 30, specialAttack: 50, specialDefense: 40, speed: 90 },
    currentStats: { hp: 35, attack: 55, defense: 30, specialAttack: 50, specialDefense: 40, speed: 90 },
    currentHp: 45,
    maxHp: 45,
    stageModifiers: makeDefaultStageModifiers(),
    abilities: [],
    moves: [],
    capabilities: { overland: 6, swim: 2, sky: 0, burrow: 0, levitate: 0, jump: { high: 1, long: 1 }, power: 3, weightClass: 1, size: 'Small' },
    skills: {},
    statusConditions: [],
    injuries: 0,
    temporaryHp: 0,
    restMinutesToday: 0,
    lastInjuryTime: null,
    injuriesHealedToday: 0,
    tutorPoints: 0,
    trainingExp: 0,
    eggGroups: ['Field', 'Fairy'],
    shiny: false,
    gender: 'Male',
    isInLibrary: true,
    origin: 'manual',
    loyalty: 3,
    ownerId: 'human-001',
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
    currentAp: 5,
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
// TESTS — validateForcedSwitch Trapped Check (decree-039)
// ============================================

describe('switching.service — validateForcedSwitch', () => {
  const trainerCombatant = makeCombatant({
    id: 'trainer-001',
    type: 'human',
    entityId: 'human-001',
    entity: makeHumanEntity()
  })

  const releasedPokemonRecord = {
    id: 'poke-bench-001',
    ownerId: 'human-001',
    currentHp: 30
  }

  describe('Trapped condition blocks forced recall (decree-039)', () => {
    it('should block forced switch when Pokemon has Trapped status condition', () => {
      const trappedPokemon = makeCombatant({
        id: 'comb-trapped',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({
          statusConditions: ['Trapped'],
          ownerId: 'human-001'
        })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, trappedPokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-trapped',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Trapped')
      expect(result.error).toContain('decree-039')
      expect(result.statusCode).toBe(400)
    })

    it('should block forced switch when Pokemon has Bound status condition', () => {
      const boundPokemon = makeCombatant({
        id: 'comb-bound',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({
          statusConditions: ['Bound'] as any,
          ownerId: 'human-001'
        })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, boundPokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-bound',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Trapped')
    })

    it('should block forced switch when Pokemon has Trapped in tempConditions', () => {
      const pokemonWithTempTrapped = makeCombatant({
        id: 'comb-temp-trapped',
        type: 'pokemon',
        entityId: 'poke-001',
        tempConditions: ['Trapped'],
        entity: makePokemonEntity({
          statusConditions: [],
          ownerId: 'human-001'
        })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, pokemonWithTempTrapped],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-temp-trapped',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Trapped')
    })

    it('should allow forced switch when Pokemon is NOT Trapped', () => {
      const normalPokemon = makeCombatant({
        id: 'comb-normal',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({
          statusConditions: ['Burned'],
          ownerId: 'human-001'
        })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, normalPokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-normal',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(true)
    })

    it('should allow forced switch when Pokemon has other conditions but not Trapped', () => {
      const conditionedPokemon = makeCombatant({
        id: 'comb-conditions',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({
          statusConditions: ['Burned', 'Confused', 'Slowed'],
          ownerId: 'human-001'
        })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, conditionedPokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-conditions',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(true)
    })
  })

  describe('existing forced switch validations still work', () => {
    it('should reject when encounter is not active', () => {
      const pokemon = makeCombatant({
        id: 'comb-001',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({ ownerId: 'human-001' })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: false,
          combatants: [trainerCombatant, pokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-001',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not active')
    })

    it('should reject when trainer combatant not found', () => {
      const pokemon = makeCombatant({
        id: 'comb-001',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({ ownerId: 'human-001' })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [pokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-missing',
        recallCombatantId: 'comb-001',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Trainer')
    })

    it('should reject when released Pokemon is fainted', () => {
      const pokemon = makeCombatant({
        id: 'comb-001',
        type: 'pokemon',
        entityId: 'poke-001',
        entity: makePokemonEntity({ ownerId: 'human-001' })
      })

      const result = validateForcedSwitch({
        encounter: {
          isActive: true,
          combatants: [trainerCombatant, pokemon],
          battleType: 'full_contact'
        },
        trainerId: 'trainer-001',
        recallCombatantId: 'comb-001',
        releaseEntityId: 'poke-bench-001',
        releasedPokemonRecord: { id: 'poke-bench-001', ownerId: 'human-001', currentHp: 0 }
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('fainted')
    })
  })
})

// ============================================
// TESTS — validateSwitch also blocks Trapped for standard switches
// ============================================

describe('switching.service — validateSwitch Trapped check', () => {
  const trainerCombatant = makeCombatant({
    id: 'trainer-001',
    type: 'human',
    entityId: 'human-001',
    entity: makeHumanEntity()
  })

  const releasedPokemonRecord = {
    id: 'poke-bench-001',
    ownerId: 'human-001',
    currentHp: 30
  }

  it('should block standard switch when Pokemon is Trapped', () => {
    const trappedPokemon = makeCombatant({
      id: 'comb-trapped',
      type: 'pokemon',
      entityId: 'poke-001',
      entity: makePokemonEntity({
        statusConditions: ['Trapped'],
        ownerId: 'human-001'
      })
    })

    const result = validateSwitch({
      encounter: {
        isActive: true,
        combatants: [trainerCombatant, trappedPokemon],
        turnOrder: ['trainer-001'],
        currentTurnIndex: 0,
        battleType: 'full_contact'
      },
      trainerId: 'trainer-001',
      recallCombatantId: 'comb-trapped',
      releaseEntityId: 'poke-bench-001',
      releasedPokemonRecord
    })

    expect(result.valid).toBe(false)
    expect(result.error).toContain('Trapped')
  })

  it('should allow standard switch when Pokemon is not Trapped', () => {
    const normalPokemon = makeCombatant({
      id: 'comb-normal',
      type: 'pokemon',
      entityId: 'poke-001',
      entity: makePokemonEntity({
        statusConditions: [],
        ownerId: 'human-001'
      })
    })

    const result = validateSwitch({
      encounter: {
        isActive: true,
        combatants: [trainerCombatant, normalPokemon],
        turnOrder: ['trainer-001'],
        currentTurnIndex: 0,
        battleType: 'full_contact'
      },
      trainerId: 'trainer-001',
      recallCombatantId: 'comb-normal',
      releaseEntityId: 'poke-bench-001',
      releasedPokemonRecord
    })

    expect(result.valid).toBe(true)
  })
})
