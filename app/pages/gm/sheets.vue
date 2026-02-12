<template>
  <div class="library">
    <div class="library__header">
      <h2>Character Library</h2>
      <div class="library__actions">
        <button class="btn btn--secondary btn--sm" @click="showManagePanel = !showManagePanel">
          Manage
        </button>
        <NuxtLink to="/gm/create" class="btn btn--primary">
          + New Character
        </NuxtLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="library__filters">
      <div class="filter-group">
        <input
          v-model="filters.search"
          type="text"
          class="form-input"
          placeholder="Search..."
        />
      </div>

      <div class="filter-group">
        <select v-model="filters.type" class="form-select">
          <option value="all">All Types</option>
          <option value="human">Humans Only</option>
          <option value="pokemon">Pokemon Only</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.characterType" class="form-select">
          <option value="all">All Characters</option>
          <option value="player">Players</option>
          <option value="npc">NPCs</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.pokemonOrigin" class="form-select">
          <option value="all">All Origins</option>
          <option value="manual">Manual</option>
          <option value="wild">Wild</option>
          <option value="captured">Captured</option>
          <option value="template">Template</option>
          <option value="import">Imported</option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.sortBy" class="form-select">
          <option value="name">Sort by Name</option>
          <option value="level">Sort by Level</option>
        </select>
      </div>

      <button class="btn btn--secondary btn--sm" @click="resetFilters">
        Reset
      </button>
    </div>

    <!-- Manage Panel -->
    <div v-if="showManagePanel" class="library__manage">
      <div class="manage-panel">
        <h4>Pokemon by Origin</h4>
        <div class="manage-panel__counts">
          <span v-for="(count, origin) in originCounts" :key="origin" class="manage-panel__count">
            {{ origin }}: {{ count }}
          </span>
        </div>
        <div class="manage-panel__actions">
          <button
            class="btn btn--secondary btn--sm"
            :disabled="unownedWildCount === 0"
            @click="archiveUnownedWild"
          >
            Archive Unowned Wild ({{ unownedWildCount }})
          </button>
          <button
            class="btn btn--danger btn--sm"
            :disabled="unownedWildCount === 0"
            @click="deleteUnownedWild"
          >
            Delete Unowned Wild ({{ unownedWildCount }})
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="library__content">
      <div v-if="loading" class="library__loading">
        Loading...
      </div>

      <div v-else-if="filteredHumans.length === 0 && filteredPokemon.length === 0" class="library__empty">
        <p>No characters found</p>
        <NuxtLink to="/gm/create" class="btn btn--primary">
          Create your first character
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Humans Section -->
        <section v-if="filters.type !== 'pokemon' && filteredHumans.length > 0" class="library__section">
          <h3>Trainers & NPCs ({{ filteredHumans.length }})</h3>
          <div class="library__grid">
            <HumanCard
              v-for="human in filteredHumans"
              :key="human.id"
              :human="human"
            />
          </div>
        </section>

        <!-- Pokemon Section -->
        <section v-if="filters.type !== 'human' && filteredPokemon.length > 0" class="library__section">
          <h3>Pokemon ({{ filteredPokemon.length }})</h3>
          <div class="library__grid">
            <PokemonCard
              v-for="pokemon in filteredPokemon"
              :key="pokemon.id"
              :pokemon="pokemon"
            />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter, Pokemon, LibraryFilters } from '~/types'

definePageMeta({
  layout: 'gm'
})

useHead({
  title: 'GM - Library'
})

const libraryStore = useLibraryStore()

// Load library on mount
onMounted(async () => {
  await libraryStore.loadLibrary()
})

// Local filters that sync with store
const filters = ref<LibraryFilters>({
  search: '',
  type: 'all',
  characterType: 'all',
  pokemonType: 'all',
  pokemonOrigin: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
})

// Watch and sync filters
watch(filters, (newFilters) => {
  libraryStore.setFilters(newFilters)
}, { deep: true })

// Manage panel
const showManagePanel = ref(false)

// Computed
const loading = computed(() => libraryStore.loading)
const filteredHumans = computed(() => libraryStore.filteredHumans)
const filteredPokemon = computed(() => libraryStore.filteredPokemon)

const originCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const p of libraryStore.pokemon) {
    const origin = p.origin || 'manual'
    counts[origin] = (counts[origin] || 0) + 1
  }
  return counts
})

const unownedWildCount = computed(() =>
  libraryStore.pokemon.filter(p => p.origin === 'wild' && !p.ownerId).length
)

// Actions
const archiveUnownedWild = async () => {
  const count = unownedWildCount.value
  if (count === 0) return
  if (!confirm(`Archive ${count} unowned wild Pokemon? They will be hidden from the library.`)) return
  try {
    await $fetch('/api/pokemon/bulk-action', {
      method: 'POST',
      body: { action: 'archive', filter: { origin: 'wild', hasOwner: false } }
    })
    await libraryStore.loadLibrary()
  } catch (e: any) {
    alert(`Archive failed: ${e.message || 'Unknown error'}`)
  }
}

const deleteUnownedWild = async () => {
  const count = unownedWildCount.value
  if (count === 0) return
  if (!confirm(`Permanently delete ${count} unowned wild Pokemon? This cannot be undone.`)) return
  try {
    await $fetch('/api/pokemon/bulk-action', {
      method: 'POST',
      body: { action: 'delete', filter: { origin: 'wild', hasOwner: false } }
    })
    await libraryStore.loadLibrary()
  } catch (e: any) {
    alert(`Delete failed: ${e.message || 'Unknown error'}`)
  }
}

const resetFilters = () => {
  filters.value = {
    search: '',
    type: 'all',
    characterType: 'all',
    pokemonType: 'all',
    pokemonOrigin: 'all',
    sortBy: 'name',
    sortOrder: 'asc'
  }
}

const deleteHuman = async (human: HumanCharacter) => {
  if (confirm(`Delete ${human.name}? This cannot be undone.`)) {
    await libraryStore.deleteHuman(human.id)
  }
}

const deletePokemon = async (pokemon: Pokemon) => {
  const name = pokemon.nickname || pokemon.species
  if (confirm(`Delete ${name}? This cannot be undone.`)) {
    await libraryStore.deletePokemon(pokemon.id)
  }
}
</script>

<style lang="scss" scoped>
.library {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-lg;

    h2 {
      margin: 0;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: $glass-bg;
    backdrop-filter: $glass-blur;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;

    .filter-group {
      flex: 1;
      min-width: 150px;
    }
  }

  &__manage {
    margin-bottom: $spacing-lg;
  }

  &__content {
    min-height: 400px;
  }

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: $color-text-muted;

    p {
      margin-bottom: $spacing-md;
    }
  }

  &__section {
    margin-bottom: $spacing-xl;

    h3 {
      margin-bottom: $spacing-md;
      padding-bottom: $spacing-sm;
      border-bottom: 1px solid $glass-border;
      font-weight: 600;
      color: $color-text;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: $spacing-md;
  }
}

.manage-panel {
  padding: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;

  h4 {
    margin: 0 0 $spacing-sm 0;
    font-weight: 600;
    color: $color-text;
  }

  &__counts {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;

    span {
      padding: 2px 8px;
      background: $color-bg-tertiary;
      border-radius: $border-radius-sm;
      font-size: $font-size-sm;
      color: $color-text-muted;
      text-transform: capitalize;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
  }
}
</style>
