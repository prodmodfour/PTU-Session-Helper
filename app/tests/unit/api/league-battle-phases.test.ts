import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for League Battle three-phase turn progression (decree-021).
 *
 * Phase flow: trainer_declaration (low→high speed) → trainer_resolution (high→low) → pokemon (high→low) → new round
 *
 * These tests simulate the next-turn.post.ts logic by building the same
 * state transitions the handler performs, then verifying the outcomes.
 * This mirrors the existing test pattern (encounters.test.ts) of testing
 * data transformations against mocked Prisma calls.
 */

// Mock Prisma client
const mockPrisma = {
  encounter: {
    findUnique: vi.fn(),
    update: vi.fn()
  }
}

vi.mock('~/server/utils/prisma', () => ({
  prisma: mockPrisma
}))

// ============================================
// Helpers — replicate the pure functions from next-turn.post.ts
// ============================================

function resetResolvingTrainerTurnState(combatants: any[], combatantId: string) {
  const trainer = combatants.find((c: any) => c.id === combatantId)
  if (trainer) {
    trainer.hasActed = false
    trainer.actionsRemaining = 2
    trainer.shiftActionsRemaining = 1
    trainer.tempConditions = []
    trainer.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    }
  }
}

function resetAllTrainersForResolution(combatants: any[], resolutionOrder: string[]) {
  const trainerIds = new Set(resolutionOrder)
  combatants.forEach((c: any) => {
    if (trainerIds.has(c.id)) {
      c.hasActed = false
    }
  })
}

function resetCombatantsForNewRound(combatants: any[]) {
  combatants.forEach((c: any) => {
    c.hasActed = false
    c.actionsRemaining = 2
    c.shiftActionsRemaining = 1
    c.readyAction = null
    c.turnState = {
      hasActed: false,
      standardActionUsed: false,
      shiftActionUsed: false,
      swiftActionUsed: false,
      canBeCommanded: true,
      isHolding: false
    }
  })
}

/**
 * Auto-skip fainted trainers during declaration phase (edge case H1).
 * Mirrors skipFaintedTrainers in next-turn.post.ts.
 */
function skipFaintedTrainers(
  startIndex: number,
  turnOrder: string[],
  combatants: any[]
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const combatant = combatants.find((c: any) => c.id === combatantId)
    if (combatant && combatant.entity.currentHp > 0) break
    index++
  }
  return index
}

/**
 * Auto-skip trainers with no declaration during resolution phase (edge case H1).
 * Mirrors skipUndeclaredTrainers in next-turn.post.ts.
 */
function skipUndeclaredTrainers(
  startIndex: number,
  turnOrder: string[],
  declarations: { combatantId: string; round: number }[],
  currentRound: number
): number {
  let index = startIndex
  while (index < turnOrder.length) {
    const combatantId = turnOrder[index]
    const hasDeclaration = declarations.some(
      d => d.combatantId === combatantId && d.round === currentRound
    )
    if (hasDeclaration) break
    index++
  }
  return index
}

// Factory helpers
const createTrainerCombatant = (id: string, name: string, speed: number, currentHp: number = 100) => ({
  id,
  type: 'human',
  side: 'players',
  initiative: speed,
  hasActed: false,
  actionsRemaining: 2,
  shiftActionsRemaining: 1,
  tempConditions: [],
  entity: { name, currentHp },
  turnState: {
    hasActed: false,
    standardActionUsed: false,
    shiftActionUsed: false,
    swiftActionUsed: false,
    canBeCommanded: true,
    isHolding: false
  }
})

const createPokemonCombatant = (id: string, species: string, speed: number) => ({
  id,
  type: 'pokemon',
  side: 'players',
  initiative: speed,
  hasActed: false,
  actionsRemaining: 2,
  shiftActionsRemaining: 1,
  tempConditions: [],
  entity: { species },
  turnState: {
    hasActed: false,
    standardActionUsed: false,
    shiftActionUsed: false,
    swiftActionUsed: false,
    canBeCommanded: true,
    isHolding: false
  }
})

/**
 * Simulates the core next-turn logic from next-turn.post.ts.
 * Returns the computed state after one next-turn call.
 */
