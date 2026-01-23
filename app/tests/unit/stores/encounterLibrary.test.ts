import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEncounterLibraryStore } from '~/stores/encounterLibrary'
import type { EncounterTemplate } from '~/stores/encounterLibrary'

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

describe('useEncounterLibraryStore', () => {
  let store: ReturnType<typeof useEncounterLibraryStore>

  const mockTemplate: EncounterTemplate = {
    id: 'template-1',
    name: 'Test Template',
    description: 'A test encounter template',
    battleType: 'trainer',
    combatants: [
      {
        type: 'pokemon',
        side: 'enemy',
        position: { x: 5, y: 5 },
        tokenSize: 1,
        entityData: {
          species: 'Pikachu',
          nickname: null,
          level: 25,
          nature: 'Hardy',
          abilities: '["Static"]',
          moves: '["Thunderbolt", "Quick Attack"]',
          shiny: false,
          gender: 'Male'
        }
      }
    ],
    gridConfig: { width: 20, height: 15, cellSize: 40 },
    category: 'Gym Battle',
    tags: ['electric', 'gym'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  }

  const mockTemplate2: EncounterTemplate = {
    id: 'template-2',
    name: 'Wild Encounter',
    description: 'A wild Pokemon appears',
    battleType: 'full_contact',
    combatants: [],
    gridConfig: null,
    category: 'Random',
    tags: ['wild', 'forest'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10')
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEncounterLibraryStore()
    mockFetch.mockReset()
  })

  describe('initial state', () => {
    it('should have empty templates array', () => {
      expect(store.templates).toEqual([])
    })

    it('should have no selected template', () => {
      expect(store.selectedTemplateId).toBeNull()
    })

    it('should not be loading', () => {
      expect(store.loading).toBe(false)
    })

    it('should have default filters', () => {
      expect(store.filters).toEqual({
        search: '',
        category: null,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      })
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      store.templates = [mockTemplate, mockTemplate2]
    })

    describe('filteredTemplates', () => {
      it('should return all templates when no filters', () => {
        expect(store.filteredTemplates).toHaveLength(2)
      })

      it('should filter by search in name', () => {
        store.setSearch('Wild')
        expect(store.filteredTemplates).toHaveLength(1)
        expect(store.filteredTemplates[0].name).toBe('Wild Encounter')
      })

      it('should filter by search in description', () => {
        store.setSearch('Pokemon appears')
        expect(store.filteredTemplates).toHaveLength(1)
        expect(store.filteredTemplates[0].name).toBe('Wild Encounter')
      })

      it('should filter by search in tags', () => {
        store.setSearch('electric')
        expect(store.filteredTemplates).toHaveLength(1)
        expect(store.filteredTemplates[0].name).toBe('Test Template')
      })

      it('should filter by category', () => {
        store.setCategory('Gym Battle')
        expect(store.filteredTemplates).toHaveLength(1)
        expect(store.filteredTemplates[0].name).toBe('Test Template')
      })

      it('should sort by name ascending', () => {
        store.setSortBy('name')
        store.setSortOrder('asc')
        const names = store.filteredTemplates.map(t => t.name)
        expect(names).toEqual(['Test Template', 'Wild Encounter'])
      })

      it('should sort by updatedAt descending (default)', () => {
        const first = store.filteredTemplates[0]
        expect(first.name).toBe('Test Template') // Updated more recently
      })
    })

    describe('selectedTemplate', () => {
      it('should return undefined when no selection', () => {
        expect(store.selectedTemplate).toBeUndefined()
      })

      it('should return selected template', () => {
        store.selectTemplate('template-1')
        expect(store.selectedTemplate).toEqual(mockTemplate)
      })
    })

    describe('getTemplateById', () => {
      it('should return template by id', () => {
        expect(store.getTemplateById('template-1')).toEqual(mockTemplate)
      })

      it('should return undefined for unknown id', () => {
        expect(store.getTemplateById('unknown')).toBeUndefined()
      })
    })

    describe('categories', () => {
      it('should return unique categories sorted', () => {
        expect(store.categories).toEqual(['Gym Battle', 'Random'])
      })
    })

    describe('allTags', () => {
      it('should return unique tags sorted', () => {
        expect(store.allTags).toEqual(['electric', 'forest', 'gym', 'wild'])
      })
    })

    describe('templateCount', () => {
      it('should return correct count', () => {
        expect(store.templateCount).toBe(2)
      })
    })
  })

  describe('actions', () => {
    describe('fetchTemplates', () => {
      it('should fetch templates from API', async () => {
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: [mockTemplate]
        })

        await store.fetchTemplates()

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates')
        expect(store.templates).toEqual([mockTemplate])
        expect(store.loading).toBe(false)
      })

      it('should include filters in query', async () => {
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: []
        })

        store.setCategory('Gym Battle')
        store.setSearch('pikachu')
        await store.fetchTemplates()

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('category=Gym')
        )
      })

      it('should handle errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        await store.fetchTemplates()

        expect(store.error).toBe('Network error')
        expect(store.loading).toBe(false)
      })
    })

    describe('createTemplate', () => {
      it('should create template via API', async () => {
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: mockTemplate
        })

        const result = await store.createTemplate({
          name: 'Test Template',
          battleType: 'trainer'
        })

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates', {
          method: 'POST',
          body: expect.objectContaining({ name: 'Test Template' })
        })
        expect(result).toEqual(mockTemplate)
        expect(store.templates).toContainEqual(mockTemplate)
      })

      it('should return null on error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Create failed'))

        const result = await store.createTemplate({ name: 'Test' })

        expect(result).toBeNull()
        expect(store.error).toBe('Create failed')
      })
    })

    describe('createFromEncounter', () => {
      it('should create template from encounter', async () => {
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: mockTemplate
        })

        const result = await store.createFromEncounter({
          encounterId: 'enc-1',
          name: 'Test Template'
        })

        expect(mockFetch).toHaveBeenCalledWith(
          '/api/encounter-templates/from-encounter',
          {
            method: 'POST',
            body: expect.objectContaining({
              encounterId: 'enc-1',
              name: 'Test Template'
            })
          }
        )
        expect(result).toEqual(mockTemplate)
      })
    })

    describe('updateTemplate', () => {
      beforeEach(() => {
        store.templates = [mockTemplate]
      })

      it('should update template via API', async () => {
        const updatedTemplate = { ...mockTemplate, name: 'Updated Name' }
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: updatedTemplate
        })

        const result = await store.updateTemplate('template-1', {
          name: 'Updated Name'
        })

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates/template-1', {
          method: 'PUT',
          body: { name: 'Updated Name' }
        })
        expect(result?.name).toBe('Updated Name')
        expect(store.templates[0].name).toBe('Updated Name')
      })
    })

    describe('deleteTemplate', () => {
      beforeEach(() => {
        store.templates = [mockTemplate, mockTemplate2]
        store.selectTemplate('template-1')
      })

      it('should delete template via API', async () => {
        mockFetch.mockResolvedValueOnce({ success: true })

        const result = await store.deleteTemplate('template-1')

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates/template-1', {
          method: 'DELETE'
        })
        expect(result).toBe(true)
        expect(store.templates).toHaveLength(1)
        expect(store.templates[0].id).toBe('template-2')
      })

      it('should clear selection if deleted template was selected', async () => {
        mockFetch.mockResolvedValueOnce({ success: true })

        await store.deleteTemplate('template-1')

        expect(store.selectedTemplateId).toBeNull()
      })
    })

    describe('duplicateTemplate', () => {
      beforeEach(() => {
        store.templates = [mockTemplate]
      })

      it('should duplicate template with (Copy) suffix', async () => {
        const duplicated = { ...mockTemplate, id: 'template-dup', name: 'Test Template (Copy)' }
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: duplicated
        })

        const result = await store.duplicateTemplate('template-1')

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates', {
          method: 'POST',
          body: expect.objectContaining({
            name: 'Test Template (Copy)'
          })
        })
        expect(result?.name).toBe('Test Template (Copy)')
      })

      it('should use custom name if provided', async () => {
        const duplicated = { ...mockTemplate, id: 'template-dup', name: 'My Copy' }
        mockFetch.mockResolvedValueOnce({
          success: true,
          data: duplicated
        })

        await store.duplicateTemplate('template-1', 'My Copy')

        expect(mockFetch).toHaveBeenCalledWith('/api/encounter-templates', {
          method: 'POST',
          body: expect.objectContaining({ name: 'My Copy' })
        })
      })

      it('should return null if original not found', async () => {
        const result = await store.duplicateTemplate('unknown')

        expect(result).toBeNull()
        expect(mockFetch).not.toHaveBeenCalled()
      })
    })

    describe('filter setters', () => {
      it('setSearch should update search filter', () => {
        store.setSearch('pikachu')
        expect(store.filters.search).toBe('pikachu')
      })

      it('setCategory should update category filter', () => {
        store.setCategory('Gym Battle')
        expect(store.filters.category).toBe('Gym Battle')
      })

      it('setSortBy should update sort field', () => {
        store.setSortBy('name')
        expect(store.filters.sortBy).toBe('name')
      })

      it('setSortOrder should update sort order', () => {
        store.setSortOrder('asc')
        expect(store.filters.sortOrder).toBe('asc')
      })

      it('toggleSortOrder should toggle between asc and desc', () => {
        expect(store.filters.sortOrder).toBe('desc')
        store.toggleSortOrder()
        expect(store.filters.sortOrder).toBe('asc')
        store.toggleSortOrder()
        expect(store.filters.sortOrder).toBe('desc')
      })
    })

    describe('selectTemplate', () => {
      it('should set selected template id', () => {
        store.selectTemplate('template-1')
        expect(store.selectedTemplateId).toBe('template-1')
      })

      it('should clear selection when passed null', () => {
        store.selectTemplate('template-1')
        store.selectTemplate(null)
        expect(store.selectedTemplateId).toBeNull()
      })
    })

    describe('clearError', () => {
      it('should clear error', () => {
        store.error = 'Some error'
        store.clearError()
        expect(store.error).toBeNull()
      })
    })
  })
})
