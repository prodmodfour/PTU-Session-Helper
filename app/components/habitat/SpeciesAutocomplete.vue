<template>
  <div class="species-autocomplete" ref="containerRef">
    <input
      v-model="searchQuery"
      type="text"
      class="form-input"
      :placeholder="placeholder"
      @focus="showDropdown = true"
      @input="onInput"
      data-testid="species-search-input"
    />

    <div v-if="showDropdown && filteredSpecies.length > 0" class="autocomplete-dropdown">
      <div
        v-for="species in filteredSpecies"
        :key="species.id"
        class="autocomplete-item"
        :class="{ 'autocomplete-item--selected': species.id === modelValue }"
        @click="selectSpecies(species)"
        data-testid="species-option"
      >
        <span class="autocomplete-item__name">{{ species.name }}</span>
        <span class="autocomplete-item__types">
          <span
            v-for="(type, idx) in [species.type1, species.type2].filter((t): t is string => !!t)"
            :key="idx"
            class="type-badge"
            :class="`type-badge--${type.toLowerCase()}`"
          >
            {{ type }}
          </span>
        </span>
      </div>
    </div>

    <div v-else-if="showDropdown && searchQuery && !loading" class="autocomplete-dropdown">
      <div class="autocomplete-empty">
        No species found
      </div>
    </div>

    <div v-else-if="showDropdown && loading" class="autocomplete-dropdown">
      <div class="autocomplete-loading">
        Loading...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SpeciesData } from '~/types'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const showDropdown = ref(false)
const loading = ref(false)
const species = ref<SpeciesData[]>([])

// Filter species based on search
const filteredSpecies = computed(() => {
  if (!searchQuery.value) return species.value.slice(0, 20)

  const query = searchQuery.value.toLowerCase()
  return species.value
    .filter(s => s.name.toLowerCase().includes(query))
    .slice(0, 20)
})

// Load species on mount
onMounted(async () => {
  await loadSpecies()

  // Close dropdown when clicking outside
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    showDropdown.value = false
  }
}

const loadSpecies = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ data: SpeciesData[] }>('/api/species')
    species.value = response.data
  } catch (error) {
    console.error('Failed to load species:', error)
  } finally {
    loading.value = false
  }
}

const onInput = () => {
  showDropdown.value = true
}

const selectSpecies = (speciesData: SpeciesData) => {
  searchQuery.value = speciesData.name
  emit('update:modelValue', speciesData.id)
  showDropdown.value = false
}
</script>

<style lang="scss" scoped>
.species-autocomplete {
  position: relative;
  flex: 1;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: $color-bg-secondary;
  border: 1px solid $glass-border;
  border-radius: $border-radius-md;
  box-shadow: $shadow-lg;
  z-index: 100;
  margin-top: $spacing-xs;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: background $transition-fast;

  &:hover {
    background: $color-bg-tertiary;
  }

  &--selected {
    background: rgba($color-accent-scarlet, 0.1);
  }

  &__name {
    font-weight: 500;
  }

  &__types {
    display: flex;
    gap: $spacing-xs;
  }
}

.autocomplete-empty,
.autocomplete-loading {
  padding: $spacing-lg;
  text-align: center;
  color: $color-text-muted;
  font-style: italic;
}

.type-badge {
  @include pokemon-sheet-type-badge;
}
</style>
