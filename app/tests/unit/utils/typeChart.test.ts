import { describe, it, expect } from 'vitest'
import {
  TYPE_CHART,
  NET_EFFECTIVENESS,
  getTypeEffectiveness,
  getEffectivenessLabel
} from '~/utils/typeChart'

describe('typeChart utility', () => {
  describe('TYPE_CHART completeness', () => {
    it('should have entries for all 18 types', () => {
      const allTypes = [
        'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
        'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
        'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
      ]
      for (const type of allTypes) {
        expect(TYPE_CHART[type]).toBeDefined()
      }
    })
  })

  describe('NET_EFFECTIVENESS', () => {
    it('should have entries for net -3 through +3', () => {
      expect(NET_EFFECTIVENESS[-3]).toBe(0.125)
      expect(NET_EFFECTIVENESS[-2]).toBe(0.25)
      expect(NET_EFFECTIVENESS[-1]).toBe(0.5)
      expect(NET_EFFECTIVENESS[0]).toBe(1.0)
      expect(NET_EFFECTIVENESS[1]).toBe(1.5)
      expect(NET_EFFECTIVENESS[2]).toBe(2.0)
      expect(NET_EFFECTIVENESS[3]).toBe(3.0)
    })
  })

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
      expect(getTypeEffectiveness('Fire', ['Grass', 'Steel'])).toBe(2.0)
      expect(getTypeEffectiveness('Ground', ['Fire', 'Steel'])).toBe(2.0)
      expect(getTypeEffectiveness('Electric', ['Water', 'Flying'])).toBe(2.0)
    })

    it('should return 1.0 for SE + resist (PTU 07-combat.md:1019-1020)', () => {
      expect(getTypeEffectiveness('Fighting', ['Ice', 'Poison'])).toBe(1.0)
      expect(getTypeEffectiveness('Fire', ['Grass', 'Water'])).toBe(1.0)
    })

    it('should return 3.0 for triply super effective (PTU 07-combat.md:1032-1033)', () => {
      expect(getTypeEffectiveness('Ice', ['Grass', 'Ground', 'Flying'])).toBe(3.0)
    })

    it('should handle mixed effectiveness on dual types', () => {
      expect(getTypeEffectiveness('Ground', ['Water', 'Grass'])).toBe(0.5)
    })

    it('should handle double resistances', () => {
      expect(getTypeEffectiveness('Fire', ['Fire', 'Dragon'])).toBe(0.25)
    })

    it('should handle immunity cancelling super effective', () => {
      expect(getTypeEffectiveness('Ground', ['Water', 'Flying'])).toBe(0)
    })

    it('should return 1 for unknown move type', () => {
      expect(getTypeEffectiveness('Banana', ['Fire'])).toBe(1)
    })

    it('should clamp net beyond +3 to triply SE (code-review-020)', () => {
      // Hypothetical 4-type defender where all are SE
      // Ice vs [Grass, Ground, Flying, Dragon] = 4 SE, 0 resist → net 4 → clamped to 3
      expect(getTypeEffectiveness('Ice', ['Grass', 'Ground', 'Flying', 'Dragon'])).toBe(3.0)
    })

    it('should clamp net below -3 to triply resisted (code-review-020)', () => {
      // Hypothetical 4-type defender where all resist
      // Grass vs [Fire, Grass, Poison, Flying] = 0 SE, 4 resist → net -4 → clamped to -3
      expect(getTypeEffectiveness('Grass', ['Fire', 'Grass', 'Poison', 'Flying'])).toBe(0.125)
    })
  })

  describe('getEffectivenessLabel', () => {
    it('should return Immune for 0', () => {
      expect(getEffectivenessLabel(0)).toBe('Immune')
    })

    it('should return Triply Resisted for 0.125', () => {
      expect(getEffectivenessLabel(0.125)).toBe('Triply Resisted')
    })

    it('should return Doubly Resisted for 0.25', () => {
      expect(getEffectivenessLabel(0.25)).toBe('Doubly Resisted')
    })

    it('should return Resisted for 0.5', () => {
      expect(getEffectivenessLabel(0.5)).toBe('Resisted')
    })

    it('should return Neutral for 1', () => {
      expect(getEffectivenessLabel(1)).toBe('Neutral')
    })

    it('should return Super Effective for 1.5', () => {
      expect(getEffectivenessLabel(1.5)).toBe('Super Effective')
    })

    it('should return Doubly Super Effective for 2.0', () => {
      expect(getEffectivenessLabel(2.0)).toBe('Doubly Super Effective')
    })

    it('should return Triply Super Effective for 3.0', () => {
      expect(getEffectivenessLabel(3.0)).toBe('Triply Super Effective')
    })
  })
})
