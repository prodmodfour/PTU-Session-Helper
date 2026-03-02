import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma to avoid DB initialization
vi.mock('~/server/utils/prisma', () => ({
  prisma: {}
}))

// Mock uuid for deterministic IDs
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234'
}))

import {
  resolveConditionsToCure,
  validateItemApplication,
  applyHealingItem,
  getEntityDisplayName
} from '~/server/services/healing-item.service'
import { HEALING_ITEM_CATALOG, type HealingItemDef } from '~/constants/healingItems'
import type { Combatant, Pokemon, StageModifiers, StatusCondition } from '~/types'

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
    currentHp: 30,
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
    ...overrides
  }
}

function makeCombatant(entityOverrides: Partial<Pokemon> = {}, combatantOverrides: Partial<Combatant> = {}): Combatant {
  const entity = makePokemonEntity(entityOverrides)
  return {
    id: 'comb-001',
    type: 'pokemon',
    entityId: entity.id,
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
    stageSources: [],
    badlyPoisonedRound: 0,
    injuries: { count: 0, sources: [] },
    physicalEvasion: 6,
    specialEvasion: 8,
    speedEvasion: 18,
    tokenSize: 1,
    entity,
    ...combatantOverrides
  }
}

// ============================================
// resolveConditionsToCure
// ============================================

describe('resolveConditionsToCure', () => {
  it('returns empty array when target has no conditions', () => {
    const item = HEALING_ITEM_CATALOG['Antidote']
    expect(resolveConditionsToCure(item, [])).toEqual([])
  })

  it('returns empty array when target conditions is null-like', () => {
    const item = HEALING_ITEM_CATALOG['Antidote']
    expect(resolveConditionsToCure(item, null as any)).toEqual([])
  })

  describe('curesConditions (specific conditions)', () => {
    it('Antidote cures Poisoned', () => {
      const item = HEALING_ITEM_CATALOG['Antidote']
      const result = resolveConditionsToCure(item, ['Poisoned'])
      expect(result).toEqual(['Poisoned'])
    })

    it('Antidote cures Badly Poisoned', () => {
      const item = HEALING_ITEM_CATALOG['Antidote']
      const result = resolveConditionsToCure(item, ['Badly Poisoned'])
      expect(result).toEqual(['Badly Poisoned'])
    })

    it('Antidote cures both Poisoned and Badly Poisoned if both present', () => {
      const item = HEALING_ITEM_CATALOG['Antidote']
      const result = resolveConditionsToCure(item, ['Poisoned', 'Badly Poisoned'])
      expect(result).toEqual(['Poisoned', 'Badly Poisoned'])
    })

    it('Antidote does not cure unrelated conditions', () => {
      const item = HEALING_ITEM_CATALOG['Antidote']
      const result = resolveConditionsToCure(item, ['Burned', 'Paralyzed'])
      expect(result).toEqual([])
    })

    it('Paralyze Heal cures Paralyzed', () => {
      const item = HEALING_ITEM_CATALOG['Paralyze Heal']
      const result = resolveConditionsToCure(item, ['Paralyzed', 'Burned'])
      expect(result).toEqual(['Paralyzed'])
    })

    it('Burn Heal cures Burned', () => {
      const item = HEALING_ITEM_CATALOG['Burn Heal']
      const result = resolveConditionsToCure(item, ['Burned'])
      expect(result).toEqual(['Burned'])
    })

    it('Ice Heal cures Frozen', () => {
      const item = HEALING_ITEM_CATALOG['Ice Heal']
      const result = resolveConditionsToCure(item, ['Frozen', 'Confused'])
      expect(result).toEqual(['Frozen'])
    })

    it('Awakening cures Asleep and Bad Sleep', () => {
      const item = HEALING_ITEM_CATALOG['Awakening']
      const result = resolveConditionsToCure(item, ['Asleep', 'Bad Sleep', 'Poisoned'])
      expect(result).toEqual(['Asleep', 'Bad Sleep'])
    })

    it('Awakening does not cure if target is not asleep', () => {
      const item = HEALING_ITEM_CATALOG['Awakening']
      const result = resolveConditionsToCure(item, ['Burned', 'Poisoned'])
      expect(result).toEqual([])
    })
  })

  describe('curesAllPersistent', () => {
    it('Full Heal cures all persistent conditions', () => {
      const item = HEALING_ITEM_CATALOG['Full Heal']
      const result = resolveConditionsToCure(item, [
        'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned'
      ])
      expect(result).toEqual(['Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned'])
    })

    it('Full Heal does not cure volatile conditions', () => {
      const item = HEALING_ITEM_CATALOG['Full Heal']
      const result = resolveConditionsToCure(item, ['Confused', 'Asleep', 'Infatuated'])
      expect(result).toEqual([])
    })

    it('Full Heal cures persistent but not volatile in mixed set', () => {
      const item = HEALING_ITEM_CATALOG['Full Heal']
      const result = resolveConditionsToCure(item, ['Burned', 'Confused', 'Paralyzed', 'Asleep'])
      expect(result).toEqual(['Burned', 'Paralyzed'])
    })

    it('Heal Powder cures all persistent conditions (same as Full Heal)', () => {
      const item = HEALING_ITEM_CATALOG['Heal Powder']
      const result = resolveConditionsToCure(item, ['Burned', 'Poisoned'])
      expect(result).toEqual(['Burned', 'Poisoned'])
    })
  })

  describe('curesAllStatus', () => {
    it('Full Restore cures all persistent and volatile conditions', () => {
      const item = HEALING_ITEM_CATALOG['Full Restore']
      const result = resolveConditionsToCure(item, [
        'Burned', 'Confused', 'Asleep', 'Paralyzed'
      ])
      expect(result).toEqual(['Burned', 'Confused', 'Asleep', 'Paralyzed'])
    })

    it('Full Restore does not cure Fainted', () => {
      const item = HEALING_ITEM_CATALOG['Full Restore']
      const result = resolveConditionsToCure(item, ['Fainted', 'Burned'])
      expect(result).toEqual(['Burned'])
    })

    it('Full Restore does not cure Dead', () => {
      const item = HEALING_ITEM_CATALOG['Full Restore']
      const result = resolveConditionsToCure(item, ['Dead', 'Poisoned'])
      expect(result).toEqual(['Poisoned'])
    })

    it('Full Restore with only Fainted returns empty', () => {
      const item = HEALING_ITEM_CATALOG['Full Restore']
      const result = resolveConditionsToCure(item, ['Fainted'])
      expect(result).toEqual([])
    })
  })
})

