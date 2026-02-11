import { defineStore } from 'pinia'

export type GroupViewTab = 'lobby' | 'scene' | 'encounter' | 'map'

export interface ScenePosition {
  x: number
  y: number
}

export interface ScenePokemon {
  id: string
  speciesId?: string
  species: string
  level: number
  nickname?: string | null
  position: ScenePosition
  groupId?: string | null
}

export interface SceneCharacter {
  id: string
  characterId: string
  name: string
  avatarUrl?: string | null
  position: ScenePosition
  groupId?: string | null
}

export interface SceneGroup {
  id: string
  name: string
  position: ScenePosition
  width: number
  height: number
}

export interface SceneModifier {
  name: string
  description?: string
  effect?: string
}

export interface Scene {
  id: string
  name: string
  description?: string | null
  locationName?: string | null
  locationImage?: string | null
  pokemon: ScenePokemon[]
  characters: SceneCharacter[]
  groups: SceneGroup[]
  weather?: string | null
  terrains: string[]
  modifiers: SceneModifier[]
  habitatId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TabState {
  activeTab: GroupViewTab
  activeSceneId: string | null
}

export const useGroupViewTabsStore = defineStore('groupViewTabs', {
  state: () => ({
    activeTab: 'lobby' as GroupViewTab,
    activeSceneId: null as string | null,
    activeScene: null as Scene | null,
    scenes: [] as Scene[],
    loading: false,
    error: null as string | null
  }),

  getters: {
    isSceneTab: (state) => state.activeTab === 'scene',
    isEncounterTab: (state) => state.activeTab === 'encounter',
    isMapTab: (state) => state.activeTab === 'map',
    isLobbyTab: (state) => state.activeTab === 'lobby',
    hasActiveScene: (state) => state.activeScene !== null
  },

  actions: {
    // Tab state management
    async fetchTabState() {
      try {
        const response = await $fetch<{ success: boolean; data: TabState }>(
          '/api/group/tab'
        )
        if (response.success) {
          this.activeTab = response.data.activeTab as GroupViewTab
          this.activeSceneId = response.data.activeSceneId
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch tab state'
        this.error = message
        return null
      }
    },

    async setActiveTab(tab: GroupViewTab, sceneId?: string | null) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: TabState }>(
          '/api/group/tab',
          {
            method: 'PUT',
            body: {
              activeTab: tab,
              activeSceneId: sceneId ?? null
            }
          }
        )
        if (response.success) {
          this.activeTab = response.data.activeTab as GroupViewTab
          this.activeSceneId = response.data.activeSceneId
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to set active tab'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    // Handle WebSocket tab change event
    handleTabChange(data: { tab: string; sceneId?: string | null }) {
      this.activeTab = data.tab as GroupViewTab
      this.activeSceneId = data.sceneId ?? null
    },

    // Scene CRUD operations
    async fetchScenes() {
      try {
        const response = await $fetch<{ success: boolean; data: Scene[] }>(
          '/api/scenes'
        )
        if (response.success) {
          this.scenes = response.data
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch scenes'
        this.error = message
        return []
      }
    },

    async fetchActiveScene() {
      try {
        const response = await $fetch<{ success: boolean; data: Scene | null }>(
          '/api/scenes/active'
        )
        if (response.success) {
          this.activeScene = response.data
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch active scene'
        this.error = message
        return null
      }
    },

    async fetchScene(id: string) {
      try {
        const response = await $fetch<{ success: boolean; data: Scene }>(
          `/api/scenes/${id}`
        )
        if (response.success) {
          return response.data
        }
        return null
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to fetch scene'
        this.error = message
        return null
      }
    },

    async createScene(data: {
      name: string
      description?: string | null
      locationName?: string | null
      locationImage?: string | null
      weather?: string | null
      terrains?: string[]
      modifiers?: SceneModifier[]
      habitatId?: string | null
    }) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: Scene }>(
          '/api/scenes',
          {
            method: 'POST',
            body: data
          }
        )
        if (response.success) {
          this.scenes = [response.data, ...this.scenes]
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to create scene'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateScene(id: string, data: Partial<Scene>) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: Scene }>(
          `/api/scenes/${id}`,
          {
            method: 'PUT',
            body: data
          }
        )
        if (response.success) {
          // Update in scenes list
          const index = this.scenes.findIndex(s => s.id === id)
          if (index !== -1) {
            this.scenes = [
              ...this.scenes.slice(0, index),
              response.data,
              ...this.scenes.slice(index + 1)
            ]
          }
          // Update activeScene if this is it
          if (this.activeScene?.id === id) {
            this.activeScene = response.data
          }
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to update scene'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteScene(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/scenes/${id}`, { method: 'DELETE' })
        this.scenes = this.scenes.filter(s => s.id !== id)
        if (this.activeScene?.id === id) {
          this.activeScene = null
        }
        if (this.activeSceneId === id) {
          this.activeSceneId = null
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to delete scene'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    async activateScene(id: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ success: boolean; data: Scene }>(
          `/api/scenes/${id}/activate`,
          { method: 'POST' }
        )
        if (response.success) {
          // Update all scenes to mark only this one as active
          this.scenes = this.scenes.map(s => ({
            ...s,
            isActive: s.id === id
          }))
          this.activeScene = response.data
          this.activeSceneId = id
        }
        return response.data
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to activate scene'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    async deactivateScene(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/scenes/${id}/deactivate`, { method: 'POST' })
        // Update scene in list
        this.scenes = this.scenes.map(s =>
          s.id === id ? { ...s, isActive: false } : s
        )
        if (this.activeScene?.id === id) {
          this.activeScene = null
        }
        if (this.activeSceneId === id) {
          this.activeSceneId = null
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to deactivate scene'
        this.error = message
        throw e
      } finally {
        this.loading = false
      }
    },

    // Handle WebSocket scene updates
    handleSceneUpdate(data: { sceneId: string; scene: Scene }) {
      if (this.activeScene?.id === data.sceneId) {
        this.activeScene = data.scene
      }
      const index = this.scenes.findIndex(s => s.id === data.sceneId)
      if (index !== -1) {
        this.scenes = [
          ...this.scenes.slice(0, index),
          data.scene,
          ...this.scenes.slice(index + 1)
        ]
      }
    },

    handleSceneActivated(data: { scene: Scene }) {
      this.activeScene = data.scene
      this.activeSceneId = data.scene.id
      this.scenes = this.scenes.map(s => ({
        ...s,
        isActive: s.id === data.scene.id
      }))
    },

    handleSceneDeactivated(data: { sceneId: string }) {
      if (this.activeScene?.id === data.sceneId) {
        this.activeScene = null
      }
      if (this.activeSceneId === data.sceneId) {
        this.activeSceneId = null
      }
      this.scenes = this.scenes.map(s =>
        s.id === data.sceneId ? { ...s, isActive: false } : s
      )
    },

    // Position updates (lightweight alternative to full scene PUT)
    async updatePositions(sceneId: string, positions: {
      pokemon?: Array<{ id: string; position: ScenePosition; groupId?: string | null }>
      characters?: Array<{ id: string; position: ScenePosition; groupId?: string | null }>
      groups?: Array<{ id: string; position: ScenePosition }>
    }) {
      await $fetch(`/api/scenes/${sceneId}/positions`, {
        method: 'PUT',
        body: positions
      })
    },

    // Handle WebSocket position updates (selective merge)
    handleScenePositionsUpdated(data: {
      pokemon?: Array<{ id: string; position: ScenePosition }>
      characters?: Array<{ id: string; position: ScenePosition }>
      groups?: Array<{ id: string; position: ScenePosition }>
    }) {
      if (!this.activeScene) return

      let updated = { ...this.activeScene }

      if (data.pokemon) {
        updated = {
          ...updated,
          pokemon: updated.pokemon.map(p => {
            const match = data.pokemon!.find(u => u.id === p.id)
            return match ? { ...p, position: match.position } : p
          })
        }
      }

      if (data.characters) {
        updated = {
          ...updated,
          characters: updated.characters.map(c => {
            const match = data.characters!.find(u => u.id === c.id)
            return match ? { ...c, position: match.position } : c
          })
        }
      }

      if (data.groups) {
        updated = {
          ...updated,
          groups: updated.groups.map(g => {
            const match = data.groups!.find(u => u.id === g.id)
            return match ? { ...g, position: match.position } : g
          })
        }
      }

      this.activeScene = updated
    },

    // Handle individual scene entity events
    // Data shapes must match server/utils/websocket.ts broadcast payloads:
    //   notifySceneCharacterAdded  -> { sceneId, character }
    //   notifySceneCharacterRemoved -> { sceneId, characterId }
    //   notifyScenePokemonAdded    -> { sceneId, pokemon }
    //   notifyScenePokemonRemoved  -> { sceneId, pokemonId }
    //   notifySceneGroupCreated    -> { sceneId, group }
    //   notifySceneGroupUpdated    -> { sceneId, group }
    //   notifySceneGroupDeleted    -> { sceneId, groupId }
    handleSceneCharacterAdded(data: { sceneId: string; character: SceneCharacter }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        characters: [...this.activeScene.characters, data.character]
      }
    },

    handleSceneCharacterRemoved(data: { sceneId: string; characterId: string }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        characters: this.activeScene.characters.filter(c => c.id !== data.characterId)
      }
    },

    handleScenePokemonAdded(data: { sceneId: string; pokemon: ScenePokemon }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        pokemon: [...this.activeScene.pokemon, data.pokemon]
      }
    },

    handleScenePokemonRemoved(data: { sceneId: string; pokemonId: string }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        pokemon: this.activeScene.pokemon.filter(p => p.id !== data.pokemonId)
      }
    },

    handleSceneGroupCreated(data: { sceneId: string; group: SceneGroup }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        groups: [...this.activeScene.groups, data.group]
      }
    },

    handleSceneGroupUpdated(data: { sceneId: string; group: SceneGroup }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        groups: this.activeScene.groups.map(g =>
          g.id === data.group.id ? data.group : g
        )
      }
    },

    handleSceneGroupDeleted(data: { sceneId: string; groupId: string }) {
      if (!this.activeScene || this.activeScene.id !== data.sceneId) return
      this.activeScene = {
        ...this.activeScene,
        groups: this.activeScene.groups.filter(g => g.id !== data.groupId)
      }
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
