<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal__header">
        <h2>{{ move.name }}</h2>
        <span class="type-badge" :class="`type-badge--${move.type?.toLowerCase() || 'normal'}`">
          {{ move.type }}
        </span>
      </div>

      <div class="modal__body">
        <!-- Move Info -->
        <div class="move-info">
          <div class="move-info__stat">
            <span class="label">Class:</span>
            <span>{{ move.damageClass }}</span>
          </div>
          <div v-if="move.damageBase" class="move-info__stat">
            <span class="label">Damage Base:</span>
            <span>{{ move.damageBase }}</span>
          </div>
          <div v-if="move.ac" class="move-info__stat">
            <span class="label">AC:</span>
            <span>{{ move.ac }}</span>
          </div>
          <div class="move-info__stat">
            <span class="label">Range:</span>
            <span>{{ move.range }}</span>
          </div>
        </div>

        <div v-if="move.effect" class="move-effect">
          {{ move.effect }}
        </div>

        <!-- Target Selection -->
        <div class="target-selection">
          <h4>Select Target(s)</h4>
          <div class="target-list">
            <button
              v-for="target in targets"
              :key="target.id"
              class="target-btn"
              :class="{
                'target-btn--selected': selectedTargets.includes(target.id),
                'target-btn--ally': target.side === 'players' || target.side === 'allies',
                'target-btn--enemy': target.side === 'enemies'
              }"
              @click="toggleTarget(target.id)"
            >
              <span class="target-btn__name">{{ getTargetName(target) }}</span>
              <span class="target-btn__hp">{{ target.entity.currentHp }}/{{ target.entity.maxHp }}</span>
            </button>
          </div>
        </div>

        <!-- Damage Input -->
        <div v-if="move.damageBase" class="damage-input">
          <label>Damage to Apply</label>
          <input
            v-model.number="damageAmount"
            type="number"
            class="form-input"
            min="0"
            placeholder="Calculated damage"
          />
        </div>
      </div>

      <div class="modal__footer">
        <button class="btn btn--secondary" @click="$emit('cancel')">Cancel</button>
        <button
          class="btn btn--primary"
          :disabled="selectedTargets.length === 0"
          @click="confirm"
        >
          Use {{ move.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Move, Combatant, Pokemon, HumanCharacter } from '~/types'

const props = defineProps<{
  move: Move
  actor: Combatant
  targets: Combatant[]
}>()

const emit = defineEmits<{
  confirm: [targetIds: string[], damage?: number]
  cancel: []
}>()

const selectedTargets = ref<string[]>([])
const damageAmount = ref<number>(0)

const toggleTarget = (targetId: string) => {
  const index = selectedTargets.value.indexOf(targetId)
  if (index === -1) {
    selectedTargets.value.push(targetId)
  } else {
    selectedTargets.value.splice(index, 1)
  }
}

const getTargetName = (target: Combatant): string => {
  if (target.type === 'pokemon') {
    const pokemon = target.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (target.entity as HumanCharacter).name
}

const confirm = () => {
  emit('confirm', selectedTargets.value, damageAmount.value || undefined)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-index-modal;
  animation: fadeIn 0.2s ease-out;
}

.modal {
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-xl;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: $shadow-xl, 0 0 40px rgba($color-accent-violet, 0.15);
  animation: slideUp 0.3s ease-out;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-bottom: 1px solid $glass-border;
    background: linear-gradient(135deg, rgba($color-accent-violet, 0.1) 0%, transparent 100%);

    h2 {
      margin: 0;
      flex: 1;
      color: $color-text;
      font-weight: 600;
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $spacing-lg;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-md;
    padding: $spacing-lg;
    border-top: 1px solid $glass-border;
    background: rgba($color-bg-primary, 0.5);
  }
}

.move-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  &__stat {
    display: flex;
    gap: $spacing-sm;
    font-size: $font-size-sm;

    .label {
      color: $color-text-muted;
    }
  }
}

.move-effect {
  margin-bottom: $spacing-lg;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  font-size: $font-size-sm;
  color: $color-text-muted;
  line-height: 1.5;
}

.target-selection {
  margin-bottom: $spacing-lg;

  h4 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.target-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.target-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 2px solid transparent;
  border-radius: $border-radius-md;
  color: $color-text;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    background: $color-bg-hover;
    border-color: $border-color-emphasis;
  }

  &--selected {
    border-color: $color-accent-scarlet;
    background: linear-gradient(135deg, rgba($color-accent-scarlet, 0.15) 0%, rgba($color-accent-violet, 0.1) 100%);
    box-shadow: 0 0 10px rgba($color-accent-scarlet, 0.2);
  }

  &--ally {
    border-left: 4px solid $color-accent-scarlet;
  }

  &--enemy {
    border-left: 4px solid $color-accent-scarlet;
  }

  &__name {
    font-weight: 500;
  }

  &__hp {
    font-size: $font-size-sm;
    color: $color-text-muted;
  }
}

.damage-input {
  margin-bottom: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 500;
  }

  input {
    width: 150px;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
