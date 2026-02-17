<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal">
        <div class="modal__header">
          <h3>Status Conditions - {{ combatantName }}</h3>
          <button class="modal__close" @click="$emit('close')">&times;</button>
        </div>
        <div class="modal__body">
          <div class="status-grid">
            <label
              v-for="status in AVAILABLE_STATUSES"
              :key="status"
              class="status-checkbox"
              :class="{ 'status-checkbox--active': statusInputs.includes(status) }"
            >
              <input
                type="checkbox"
                :checked="statusInputs.includes(status)"
                @change="toggleStatus(status)"
              />
              <span class="status-checkbox__label">{{ status }}</span>
            </label>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn btn--secondary" @click="clearAllStatuses">Clear All</button>
          <button class="btn btn--primary" @click="applyStatuses">Save Changes</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { StatusCondition } from '~/types'

const props = defineProps<{
  combatantName: string
  currentStatuses: StatusCondition[]
}>()

const emit = defineEmits<{
  close: []
  save: [add: StatusCondition[], remove: StatusCondition[]]
}>()

const AVAILABLE_STATUSES: StatusCondition[] = [
  'Burned', 'Frozen', 'Paralyzed', 'Poisoned', 'Badly Poisoned',
  'Asleep', 'Confused', 'Flinched', 'Infatuated', 'Cursed',
  'Disabled', 'Enraged', 'Suppressed',
  'Stuck', 'Slowed', 'Trapped', 'Fainted',
  'Tripped', 'Vulnerable'
]

// Status inputs initialized from current values
const statusInputs = ref<StatusCondition[]>([...props.currentStatuses])

const toggleStatus = (status: StatusCondition) => {
  const index = statusInputs.value.indexOf(status)
  if (index === -1) {
    statusInputs.value.push(status)
  } else {
    statusInputs.value.splice(index, 1)
  }
}

const clearAllStatuses = () => {
  statusInputs.value = []
}

const applyStatuses = () => {
  // Calculate what to add and remove
  const toAdd = statusInputs.value.filter(s => !props.currentStatuses.includes(s))
  const toRemove = props.currentStatuses.filter(s => !statusInputs.value.includes(s))

  emit('save', toAdd, toRemove)
  emit('close')
}
</script>

<style lang="scss" scoped>
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $spacing-sm;
}

.status-checkbox {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.05);
  }

  &--active {
    border-color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.1);
  }

  input[type="checkbox"] {
    accent-color: $color-accent-scarlet;
  }

  &__label {
    font-size: $font-size-sm;
    color: $color-text;
  }
}
</style>
