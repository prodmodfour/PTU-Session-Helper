<template>
  <div class="trainer-xp-section">
    <h3 class="section__title">Trainer Experience</h3>

    <!-- Suggestion bar -->
    <div class="trainer-xp-section__suggestion">
      <span class="trainer-xp-section__suggestion-label">
        Suggested: {{ suggestedXp }} XP per trainer
      </span>
      <button
        class="btn btn--sm btn--secondary"
        @click="applyToAll(suggestedXp)"
      >
        Apply to All
      </button>
    </div>

    <!-- Per-trainer XP input -->
    <div class="trainer-xp-section__trainers">
      <div
        v-for="trainer in participatingTrainers"
        :key="trainer.id"
        class="trainer-xp-row"
      >
        <div class="trainer-xp-row__info">
          <span class="trainer-xp-row__name">{{ trainer.name }}</span>
          <span class="trainer-xp-row__level">Lv.{{ trainer.level }}</span>
          <span class="trainer-xp-row__bank">Bank: {{ trainer.trainerXp }}/10</span>
        </div>
        <div class="trainer-xp-row__input">
          <input
            :value="getAllocation(trainer.id)"
            type="number"
            class="form-input-compact"
            min="0"
            max="10"
            @input="handleInput(trainer.id, $event)"
          />
        </div>
        <div class="trainer-xp-row__preview">
          <span
            v-if="getLevelUpPreview(trainer)"
            class="trainer-xp-row__levelup"
          >
            LEVEL UP! -> Lv.{{ getLevelUpPreview(trainer) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Quick-set row -->
    <div class="trainer-xp-section__quick">
      <button
        v-for="n in quickSetValues"
        :key="n"
        class="btn btn--sm btn--ghost"
        @click="applyToAll(n)"
      >
        {{ n }} to All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { applyTrainerXp } from '~/utils/trainerExperience'

interface TrainerInfo {
  id: string
  name: string
  level: number
  trainerXp: number
}

const props = defineProps<{
  participatingTrainers: TrainerInfo[]
  suggestedXp: number
}>()

const emit = defineEmits<{
  'update:allocations': [allocations: Map<string, number>]
}>()

const quickSetValues = [0, 1, 2, 3, 5]

// Internal allocation state
const allocations = ref<Map<string, number>>(new Map())

// Initialize allocations for all trainers
watchEffect(() => {
  const newMap = new Map(allocations.value)
  for (const trainer of props.participatingTrainers) {
    if (!newMap.has(trainer.id)) {
      newMap.set(trainer.id, 0)
    }
  }
  allocations.value = newMap
})

function getAllocation(trainerId: string): number {
  return allocations.value.get(trainerId) ?? 0
}

function handleInput(trainerId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const value = Math.max(0, Math.floor(Number(input.value) || 0))
  const newMap = new Map(allocations.value)
  newMap.set(trainerId, value)
  allocations.value = newMap
  emit('update:allocations', newMap)
}

function applyToAll(amount: number) {
  const newMap = new Map<string, number>()
  for (const trainer of props.participatingTrainers) {
    newMap.set(trainer.id, amount)
  }
  allocations.value = newMap
  emit('update:allocations', newMap)
}

function getLevelUpPreview(trainer: TrainerInfo): number | null {
  const allocation = getAllocation(trainer.id)
  if (allocation <= 0) return null

  const result = applyTrainerXp({
    currentXp: trainer.trainerXp,
    currentLevel: trainer.level,
    xpToAdd: allocation
  })

  return result.levelsGained > 0 ? result.newLevel : null
}
</script>

<style lang="scss" scoped>
.trainer-xp-section {
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-color-default;

  .section__title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $color-text;
    margin-bottom: $spacing-md;
  }

  &__suggestion {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm $spacing-md;
    margin-bottom: $spacing-md;
    background: rgba($color-accent-teal, 0.08);
    border: 1px solid rgba($color-accent-teal, 0.2);
    border-radius: $border-radius-md;
  }

  &__suggestion-label {
    font-size: $font-size-sm;
    color: $color-text-muted;
    font-weight: 500;
  }

  &__trainers {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    margin-bottom: $spacing-md;
  }

  &__quick {
    display: flex;
    gap: $spacing-xs;
    flex-wrap: wrap;
  }
}

.trainer-xp-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: $spacing-sm;
  align-items: center;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius-sm;
  transition: background $transition-fast;

  &:hover {
    background: rgba($color-bg-hover, 0.5);
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    min-width: 0;
  }

  &__name {
    font-weight: 500;
    color: $color-text;
    font-size: $font-size-sm;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__level {
    font-size: $font-size-xs;
    color: $color-text-muted;
  }

  &__bank {
    font-size: $font-size-xs;
    color: $color-accent-teal;
    font-weight: 500;
  }

  &__input {
    .form-input-compact {
      width: 70px;
      text-align: center;
    }
  }

  &__preview {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }

  &__levelup {
    font-size: $font-size-xs;
    font-weight: 700;
    color: $color-success;
    animation: pulse 1.5s ease-in-out infinite;
  }
}
</style>
