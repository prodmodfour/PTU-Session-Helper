<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal start-encounter-modal">
      <div class="modal__header">
        <h3>Start Encounter</h3>
        <button class="modal__close" @click="$emit('close')">&times;</button>
      </div>

      <div class="modal__body">
        <p class="scene-summary">
          Create encounter from <strong>{{ sceneName }}</strong>
        </p>

        <div class="entity-counts">
          <div v-if="pokemonCount > 0" class="entity-count">
            <PhPawPrint :size="18" />
            <span>{{ pokemonCount }} wild Pokemon (enemies)</span>
          </div>
          <div v-if="characterCount > 0" class="entity-count">
            <PhUser :size="18" />
            <span>{{ characterCount }} characters (players)</span>
          </div>
          <div v-if="pokemonCount === 0 && characterCount === 0" class="entity-count entity-count--empty">
            <PhWarning :size="18" />
            <span>No Pokemon or characters in this scene</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Battle Type</label>
          <div class="battle-type-options">
            <label class="radio-option" :class="{ 'radio-option--selected': battleType === 'full_contact' }">
              <input type="radio" v-model="battleType" value="full_contact" />
              <div class="radio-option__content">
                <strong>Full Contact</strong>
                <span>All combatants act in speed order</span>
              </div>
            </label>
            <label class="radio-option" :class="{ 'radio-option--selected': battleType === 'trainer' }">
              <input type="radio" v-model="battleType" value="trainer" />
              <div class="radio-option__content">
                <strong>Trainer (League)</strong>
                <span>Trainers declare, then Pokemon act</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('close')">Cancel</button>
        <button
          class="btn btn--warning"
          :disabled="pokemonCount === 0 && characterCount === 0"
          @click="handleConfirm"
        >
          <PhSword :size="16" />
          Start Encounter
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhPawPrint, PhUser, PhWarning, PhSword } from '@phosphor-icons/vue'

defineProps<{
  sceneName: string
  pokemonCount: number
  characterCount: number
}>()

const emit = defineEmits<{
  close: []
  confirm: [options: { battleType: 'trainer' | 'full_contact' }]
}>()

const battleType = ref<'trainer' | 'full_contact'>('full_contact')

const handleConfirm = () => {
  emit('confirm', { battleType: battleType.value })
}
</script>

<style lang="scss" scoped>
.start-encounter-modal {
  max-width: 440px;
}

.scene-summary {
  margin-bottom: $spacing-md;
  color: $color-text-muted;
}

.entity-counts {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border-radius: $border-radius-md;
}

.entity-count {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  color: $color-text;

  &--empty {
    color: $color-text-muted;
  }
}

.battle-type-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
  }

  &--selected {
    border-color: $color-warning;
    background: rgba($color-warning, 0.1);
  }

  input[type="radio"] {
    margin-top: 3px;
    accent-color: $color-warning;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
      color: $color-text;
    }

    span {
      font-size: $font-size-sm;
      color: $color-text-muted;
    }
  }
}

// Reuse shared modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: $color-bg-secondary;
  border-radius: $border-radius-lg;
  border: 1px solid $glass-border;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-md $spacing-lg;
    border-bottom: 1px solid $glass-border;

    h3 {
      margin: 0;
      color: $color-text;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-text-muted;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: $color-text;
    }
  }

  &__body {
    padding: $spacing-lg;
    overflow-y: auto;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
    padding: $spacing-md $spacing-lg;
    border-top: 1px solid $glass-border;
  }
}
</style>
