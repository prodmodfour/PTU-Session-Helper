/**
 * Composable for the wild encounter creation workflow.
 * Encapsulates: create encounter → add wild pokemon → serve to group → navigate to GM page.
 * Used by encounter-tables list page and habitat editor page.
 */
export function useEncounterCreation() {
  const encounterStore = useEncounterStore()
  const router = useRouter()

  const creating = ref(false)
  const error = ref<string | null>(null)

  const createWildEncounter = async (
    pokemon: Array<{ speciesId: string; speciesName: string; level: number }>,
    tableName: string
  ): Promise<boolean> => {
    if (pokemon.length === 0) {
      error.value = 'No Pokemon to add'
      return false
    }

    creating.value = true
    error.value = null

    try {
      await encounterStore.createEncounter(tableName, 'full_contact')
      await encounterStore.addWildPokemon(pokemon, 'enemies')
      await encounterStore.serveEncounter()
      router.push('/gm')
      return true
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to create encounter'
      return false
    } finally {
      creating.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    creating: readonly(creating),
    error: readonly(error),
    clearError,
    createWildEncounter
  }
}
