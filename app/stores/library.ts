import { defineStore } from 'pinia'
import type { HumanCharacter, Pokemon, LibraryFilters } from '~/types'

export const useLibraryStore = defineStore('library', {
  state: () => ({
    humans: [] as HumanCharacter[],
    pokemon: [] as Pokemon[],
    loading: false,
    error: null as string | null,
    filters: {
      search: '',
      type: 'all',
      characterType: 'all',
      pokemonType: 'all',
      pokemonOrigin: 'all',
      sortBy: 'name',
      sortOrder: 'asc'
    } as LibraryFilters
  }),

  getters: {
    filteredHumans: (state): HumanCharacter[] => {
      let result = [...state.humans]

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(h => h.name.toLowerCase().includes(search))
      }

      // Filter by character type
      if (state.filters.characterType !== 'all') {
        result = result.filter(h => h.characterType === state.filters.characterType)
      }

      // Sort
      result.sort((a, b) => {
        let comparison = 0
        switch (state.filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name)
            break
          case 'level':
            comparison = a.level - b.level
            break
        }
        return state.filters.sortOrder === 'asc' ? comparison : -comparison
      })

      return result
    },

    filteredPokemon: (state): Pokemon[] => {
      let result = [...state.pokemon]

      // Filter by search
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(p =>
          p.species.toLowerCase().includes(search) ||
          (p.nickname?.toLowerCase().includes(search) ?? false)
        )
      }

      // Filter by Pokemon type
      if (state.filters.pokemonType !== 'all') {
        result = result.filter(p => p.types.includes(state.filters.pokemonType as any))
      }

      // Filter by origin
      if (state.filters.pokemonOrigin !== 'all') {
        result = result.filter(p => p.origin === state.filters.pokemonOrigin)
      }

      // Sort
      result.sort((a, b) => {
        let comparison = 0
        switch (state.filters.sortBy) {
          case 'name':
            comparison = (a.nickname || a.species).localeCompare(b.nickname || b.species)
            break
          case 'level':
            comparison = a.level - b.level
            break
        }
        return state.filters.sortOrder === 'asc' ? comparison : -comparison
      })

      return result
    },

    allFiltered: (state): (HumanCharacter | Pokemon)[] => {
      const humans = state.filters.type === 'pokemon' ? [] : useLibraryStore().filteredHumans
      const pokemon = state.filters.type === 'human' ? [] : useLibraryStore().filteredPokemon
      return [...humans, ...pokemon]
    },

    getHumanById: (state) => (id: string): HumanCharacter | undefined => {
      return state.humans.find(h => h.id === id)
    },

    getPokemonById: (state) => (id: string): Pokemon | undefined => {
      return state.pokemon.find(p => p.id === id)
    },

    getPokemonByOwner: (state) => (ownerId: string): Pokemon[] => {
      return state.pokemon.filter(p => p.ownerId === ownerId)
    }
  },

  actions: {
    // Load all library items
    async loadLibrary() {
      this.loading = true
      this.error = null
      try {
        const [humansRes, pokemonRes] = await Promise.all([
          $fetch<{ data: HumanCharacter[] }>('/api/characters'),
          $fetch<{ data: Pokemon[] }>('/api/pokemon')
        ])
        this.humans = humansRes.data
        this.pokemon = pokemonRes.data
      } catch (e: any) {
        this.error = e.message || 'Failed to load library'
      } finally {
        this.loading = false
      }
    },

    // Create human character
    async createHuman(data: Partial<HumanCharacter>): Promise<HumanCharacter> {
      try {
        const response = await $fetch<{ data: HumanCharacter }>('/api/characters', {
          method: 'POST',
          body: data
        })
        this.humans.push(response.data)
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create character'
        throw e
      }
    },

    // Update human character
    async updateHuman(id: string, data: Partial<HumanCharacter>): Promise<HumanCharacter> {
      try {
        const response = await $fetch<{ data: HumanCharacter }>(`/api/characters/${id}`, {
          method: 'PUT',
          body: data
        })
        const index = this.humans.findIndex(h => h.id === id)
        if (index !== -1) {
          this.humans[index] = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to update character'
        throw e
      }
    },

    // Delete human character
    async deleteHuman(id: string) {
      try {
        await $fetch(`/api/characters/${id}`, { method: 'DELETE' })
        this.humans = this.humans.filter(h => h.id !== id)
      } catch (e: any) {
        this.error = e.message || 'Failed to delete character'
        throw e
      }
    },

    // Create Pokemon
    async createPokemon(data: Partial<Pokemon>): Promise<Pokemon> {
      try {
        const response = await $fetch<{ data: Pokemon }>('/api/pokemon', {
          method: 'POST',
          body: data
        })
        this.pokemon.push(response.data)
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to create Pokemon'
        throw e
      }
    },

    // Update Pokemon
    async updatePokemon(id: string, data: Partial<Pokemon>): Promise<Pokemon> {
      try {
        const response = await $fetch<{ data: Pokemon }>(`/api/pokemon/${id}`, {
          method: 'PUT',
          body: data
        })
        const index = this.pokemon.findIndex(p => p.id === id)
        if (index !== -1) {
          this.pokemon[index] = response.data
        }
        return response.data
      } catch (e: any) {
        this.error = e.message || 'Failed to update Pokemon'
        throw e
      }
    },

    // Delete Pokemon
    async deletePokemon(id: string) {
      try {
        await $fetch(`/api/pokemon/${id}`, { method: 'DELETE' })
        this.pokemon = this.pokemon.filter(p => p.id !== id)
      } catch (e: any) {
        this.error = e.message || 'Failed to delete Pokemon'
        throw e
      }
    },

    // Link Pokemon to trainer
    async linkPokemonToTrainer(pokemonId: string, trainerId: string) {
      try {
        const response = await $fetch<{ data: Pokemon }>(`/api/pokemon/${pokemonId}/link`, {
          method: 'POST',
          body: { trainerId }
        })
        const index = this.pokemon.findIndex(p => p.id === pokemonId)
        if (index !== -1) {
          this.pokemon[index] = response.data
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to link Pokemon'
        throw e
      }
    },

    // Unlink Pokemon from trainer
    async unlinkPokemon(pokemonId: string) {
      try {
        const response = await $fetch<{ data: Pokemon }>(`/api/pokemon/${pokemonId}/unlink`, {
          method: 'POST'
        })
        const index = this.pokemon.findIndex(p => p.id === pokemonId)
        if (index !== -1) {
          this.pokemon[index] = response.data
        }
      } catch (e: any) {
        this.error = e.message || 'Failed to unlink Pokemon'
        throw e
      }
    },

    // Update filters
    setFilters(filters: Partial<LibraryFilters>) {
      this.filters = { ...this.filters, ...filters }
    },

    // Reset filters
    resetFilters() {
      this.filters = {
        search: '',
        type: 'all',
        characterType: 'all',
        pokemonType: 'all',
        pokemonOrigin: 'all',
        sortBy: 'name',
        sortOrder: 'asc'
      }
    }
  }
})
