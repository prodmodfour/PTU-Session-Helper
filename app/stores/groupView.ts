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

export interface ServedMap {
  id: string
  name: string
  locations: Array<{
    id: string
    name: string
    type: 'town' | 'forest' | 'castle' | 'path' | 'river' | 'landmark'
    description?: string
    x: number
    y: number
    highlighted?: boolean
  }>
  connections: Array<{
    from: string
    to: string
    label?: string
    type: 'road' | 'path' | 'river' | 'aqueduct'
  }>
  timestamp: number
}

export const useGroupViewStore = defineStore('groupView', {
  state: () => ({
    wildSpawnPreview: null as WildSpawnPreview | null,
    servedMap: null as ServedMap | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    hasWildSpawn: (state) => state.wildSpawnPreview !== null,
    hasMap: (state) => state.servedMap !== null
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
    },

    // Map actions
    async fetchServedMap() {
      try {
        const response = await $fetch<{ success: boolean; data: ServedMap | null }>(
          '/api/group/map'
        )
        if (response.success) {
          this.servedMap = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to fetch served map'
        return null
      }
    },

    async serveMap(map: Omit<ServedMap, 'timestamp'>) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean }>('/api/group/map', {
          method: 'POST',
          body: map
        })
        if (response.success) {
          this.servedMap = { ...map, timestamp: Date.now() }
        }
        return response.success
      } catch (e: any) {
        this.error = e.message || 'Failed to serve map'
        throw e
      } finally {
        this.loading = false
      }
    },

    async clearServedMap() {
      try {
        await $fetch('/api/group/map', { method: 'DELETE' })
        this.servedMap = null
      } catch (e: any) {
        this.error = e.message || 'Failed to clear map'
        throw e
      }
    },

    setServedMap(map: ServedMap | null) {
      this.servedMap = map
    }
  }
})
