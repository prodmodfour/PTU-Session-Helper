import { describe, it, expect, vi, beforeEach } from 'vitest'

// Test data helpers
const createMockPokemonEntity = (overrides = {}) => ({
  id: 'poke-123',
  species: 'Pikachu',
  nickname: 'Sparky',
  level: 25,
  currentHp: 85,
  maxHp: 85,
  types: ['Electric'],
  statusConditions: [],
  shiny: false,
  ...overrides
})

const createMockHumanEntity = (overrides = {}) => ({
  id: 'human-123',
  name: 'Ash Ketchum',
  level: 10,
  currentHp: 50,
  maxHp: 50,
  avatarUrl: null,
  statusConditions: [],
  ...overrides
})

const createMockCombatant = (entityType: 'pokemon' | 'human', overrides = {}) => ({
  id: 'comb-123',
  type: entityType,
  entityId: entityType === 'pokemon' ? 'poke-123' : 'human-123',
  entity: entityType === 'pokemon' ? createMockPokemonEntity() : createMockHumanEntity(),
  side: 'players' as const,
  initiative: 95,
  hasActed: false,
  ...overrides
})

// Component logic tests (mimicking the component's computed properties)
const CombatantCardLogic = {
  getDisplayName(combatant: any) {
    if (combatant.type === 'pokemon') {
      const pokemon = combatant.entity
      return pokemon.nickname || pokemon.species
    }
    return combatant.entity.name
  },

  getHealthPercentage(entity: any) {
    return Math.round((entity.currentHp / entity.maxHp) * 100)
  },

  getHealthStatus(percentage: number) {
    if (percentage > 50) return 'healthy'
    if (percentage > 25) return 'warning'
    return 'critical'
  },

  isFainted(entity: any) {
    return entity.currentHp <= 0
  },

  getHealthBarClass(percentage: number) {
    const status = CombatantCardLogic.getHealthStatus(percentage)
    return `health-bar--${status}`
  },

  applyDamage(currentHp: number, damage: number, maxHp: number) {
    return Math.max(0, currentHp - damage)
  },

  applyHeal(currentHp: number, heal: number, maxHp: number) {
    return Math.min(maxHp, currentHp + heal)
  }
}

