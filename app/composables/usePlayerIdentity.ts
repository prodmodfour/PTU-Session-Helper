import type { HumanCharacter, Pokemon } from '~/types'

const STORAGE_KEY = 'ptu_player_identity'

interface StoredIdentity {
  characterId: string
  characterName: string
  selectedAt: string
}

/**
 * Composable for player identity management.
 * Wraps the playerIdentity store with localStorage persistence
 * and server data fetching.
 */
export function usePlayerIdentity() {
  const store = usePlayerIdentityStore()

  const identity = computed(() => {
    if (!store.characterId) return null
    return {
      characterId: store.characterId,
      characterName: store.characterName
    }
  })

  const character = computed(() => store.character)
  const pokemon = computed(() => store.pokemon)
  const isIdentified = computed(() => store.isIdentified)
  const loading = computed(() => store.loading)
  const error = computed(() => store.error)

  /**
   * Load stored identity from localStorage on startup.
   * If found, fetches fresh character data from the server.
   */
  const restoreIdentity = async (): Promise<boolean> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false

      const stored: StoredIdentity = JSON.parse(raw)
      if (!stored.characterId) return false

      store.setIdentity(stored.characterId, stored.characterName)
      await refreshCharacterData()
      return true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }

  /**
   * Select a character as the player's identity.
   * Saves to localStorage and fetches full character data.
   */
  const selectCharacter = async (characterId: string, characterName: string): Promise<void> => {
    store.setLoading(true)
    store.setError(null)

    try {
      const stored: StoredIdentity = {
        characterId,
        characterName,
        selectedAt: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

      store.setIdentity(characterId, characterName)
      await refreshCharacterData()
    } catch (err: any) {
      store.setError(err.message || 'Failed to select character')
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Re-fetch character and Pokemon data from the server.
   * Called on identity restore, character selection, and
   * WebSocket character_update events.
   */
  const refreshCharacterData = async (): Promise<void> => {
    if (!store.characterId) return

    store.setLoading(true)
    store.setError(null)

    try {
      const response = await $fetch<{
        success: boolean
        data: {
          character: HumanCharacter
          pokemon: Pokemon[]
        }
      }>(`/api/characters/${store.characterId}/player-view`)

      store.setCharacterData(response.data.character, response.data.pokemon)
    } catch (err: any) {
      store.setError(err.message || 'Failed to load character data')
      throw err
    } finally {
      store.setLoading(false)
    }
  }

  /**
   * Clear the player's identity.
   * Removes from localStorage and resets all state.
   */
  const clearIdentity = (): void => {
    localStorage.removeItem(STORAGE_KEY)
    store.clearIdentity()
  }

  return {
    identity,
    character,
    pokemon,
    isIdentified,
    loading,
    error,
    restoreIdentity,
    selectCharacter,
    clearIdentity,
    refreshCharacterData
  }
}