// ============================================
// validateItemApplication
// ============================================

describe('validateItemApplication', () => {
  it('returns error for unknown item', () => {
    const target = makeCombatant()
    expect(validateItemApplication('Fake Item', target)).toBe('Unknown item: Fake Item')
  })

  describe('restorative items', () => {
    it('allows Potion on damaged non-fainted target', () => {
      const target = makeCombatant({ currentHp: 20, maxHp: 45 })
      expect(validateItemApplication('Potion', target)).toBeUndefined()
    })

    it('rejects Potion on full HP target', () => {
      const target = makeCombatant({ currentHp: 45, maxHp: 45 })
      const result = validateItemApplication('Potion', target)
      expect(result).toContain('already at full HP')
    })

    it('rejects Potion on fainted target', () => {
      const target = makeCombatant({
        currentHp: 0,
        statusConditions: ['Fainted']
      })
      const result = validateItemApplication('Potion', target)
      expect(result).toContain('fainted target')
    })

    it('respects injury-reduced effective max HP', () => {
      // maxHp: 45, 2 injuries => effectiveMax = 45 - 2*5 = 35
      const target = makeCombatant({ currentHp: 35, maxHp: 45, injuries: 2 })
      const result = validateItemApplication('Potion', target)
      expect(result).toContain('already at full HP')
    })
  })

  describe('cure items', () => {
    it('allows Antidote on poisoned target', () => {
      const target = makeCombatant({ statusConditions: ['Poisoned'] })
      expect(validateItemApplication('Antidote', target)).toBeUndefined()
    })

    it('rejects Antidote on target without poison', () => {
      const target = makeCombatant({ statusConditions: ['Burned'] })
      const result = validateItemApplication('Antidote', target)
      expect(result).toContain('not affected by')
    })

    it('rejects Antidote on target with no conditions', () => {
      const target = makeCombatant({ statusConditions: [] })
      const result = validateItemApplication('Antidote', target)
      expect(result).toContain('not affected by')
    })

    it('rejects cure item on fainted target', () => {
      const target = makeCombatant({
        currentHp: 0,
        statusConditions: ['Fainted', 'Poisoned']
      })
      const result = validateItemApplication('Antidote', target)
      expect(result).toContain('fainted target')
    })

    it('rejects Full Heal when no persistent conditions', () => {
      const target = makeCombatant({ statusConditions: ['Confused'] })
      const result = validateItemApplication('Full Heal', target)
      expect(result).toContain('no persistent status conditions')
    })

    it('allows Full Heal when persistent conditions present', () => {
      const target = makeCombatant({ statusConditions: ['Burned', 'Confused'] })
      expect(validateItemApplication('Full Heal', target)).toBeUndefined()
    })
  })

  describe('revive items', () => {
    it('allows Revive on fainted target', () => {
      const target = makeCombatant({
        currentHp: 0,
        statusConditions: ['Fainted']
      })
      expect(validateItemApplication('Revive', target)).toBeUndefined()
    })

    it('rejects Revive on non-fainted target', () => {
      const target = makeCombatant({ currentHp: 30 })
      const result = validateItemApplication('Revive', target)
      expect(result).toContain('only be used on fainted targets')
    })

    it('allows Revival Herb on fainted target', () => {
      const target = makeCombatant({
        currentHp: 0,
        statusConditions: ['Fainted']
      })
      expect(validateItemApplication('Revival Herb', target)).toBeUndefined()
    })
  })

  describe('combined items', () => {
    it('allows Full Restore on damaged target', () => {
      const target = makeCombatant({ currentHp: 20, maxHp: 45 })
      expect(validateItemApplication('Full Restore', target)).toBeUndefined()
    })

    it('allows Full Restore on full HP target with curable conditions', () => {
      const target = makeCombatant({
        currentHp: 45,
        maxHp: 45,
        statusConditions: ['Burned']
      })
      expect(validateItemApplication('Full Restore', target)).toBeUndefined()
    })

    it('rejects Full Restore on full HP target with no conditions', () => {
      const target = makeCombatant({ currentHp: 45, maxHp: 45 })
      const result = validateItemApplication('Full Restore', target)
      expect(result).toContain('no effect')
    })

    it('rejects Full Restore on fainted target', () => {
      const target = makeCombatant({
        currentHp: 0,
        statusConditions: ['Fainted']
      })
      const result = validateItemApplication('Full Restore', target)
      expect(result).toContain('fainted target')
    })
  })
})