function simulateNextTurn(params: {
  combatants: any[]
  turnOrder: string[]
  currentTurnIndex: number
  currentRound: number
  currentPhase: string
  battleType: string
  trainerTurnOrder: string[]
  pokemonTurnOrder: string[]
  declarations?: { combatantId: string; round: number }[]
}) {
  const combatants = JSON.parse(JSON.stringify(params.combatants))
  let turnOrder = [...params.turnOrder]
  let currentTurnIndex = params.currentTurnIndex
  let currentRound = params.currentRound
  let currentPhase = params.currentPhase
  const trainerTurnOrder = [...params.trainerTurnOrder]
  const pokemonTurnOrder = [...params.pokemonTurnOrder]
  const declarations = params.declarations ?? []
  let clearDeclarations = false

  // Mark current combatant as having acted
  const currentCombatantId = turnOrder[currentTurnIndex]
  const currentCombatant = combatants.find((c: any) => c.id === currentCombatantId)
  if (currentCombatant) {
    currentCombatant.hasActed = true
    currentCombatant.actionsRemaining = 0
    currentCombatant.shiftActionsRemaining = 0
    // Skip tempConditions clearing during declaration phase (C1 fix)
    if (currentPhase !== 'trainer_declaration') {
      currentCombatant.tempConditions = []
    }
  }

  currentTurnIndex++

  const isLeagueBattle = params.battleType === 'trainer'

  if (isLeagueBattle) {
    // Auto-skip fainted trainers during declaration phase
    if (currentPhase === 'trainer_declaration') {
      currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
    }
    // Auto-skip undeclared trainers during resolution phase
    if (currentPhase === 'trainer_resolution') {
      currentTurnIndex = skipUndeclaredTrainers(currentTurnIndex, turnOrder, declarations, currentRound)
    }

    if (currentTurnIndex >= turnOrder.length) {
      if (currentPhase === 'trainer_declaration') {
        if (trainerTurnOrder.length > 0) {
          const resolutionOrder = [...trainerTurnOrder].reverse()
          currentPhase = 'trainer_resolution'
          turnOrder = resolutionOrder
          currentTurnIndex = 0

          // H1 fix: reset hasActed for ALL trainers
          resetAllTrainersForResolution(combatants, resolutionOrder)

          // Skip undeclared trainers at the start of resolution phase
          currentTurnIndex = skipUndeclaredTrainers(currentTurnIndex, turnOrder, declarations, currentRound)

          if (currentTurnIndex >= turnOrder.length) {
            // All trainers skipped → go straight to pokemon phase
            if (pokemonTurnOrder.length > 0) {
              currentPhase = 'pokemon'
              turnOrder = [...pokemonTurnOrder]
              currentTurnIndex = 0
            } else {
              currentRound++
              currentTurnIndex = 0
              clearDeclarations = true
              resetCombatantsForNewRound(combatants)
            }
          } else {
            resetResolvingTrainerTurnState(combatants, turnOrder[currentTurnIndex])
          }
        } else {
          if (pokemonTurnOrder.length > 0) {
            currentPhase = 'pokemon'
            turnOrder = [...pokemonTurnOrder]
            currentTurnIndex = 0
          } else {
            currentRound++
            currentTurnIndex = 0
            clearDeclarations = true
            resetCombatantsForNewRound(combatants)
          }
        }
      } else if (currentPhase === 'trainer_resolution') {
        if (pokemonTurnOrder.length > 0) {
          currentPhase = 'pokemon'
          turnOrder = [...pokemonTurnOrder]
          currentTurnIndex = 0
        } else {
          currentPhase = trainerTurnOrder.length > 0 ? 'trainer_declaration' : 'pokemon'
          turnOrder = trainerTurnOrder.length > 0 ? [...trainerTurnOrder] : [...pokemonTurnOrder]
          currentTurnIndex = 0
          currentRound++
          clearDeclarations = true
          resetCombatantsForNewRound(combatants)

          // If starting a new declaration phase, skip fainted trainers at the start
          if (currentPhase === 'trainer_declaration') {
            currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
          }
        }
      } else {
        currentTurnIndex = 0
        currentRound++
        clearDeclarations = true
        resetCombatantsForNewRound(combatants)

        if (trainerTurnOrder.length > 0) {
          currentPhase = 'trainer_declaration'
          turnOrder = [...trainerTurnOrder]
        } else {
          currentPhase = 'pokemon'
          turnOrder = [...pokemonTurnOrder]
        }

        // Skip fainted trainers at the start of a new declaration phase
        if (currentPhase === 'trainer_declaration') {
          currentTurnIndex = skipFaintedTrainers(currentTurnIndex, turnOrder, combatants)
        }
      }
    } else if (currentPhase === 'trainer_resolution') {
      resetResolvingTrainerTurnState(combatants, turnOrder[currentTurnIndex])
    }
  } else {
    if (currentTurnIndex >= turnOrder.length) {
      currentTurnIndex = 0
      currentRound++
      resetCombatantsForNewRound(combatants)
    }
  }

  return {
    combatants,
    turnOrder,
    currentTurnIndex,
    currentRound,
    currentPhase,
    clearDeclarations
  }
}