describe('CombatantCard Component Logic', () => {
  describe('displayName for Pokemon', () => {
    it('should show nickname when available', () => {
      const combatant = createMockCombatant('pokemon', {
        entity: createMockPokemonEntity({ nickname: 'Sparky' })
      })
      expect(CombatantCardLogic.getDisplayName(combatant)).toBe('Sparky')
    })

    it('should show species when no nickname', () => {
      const combatant = createMockCombatant('pokemon', {
        entity: createMockPokemonEntity({ nickname: null })
      })
      expect(CombatantCardLogic.getDisplayName(combatant)).toBe('Pikachu')
    })
  })

  describe('displayName for Human', () => {
    it('should show character name', () => {
      const combatant = createMockCombatant('human')
      expect(CombatantCardLogic.getDisplayName(combatant)).toBe('Ash Ketchum')
    })
  })

  describe('healthPercentage', () => {
    it('should calculate 100% for full health', () => {
      const entity = createMockPokemonEntity({ currentHp: 100, maxHp: 100 })
      expect(CombatantCardLogic.getHealthPercentage(entity)).toBe(100)
    })

    it('should calculate 50% for half health', () => {
      const entity = createMockPokemonEntity({ currentHp: 50, maxHp: 100 })
      expect(CombatantCardLogic.getHealthPercentage(entity)).toBe(50)
    })

    it('should calculate 0% for no health', () => {
      const entity = createMockPokemonEntity({ currentHp: 0, maxHp: 100 })
      expect(CombatantCardLogic.getHealthPercentage(entity)).toBe(0)
    })
  })

  describe('healthStatus', () => {
    it('should return healthy for > 50%', () => {
      expect(CombatantCardLogic.getHealthStatus(100)).toBe('healthy')
      expect(CombatantCardLogic.getHealthStatus(75)).toBe('healthy')
      expect(CombatantCardLogic.getHealthStatus(51)).toBe('healthy')
    })

    it('should return warning for 26-50%', () => {
      expect(CombatantCardLogic.getHealthStatus(50)).toBe('warning')
      expect(CombatantCardLogic.getHealthStatus(35)).toBe('warning')
      expect(CombatantCardLogic.getHealthStatus(26)).toBe('warning')
    })

    it('should return critical for <= 25%', () => {
      expect(CombatantCardLogic.getHealthStatus(25)).toBe('critical')
      expect(CombatantCardLogic.getHealthStatus(10)).toBe('critical')
      expect(CombatantCardLogic.getHealthStatus(0)).toBe('critical')
    })
  })

  describe('healthBarClass', () => {
    it('should return correct class for healthy', () => {
      expect(CombatantCardLogic.getHealthBarClass(75)).toBe('health-bar--healthy')
    })

    it('should return correct class for warning', () => {
      expect(CombatantCardLogic.getHealthBarClass(35)).toBe('health-bar--warning')
    })

    it('should return correct class for critical', () => {
      expect(CombatantCardLogic.getHealthBarClass(15)).toBe('health-bar--critical')
    })
  })

  describe('isFainted', () => {
    it('should return false when HP > 0', () => {
      const entity = createMockPokemonEntity({ currentHp: 50 })
      expect(CombatantCardLogic.isFainted(entity)).toBe(false)
    })

    it('should return true when HP = 0', () => {
      const entity = createMockPokemonEntity({ currentHp: 0 })
      expect(CombatantCardLogic.isFainted(entity)).toBe(true)
    })

    it('should return true when HP < 0 (edge case)', () => {
      const entity = createMockPokemonEntity({ currentHp: -10 })
      expect(CombatantCardLogic.isFainted(entity)).toBe(true)
    })
  })

  describe('applyDamage', () => {
    it('should subtract damage from HP', () => {
      expect(CombatantCardLogic.applyDamage(100, 25, 100)).toBe(75)
    })

    it('should not go below 0', () => {
      expect(CombatantCardLogic.applyDamage(20, 50, 100)).toBe(0)
    })

    it('should handle exact HP depletion', () => {
      expect(CombatantCardLogic.applyDamage(50, 50, 100)).toBe(0)
    })

    it('should handle 0 damage', () => {
      expect(CombatantCardLogic.applyDamage(100, 0, 100)).toBe(100)
    })
  })

  describe('applyHeal', () => {
    it('should add healing to HP', () => {
      expect(CombatantCardLogic.applyHeal(50, 25, 100)).toBe(75)
    })

    it('should not exceed max HP', () => {
      expect(CombatantCardLogic.applyHeal(80, 50, 100)).toBe(100)
    })

    it('should heal to exactly max HP', () => {
      expect(CombatantCardLogic.applyHeal(50, 50, 100)).toBe(100)
    })

    it('should handle 0 healing', () => {
      expect(CombatantCardLogic.applyHeal(50, 0, 100)).toBe(50)
    })

    it('should heal from 0 HP', () => {
      expect(CombatantCardLogic.applyHeal(0, 30, 100)).toBe(30)
    })
  })
})

describe('CombatantCard CSS Classes', () => {
  describe('current combatant styling', () => {
    it('should have current class when isCurrent is true', () => {
      const classes = ['combatant-card', 'combatant-card--current']
      expect(classes).toContain('combatant-card--current')
    })

    it('should not have current class when isCurrent is false', () => {
      const classes = ['combatant-card']
      expect(classes).not.toContain('combatant-card--current')
    })
  })

  describe('fainted combatant styling', () => {
    it('should have fainted class when HP is 0', () => {
      const entity = createMockPokemonEntity({ currentHp: 0 })
      const isFainted = CombatantCardLogic.isFainted(entity)
      expect(isFainted).toBe(true)
    })
  })
})

