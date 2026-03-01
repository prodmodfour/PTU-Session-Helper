<template>
  <div class="levelup-features">
    <div class="levelup-features__header">
      <h3>Features</h3>
      <span
        class="counter"
        :class="{ 'counter--full': featureChoices.length >= totalFeatures }"
      >
        {{ featureChoices.length }} / {{ totalFeatures }}
      </span>
    </div>

    <div v-if="trainerClasses.length" class="levelup-features__classes">
      <span class="class-hint-label">Your Classes:</span>
      <span
        v-for="cls in trainerClasses"
        :key="cls"
        class="class-hint-tag"
      >
        {{ cls }}
      </span>
    </div>

    <div class="feature-input">
      <input
        v-model="newFeature"
        type="text"
        class="form-input"
        placeholder="Enter feature name..."
        :disabled="featureChoices.length >= totalFeatures"
        @keydown.enter.prevent="onAddFeature"
      />
      <button
        class="btn btn--primary btn--sm"
        :disabled="!newFeature.trim() || featureChoices.length >= totalFeatures"
        @click="onAddFeature"
      >
        Add
      </button>
    </div>

    <div v-if="featureChoices.length" class="selected-tags">
      <span
        v-for="(feat, i) in featureChoices"
        :key="i"
        class="tag tag--feature"
      >
        {{ feat }}
        <button class="tag__remove" @click="$emit('removeFeature', i)">&times;</button>
      </span>
    </div>

    <p class="levelup-features__tip">
      Features should come from your owned class feature lists.
    </p>

    <div v-if="currentFeatures.length" class="levelup-features__existing">
      <details>
        <summary class="existing-summary">Current Features ({{ currentFeatures.length }})</summary>
        <div class="existing-list">
          <span
            v-for="feat in currentFeatures"
            :key="feat"
            class="existing-tag"
          >
            {{ feat }}
          </span>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** Current features on the character */
  currentFeatures: string[]
  /** Features chosen so far in this level-up session */
  featureChoices: string[]
  /** Total features to choose */
  totalFeatures: number
  /** Current trainer classes (for informational display) */
  trainerClasses: string[]
}

defineProps<Props>()

const emit = defineEmits<{
  addFeature: [featureName: string]
  removeFeature: [index: number]
}>()

// --- Local State ---
const newFeature = ref('')

// --- Methods ---
function onAddFeature(): void {
  const trimmed = newFeature.value.trim()
  if (!trimmed) return
  emit('addFeature', trimmed)
  newFeature.value = ''
}
</script>

<style lang="scss" scoped>
.levelup-features {
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

  &__classes {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
    padding: $spacing-sm $spacing-md;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
  }

  &__tip {
    font-size: $font-size-xs;
    color: $color-text-muted;
    font-style: italic;
    margin: $spacing-md 0 0 0;
  }

  &__existing {
    margin-top: $spacing-md;
    padding: $spacing-sm;
    background: $color-bg-tertiary;
    border: 1px solid $border-color-default;
    border-radius: $border-radius-sm;
  }
}

.class-hint-label {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  font-weight: 600;
}

.class-hint-tag {
  font-size: $font-size-xs;
  color: $color-accent-violet;
  padding: 2px $spacing-xs;
  background: rgba($color-accent-violet, 0.1);
  border: 1px solid rgba($color-accent-violet, 0.2);
  border-radius: $border-radius-sm;
}

.counter {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border-radius: $border-radius-sm;

  &--full {
    color: $color-success;
    background: rgba($color-success, 0.1);
  }
}

.feature-input {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-sm;

  .form-input {
    flex: 1;
  }
}

.selected-tags {
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

  &--feature {
    background: rgba($color-accent-violet, 0.1);
    border: 1px solid rgba($color-accent-violet, 0.3);
    color: $color-text;
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

.existing-summary {
  font-size: $font-size-xs;
  color: $color-text-secondary;
  cursor: pointer;
  padding: $spacing-xs;

  &:hover {
    color: $color-text;
  }
}

.existing-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  padding-top: $spacing-sm;
}

.existing-tag {
  font-size: $font-size-xs;
  color: $color-text-muted;
  padding: 2px $spacing-xs;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
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

  &--sm {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-xs;
  }
}
</style>
