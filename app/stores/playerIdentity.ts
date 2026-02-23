import { defineStore } from 'pinia'
import type { HumanCharacter, Pokemon } from '~/types'

export interface PlayerIdentityState {
  characterId: string | null
  characterName: string | null
  character: HumanCharacter | null
  pokemon: Pokemon[]
  loading: boolean
  error: string | null
}

export const usePlayerIdentityStore = defineStore('playerIdentity', {
  state: (): PlayerIdentityState => ({
    characterId: null,
    characterName: null,
    character: null,
    pokemon: [],
    loading: false,
    error: null
  }),

  getters: {
    isIdentified: (state): boolean => state.characterId !== null,

    activePokemonId: (state): string | undefined =>
      state.character?.activePokemonId,

    activePokemon: (state): Pokemon | null => {
      if (!state.character?.activePokemonId) return null
      return state.pokemon.find(p => p.id === state.character!.activePokemonId) ?? null
    },

    pokemonIds: (state): string[] =>
      state.pokemon.map(p => p.id)
  },

  actions: {
    setIdentity(characterId: string, characterName: string) {
      this.characterId = characterId
      this.characterName = characterName
    },

    setCharacterData(character: HumanCharacter, pokemon: Pokemon[]) {
      this.character = character
      this.pokemon = pokemon
    },

    setLoading(loading: boolean) {
      this.loading = loading
    },

    setError(error: string | null) {
      this.error = error
    },

    clearIdentity() {
      this.characterId = null
      this.characterName = null
      this.character = null
      this.pokemon = []
      this.error = null
    }
  }
})
