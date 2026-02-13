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

      <div v-else-if="filteredPlayers.length === 0 && npcCount === 0 && pokemonCount === 0" class="library__empty">
        <p>No characters found</p>
        <NuxtLink to="/gm/create" class="btn btn--primary">
          Create your first character
        </NuxtLink>
      </div>

      <template v-else>
        <!-- Players Section -->
        <section v-if="filters.type !== 'pokemon' && filters.characterType !== 'npc' && filteredPlayers.length > 0" class="library__section">
          <h3>Players ({{ filteredPlayers.length }})</h3>
          <div class="library__grid">
            <HumanCard
              v-for="human in filteredPlayers"
              :key="human.id"
              :human="human"
            />
          </div>
        </section>

        <!-- NPCs by Location Section -->
        <section v-if="filters.type !== 'pokemon' && filters.characterType !== 'player' && groupedNpcs.length > 0" class="library__section">
          <h3>NPCs ({{ npcCount }})</h3>
          <div class="location-groups">
            <div
              v-for="group in groupedNpcs"
              :key="group.location"
              class="location-group"
            >
              <button
                class="location-group__header"
                @click="toggleLocation(group.location)"
              >
                <PhMapPin :size="16" class="location-group__icon" />
                <span class="location-group__name">{{ group.location }}</span>
                <span class="location-group__count">{{ group.humans.length }}</span>
                <PhCaretDown
                  :size="14"
                  class="location-group__caret"
                  :class="{ 'location-group__caret--open': expandedLocations.has(group.location) }"
                />
              </button>
              <div v-if="expandedLocations.has(group.location)" class="library__grid">
                <HumanCard
                  v-for="human in group.humans"
                  :key="human.id"
                  :human="human"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Pokemon by Location Section -->
        <section v-if="filters.type !== 'human' && groupedPokemon.length > 0" class="library__section">
          <h3>Pokemon ({{ pokemonCount }})</h3>
          <div class="location-groups">
            <div
              v-for="group in groupedPokemon"
              :key="group.location"
              class="location-group"
            >
              <button
                class="location-group__header"
                @click="togglePokemonLocation(group.location)"
              >
                <PhMapPin :size="16" class="location-group__icon" />
                <span class="location-group__name">{{ group.location }}</span>
                <span class="location-group__count">{{ group.pokemon.length }}</span>
                <PhCaretDown
                  :size="14"
                  class="location-group__caret"
                  :class="{ 'location-group__caret--open': expandedPokemonLocations.has(group.location) }"
                />
              </button>
              <div v-if="expandedPokemonLocations.has(group.location)" class="library__grid">
                <PokemonCard
                  v-for="pokemon in group.pokemon"
                  :key="pokemon.id"
                  :pokemon="pokemon"
                />
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhMapPin, PhCaretDown } from '@phosphor-icons/vue'
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
const filteredPlayers = computed(() => libraryStore.filteredPlayers)
const groupedNpcs = computed(() => libraryStore.groupedNpcsByLocation)
const npcCount = computed(() => groupedNpcs.value.reduce((sum, g) => sum + g.humans.length, 0))
const groupedPokemon = computed(() => libraryStore.groupedPokemonByLocation)
const pokemonCount = computed(() => groupedPokemon.value.reduce((sum, g) => sum + g.pokemon.length, 0))

// Location group collapse state — all expanded by default
const expandedLocations = ref(new Set<string>())

watch(groupedNpcs, (groups) => {
  expandedLocations.value = new Set(groups.map(g => g.location))
}, { immediate: true })

const toggleLocation = (location: string) => {
  const next = new Set(expandedLocations.value)
  if (next.has(location)) {
    next.delete(location)
  } else {
    next.add(location)
  }
  expandedLocations.value = next
}

// Pokemon location group collapse state — all expanded by default
const expandedPokemonLocations = ref(new Set<string>())

watch(groupedPokemon, (groups) => {
  expandedPokemonLocations.value = new Set(groups.map(g => g.location))
}, { immediate: true })

const togglePokemonLocation = (location: string) => {
  const next = new Set(expandedPokemonLocations.value)
  if (next.has(location)) {
    next.delete(location)
  } else {
    next.add(location)
  }
  expandedPokemonLocations.value = next
}

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

.location-groups {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.location-group {
  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    width: 100%;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid $glass-border;
    border-radius: $border-radius-md;
    cursor: pointer;
    color: $color-text;
    font-size: $font-size-sm;
    transition: all $transition-fast;

    &:hover {
      background: $color-bg-hover;
      border-color: rgba($color-accent-violet, 0.3);
    }
  }

  &__icon {
    color: $color-accent-violet;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    text-align: left;
    font-weight: 600;
  }

  &__count {
    padding: 2px $spacing-sm;
    background: $color-bg-secondary;
    border-radius: $border-radius-full;
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__caret {
    transition: transform 0.15s ease;
    color: $color-text-muted;

    &--open {
      transform: rotate(180deg);
    }
  }

  .library__grid {
    margin-top: $spacing-sm;
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
