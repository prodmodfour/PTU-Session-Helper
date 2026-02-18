import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '~/stores/settings'
import { DEFAULT_SETTINGS } from '~/types'

describe('settings store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('has default damage mode matching DEFAULT_SETTINGS', () => {
      const store = useSettingsStore()
      expect(store.damageMode).toBe(DEFAULT_SETTINGS.damageMode)
    })

    it('has correct default grid dimensions', () => {
      const store = useSettingsStore()
      expect(store.defaultGridWidth).toBe(DEFAULT_SETTINGS.defaultGridWidth)
      expect(store.defaultGridHeight).toBe(DEFAULT_SETTINGS.defaultGridHeight)
      expect(store.defaultCellSize).toBe(DEFAULT_SETTINGS.defaultCellSize)
    })

    it('is not loaded initially', () => {
      const store = useSettingsStore()
      expect(store.loaded).toBe(false)
    })
  })

  describe('getters', () => {
    it('isSetDamageMode returns true when mode is set', () => {
      const store = useSettingsStore()
      store.damageMode = 'set'
      expect(store.isSetDamageMode).toBe(true)
      expect(store.isRolledDamageMode).toBe(false)
    })

    it('isRolledDamageMode returns true when mode is rolled', () => {
      const store = useSettingsStore()
      store.damageMode = 'rolled'
      expect(store.isRolledDamageMode).toBe(true)
      expect(store.isSetDamageMode).toBe(false)
    })
  })

  describe('loadSettings', () => {
    it('sets loaded to true after loading', () => {
      const store = useSettingsStore()
      store.loadSettings()
      expect(store.loaded).toBe(true)
    })

    it('does not throw on load', () => {
      const store = useSettingsStore()
      expect(() => store.loadSettings()).not.toThrow()
    })
  })

  describe('setDamageMode', () => {
    it('sets damage mode to set', () => {
      const store = useSettingsStore()
      store.damageMode = 'rolled'

      store.setDamageMode('set')

      expect(store.damageMode).toBe('set')
    })

    it('sets damage mode to rolled', () => {
      const store = useSettingsStore()

      store.setDamageMode('rolled')

      expect(store.damageMode).toBe('rolled')
    })
  })

  describe('toggleDamageMode', () => {
    it('toggles from set to rolled', () => {
      const store = useSettingsStore()
      store.damageMode = 'set'

      store.toggleDamageMode()

      expect(store.damageMode).toBe('rolled')
    })

    it('toggles from rolled to set', () => {
      const store = useSettingsStore()
      store.damageMode = 'rolled'

      store.toggleDamageMode()

      expect(store.damageMode).toBe('set')
    })
  })

  describe('setDefaultGridDimensions', () => {
    it('updates width and height', () => {
      const store = useSettingsStore()

      store.setDefaultGridDimensions(40, 30)

      expect(store.defaultGridWidth).toBe(40)
      expect(store.defaultGridHeight).toBe(30)
    })
  })

  describe('setDefaultCellSize', () => {
    it('updates cell size', () => {
      const store = useSettingsStore()

      store.setDefaultCellSize(60)

      expect(store.defaultCellSize).toBe(60)
    })
  })

  describe('resetToDefaults', () => {
    it('resets all settings to defaults', () => {
      const store = useSettingsStore()
      store.damageMode = 'rolled'
      store.defaultGridWidth = 100
      store.defaultGridHeight = 100
      store.defaultCellSize = 100

      store.resetToDefaults()

      expect(store.damageMode).toBe(DEFAULT_SETTINGS.damageMode)
      expect(store.defaultGridWidth).toBe(DEFAULT_SETTINGS.defaultGridWidth)
      expect(store.defaultGridHeight).toBe(DEFAULT_SETTINGS.defaultGridHeight)
      expect(store.defaultCellSize).toBe(DEFAULT_SETTINGS.defaultCellSize)
    })
  })
})
