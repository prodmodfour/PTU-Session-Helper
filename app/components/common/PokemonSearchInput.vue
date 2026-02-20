<template>
  <div class="pokemon-search" :class="{ 'is-open': showDropdown }">
    <input
      ref="inputRef"
      :value="modelValue"
      type="text"
      class="form-input"
      :placeholder="placeholder"
      autocomplete="off"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
    />

    <div v-if="showDropdown && filteredSpecies.length > 0" class="search-dropdown">
      <div
        v-for="(species, index) in filteredSpecies"
        :key="species.id"
        class="search-option"
        :class="{ 'is-highlighted': index === highlightedIndex }"
        @mousedown.prevent="selectSpecies(species)"
        @mouseover="highlightedIndex = index"
      >
        <span class="species-name">{{ species.name }}</span>
        <span class="species-types">
          <span
            v-for="type in getTypes(species)"
            :key="type"
            class="type-badge"
            :class="`type-badge--${type.toLowerCase()}`"
          >
            {{ type }}
          </span>
        </span>
      </div>
    </div>

    <div v-else-if="showDropdown && modelValue && modelValue.length >= 2" class="search-dropdown search-dropdown--empty">
      <div class="search-empty">No Pokemon found</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SpeciesData {
  id: string
  name: string
  types: string[]
}

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Search Pokemon...'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', species: { id: string; name: string }): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const showDropdown = ref(false)
const highlightedIndex = ref(0)
const speciesList = ref<SpeciesData[]>([])
const isLoading = ref(false)

// Load species list on mount
onMounted(async () => {
  await loadSpecies()
})

const loadSpecies = async () => {
  try {
    isLoading.value = true
    const response = await $fetch<{ data: SpeciesData[] }>('/api/species')
    speciesList.value = response.data || []
  } catch (error) {
    console.error('Failed to load species:', error)
    // Fallback: Try to load from seed data or use empty array
    speciesList.value = []
  } finally {
    isLoading.value = false
  }
}

const filteredSpecies = computed(() => {
  if (!props.modelValue || props.modelValue.length < 2) {
    return []
  }

  const search = props.modelValue.toLowerCase()
  return speciesList.value
    .filter(s => s.name.toLowerCase().includes(search))
    .slice(0, 10) // Limit to 10 results
})

const getTypes = (species: SpeciesData): string[] => {
  return species.types || []
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
  highlightedIndex.value = 0
}

const handleFocus = () => {
  showDropdown.value = true
}

const handleBlur = () => {
  // Delay to allow click on dropdown item
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showDropdown.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      highlightedIndex.value = Math.min(
        highlightedIndex.value + 1,
        filteredSpecies.value.length - 1
      )
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightedIndex.value = Math.max(highlightedIndex.value - 1, 0)
      break
    case 'Enter':
      event.preventDefault()
      if (filteredSpecies.value[highlightedIndex.value]) {
        selectSpecies(filteredSpecies.value[highlightedIndex.value])
      }
      break
    case 'Escape':
      showDropdown.value = false
      break
  }
}

const selectSpecies = (species: SpeciesData) => {
  emit('update:modelValue', species.name)
  emit('select', { id: species.id, name: species.name })
  showDropdown.value = false
}
</script>

<style lang="scss" scoped>
.pokemon-search {
  position: relative;

  &.is-open .form-input {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-color: $color-primary;
  }
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: $color-bg-secondary;
  border: 1px solid $color-primary;
  border-top: none;
  border-radius: 0 0 $border-radius-md $border-radius-md;
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;

  &--empty {
    padding: $spacing-md;
  }
}

.search-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover,
  &.is-highlighted {
    background: rgba($color-primary, 0.2);
  }
}

.species-name {
  color: $color-text;
  font-weight: 500;
}

.species-types {
  display: flex;
  gap: $spacing-xs;
}

.type-badge {
  @include pokemon-sheet-type-badge;
  font-size: 0.65rem;
}

.search-empty {
  text-align: center;
  color: $color-text-muted;
  font-size: 0.875rem;
}
</style>
