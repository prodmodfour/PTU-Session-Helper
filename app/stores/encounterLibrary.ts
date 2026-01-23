import { defineStore } from 'pinia'
import type { BattleType, GridConfig } from '~/types'

// Template combatant data structure (what's stored in the template)
export interface TemplateCombatant {
  type: 'pokemon' | 'human'
  side: 'player' | 'ally' | 'enemy'
  position: { x: number; y: number } | null
  tokenSize: number
  entityData: TemplatePokemonData | TemplateHumanData | null
}

export interface TemplatePokemonData {
  species: string
  nickname?: string | null
  level: number
  nature: string
  abilities: string
  moves: string
  shiny: boolean
  gender: 'Male' | 'Female' | 'Genderless'
}

export interface TemplateHumanData {
  name: string
  characterType: 'player' | 'npc' | 'trainer'
  level: number
  trainerClasses: string
}

export interface EncounterTemplate {
  id: string
  name: string
  description: string | null
  battleType: BattleType
  combatants: TemplateCombatant[]
  gridConfig: {
    width: number | null
    height: number | null
    cellSize: number | null
  } | null
  category: string | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

interface EncounterLibraryState {
  templates: EncounterTemplate[]
  selectedTemplateId: string | null
  loading: boolean
  error: string | null
  filters: {
    search: string
    category: string | null
    sortBy: 'name' | 'createdAt' | 'updatedAt'
    sortOrder: 'asc' | 'desc'
  }
}

export const useEncounterLibraryStore = defineStore('encounterLibrary', {
  state: (): EncounterLibraryState => ({
    templates: [],
    selectedTemplateId: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      category: null,
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    }
  }),

  getters: {
    filteredTemplates: (state): EncounterTemplate[] => {
      let result = [...state.templates]

      // Filter by category
      if (state.filters.category) {
        result = result.filter(t => t.category === state.filters.category)
      }

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(t =>
          t.name.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search) ||
          t.tags.some(tag => tag.toLowerCase().includes(search))
        )
      }

      // Sort
      result.sort((a, b) => {
        let comparison = 0
        switch (state.filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            break
          case 'updatedAt':
            comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
            break
        }
        return state.filters.sortOrder === 'asc' ? comparison : -comparison
      })

      return result
    },

    selectedTemplate: (state): EncounterTemplate | undefined => {
      if (!state.selectedTemplateId) return undefined
      return state.templates.find(t => t.id === state.selectedTemplateId)
    },

    getTemplateById: (state) => (id: string): EncounterTemplate | undefined => {
      return state.templates.find(t => t.id === id)
    },

    categories: (state): string[] => {
      const cats = new Set<string>()
      state.templates.forEach(t => {
        if (t.category) cats.add(t.category)
      })
      return Array.from(cats).sort()
    },

    allTags: (state): string[] => {
      const tags = new Set<string>()
      state.templates.forEach(t => {
        t.tags.forEach(tag => tags.add(tag))
      })
      return Array.from(tags).sort()
    },

    templateCount: (state): number => state.templates.length
  },

  actions: {
    // Fetch all templates from API
    async fetchTemplates() {
      this.loading = true
      this.error = null

      try {
        const params: Record<string, string> = {}
        if (this.filters.category) {
          params.category = this.filters.category
        }
        if (this.filters.search) {
          params.search = this.filters.search
        }

        const queryString = new URLSearchParams(params).toString()
        const url = queryString ? `/api/encounter-templates?${queryString}` : '/api/encounter-templates'

        const response = await $fetch<{ success: boolean; data: EncounterTemplate[] }>(url)

        if (response.success) {
          this.templates = response.data
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch templates'
        console.error('Failed to fetch templates:', error)
      } finally {
        this.loading = false
      }
    },

    // Create a new template
    async createTemplate(data: {
      name: string
      description?: string
      battleType?: BattleType
      combatants?: TemplateCombatant[]
      gridConfig?: { width: number; height: number; cellSize: number } | null
      category?: string
      tags?: string[]
    }): Promise<EncounterTemplate | null> {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: EncounterTemplate }>(
          '/api/encounter-templates',
          {
            method: 'POST',
            body: data
          }
        )

        if (response.success) {
          this.templates.unshift(response.data)
          return response.data
        }
        return null
      } catch (error: any) {
        this.error = error.message || 'Failed to create template'
        console.error('Failed to create template:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    // Create template from existing encounter
    async createFromEncounter(data: {
      encounterId: string
      name: string
      description?: string
      category?: string
      tags?: string[]
    }): Promise<EncounterTemplate | null> {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: EncounterTemplate }>(
          '/api/encounter-templates/from-encounter',
          {
            method: 'POST',
            body: data
          }
        )

        if (response.success) {
          this.templates.unshift(response.data)
          return response.data
        }
        return null
      } catch (error: any) {
        this.error = error.message || 'Failed to create template from encounter'
        console.error('Failed to create template from encounter:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    // Update a template
    async updateTemplate(
      id: string,
      data: Partial<{
        name: string
        description: string | null
        battleType: BattleType
        combatants: TemplateCombatant[]
        gridConfig: { width: number; height: number; cellSize: number } | null
        category: string | null
        tags: string[]
      }>
    ): Promise<EncounterTemplate | null> {
      this.loading = true
      this.error = null

      try {
        const response = await $fetch<{ success: boolean; data: EncounterTemplate }>(
          `/api/encounter-templates/${id}`,
          {
            method: 'PUT',
            body: data
          }
        )

        if (response.success) {
          const index = this.templates.findIndex(t => t.id === id)
          if (index !== -1) {
            this.templates[index] = response.data
          }
          return response.data
        }
        return null
      } catch (error: any) {
        this.error = error.message || 'Failed to update template'
        console.error('Failed to update template:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    // Delete a template
    async deleteTemplate(id: string): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        await $fetch(`/api/encounter-templates/${id}`, {
          method: 'DELETE'
        })

        this.templates = this.templates.filter(t => t.id !== id)
        if (this.selectedTemplateId === id) {
          this.selectedTemplateId = null
        }
        return true
      } catch (error: any) {
        this.error = error.message || 'Failed to delete template'
        console.error('Failed to delete template:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    // Duplicate a template
    async duplicateTemplate(id: string, newName?: string): Promise<EncounterTemplate | null> {
      const original = this.templates.find(t => t.id === id)
      if (!original) return null

      // Convert gridConfig with nullable properties to required properties or null
      const gridConfig = original.gridConfig &&
        original.gridConfig.width !== null &&
        original.gridConfig.height !== null &&
        original.gridConfig.cellSize !== null
          ? {
              width: original.gridConfig.width,
              height: original.gridConfig.height,
              cellSize: original.gridConfig.cellSize
            }
          : null

      return this.createTemplate({
        name: newName || `${original.name} (Copy)`,
        description: original.description ?? undefined,
        battleType: original.battleType,
        combatants: original.combatants,
        gridConfig,
        category: original.category ?? undefined,
        tags: [...original.tags]
      })
    },

    // Set filters
    setSearch(search: string) {
      this.filters.search = search
    },

    setCategory(category: string | null) {
      this.filters.category = category
    },

    setSortBy(sortBy: 'name' | 'createdAt' | 'updatedAt') {
      this.filters.sortBy = sortBy
    },

    setSortOrder(order: 'asc' | 'desc') {
      this.filters.sortOrder = order
    },

    toggleSortOrder() {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc'
    },

    // Select a template
    selectTemplate(id: string | null) {
      this.selectedTemplateId = id
    },

    // Clear error
    clearError() {
      this.error = null
    }
  }
})
