import type { Encounter, EncounterSnapshot } from '~/types'

const MAX_HISTORY_SIZE = 50

// Global state for history (shared across components)
const history = ref<EncounterSnapshot[]>([])
const currentIndex = ref(-1)

export function useEncounterHistory() {
  // Computed properties
  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

  const lastActionName = computed(() => {
    if (currentIndex.value > 0) {
      return history.value[currentIndex.value].actionName
    }
    return null
  })

  const nextActionName = computed(() => {
    if (currentIndex.value < history.value.length - 1) {
      return history.value[currentIndex.value + 1].actionName
    }
    return null
  })

  // Push a new snapshot to history
  const pushSnapshot = (actionName: string, state: Encounter) => {
    // Remove any redo history beyond current position
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // Create deep copy of state
    const snapshot: EncounterSnapshot = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      actionName,
      state: JSON.parse(JSON.stringify(state))
    }

    history.value.push(snapshot)

    // Enforce max history size
    if (history.value.length > MAX_HISTORY_SIZE) {
      history.value = history.value.slice(history.value.length - MAX_HISTORY_SIZE)
    }

    currentIndex.value = history.value.length - 1
  }

  // Get state for undo (previous state)
  const getUndoState = (): Encounter | null => {
    if (!canUndo.value) return null
    return JSON.parse(JSON.stringify(history.value[currentIndex.value - 1].state))
  }

  // Get state for redo (next state)
  const getRedoState = (): Encounter | null => {
    if (!canRedo.value) return null
    return JSON.parse(JSON.stringify(history.value[currentIndex.value + 1].state))
  }

  // Move to previous state
  const undo = (): Encounter | null => {
    if (!canUndo.value) return null
    currentIndex.value--
    return JSON.parse(JSON.stringify(history.value[currentIndex.value].state))
  }

  // Move to next state
  const redo = (): Encounter | null => {
    if (!canRedo.value) return null
    currentIndex.value++
    return JSON.parse(JSON.stringify(history.value[currentIndex.value].state))
  }

  // Clear all history
  const clearHistory = () => {
    history.value = []
    currentIndex.value = -1
  }

  // Initialize history with current state
  const initializeHistory = (state: Encounter) => {
    clearHistory()
    pushSnapshot('Initial state', state)
  }

  // Get history info for debugging
  const getHistoryInfo = () => ({
    size: history.value.length,
    currentIndex: currentIndex.value,
    canUndo: canUndo.value,
    canRedo: canRedo.value,
    actions: history.value.map(s => s.actionName)
  })

  return {
    // State
    history: readonly(history),
    currentIndex: readonly(currentIndex),

    // Computed
    canUndo,
    canRedo,
    lastActionName,
    nextActionName,

    // Methods
    pushSnapshot,
    getUndoState,
    getRedoState,
    undo,
    redo,
    clearHistory,
    initializeHistory,
    getHistoryInfo
  }
}