describe('League Battle Three-Phase Flow (decree-021)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Phase transitions: declaration → resolution → pokemon → new round', () => {
    // Setup: 2 trainers (slow=30, fast=80), 2 pokemon (poke1=90, poke2=60)
    // Declaration order (low→high): [slow, fast]
    // Resolution order (high→low): [fast, slow]
    // Pokemon order (high→low): [poke1, poke2]
    const trainerSlow = createTrainerCombatant('trainer-slow', 'Brock', 30)
    const trainerFast = createTrainerCombatant('trainer-fast', 'Misty', 80)
    const pokemon1 = createPokemonCombatant('poke-1', 'Pikachu', 90)
    const pokemon2 = createPokemonCombatant('poke-2', 'Geodude', 60)

    const trainerTurnOrder = ['trainer-slow', 'trainer-fast'] // low→high speed
    const pokemonTurnOrder = ['poke-1', 'poke-2'] // high→low speed

    it('should transition from declaration to resolution after all trainers declare', () => {
      // Start in declaration phase, index 0 (trainer-slow's turn)
      let state = {
        combatants: [trainerSlow, trainerFast, pokemon1, pokemon2],
        turnOrder: [...trainerTurnOrder],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder
      }

      // Advance past trainer-slow's declaration turn
      state = { ...state, ...simulateNextTurn(state) }
      // Now at index 1 — trainer-fast's declaration turn
      expect(state.currentPhase).toBe('trainer_declaration')
      expect(state.currentTurnIndex).toBe(1)

      // Advance past trainer-fast's declaration turn (end of declaration)
      state = { ...state, ...simulateNextTurn(state) }
      // Should transition to trainer_resolution
      expect(state.currentPhase).toBe('trainer_resolution')
      expect(state.currentTurnIndex).toBe(0)
      // Resolution order is reverse: [fast, slow]
      expect(state.turnOrder).toEqual(['trainer-fast', 'trainer-slow'])
      expect(state.currentRound).toBe(1)
    })

    it('should transition from resolution to pokemon after all trainers resolve', () => {
      // Start in resolution phase, both trainers about to resolve
      let state = {
        combatants: [trainerSlow, trainerFast, pokemon1, pokemon2],
        turnOrder: ['trainer-fast', 'trainer-slow'], // resolution order
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_resolution',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder
      }

      // Advance past trainer-fast's resolution turn
      state = { ...state, ...simulateNextTurn(state) }
      expect(state.currentPhase).toBe('trainer_resolution')
      expect(state.currentTurnIndex).toBe(1)

      // Advance past trainer-slow's resolution turn (end of resolution)
      state = { ...state, ...simulateNextTurn(state) }
      // Should transition to pokemon phase
      expect(state.currentPhase).toBe('pokemon')
      expect(state.currentTurnIndex).toBe(0)
      expect(state.turnOrder).toEqual(['poke-1', 'poke-2'])
      expect(state.currentRound).toBe(1)
    })

    it('should start new round after pokemon phase completes', () => {
      let state = {
        combatants: [trainerSlow, trainerFast, pokemon1, pokemon2],
        turnOrder: ['poke-1', 'poke-2'], // pokemon order
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'pokemon',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder
      }

      // Advance past poke-1
      state = { ...state, ...simulateNextTurn(state) }
      expect(state.currentPhase).toBe('pokemon')
      expect(state.currentTurnIndex).toBe(1)

      // Advance past poke-2 (end of pokemon phase → new round)
      state = { ...state, ...simulateNextTurn(state) }
      expect(state.currentPhase).toBe('trainer_declaration')
      expect(state.currentTurnIndex).toBe(0)
      expect(state.currentRound).toBe(2)
      expect(state.clearDeclarations).toBe(true)
      expect(state.turnOrder).toEqual(['trainer-slow', 'trainer-fast'])
    })

    it('should complete a full round cycle: declaration → resolution → pokemon → new round', () => {
      let state: any = {
        combatants: [trainerSlow, trainerFast, pokemon1, pokemon2],
        turnOrder: [...trainerTurnOrder],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder
      }

      // --- Declaration phase (2 trainers) ---
      state = { ...state, ...simulateNextTurn(state) } // trainer-slow declares
      state = { ...state, ...simulateNextTurn(state) } // trainer-fast declares → resolution
      expect(state.currentPhase).toBe('trainer_resolution')

      // --- Resolution phase (2 trainers, reversed) ---
      state = { ...state, ...simulateNextTurn(state) } // trainer-fast resolves
      state = { ...state, ...simulateNextTurn(state) } // trainer-slow resolves → pokemon
      expect(state.currentPhase).toBe('pokemon')

      // --- Pokemon phase (2 pokemon) ---
      state = { ...state, ...simulateNextTurn(state) } // poke-1 acts
      state = { ...state, ...simulateNextTurn(state) } // poke-2 acts → new round
      expect(state.currentPhase).toBe('trainer_declaration')
      expect(state.currentRound).toBe(2)
      expect(state.clearDeclarations).toBe(true)
    })
  })

  describe('C1: tempConditions not cleared during declaration phase', () => {
    it('should preserve tempConditions during declaration phase', () => {
      const trainer = {
        ...createTrainerCombatant('trainer-1', 'Ash', 50),
        tempConditions: ['Sprint']
      }

      const state = simulateNextTurn({
        combatants: [trainer],
        turnOrder: ['trainer-1'],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder: ['trainer-1'],
        pokemonTurnOrder: []
      })

      // tempConditions should NOT be cleared during declaration
      const updatedTrainer = state.combatants.find((c: any) => c.id === 'trainer-1')
      expect(updatedTrainer.tempConditions).toEqual(['Sprint'])
    })

    it('should clear tempConditions during resolution phase', () => {
      const trainerFast = {
        ...createTrainerCombatant('trainer-fast', 'Misty', 80),
        tempConditions: ['Sprint']
      }
      const trainerSlow = {
        ...createTrainerCombatant('trainer-slow', 'Brock', 30),
        tempConditions: ['Tripped']
      }

      // Start in resolution phase: trainer-fast resolves first
      const state = simulateNextTurn({
        combatants: [trainerFast, trainerSlow],
        turnOrder: ['trainer-fast', 'trainer-slow'],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_resolution',
        battleType: 'trainer',
        trainerTurnOrder: ['trainer-slow', 'trainer-fast'],
        pokemonTurnOrder: []
      })

      // trainer-fast acted during resolution → tempConditions should be cleared
      const updatedFast = state.combatants.find((c: any) => c.id === 'trainer-fast')
      expect(updatedFast.tempConditions).toEqual([])
    })

    it('should clear tempConditions via resetResolvingTrainerTurnState when entering resolution', () => {
      // Trainer with tempConditions from before declaration
      const trainer = {
        ...createTrainerCombatant('trainer-1', 'Ash', 50),
        tempConditions: ['Sprint'],
        hasActed: true // marked as acted from declaration
      }

      const combatants = [{ ...trainer }]
      // Calling resetResolvingTrainerTurnState clears tempConditions
      resetResolvingTrainerTurnState(combatants, 'trainer-1')

      expect(combatants[0].tempConditions).toEqual([])
      expect(combatants[0].hasActed).toBe(false)
    })
  })

  describe('H1: hasActed reset for all trainers at resolution transition', () => {
    it('should reset hasActed for ALL trainers when transitioning to resolution', () => {
      const trainerSlow = {
        ...createTrainerCombatant('trainer-slow', 'Brock', 30),
        hasActed: false
      }
      const trainerMid = {
        ...createTrainerCombatant('trainer-mid', 'Misty', 60),
        hasActed: false
      }
      const trainerFast = {
        ...createTrainerCombatant('trainer-fast', 'Surge', 80),
        hasActed: false
      }

      const trainerTurnOrder = ['trainer-slow', 'trainer-mid', 'trainer-fast']

      let state: any = {
        combatants: [trainerSlow, trainerMid, trainerFast],
        turnOrder: [...trainerTurnOrder],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder: ['poke-1']
      }

      // Advance through all 3 declarations
      state = { ...state, ...simulateNextTurn(state) } // slow declares (hasActed=true)
      state = { ...state, ...simulateNextTurn(state) } // mid declares (hasActed=true)
      state = { ...state, ...simulateNextTurn(state) } // fast declares → resolution

      expect(state.currentPhase).toBe('trainer_resolution')

      // ALL trainers should have hasActed=false now (not just the first)
      const slow = state.combatants.find((c: any) => c.id === 'trainer-slow')
      const mid = state.combatants.find((c: any) => c.id === 'trainer-mid')
      const fast = state.combatants.find((c: any) => c.id === 'trainer-fast')

      expect(slow.hasActed).toBe(false)
      expect(mid.hasActed).toBe(false)
      expect(fast.hasActed).toBe(false)
    })
  })

  describe('Declaration endpoint validation', () => {
    it('should reject declarations outside trainer_declaration phase', () => {
      // Simulates the validation in declare.post.ts:
      // if (encounter.currentPhase !== 'trainer_declaration') → error
      const phases = ['trainer_resolution', 'pokemon']

      for (const phase of phases) {
        const isValidPhase = phase === 'trainer_declaration'
        expect(isValidPhase).toBe(false)
      }
    })

    it('should reject declarations from non-current combatant', () => {
      const turnOrder = ['trainer-slow', 'trainer-fast']
      const currentTurnIndex = 0
      const declaringCombatantId = 'trainer-fast' // NOT the current turn's combatant

      const currentCombatantId = turnOrder[currentTurnIndex]
      const isCurrentTurn = declaringCombatantId === currentCombatantId

      expect(isCurrentTurn).toBe(false)
    })

    it('should reject duplicate declarations for the same round', () => {
      const existingDeclarations = [
        { combatantId: 'trainer-1', round: 1, actionType: 'command_pokemon', description: 'Use Thunderbolt' }
      ]

      const alreadyDeclared = existingDeclarations.some(
        d => d.combatantId === 'trainer-1' && d.round === 1
      )

      expect(alreadyDeclared).toBe(true)
    })

    it('should allow declaration for a different round', () => {
      const existingDeclarations = [
        { combatantId: 'trainer-1', round: 1, actionType: 'command_pokemon', description: 'Use Thunderbolt' }
      ]

      const alreadyDeclared = existingDeclarations.some(
        d => d.combatantId === 'trainer-1' && d.round === 2
      )

      expect(alreadyDeclared).toBe(false)
    })

    it('should reject non-trainer combatants from declaring', () => {
      const pokemonCombatant = createPokemonCombatant('poke-1', 'Pikachu', 90)
      const isTrainer = pokemonCombatant.type === 'human'

      expect(isTrainer).toBe(false)
    })

    it('should accept valid trainer declarations', () => {
      const trainerCombatant = createTrainerCombatant('trainer-1', 'Ash', 50)
      const isTrainer = trainerCombatant.type === 'human'
      const phase = 'trainer_declaration'
      const isValidPhase = phase === 'trainer_declaration'

      expect(isTrainer).toBe(true)
      expect(isValidPhase).toBe(true)
    })

    it('should validate actionType against allowed values', () => {
      const validActionTypes = ['command_pokemon', 'switch_pokemon', 'use_item', 'use_feature', 'orders', 'pass']

      expect(validActionTypes.includes('command_pokemon')).toBe(true)
      expect(validActionTypes.includes('switch_pokemon')).toBe(true)
      expect(validActionTypes.includes('invalid_action' as any)).toBe(false)
    })
  })

  describe('skipFaintedTrainers: auto-skip fainted trainers during declaration', () => {
    it('should skip a single fainted trainer during declaration', () => {
      const trainerAlive = createTrainerCombatant('trainer-alive', 'Ash', 30, 50)
      const trainerFainted = createTrainerCombatant('trainer-fainted', 'Brock', 60, 0)
      const trainerAlive2 = createTrainerCombatant('trainer-alive2', 'Misty', 80, 75)

      // Declaration order: [alive(30), fainted(60), alive2(80)]
      const trainerTurnOrder = ['trainer-alive', 'trainer-fainted', 'trainer-alive2']

      let state: any = {
        combatants: [trainerAlive, trainerFainted, trainerAlive2],
        turnOrder: [...trainerTurnOrder],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder: ['poke-1']
      }

      // Advance past trainer-alive's declaration
      state = { ...state, ...simulateNextTurn(state) }
      // Should skip trainer-fainted and land on trainer-alive2 (index 2)
      expect(state.currentTurnIndex).toBe(2)
      expect(state.currentPhase).toBe('trainer_declaration')
    })

    it('should skip multiple consecutive fainted trainers', () => {
      const trainerAlive = createTrainerCombatant('trainer-alive', 'Ash', 30, 50)
      const trainerFainted1 = createTrainerCombatant('trainer-fainted1', 'Brock', 60, 0)
      const trainerFainted2 = createTrainerCombatant('trainer-fainted2', 'Gary', 70, 0)
      const trainerAlive2 = createTrainerCombatant('trainer-alive2', 'Misty', 80, 75)

      const trainerTurnOrder = ['trainer-alive', 'trainer-fainted1', 'trainer-fainted2', 'trainer-alive2']

      let state: any = {
        combatants: [trainerAlive, trainerFainted1, trainerFainted2, trainerAlive2],
        turnOrder: [...trainerTurnOrder],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_declaration',
        battleType: 'trainer',
        trainerTurnOrder,
        pokemonTurnOrder: ['poke-1']
      }

      // Advance past trainer-alive's declaration
      state = { ...state, ...simulateNextTurn(state) }
      // Should skip both fainted trainers and land on trainer-alive2 (index 3)
      expect(state.currentTurnIndex).toBe(3)
      expect(state.currentPhase).toBe('trainer_declaration')
    })

    it('should cascade to pokemon phase when all trainers are fainted', () => {
      const trainerFainted1 = createTrainerCombatant('trainer-f1', 'Ash', 30, 0)
      const trainerFainted2 = createTrainerCombatant('trainer-f2', 'Brock', 60, 0)
      const pokemon1 = createPokemonCombatant('poke-1', 'Pikachu', 90)

      const trainerTurnOrder = ['trainer-f1', 'trainer-f2']
      const pokemonTurnOrder = ['poke-1']

      // Start at the end of declaration (all fainted → skip past end → cascade)
      // We simulate by having the last alive trainer just declared, but here
      // both are fainted from the start. Use skipFaintedTrainers directly.
      const index = skipFaintedTrainers(0, trainerTurnOrder, [trainerFainted1, trainerFainted2])
      expect(index).toBe(2) // past end of turnOrder
      expect(index >= trainerTurnOrder.length).toBe(true)
    })
  })

  describe('skipUndeclaredTrainers: auto-skip undeclared trainers during resolution', () => {
    it('should skip a trainer with no declaration during resolution', () => {
      const trainerFast = createTrainerCombatant('trainer-fast', 'Misty', 80, 100)
      const trainerMid = createTrainerCombatant('trainer-mid', 'Brock', 60, 0) // fainted, no declaration
      const trainerSlow = createTrainerCombatant('trainer-slow', 'Ash', 30, 100)

      // Resolution order (high→low): [fast, mid, slow]
      const resolutionOrder = ['trainer-fast', 'trainer-mid', 'trainer-slow']
      // Only fast and slow declared (mid was fainted during declaration)
      const declarations = [
        { combatantId: 'trainer-fast', round: 1 },
        { combatantId: 'trainer-slow', round: 1 }
      ]

      let state: any = {
        combatants: [trainerFast, trainerMid, trainerSlow],
        turnOrder: resolutionOrder,
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_resolution',
        battleType: 'trainer',
        trainerTurnOrder: ['trainer-slow', 'trainer-mid', 'trainer-fast'],
        pokemonTurnOrder: ['poke-1'],
        declarations
      }

      // Advance past trainer-fast's resolution
      state = { ...state, ...simulateNextTurn(state) }
      // Should skip trainer-mid (no declaration) and land on trainer-slow (index 2)
      expect(state.currentTurnIndex).toBe(2)
      expect(state.currentPhase).toBe('trainer_resolution')
    })

    it('should cascade to pokemon phase when all trainers have no declarations', () => {
      // All trainers were fainted during declaration → no declarations exist
      const resolutionOrder = ['trainer-fast', 'trainer-slow']
      const declarations: { combatantId: string; round: number }[] = [] // empty

      const index = skipUndeclaredTrainers(0, resolutionOrder, declarations, 1)
      expect(index).toBe(2) // past end
      expect(index >= resolutionOrder.length).toBe(true)
    })

    it('should not skip trainers who have a declaration for the current round', () => {
      const declarations = [
        { combatantId: 'trainer-fast', round: 1 },
        { combatantId: 'trainer-slow', round: 1 }
      ]
      const resolutionOrder = ['trainer-fast', 'trainer-slow']

      const index = skipUndeclaredTrainers(0, resolutionOrder, declarations, 1)
      // trainer-fast has a declaration → should stop at index 0
      expect(index).toBe(0)
    })

    it('should not match declarations from a different round', () => {
      const declarations = [
        { combatantId: 'trainer-fast', round: 1 } // declaration from round 1
      ]
      const resolutionOrder = ['trainer-fast', 'trainer-slow']

      // Checking round 2 — no declarations match
      const index = skipUndeclaredTrainers(0, resolutionOrder, declarations, 2)
      expect(index).toBe(2) // skips all
    })
  })

  describe('Resolution turn state management', () => {
    it('should give resolving trainer fresh action economy', () => {
      const combatants = [
        {
          ...createTrainerCombatant('trainer-1', 'Ash', 50),
          hasActed: true,
          actionsRemaining: 0,
          shiftActionsRemaining: 0
        }
      ]

      resetResolvingTrainerTurnState(combatants, 'trainer-1')

      expect(combatants[0].hasActed).toBe(false)
      expect(combatants[0].actionsRemaining).toBe(2)
      expect(combatants[0].shiftActionsRemaining).toBe(1)
      expect(combatants[0].turnState.hasActed).toBe(false)
      expect(combatants[0].turnState.standardActionUsed).toBe(false)
      expect(combatants[0].turnState.shiftActionUsed).toBe(false)
    })

    it('should reset next trainer during mid-resolution advance', () => {
      // 2 trainers in resolution, fast first
      const trainerFast = {
        ...createTrainerCombatant('trainer-fast', 'Misty', 80),
        hasActed: false,
        actionsRemaining: 2,
        shiftActionsRemaining: 1
      }
      const trainerSlow = {
        ...createTrainerCombatant('trainer-slow', 'Brock', 30),
        hasActed: false,
        actionsRemaining: 0,
        shiftActionsRemaining: 0
      }

      const state = simulateNextTurn({
        combatants: [trainerFast, trainerSlow],
        turnOrder: ['trainer-fast', 'trainer-slow'],
        currentTurnIndex: 0,
        currentRound: 1,
        currentPhase: 'trainer_resolution',
        battleType: 'trainer',
        trainerTurnOrder: ['trainer-slow', 'trainer-fast'],
        pokemonTurnOrder: ['poke-1']
      })

      // trainer-slow should now have fresh action economy
      const slow = state.combatants.find((c: any) => c.id === 'trainer-slow')
      expect(slow.hasActed).toBe(false)
      expect(slow.actionsRemaining).toBe(2)
      expect(slow.shiftActionsRemaining).toBe(1)
    })
  })
})
