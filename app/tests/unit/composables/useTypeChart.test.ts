import { describe, it, expect } from 'vitest'
import { useTypeChart } from '~/composables/useTypeChart'

const {
  getTypeEffectiveness,
  getEffectivenessDescription,
  hasSTAB,
  isImmuneToStatus,
  typeEffectiveness
} = useTypeChart()

describe('useTypeChart composable', () => {
  describe('getTypeEffectiveness', () => {
    it('should return 1 for neutral matchups', () => {
      expect(getTypeEffectiveness('Normal', ['Normal'])).toBe(1)
      expect(getTypeEffectiveness('Fire', ['Normal'])).toBe(1)
    })

    it('should return 1.5 for super effective matchups (PTU)', () => {
      expect(getTypeEffectiveness('Fire', ['Grass'])).toBe(1.5)
      expect(getTypeEffectiveness('Water', ['Fire'])).toBe(1.5)
      expect(getTypeEffectiveness('Electric', ['Water'])).toBe(1.5)
    })

    it('should return 0.5 for resisted matchups', () => {
      expect(getTypeEffectiveness('Fire', ['Water'])).toBe(0.5)
      expect(getTypeEffectiveness('Water', ['Grass'])).toBe(0.5)
    })

    it('should return 0 for immune matchups', () => {
      expect(getTypeEffectiveness('Normal', ['Ghost'])).toBe(0)
      expect(getTypeEffectiveness('Electric', ['Ground'])).toBe(0)
      expect(getTypeEffectiveness('Ghost', ['Normal'])).toBe(0)
      expect(getTypeEffectiveness('Fighting', ['Ghost'])).toBe(0)
      expect(getTypeEffectiveness('Psychic', ['Dark'])).toBe(0)
      expect(getTypeEffectiveness('Dragon', ['Fairy'])).toBe(0)
    })

    it('should return 2.0 for doubly super effective (PTU 07-combat.md:1016-1017)', () => {
      // Fire vs Grass/Steel: both SE → doubly SE = 2.0
      expect(getTypeEffectiveness('Fire', ['Grass', 'Steel'])).toBe(2.0)
      // Ground vs Fire/Steel: both SE → doubly SE = 2.0
      expect(getTypeEffectiveness('Ground', ['Fire', 'Steel'])).toBe(2.0)
      // Electric vs Water/Flying: both SE → doubly SE = 2.0
      expect(getTypeEffectiveness('Electric', ['Water', 'Flying'])).toBe(2.0)
    })

    it('should return 1.0 for SE + resist (PTU 07-combat.md:1019-1020)', () => {
      // Fighting vs Ice/Poison: Ice=SE, Poison=resist → neutral
      expect(getTypeEffectiveness('Fighting', ['Ice', 'Poison'])).toBe(1.0)
      // Fire vs Grass/Water: Grass=SE, Water=resist → neutral
      expect(getTypeEffectiveness('Fire', ['Grass', 'Water'])).toBe(1.0)
    })

    it('should return 3.0 for triply super effective (PTU 07-combat.md:1032-1033)', () => {
      // Ice vs Grass/Ground/Flying: all three SE → triply SE = 3.0
      expect(getTypeEffectiveness('Ice', ['Grass', 'Ground', 'Flying'])).toBe(3.0)
    })

    it('should handle mixed effectiveness on dual types', () => {
      // Ground vs Water/Grass: Water=neutral(1), Grass=0.5 → 0.5
      expect(getTypeEffectiveness('Ground', ['Water', 'Grass'])).toBe(0.5)
    })

    it('should handle double resistances', () => {
      // Fire vs Fire/Dragon = 0.5 * 0.5 = 0.25
      expect(getTypeEffectiveness('Fire', ['Fire', 'Dragon'])).toBe(0.25)
    })

    it('should handle immunity cancelling super effective', () => {
      // Ground vs Water/Flying: Water=1.5, Flying=0 → 0
      expect(getTypeEffectiveness('Ground', ['Water', 'Flying'])).toBe(0)
    })
  })

  describe('getEffectivenessDescription', () => {
    it('should return Immune for 0', () => {
      expect(getEffectivenessDescription(0)).toBe('Immune')
    })

    it('should return Doubly Resisted for 0.25', () => {
      expect(getEffectivenessDescription(0.25)).toBe('Doubly Resisted')
    })

    it('should return Resisted for 0.5', () => {
      expect(getEffectivenessDescription(0.5)).toBe('Resisted')
    })

    it('should return Neutral for 1', () => {
      expect(getEffectivenessDescription(1)).toBe('Neutral')
    })

    it('should return Super Effective for 1.5', () => {
      expect(getEffectivenessDescription(1.5)).toBe('Super Effective')
    })

    it('should return Doubly Super Effective for 2.0', () => {
      expect(getEffectivenessDescription(2.0)).toBe('Doubly Super Effective')
    })

    it('should return Triply Super Effective for 3.0', () => {
      expect(getEffectivenessDescription(3.0)).toBe('Triply Super Effective')
    })

    it('should return Triply Resisted for 0.125', () => {
      expect(getEffectivenessDescription(0.125)).toBe('Triply Resisted')
    })
  })

  describe('hasSTAB', () => {
    it('should return true when move type matches user type', () => {
      expect(hasSTAB('Fire', ['Fire'])).toBe(true)
      expect(hasSTAB('Water', ['Water', 'Ground'])).toBe(true)
    })

    it('should return false when move type does not match', () => {
      expect(hasSTAB('Fire', ['Water'])).toBe(false)
      expect(hasSTAB('Electric', ['Fire', 'Flying'])).toBe(false)
    })
  })

  describe('isImmuneToStatus', () => {
    it('should grant Electric types immunity to Paralyzed', () => {
      expect(isImmuneToStatus(['Electric'], 'Paralyzed')).toBe(true)
    })

    it('should grant Fire types immunity to Burned', () => {
      expect(isImmuneToStatus(['Fire'], 'Burned')).toBe(true)
    })

    it('should grant Ice types immunity to Frozen', () => {
      expect(isImmuneToStatus(['Ice'], 'Frozen')).toBe(true)
    })

    it('should grant Poison and Steel types immunity to Poisoned', () => {
      expect(isImmuneToStatus(['Poison'], 'Poisoned')).toBe(true)
      expect(isImmuneToStatus(['Poison'], 'Badly Poisoned')).toBe(true)
      expect(isImmuneToStatus(['Steel'], 'Poisoned')).toBe(true)
      expect(isImmuneToStatus(['Steel'], 'Badly Poisoned')).toBe(true)
    })

    it('should grant Ghost types immunity to Stuck and Trapped', () => {
      expect(isImmuneToStatus(['Ghost'], 'Stuck')).toBe(true)
      expect(isImmuneToStatus(['Ghost'], 'Trapped')).toBe(true)
    })

    it('should check dual types for immunity', () => {
      // Fire/Flying should be immune to Burned (from Fire type)
      expect(isImmuneToStatus(['Fire', 'Flying'], 'Burned')).toBe(true)
    })

    it('should return false when no type grants immunity', () => {
      expect(isImmuneToStatus(['Normal'], 'Burned')).toBe(false)
      expect(isImmuneToStatus(['Water'], 'Paralyzed')).toBe(false)
    })
  })

  describe('typeEffectiveness chart completeness', () => {
    it('should have entries for all 18 types', () => {
      const allTypes = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
        'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
        'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
      ]
      for (const type of allTypes) {
        expect(typeEffectiveness[type]).toBeDefined()
      }
    })
  })
})
