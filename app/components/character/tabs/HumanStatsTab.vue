<template>
  <div class="tab-content">
    <div class="stats-grid">
      <div class="stat-block">
        <label>HP</label>
        <div class="stat-values">
          <span class="stat-base">{{ human.stats?.hp || 0 }}</span>
          <span class="stat-current">{{ currentHp }} / {{ maxHp }}</span>
        </div>
      </div>
      <div class="stat-block">
        <label>Attack</label>
        <span class="stat-current">{{ human.stats?.attack || 0 }}</span>
      </div>
      <div class="stat-block">
        <label>Defense</label>
        <span class="stat-current">{{ human.stats?.defense || 0 }}</span>
      </div>
      <div class="stat-block">
        <label>Sp. Atk</label>
        <span class="stat-current">{{ human.stats?.specialAttack || 0 }}</span>
      </div>
      <div class="stat-block">
        <label>Sp. Def</label>
        <span class="stat-current">{{ human.stats?.specialDefense || 0 }}</span>
      </div>
      <div class="stat-block">
        <label>Speed</label>
        <span class="stat-current">{{ human.stats?.speed || 0 }}</span>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group form-group--sm">
        <label>Height (cm)</label>
        <input
          :value="editData.height"
          @input="$emit('update:editData', { ...editData, height: Number(($event.target as HTMLInputElement).value) })"
          type="number"
          class="form-input"
          :disabled="!isEditing"
        />
      </div>
      <div class="form-group form-group--sm">
        <label>Weight (kg)</label>
        <input
          :value="editData.weight"
          @input="$emit('update:editData', { ...editData, weight: Number(($event.target as HTMLInputElement).value) })"
          type="number"
          class="form-input"
          :disabled="!isEditing"
        />
      </div>
      <div class="form-group form-group--sm">
        <label>Money</label>
        <input
          :value="editData.money"
          @input="$emit('update:editData', { ...editData, money: Number(($event.target as HTMLInputElement).value) })"
          type="number"
          class="form-input"
          :disabled="!isEditing"
        />
      </div>
    </div>

    <!-- Derived Trainer Capabilities (computed from skills + weight) -->
    <CapabilitiesDisplay :derived-stats="derivedStats" variant="bordered" />
  </div>
</template>

<script setup lang="ts">
import type { HumanCharacter } from '~/types'
import { computeTrainerDerivedStats } from '~/utils/trainerDerivedStats'

const props = defineProps<{
  human: HumanCharacter
  currentHp: number
  maxHp: number
  editData: Partial<HumanCharacter>
  isEditing: boolean
}>()

defineEmits<{
  'update:editData': [data: Partial<HumanCharacter>]
}>()

const derivedStats = computed(() =>
  computeTrainerDerivedStats({
    skills: props.human.skills || {},
    weightKg: props.human.weight
  })
)
</script>

<style lang="scss" scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.stat-block {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    margin-bottom: $spacing-xs;
  }
}

.stat-values {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
}

.stat-base {
  font-size: $font-size-sm;
  color: $color-text-muted;
}

.stat-current {
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text;
}

.form-row {
  display: flex;
  gap: $spacing-md;
}

.form-group {
  flex: 1;

  &--sm {
    flex: 0 0 auto;
    min-width: 100px;
  }

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }
}

.form-input {
  width: 100%;
  padding: $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
  color: $color-text;
  font-size: $font-size-sm;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

</style>
