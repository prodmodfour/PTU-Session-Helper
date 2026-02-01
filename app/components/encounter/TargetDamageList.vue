<template>
  <div class="target-damages">
    <h4>Damage Per Target</h4>
    <div
      v-for="calc in damages"
      :key="calc.targetId"
      class="target-damage-row"
    >
      <span class="target-damage-row__name">{{ getTargetName(calc.targetId) }}</span>
      <div class="target-damage-row__calc">
        <span class="target-damage-row__step">{{ preDefenseTotal }}</span>
        <span class="target-damage-row__op">−</span>
        <span class="target-damage-row__step">{{ calc.defenseStat }} {{ defenseStatLabel }}</span>
        <span class="target-damage-row__op">×</span>
        <span
          class="target-damage-row__step effectiveness-badge"
          :class="'effectiveness-badge--' + calc.effectivenessClass"
        >
          {{ calc.effectiveness }}
        </span>
        <span class="target-damage-row__op">=</span>
        <span class="target-damage-row__result">{{ calc.finalDamage }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface TargetDamageCalc {
  targetId: string
  defenseStat: number
  effectiveness: number
  effectivenessText: string
  effectivenessClass: string
  finalDamage: number
}

const props = defineProps<{
  damages: TargetDamageCalc[]
  preDefenseTotal: number
  defenseStatLabel: string
  getTargetName: (targetId: string) => string
}>()
</script>

<style lang="scss" scoped>
.target-damages {
  margin-top: $spacing-lg;
  padding-top: $spacing-md;
  border-top: 1px solid $border-color-default;

  h4 {
    margin-bottom: $spacing-md;
    font-size: $font-size-sm;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.target-damage-row {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding: $spacing-sm;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-sm;

  &__name {
    font-weight: 600;
    font-size: $font-size-sm;
  }

  &__calc {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    flex-wrap: wrap;
    font-size: $font-size-sm;
  }

  &__step {
    background: $color-bg-tertiary;
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
  }

  &__op {
    color: $color-text-muted;
    font-weight: 500;
  }

  &__result {
    font-weight: 700;
    font-size: $font-size-md;
    color: $color-accent-scarlet;
    background: rgba($color-accent-scarlet, 0.15);
    padding: 2px $spacing-sm;
    border-radius: $border-radius-sm;
  }
}

.effectiveness-badge {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-sm;
  border-radius: $border-radius-sm;

  &--immune {
    background: rgba(128, 128, 128, 0.3);
    color: #888;
  }

  &--double-resist {
    background: rgba($color-side-ally, 0.2);
    color: $color-side-ally;
  }

  &--resist {
    background: rgba($color-side-ally, 0.15);
    color: lighten($color-side-ally, 10%);
  }

  &--neutral {
    background: rgba(255, 255, 255, 0.1);
    color: $color-text-muted;
  }

  &--super {
    background: rgba($color-side-enemy, 0.15);
    color: lighten($color-side-enemy, 10%);
  }

  &--double-super {
    background: rgba($color-side-enemy, 0.25);
    color: $color-side-enemy;
  }
}
</style>