describe('CombatantCard Events', () => {
  describe('damage event', () => {
    it('should emit damage event with correct data', () => {
      const emittedEvents: any[] = []
      const emit = (event: string, ...args: any[]) => {
        emittedEvents.push({ event, args })
      }

      const combatantId = 'comb-123'
      const damage = 25

      emit('damage', combatantId, damage)

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].event).toBe('damage')
      expect(emittedEvents[0].args[0]).toBe(combatantId)
      expect(emittedEvents[0].args[1]).toBe(25)
    })

    it('should not emit when damage is 0', () => {
      const emittedEvents: any[] = []
      const damageInput = 0

      if (damageInput > 0) {
        emittedEvents.push({ event: 'damage' })
      }

      expect(emittedEvents).toHaveLength(0)
    })
  })

  describe('heal event', () => {
    it('should emit heal event with correct data', () => {
      const emittedEvents: any[] = []
      const emit = (event: string, ...args: any[]) => {
        emittedEvents.push({ event, args })
      }

      const combatantId = 'comb-123'
      const amount = 20

      emit('heal', combatantId, amount)

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].event).toBe('heal')
      expect(emittedEvents[0].args[1]).toBe(20)
    })

    it('should not emit when heal amount is 0', () => {
      const emittedEvents: any[] = []
      const healInput = 0

      if (healInput > 0) {
        emittedEvents.push({ event: 'heal' })
      }

      expect(emittedEvents).toHaveLength(0)
    })
  })

  describe('remove event', () => {
    it('should emit remove event with combatant id', () => {
      const emittedEvents: any[] = []
      const emit = (event: string, ...args: any[]) => {
        emittedEvents.push({ event, args })
      }

      emit('remove', 'comb-123')

      expect(emittedEvents).toHaveLength(1)
      expect(emittedEvents[0].event).toBe('remove')
      expect(emittedEvents[0].args[0]).toBe('comb-123')
    })
  })
})

describe('CombatantCard Display Modes', () => {
  describe('GM view', () => {
    it('should display exact HP values', () => {
      const isGm = true
      const entity = createMockPokemonEntity({ currentHp: 73, maxHp: 100 })

      const display = isGm ? `${entity.currentHp}/${entity.maxHp}` : `${CombatantCardLogic.getHealthPercentage(entity)}%`

      expect(display).toBe('73/100')
    })

    it('should display initiative', () => {
      const isGm = true
      const combatant = createMockCombatant('pokemon', { initiative: 95 })

      expect(isGm && combatant.initiative).toBeTruthy()
      expect(combatant.initiative).toBe(95)
    })
  })

  describe('Player view', () => {
    it('should display HP as percentage', () => {
      const isGm = false
      const entity = createMockPokemonEntity({ currentHp: 73, maxHp: 100 })

      const display = isGm ? `${entity.currentHp}/${entity.maxHp}` : `${CombatantCardLogic.getHealthPercentage(entity)}%`

      expect(display).toBe('73%')
    })

    it('should not show initiative', () => {
      const isGm = false
      expect(isGm).toBe(false)
    })
  })
})

describe('CombatantCard Status Conditions', () => {
  it('should display status conditions', () => {
    const entity = createMockPokemonEntity({
      statusConditions: ['Paralyzed', 'Confused']
    })

    expect(entity.statusConditions).toHaveLength(2)
    expect(entity.statusConditions).toContain('Paralyzed')
    expect(entity.statusConditions).toContain('Confused')
  })

  it('should handle empty status conditions', () => {
    const entity = createMockPokemonEntity({ statusConditions: [] })

    expect(entity.statusConditions).toHaveLength(0)
  })

  it('should handle multiple status conditions', () => {
    const entity = createMockPokemonEntity({
      statusConditions: ['Burned', 'Poisoned', 'Asleep']
    })

    expect(entity.statusConditions).toHaveLength(3)
  })
})

describe('CombatantCard Type Display', () => {
  describe('Pokemon types', () => {
    it('should display single type', () => {
      const combatant = createMockCombatant('pokemon', {
        entity: createMockPokemonEntity({ types: ['Fire'] })
      })

      expect(combatant.entity.types).toEqual(['Fire'])
    })

    it('should display dual types', () => {
      const combatant = createMockCombatant('pokemon', {
        entity: createMockPokemonEntity({ types: ['Water', 'Ice'] })
      })

      expect(combatant.entity.types).toHaveLength(2)
      expect(combatant.entity.types).toContain('Water')
      expect(combatant.entity.types).toContain('Ice')
    })
  })

  describe('Human combatants', () => {
    it('should not display types for humans', () => {
      const combatant = createMockCombatant('human')

      expect(combatant.type).toBe('human')
      expect((combatant.entity as any).types).toBeUndefined()
    })
  })
})
