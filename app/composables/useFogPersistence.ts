import { useFogOfWarStore, type FogState } from '~/stores/fogOfWar'

interface FogApiResponse {
  success: boolean
  data: {
    enabled: boolean
    cells: [string, FogState][]
    defaultState: FogState
  }
}

export function useFogPersistence() {
  const fogOfWarStore = useFogOfWarStore()
  const isSaving = ref(false)
  const isLoading = ref(false)
  const saveError = ref<string | null>(null)
  const loadError = ref<string | null>(null)

  // Debounce timer for saving
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const SAVE_DEBOUNCE_MS = 500

  // Load fog state from server
  const loadFogState = async (encounterId: string): Promise<boolean> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await $fetch<FogApiResponse>(`/api/encounters/${encounterId}/fog`, {
        method: 'GET'
      })

      if (response.success && response.data) {
        // Import state into store
        fogOfWarStore.setEnabled(response.data.enabled)
        fogOfWarStore.importState({
          cells: response.data.cells || [],
          defaultState: response.data.defaultState || 'hidden'
        })
        return true
      }
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load fog state'
      loadError.value = message
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Save fog state to server
  const saveFogState = async (encounterId: string): Promise<boolean> => {
    isSaving.value = true
    saveError.value = null

    try {
      const exportedState = fogOfWarStore.exportState()

      const response = await $fetch<FogApiResponse>(`/api/encounters/${encounterId}/fog`, {
        method: 'PUT',
        body: {
          enabled: fogOfWarStore.enabled,
          cells: exportedState.cells,
          defaultState: exportedState.defaultState
        }
      })

      return response.success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save fog state'
      saveError.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Debounced save - call this when fog state changes
  const debouncedSave = (encounterId: string) => {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      saveFogState(encounterId)
    }, SAVE_DEBOUNCE_MS)
  }

  // Clear any pending save
  const cancelPendingSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
  }

  // Force immediate save
  const forceSave = async (encounterId: string): Promise<boolean> => {
    cancelPendingSave()
    return saveFogState(encounterId)
  }

  return {
    loadFogState,
    saveFogState,
    debouncedSave,
    cancelPendingSave,
    forceSave,
    isSaving: readonly(isSaving),
    isLoading: readonly(isLoading),
    saveError: readonly(saveError),
    loadError: readonly(loadError)
  }
}
