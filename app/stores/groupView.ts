import { defineStore } from 'pinia'

export interface WildSpawnPreview {
  id: string
  pokemon: Array<{
    speciesId: string
    speciesName: string
    level: number
  }>
  tableName: string
  timestamp: number
}

export const useGroupViewStore = defineStore('groupView', {
  state: () => ({
    wildSpawnPreview: null as WildSpawnPreview | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    hasWildSpawn: (state) => state.wildSpawnPreview !== null
  },

  actions: {
    async fetchWildSpawnPreview() {
      try {
        const response = await $fetch<{ success: boolean; data: WildSpawnPreview | null }>(
          '/api/group/wild-spawn'
        )
        if (response.success) {
          this.wildSpawnPreview = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to fetch wild spawn preview'
        return null
      }
    },

    async serveWildSpawn(
      pokemon: Array<{ speciesId: string; speciesName: string; level: number }>,
      tableName: string
    ) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: WildSpawnPreview }>(
          '/api/group/wild-spawn',
          {
            method: 'POST',
            body: { pokemon, tableName }
          }
        )
        if (response.success) {
          this.wildSpawnPreview = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to serve wild spawn'
        throw e
      } finally {
        this.loading = false
      }
    },

    async clearWildSpawnPreview() {
      try {
        await $fetch('/api/group/wild-spawn', {
          method: 'DELETE'
        })
        this.wildSpawnPreview = null
      } catch (e: any) {
        this.error = e.message || 'Failed to clear wild spawn preview'
        throw e
      }
    },

    setWildSpawnPreview(preview: WildSpawnPreview | null) {
      this.wildSpawnPreview = preview
    }
  }
})
