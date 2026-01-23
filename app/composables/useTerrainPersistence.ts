import { useTerrainStore } from '~/stores/terrain'
import type { GridPosition, TerrainType } from '~/types'

interface TerrainCellData {
  position: GridPosition
  type: TerrainType
  elevation: number
  note?: string
}

interface TerrainApiResponse {
  success: boolean
  data: {
    enabled: boolean
    cells: TerrainCellData[]
  }
}

export function useTerrainPersistence() {
  const terrainStore = useTerrainStore()
  const isSaving = ref(false)
  const isLoading = ref(false)
  const saveError = ref<string | null>(null)
  const loadError = ref<string | null>(null)

  // Debounce timer for saving
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const SAVE_DEBOUNCE_MS = 500

  // Load terrain state from server
  const loadTerrainState = async (encounterId: string): Promise<boolean> => {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await $fetch<TerrainApiResponse>(`/api/encounters/${encounterId}/terrain`, {
        method: 'GET'
      })

      if (response.success && response.data) {
        // Import state into store
        terrainStore.setEnabled(response.data.enabled)
        terrainStore.importState({
          cells: response.data.cells || []
        })
        return true
      }
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load terrain state'
      loadError.value = message
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Save terrain state to server
  const saveTerrainState = async (encounterId: string): Promise<boolean> => {
    isSaving.value = true
    saveError.value = null

    try {
      const exportedState = terrainStore.exportState()

      const response = await $fetch<TerrainApiResponse>(`/api/encounters/${encounterId}/terrain`, {
        method: 'PUT',
        body: {
          enabled: terrainStore.enabled,
          cells: exportedState.cells
        }
      })

      return response.success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save terrain state'
      saveError.value = message
      return false
    } finally {
      isSaving.value = false
    }
  }

  // Debounced save - call this when terrain state changes
  const debouncedSave = (encounterId: string) => {
    if (saveTimer) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      saveTerrainState(encounterId)
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
    return saveTerrainState(encounterId)
  }

  return {
    loadTerrainState,
    saveTerrainState,
    debouncedSave,
    cancelPendingSave,
    forceSave,
    isSaving: readonly(isSaving),
    isLoading: readonly(isLoading),
    saveError: readonly(saveError),
    loadError: readonly(loadError)
  }
}
