<template>
  <div class="ability-assignment-panel">
    <div class="ability-assignment-panel__header">
      <h4>
        <PhLightning :size="16" class="header-icon" />
        Ability Assignment (Level {{ milestone === 'second' ? 20 : 40 }}: {{ milestone === 'second' ? 'Second' : 'Third' }} Ability)
      </h4>
    </div>

    <!-- Current abilities -->
    <div class="ability-assignment-panel__current">
      <span class="current-label">Current {{ currentAbilities.length === 1 ? 'Ability' : 'Abilities' }}:</span>
      <span
        v-for="ability in currentAbilities"
        :key="ability.name"
        class="current-ability"
      >
        {{ ability.name }}
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="ability-assignment-panel__loading">
      <PhSpinner :size="20" class="spinner-icon" />
      Loading available abilities...
    </div>

    <!-- Error state -->
    <div v-else-if="errorMsg" class="ability-assignment-panel__error">
      <PhWarning :size="16" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- No abilities available -->
    <div v-else-if="abilityOptions.length === 0" class="ability-assignment-panel__empty">
      <PhInfo :size="16" />
      <span>No abilities available for this milestone.</span>
    </div>

    <!-- Ability options -->
    <div v-else class="ability-assignment-panel__options">
      <p class="options-prompt">
        Choose from {{ milestone === 'second' ? 'Basic/Advanced' : 'any' }} abilities:
      </p>

      <label
        v-for="option in abilityOptions"
        :key="option.name"
        class="ability-option"
        :class="{ 'ability-option--selected': selectedAbility === option.name }"
      >
        <input
          type="radio"
          :value="option.name"
          :checked="selectedAbility === option.name"
          name="ability-selection"
          class="ability-option__radio"
          @change="selectedAbility = option.name"
        />
        <div class="ability-option__content">
          <div class="ability-option__header">
            <span class="ability-option__name">{{ option.name }}</span>
            <span
              class="ability-option__category"
              :class="`ability-option__category--${option.category.toLowerCase()}`"
            >
              {{ option.category }}
            </span>
          </div>
          <p v-if="option.effect" class="ability-option__effect">{{ option.effect }}</p>
        </div>
      </label>
    </div>

    <!-- Actions -->
    <div class="ability-assignment-panel__actions">
      <button class="btn btn--secondary btn--sm" @click="handleCancel">
        Cancel
      </button>
      <button
        class="btn btn--primary btn--sm"
        :disabled="!selectedAbility || saving"
        @click="handleAssign"
      >
        {{ saving ? 'Assigning...' : 'Assign Ability' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhLightning, PhSpinner, PhWarning, PhInfo } from '@phosphor-icons/vue'
import type { Pokemon } from '~/types'
import { getAbilityPool } from '~/utils/abilityAssignment'
import type { CategorizedAbility } from '~/utils/abilityAssignment'

interface AbilityOption {
  name: string
  category: string
  effect: string
}

const props = defineProps<{
  pokemon: Pokemon
  milestone: 'second' | 'third'
  speciesAbilities: string[]
  numBasicAbilities: number
}>()

const emit = defineEmits<{
  (e: 'assigned', ability: { name: string; effect: string }): void
  (e: 'cancelled'): void
}>()

const selectedAbility = ref<string | null>(null)
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref<string | null>(null)
const abilityOptions = ref<AbilityOption[]>([])

const currentAbilities = computed(() => props.pokemon.abilities || [])

async function loadAbilityDetails() {
  loading.value = true
  errorMsg.value = null

  try {
    // Compute the pool
    const pool = getAbilityPool({
      speciesAbilities: props.speciesAbilities,
      numBasicAbilities: props.numBasicAbilities,
      currentAbilities: currentAbilities.value.map(a => a.name),
      milestone: props.milestone
    })

    if (pool.available.length === 0) {
      abilityOptions.value = []
      loading.value = false
      return
    }

    // Fetch ability details in batch
    const names = pool.available.map(a => a.name)
    const response = await $fetch<{ success: boolean; data: Array<{ name: string; effect: string }> }>(
      '/api/abilities/batch',
      { method: 'POST', body: { names } }
    )

    if (response.success) {
      // Merge pool categories with fetched effects
      const effectMap = new Map(response.data.map(a => [a.name, a.effect]))
      abilityOptions.value = pool.available.map((a: CategorizedAbility) => ({
        name: a.name,
        category: a.category,
        effect: effectMap.get(a.name) ?? ''
      }))
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load ability details'
    errorMsg.value = message
  } finally {
    loading.value = false
  }
}

async function handleAssign() {
  if (!selectedAbility.value) return

  saving.value = true
  errorMsg.value = null

  try {
    const response = await $fetch<{
      success: boolean
      data: { assignedAbility: { name: string; effect: string } }
    }>(
      `/api/pokemon/${props.pokemon.id}/assign-ability`,
      {
        method: 'POST',
        body: {
          abilityName: selectedAbility.value,
          milestone: props.milestone
        }
      }
    )

    if (response.success) {
      emit('assigned', response.data.assignedAbility)
    }
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    errorMsg.value = fetchError.data?.message || 'Failed to assign ability'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  emit('cancelled')
}

// Load on mount
onMounted(() => {
  loadAbilityDetails()
})
</script>

<style lang="scss" scoped>
.ability-assignment-panel {
  background: linear-gradient(135deg, rgba($color-accent-pink, 0.08) 0%, rgba($color-accent-violet, 0.04) 100%);
  border: 1px solid rgba($color-accent-pink, 0.25);
  border-radius: $border-radius-lg;
  padding: $spacing-md $spacing-lg;
  margin-top: $spacing-md;
  animation: slideDown 0.3s ease-out;

  &__header {
    margin-bottom: $spacing-md;

    h4 {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      margin: 0;
      color: $color-accent-pink;
      font-size: $font-size-md;
    }
  }

  &__current {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-bg-secondary, 0.5);
    border-radius: $border-radius-sm;
    font-size: $font-size-sm;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__error {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-sm $spacing-md;
    background: rgba($color-danger, 0.1);
    border: 1px solid rgba($color-danger, 0.3);
    border-radius: $border-radius-sm;
    color: $color-danger;
    font-size: $font-size-sm;
    margin-bottom: $spacing-md;
  }

  &__empty {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    padding: $spacing-md;
    color: $color-text-muted;
    font-size: $font-size-sm;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
}

.header-icon {
  flex-shrink: 0;
}

.current-label {
  font-weight: 600;
  color: $color-text-muted;
  white-space: nowrap;
}

.current-ability {
  padding: 2px $spacing-sm;
  background: rgba($color-accent-violet, 0.15);
  border: 1px solid rgba($color-accent-violet, 0.3);
  border-radius: $border-radius-sm;
  font-size: $font-size-xs;
  font-weight: 600;
  color: $color-accent-violet-light;
}

.options-prompt {
  font-size: $font-size-sm;
  color: $color-text-muted;
  margin: 0 0 $spacing-sm 0;
}

.spinner-icon {
  animation: spin 1s linear infinite;
}

.ability-option {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  background: rgba($color-bg-primary, 0.3);
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: rgba($color-bg-hover, 0.5);
    border-color: rgba($color-accent-pink, 0.3);
  }

  &--selected {
    background: rgba($color-accent-pink, 0.1);
    border-color: rgba($color-accent-pink, 0.5);
  }

  &__radio {
    margin-top: 3px;
    flex-shrink: 0;
    accent-color: $color-accent-pink;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: 2px;
  }

  &__name {
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-text;
  }

  &__category {
    font-size: $font-size-xs;
    font-weight: 600;
    padding: 1px $spacing-xs;
    border-radius: $border-radius-sm;
    text-transform: uppercase;

    &--basic {
      background: rgba($color-success, 0.15);
      color: $color-success;
    }

    &--advanced {
      background: rgba($color-accent-teal, 0.15);
      color: $color-accent-teal;
    }

    &--high {
      background: rgba($color-warning, 0.15);
      color: $color-warning;
    }
  }

  &__effect {
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin: 0;
    line-height: 1.4;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
