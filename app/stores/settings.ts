import { defineStore } from 'pinia'
import type { DamageMode, AppSettings } from '~/types'
import { DEFAULT_SETTINGS } from '~/types'

interface SettingsState extends AppSettings {
  loaded: boolean
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ...DEFAULT_SETTINGS,
    loaded: false
  }),

  getters: {
    isSetDamageMode: (state): boolean => state.damageMode === 'set',
    isRolledDamageMode: (state): boolean => state.damageMode === 'rolled'
  },

  actions: {
    // Load settings from localStorage
    loadSettings() {
      if (import.meta.client) {
        try {
          const stored = localStorage.getItem('ptu-settings')
          if (stored) {
            const parsed = JSON.parse(stored)
            this.damageMode = parsed.damageMode ?? DEFAULT_SETTINGS.damageMode
            this.defaultGridWidth = parsed.defaultGridWidth ?? DEFAULT_SETTINGS.defaultGridWidth
            this.defaultGridHeight = parsed.defaultGridHeight ?? DEFAULT_SETTINGS.defaultGridHeight
            this.defaultCellSize = parsed.defaultCellSize ?? DEFAULT_SETTINGS.defaultCellSize
          }
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
      this.loaded = true
    },

    // Save settings to localStorage
    saveSettings() {
      if (import.meta.client) {
        try {
          const settings: AppSettings = {
            damageMode: this.damageMode,
            defaultGridWidth: this.defaultGridWidth,
            defaultGridHeight: this.defaultGridHeight,
            defaultCellSize: this.defaultCellSize
          }
          localStorage.setItem('ptu-settings', JSON.stringify(settings))
        } catch (error) {
          console.error('Failed to save settings:', error)
        }
      }
    },

    // Set damage mode
    setDamageMode(mode: DamageMode) {
      this.damageMode = mode
      this.saveSettings()
    },

    // Toggle damage mode
    toggleDamageMode() {
      this.damageMode = this.damageMode === 'set' ? 'rolled' : 'set'
      this.saveSettings()
    },

    // Set default grid dimensions
    setDefaultGridDimensions(width: number, height: number) {
      this.defaultGridWidth = width
      this.defaultGridHeight = height
      this.saveSettings()
    },

    // Set default cell size
    setDefaultCellSize(size: number) {
      this.defaultCellSize = size
      this.saveSettings()
    },

    // Reset to defaults
    resetToDefaults() {
      this.damageMode = DEFAULT_SETTINGS.damageMode
      this.defaultGridWidth = DEFAULT_SETTINGS.defaultGridWidth
      this.defaultGridHeight = DEFAULT_SETTINGS.defaultGridHeight
      this.defaultCellSize = DEFAULT_SETTINGS.defaultCellSize
      this.saveSettings()
    }
  }
})
