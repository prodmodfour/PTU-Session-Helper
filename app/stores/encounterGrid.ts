import { defineStore } from 'pinia'
import type { GridConfig, GridPosition, Encounter } from '~/types'

/**
 * Store for VTT grid-related state and actions.
 * Handles grid configuration, token positions, backgrounds, and fog of war.
 */
export const useEncounterGridStore = defineStore('encounterGrid', {
  actions: {
    /**
     * Update combatant position on the grid
     */
    async updateCombatantPosition(encounterId: string, combatantId: string, position: GridPosition) {
      try {
        await $fetch(`/api/encounters/${encounterId}/position`, {
          method: 'POST',
          body: { combatantId, position }
        })
        return position
      } catch (e: any) {
        throw new Error(e.message || 'Failed to update position')
      }
    },

    /**
     * Update grid configuration
     */
    async updateGridConfig(encounterId: string, config: Partial<GridConfig>) {
      try {
        const response = await $fetch<{ data: Partial<GridConfig> }>(
          `/api/encounters/${encounterId}/grid-config`,
          {
            method: 'PUT',
            body: config
          }
        )
        return response.data
      } catch (e: any) {
        throw new Error(e.message || 'Failed to update grid config')
      }
    },

    /**
     * Set token size for a combatant
     */
    async setTokenSize(encounterId: string, encounter: Encounter, combatantId: string, size: number) {
      try {
        await $fetch(`/api/encounters/${encounterId}`, {
          method: 'PUT',
          body: encounter
        })
        return size
      } catch (e: any) {
        throw new Error(e.message || 'Failed to update token size')
      }
    },

    /**
     * Upload background image for grid
     */
    async uploadBackgroundImage(encounterId: string, file: File): Promise<string> {
      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await $fetch<{ data: { background: string } }>(
          `/api/encounters/${encounterId}/background`,
          {
            method: 'POST',
            body: formData
          }
        )
        return response.data.background
      } catch (e: any) {
        throw new Error(e.message || 'Failed to upload background image')
      }
    },

    /**
     * Remove background image from grid
     */
    async removeBackgroundImage(encounterId: string) {
      try {
        await $fetch(`/api/encounters/${encounterId}/background`, {
          method: 'DELETE'
        })
      } catch (e: any) {
        throw new Error(e.message || 'Failed to remove background image')
      }
    },

    /**
     * Load fog state from server
     */
    async loadFogState(encounterId: string) {
      try {
        const response = await $fetch<{
          success: boolean
          data: {
            enabled: boolean
            cells: [string, string][]
            defaultState: string
          }
        }>(`/api/encounters/${encounterId}/fog`)

        return response.data
      } catch (e: any) {
        throw new Error(e.message || 'Failed to load fog state')
      }
    },

    /**
     * Save fog state to server
     */
    async saveFogState(
      encounterId: string,
      fogState: {
        enabled: boolean
        cells: [string, string][]
        defaultState: string
      }
    ) {
      try {
        await $fetch(`/api/encounters/${encounterId}/fog`, {
          method: 'PUT',
          body: fogState
        })
      } catch (e: any) {
        throw new Error(e.message || 'Failed to save fog state')
      }
    }
  }
})
