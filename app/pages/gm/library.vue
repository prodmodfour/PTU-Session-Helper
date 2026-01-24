<template>
  <div class="library">
    <div class="library__header">
      <h2>Character Library</h2>
      <div class="library__actions">
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
        <select v-model="filters.sortBy" class="form-select">
          <option value="name">Sort by Name</option>
          <option value="level">Sort by Level</option>
        </select>
      </div>

      <button class="btn btn--secondary btn--sm" @click="resetFilters">
        Reset
      </button>
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
              @delete="deleteHuman"
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
              @delete="deletePokemon"
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
  sortBy: 'name',
  sortOrder: 'asc'
})

// Watch and sync filters
watch(filters, (newFilters) => {
  libraryStore.setFilters(newFilters)
}, { deep: true })

// Computed
const loading = computed(() => libraryStore.loading)
const filteredHumans = computed(() => libraryStore.filteredHumans)
const filteredPokemon = computed(() => libraryStore.filteredPokemon)

// Actions
const resetFilters = () => {
  filters.value = {
    search: '',
    type: 'all',
    characterType: 'all',
    pokemonType: 'all',
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
</style>
