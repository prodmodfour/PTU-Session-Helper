/**
 * Composable for managing post-evolution undo.
 *
 * Stores pre-evolution snapshots keyed by Pokemon ID.
 * Allows immediate undo after evolution before the next
 * session action clears the snapshot.
 *
 * Immutable state management — never mutates the Map directly.
 */
import type { PokemonSnapshot } from '~/server/services/evolution.service'

export function useEvolutionUndo() {
  const undoStack = useState<Map<string, PokemonSnapshot>>(
    'evolution-undo-stack',
    () => new Map()
  )

  function recordEvolution(pokemonId: string, snapshot: PokemonSnapshot): void {
    const newStack = new Map(undoStack.value)
    newStack.set(pokemonId, snapshot)
    undoStack.value = newStack
  }

  function canUndo(pokemonId: string): boolean {
    return undoStack.value.has(pokemonId)
  }

  async function undoEvolution(pokemonId: string): Promise<boolean> {
    const snapshot = undoStack.value.get(pokemonId)
    if (!snapshot) return false

    try {
      await $fetch(`/api/pokemon/${pokemonId}/evolution-undo`, {
        method: 'POST',
        body: { snapshot }
      })

      const newStack = new Map(undoStack.value)
      newStack.delete(pokemonId)
      undoStack.value = newStack
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to undo evolution'
      alert(`Evolution undo failed: ${message}`)
      return false
    }
  }

  function clearUndo(pokemonId: string): void {
    if (!undoStack.value.has(pokemonId)) return
    const newStack = new Map(undoStack.value)
    newStack.delete(pokemonId)
    undoStack.value = newStack
  }

  function clearAll(): void {
    undoStack.value = new Map()
  }

  return { recordEvolution, canUndo, undoEvolution, clearUndo, clearAll }
}
