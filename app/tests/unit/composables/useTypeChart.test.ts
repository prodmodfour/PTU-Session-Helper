import { describe, it, expect } from 'vitest'
import { useTypeChart } from '~/composables/useTypeChart'

const {
  typeEffectiveness,
  getTypeEffectiveness,
  getEffectivenessDescription,
  getEffectivenessLabel,
  hasSTAB,
  isImmuneToStatus
} = useTypeChart()

describe('useTypeChart composable', () => {
  describe('re-exports from typeChart utility', () => {
    it('should expose typeEffectiveness chart', () => {
      expect(typeEffectiveness).toBeDefined()
      expect(typeEffectiveness['Fire']).toBeDefined()
    })

    it('should expose getTypeEffectiveness', () => {
      expect(getTypeEffectiveness('Fire', ['Grass'])).toBe(1.5)
    })

    it('should expose getEffectivenessLabel', () => {
      expect(getEffectivenessLabel(1.5)).toBe('Super Effective')
    })

    it('should expose getEffectivenessDescription as alias for getEffectivenessLabel', () => {
      expect(getEffectivenessDescription(1.5)).toBe('Super Effective')
      expect(getEffectivenessDescription(0)).toBe('Immune')
      expect(getEffectivenessDescription(2.0)).toBe('Doubly Super Effective')
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
      expect(isImmuneToStatus(['Fire', 'Flying'], 'Burned')).toBe(true)
    })

    it('should return false when no type grants immunity', () => {
      expect(isImmuneToStatus(['Normal'], 'Burned')).toBe(false)
      expect(isImmuneToStatus(['Water'], 'Paralyzed')).toBe(false)
    })
  })
})