// ============================================
// applyHealingItem — Restorative items
// ============================================

describe('applyHealingItem — restoratives', () => {
  it('Potion heals 20 HP', () => {
    const target = makeCombatant({ currentHp: 10, maxHp: 45 })
    const result = applyHealingItem('Potion', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBe(20)
    expect(target.entity.currentHp).toBe(30)
  })

  it('Potion heals capped at effective max HP', () => {
    const target = makeCombatant({ currentHp: 35, maxHp: 45 })
    const result = applyHealingItem('Potion', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBe(10)
    expect(target.entity.currentHp).toBe(45)
  })

  it('Energy Powder heals HP and sets repulsive flag', () => {
    const target = makeCombatant({ currentHp: 10, maxHp: 45 })
    const result = applyHealingItem('Energy Powder', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBe(25)
    expect(result.effects.repulsive).toBe(true)
  })
})

// ============================================
// applyHealingItem — Cure items
// ============================================

describe('applyHealingItem — cure items', () => {
  it('Antidote cures Poisoned', () => {
    const target = makeCombatant({ statusConditions: ['Poisoned'] })
    const result = applyHealingItem('Antidote', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Poisoned'])
    expect(target.entity.statusConditions).not.toContain('Poisoned')
  })

  it('Antidote cures Badly Poisoned and resets badlyPoisonedRound', () => {
    const target = makeCombatant(
      { statusConditions: ['Badly Poisoned'] },
      { badlyPoisonedRound: 3 }
    )
    const result = applyHealingItem('Antidote', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Badly Poisoned'])
    expect(target.badlyPoisonedRound).toBe(0)
    expect(target.entity.statusConditions).not.toContain('Badly Poisoned')
  })

  it('Burn Heal cures Burned and reverses CS effect (decree-005)', () => {
    const target = makeCombatant({
      statusConditions: ['Burned'],
      stageModifiers: { ...makeDefaultStageModifiers(), defense: -2 }
    })
    // Set up stage source tracking for Burn CS effect
    target.stageSources = [{ stat: 'defense', value: -2, source: 'Burned' }]

    const result = applyHealingItem('Burn Heal', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Burned'])
    // Defense CS should be reversed from -2 back to 0
    expect(target.entity.stageModifiers!.defense).toBe(0)
    expect(target.stageSources).toEqual([])
  })

  it('Paralyze Heal cures Paralyzed and reverses Speed CS', () => {
    const target = makeCombatant({
      statusConditions: ['Paralyzed'],
      stageModifiers: { ...makeDefaultStageModifiers(), speed: -4 }
    })
    target.stageSources = [{ stat: 'speed', value: -4, source: 'Paralyzed' }]

    const result = applyHealingItem('Paralyze Heal', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Paralyzed'])
    expect(target.entity.stageModifiers!.speed).toBe(0)
  })

  it('Awakening cures Asleep', () => {
    const target = makeCombatant({ statusConditions: ['Asleep'] })
    const result = applyHealingItem('Awakening', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Asleep'])
    expect(target.entity.statusConditions).not.toContain('Asleep')
  })

  it('Awakening cures both Asleep and Bad Sleep', () => {
    const target = makeCombatant({ statusConditions: ['Asleep', 'Bad Sleep'] })
    const result = applyHealingItem('Awakening', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Asleep', 'Bad Sleep'])
    expect(target.entity.statusConditions).not.toContain('Asleep')
    expect(target.entity.statusConditions).not.toContain('Bad Sleep')
  })

  it('Full Heal cures all persistent conditions', () => {
    const target = makeCombatant({
      statusConditions: ['Burned', 'Paralyzed', 'Confused'],
      stageModifiers: { ...makeDefaultStageModifiers(), defense: -2, speed: -4 }
    })
    target.stageSources = [
      { stat: 'defense', value: -2, source: 'Burned' },
      { stat: 'speed', value: -4, source: 'Paralyzed' }
    ]

    const result = applyHealingItem('Full Heal', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Burned', 'Paralyzed'])
    // Confused (volatile) should remain
    expect(target.entity.statusConditions).toContain('Confused')
    expect(target.entity.statusConditions).not.toContain('Burned')
    expect(target.entity.statusConditions).not.toContain('Paralyzed')
    // CS should be reversed
    expect(target.entity.stageModifiers!.defense).toBe(0)
    expect(target.entity.stageModifiers!.speed).toBe(0)
  })

  it('Heal Powder cures persistent conditions and sets repulsive flag', () => {
    const target = makeCombatant({ statusConditions: ['Poisoned'] })
    const result = applyHealingItem('Heal Powder', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Poisoned'])
    expect(result.effects.repulsive).toBe(true)
  })

  it('cure item does not heal HP', () => {
    const target = makeCombatant({
      currentHp: 20,
      maxHp: 45,
      statusConditions: ['Burned']
    })
    const result = applyHealingItem('Burn Heal', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBeUndefined()
    expect(target.entity.currentHp).toBe(20) // HP unchanged
  })
})

// ============================================
// applyHealingItem — Revive items
// ============================================

describe('applyHealingItem — revive items', () => {
  it('Revive restores to 20 HP', () => {
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 45,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revive', target)

    expect(result.success).toBe(true)
    expect(result.effects.revived).toBe(true)
    expect(result.effects.hpHealed).toBe(20)
    expect(target.entity.currentHp).toBe(20)
    expect(target.entity.statusConditions).not.toContain('Fainted')
  })

  it('Revive caps HP at effective max if below 20', () => {
    // maxHp: 30, 3 injuries => effectiveMax = 30 - 15 = 15
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 30,
      injuries: 3,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revive', target)

    expect(result.success).toBe(true)
    expect(result.effects.revived).toBe(true)
    expect(result.effects.hpHealed).toBe(15) // capped at effective max
    expect(target.entity.currentHp).toBe(15)
  })

  it('Revival Herb restores to 50% of effective max HP', () => {
    // maxHp: 100, 0 injuries => effectiveMax = 100, 50% = 50
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 100,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revival Herb', target)

    expect(result.success).toBe(true)
    expect(result.effects.revived).toBe(true)
    expect(result.effects.hpHealed).toBe(50)
    expect(target.entity.currentHp).toBe(50)
    expect(result.effects.repulsive).toBe(true)
  })

  it('Revival Herb rounds down 50% HP', () => {
    // maxHp: 45, 0 injuries => effectiveMax = 45, 50% = 22.5 => 22
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 45,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revival Herb', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBe(22) // floor(45 * 0.5) = 22
    expect(target.entity.currentHp).toBe(22)
  })

  it('Revival Herb respects injury-reduced effective max', () => {
    // maxHp: 100, 4 injuries => effectiveMax = 100 - 20 = 80, 50% = 40
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 100,
      injuries: 4,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revival Herb', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBe(40)
    expect(target.entity.currentHp).toBe(40)
  })

  it('Revival Herb always restores at least 1 HP', () => {
    // Very heavily injured with low maxHp
    // maxHp: 10, 1 injury => effectiveMax = 5, 50% = 2 (floor)
    const target = makeCombatant({
      currentHp: 0,
      maxHp: 10,
      injuries: 1,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Revival Herb', target)

    expect(result.success).toBe(true)
    expect(result.effects.hpHealed).toBeGreaterThanOrEqual(1)
    expect(target.entity.currentHp).toBeGreaterThanOrEqual(1)
  })

  it('Revive rejects non-fainted target', () => {
    const target = makeCombatant({ currentHp: 30 })
    const result = applyHealingItem('Revive', target)

    expect(result.success).toBe(false)
    expect(result.error).toContain('only be used on fainted targets')
  })
})

// ============================================
// applyHealingItem — Combined items
// ============================================

describe('applyHealingItem — combined items (Full Restore)', () => {
  it('cures status conditions AND heals HP', () => {
    const target = makeCombatant({
      currentHp: 10,
      maxHp: 100,
      statusConditions: ['Burned', 'Confused'],
      stageModifiers: { ...makeDefaultStageModifiers(), defense: -2 }
    })
    target.stageSources = [{ stat: 'defense', value: -2, source: 'Burned' }]

    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(true)
    // Cures Burned and Confused (curesAllStatus)
    expect(result.effects.conditionsCured).toEqual(['Burned', 'Confused'])
    // Heals 80 HP (capped at effective max)
    expect(result.effects.hpHealed).toBe(80)
    expect(target.entity.currentHp).toBe(90)
    // CS reversed
    expect(target.entity.stageModifiers!.defense).toBe(0)
  })

  it('cures conditions first, then heals HP (order matters for CS)', () => {
    const target = makeCombatant({
      currentHp: 20,
      maxHp: 45,
      statusConditions: ['Paralyzed'],
      stageModifiers: { ...makeDefaultStageModifiers(), speed: -4 }
    })
    target.stageSources = [{ stat: 'speed', value: -4, source: 'Paralyzed' }]

    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(true)
    // Paralyzed cured
    expect(result.effects.conditionsCured).toEqual(['Paralyzed'])
    // HP healed
    expect(result.effects.hpHealed).toBe(25) // 20 + 25 = 45 (capped at max)
    expect(target.entity.currentHp).toBe(45)
    // Speed CS reversed
    expect(target.entity.stageModifiers!.speed).toBe(0)
  })

  it('Full Restore does NOT revive from Fainted', () => {
    const target = makeCombatant({
      currentHp: 0,
      statusConditions: ['Fainted']
    })
    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(false)
    expect(result.error).toContain('fainted target')
  })

  it('Full Restore cures all persistent AND volatile conditions', () => {
    const target = makeCombatant({
      currentHp: 40,
      maxHp: 45,
      statusConditions: ['Burned', 'Frozen', 'Asleep', 'Confused']
    })

    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Burned', 'Frozen', 'Asleep', 'Confused'])
    expect(target.entity.statusConditions).toEqual([])
  })

  it('Full Restore rejects full HP with no conditions', () => {
    const target = makeCombatant({ currentHp: 45, maxHp: 45 })
    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(false)
    expect(result.error).toContain('no effect')
  })

  it('Full Restore works on full HP with curable conditions', () => {
    const target = makeCombatant({
      currentHp: 45,
      maxHp: 45,
      statusConditions: ['Poisoned']
    })
    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(true)
    expect(result.effects.conditionsCured).toEqual(['Poisoned'])
    // No HP healed since already at max
    expect(result.effects.hpHealed).toBe(0)
  })

  it('Full Restore resets badlyPoisonedRound when curing Badly Poisoned', () => {
    const target = makeCombatant(
      { statusConditions: ['Badly Poisoned'], currentHp: 30, maxHp: 45 },
      { badlyPoisonedRound: 5 }
    )

    const result = applyHealingItem('Full Restore', target)

    expect(result.success).toBe(true)
    expect(target.badlyPoisonedRound).toBe(0)
  })
})

// ============================================
// getEntityDisplayName
// ============================================

describe('getEntityDisplayName', () => {
  it('returns species name for Pokemon without nickname', () => {
    const target = makeCombatant({ species: 'Charizard', nickname: null })
    expect(getEntityDisplayName(target)).toBe('Charizard')
  })

  it('returns nickname for Pokemon with nickname', () => {
    const target = makeCombatant({ species: 'Charizard', nickname: 'Zippy' })
    expect(getEntityDisplayName(target)).toBe('Zippy')
  })
})
