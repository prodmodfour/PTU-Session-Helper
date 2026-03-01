<template>
  <div class="levelup-classes">
    <div class="levelup-classes__header">
      <h3>New Trainer Class</h3>
      <span class="levelup-classes__levels">
        Level{{ classChoiceLevels.length > 1 ? 's' : '' }}
        {{ classChoiceLevels.join(' / ') }}
      </span>
    </div>

    <div class="levelup-classes__current">
      <span class="current-label">Current Classes ({{ totalClassCount }}/{{ maxClasses }}):</span>
      <div class="current-tags">
        <span
          v-for="cls in currentClasses"
          :key="cls"
          class="tag tag--class tag--existing"
        >
          {{ cls }}
        </span>
        <span
          v-for="cls in newClassChoices"
          :key="cls"
          class="tag tag--class tag--new"
        >
          {{ cls }}
          <button class="tag__remove" @click="$emit('removeClass', cls)">&times;</button>
        </span>
      </div>
    </div>

    <p class="levelup-classes__hint">
      Optional: Choose a new trainer class for which you qualify.
    </p>

    <!-- Class Picker -->
    <div v-if="canAddMore" class="class-picker">
      <div class="class-picker__search">
        <input
          v-model="classSearch"
          type="text"
          class="form-input"
          placeholder="Search classes..."
        />
      </div>

      <div class="class-picker__groups">
        <div
          v-for="category in visibleCategories"
          :key="category"
          class="class-group"
        >
          <h5 class="class-group__label">{{ category }}</h5>
          <div class="class-group__items">
            <button
              v-for="cls in filteredClassesByCategory(category)"
              :key="cls.name"
              class="class-option"
              :class="{
                'class-option--selected': isClassSelected(cls.name),
                'class-option--disabled': isClassDisabled(cls)
              }"
              :disabled="isClassDisabled(cls)"
              :title="cls.description"
              @click="toggleClass(cls)"
            >
              <span class="class-option__name">{{ cls.name }}</span>
              <span v-if="cls.isBranching" class="class-option__branching">[Branch]</span>
              <span v-if="cls.associatedSkills.length" class="class-option__skills">
                {{ cls.associatedSkills.join(', ') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="levelup-classes__full">
      Maximum classes reached ({{ maxClasses }}/{{ maxClasses }}).
    </div>

    <!-- Branching Specialization Picker -->
    <div v-if="pendingBranching" class="levelup-classes__branching-prompt">
      <label>{{ pendingBranching.name }} Specialization:</label>
      <div class="branching-input">
        <select
          v-model="branchingSpec"
          class="form-select"
        >
          <option value="" disabled>Select specialization...</option>
          <option
            v-for="spec in availableSpecializations"
            :key="spec"
            :value="spec"
          >
            {{ spec }}
          </option>
        </select>
        <button class="btn btn--primary btn--sm" :disabled="!branchingSpec" @click="confirmBranching">
          Confirm
        </button>
        <button class="btn btn--secondary btn--sm" @click="cancelBranching">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrainerClassDef, TrainerClassCategory } from '~/constants/trainerClasses'
import {
  TRAINER_CLASSES,
  TRAINER_CLASS_CATEGORIES,
  getBranchingSpecializations,
  hasBaseClass,
  getSpecialization
} from '~/constants/trainerClasses'

interface Props {
  /** Current trainer classes on the character */
  currentClasses: string[]
  /** Max classes allowed */
  maxClasses: number
  /** Levels that prompt class choice in this advancement */
  classChoiceLevels: number[]
  /** New classes chosen so far */
  newClassChoices: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  addClass: [className: string]
  removeClass: [className: string]
}>()

// --- Local State ---
const classSearch = ref('')
const pendingBranching = ref<TrainerClassDef | null>(null)
const branchingSpec = ref('')

// --- Computed ---
/** Total combined classes (existing + new) */
const totalClassCount = computed(() =>
  props.currentClasses.length + props.newClassChoices.length
)

const canAddMore = computed(() => totalClassCount.value < props.maxClasses)

/** All classes combined for selection checks */
const allClasses = computed(() => [
  ...props.currentClasses,
  ...props.newClassChoices
])

const normalizedSearch = computed(() => classSearch.value.toLowerCase().trim())

const filteredClasses = computed((): TrainerClassDef[] => {
  if (!normalizedSearch.value) return TRAINER_CLASSES
  return TRAINER_CLASSES.filter(cls =>
    cls.name.toLowerCase().includes(normalizedSearch.value) ||
    cls.category.toLowerCase().includes(normalizedSearch.value) ||
    cls.description.toLowerCase().includes(normalizedSearch.value) ||
    cls.associatedSkills.some(s => s.toLowerCase().includes(normalizedSearch.value))
  )
})

const visibleCategories = computed((): TrainerClassCategory[] =>
  TRAINER_CLASS_CATEGORIES.filter(cat =>
    filteredClasses.value.some(cls => cls.category === cat)
  )
)

const availableSpecializations = computed((): readonly string[] => {
  if (!pendingBranching.value) return []
  const allSpecs = getBranchingSpecializations(pendingBranching.value.name)
  const taken = new Set(takenSpecializations(pendingBranching.value.name))
  return allSpecs.filter(s => !taken.has(s))
})

// --- Methods ---
function filteredClassesByCategory(category: TrainerClassCategory): TrainerClassDef[] {
  return filteredClasses.value.filter(cls => cls.category === category)
}

function isClassSelected(className: string): boolean {
  return allClasses.value.some(c => hasBaseClass(c, className))
}

function isClassDisabled(cls: TrainerClassDef): boolean {
  const atMax = totalClassCount.value >= props.maxClasses
  if (isClassSelected(cls.name)) {
    if (cls.isBranching) {
      return isFullySpecialized(cls.name) || atMax
    }
    // Non-branching: only allow removal if it's a new choice
    return !props.newClassChoices.some(c => hasBaseClass(c, cls.name))
  }
  return atMax
}

function takenSpecializations(className: string): string[] {
  return allClasses.value
    .filter(c => hasBaseClass(c, className))
    .map(c => getSpecialization(c))
    .filter((s): s is string => s !== null)
}

function isFullySpecialized(className: string): boolean {
  const allSpecs = getBranchingSpecializations(className)
  if (allSpecs.length === 0) return false
  const taken = takenSpecializations(className)
  return taken.length >= allSpecs.length
}

function toggleClass(cls: TrainerClassDef): void {
  if (cls.isBranching) {
    if (isClassSelected(cls.name) && !isFullySpecialized(cls.name)) {
      // Has one instance, more specializations available -- open picker
      pendingBranching.value = cls
      branchingSpec.value = ''
    } else if (!isClassSelected(cls.name)) {
      // No instances yet -- open picker
      pendingBranching.value = cls
      branchingSpec.value = ''
    }
  } else {
    // Non-branching: toggle
    if (props.newClassChoices.includes(cls.name)) {
      emit('removeClass', cls.name)
    } else if (!isClassSelected(cls.name)) {
      emit('addClass', cls.name)
    }
  }
}

function confirmBranching(): void {
  if (!pendingBranching.value || !branchingSpec.value) return
  emit('addClass', `${pendingBranching.value.name}: ${branchingSpec.value}`)
  pendingBranching.value = null
  branchingSpec.value = ''
}

function cancelBranching(): void {
  pendingBranching.value = null
  branchingSpec.value = ''
}
</script>

<style lang="scss" scoped>
.levelup-classes {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-md;

    h3 {
      margin: 0;
      font-size: $font-size-md;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__levels {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    padding: $spacing-xs $spacing-sm;
    background: $color-bg-tertiary;
    border-radius: $border-radius-sm;
  }

  &__current {
    margin-bottom: $spacing-md;
    padding: $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
  }

  &__hint {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin: 0 0 $spacing-md 0;
    font-style: italic;
  }

  &__full {
    font-size: $font-size-sm;
    color: $color-text-muted;
    padding: $spacing-md;
    text-align: center;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
  }

  &__branching-prompt {
    margin-top: $spacing-md;
    padding: $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid rgba($color-accent-violet, 0.3);
    border-radius: $border-radius-sm;

    label {
      display: block;
      font-size: $font-size-sm;
      font-weight: 600;
      color: $color-accent-violet;
      margin-bottom: $spacing-sm;
    }
  }
}

.current-label {
  display: block;
  font-size: $font-size-xs;
  color: $color-text-secondary;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: $spacing-sm;
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;

  &--class {
    background: rgba($color-accent-violet, 0.1);
    border: 1px solid rgba($color-accent-violet, 0.3);
    color: $color-text;
  }

  &--existing {
    opacity: 0.7;
  }

  &--new {
    border-color: rgba($color-success, 0.4);
    background: rgba($color-success, 0.1);
  }

  &__remove {
    background: none;
    border: none;
    color: $color-text-muted;
    cursor: pointer;
    padding: 0;
    font-size: $font-size-md;
    line-height: 1;

    &:hover {
      color: $color-danger;
    }
  }
}

.class-picker {
  margin-bottom: $spacing-md;

  &__search {
    margin-bottom: $spacing-sm;
  }

  &__groups {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
    background: $color-bg-tertiary;
    padding: $spacing-sm;
  }
}

.class-group {
  margin-bottom: $spacing-sm;

  &:last-child {
    margin-bottom: 0;
  }

  &__label {
    margin: 0 0 $spacing-xs 0;
    font-size: $font-size-xs;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-xs;
  }
}

.class-option {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  cursor: pointer;
  font-size: $font-size-sm;
  transition: all $transition-fast;

  &:hover:not(:disabled) {
    border-color: $color-accent-violet;
    background: rgba($color-accent-violet, 0.1);
  }

  &--selected {
    background: rgba($color-accent-violet, 0.15);
    border-color: rgba($color-accent-violet, 0.4);
    color: $color-accent-violet;
  }

  &--disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &__name {
    font-weight: 500;
  }

  &__branching {
    color: $color-warning;
    font-weight: 700;
    font-size: $font-size-xs;
  }

  &__skills {
    font-size: $font-size-xs;
    color: $color-text-secondary;
    font-style: italic;
  }
}

.branching-input {
  display: flex;
  gap: $spacing-sm;
  align-items: center;

  .form-select {
    flex: 1;
  }
}

.btn {
  padding: $spacing-xs $spacing-sm;
  border: 1px solid transparent;
  border-radius: $border-radius-sm;
  font-size: $font-size-sm;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-fast;

  &--primary {
    background: $gradient-sv-cool;
    color: $color-text;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--secondary {
    background: $color-bg-tertiary;
    color: $color-text-secondary;
    border-color: $border-color-default;

    &:hover {
      background: $color-bg-hover;
      color: $color-text;
    }
  }

  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }
}
</style>
