<template>
  <div class="context-toggles">
    <span class="context-toggles__label">Capture Conditions</span>
    <label class="context-toggle">
      <input
        type="checkbox"
        :checked="modelValue.targetWasBaited"
        @change="toggle('targetWasBaited', ($event.target as HTMLInputElement).checked)"
      />
      <span class="context-toggle__text">Target was baited (Lure Ball)</span>
    </label>
    <label class="context-toggle">
      <input
        type="checkbox"
        :checked="modelValue.isDarkOrLowLight"
        @change="toggle('isDarkOrLowLight', ($event.target as HTMLInputElement).checked)"
      />
      <span class="context-toggle__text">Dark / low-light (Dusk Ball)</span>
    </label>
    <label class="context-toggle">
      <input
        type="checkbox"
        :checked="modelValue.isUnderwaterOrUnderground"
        @change="toggle('isUnderwaterOrUnderground', ($event.target as HTMLInputElement).checked)"
      />
      <span class="context-toggle__text">Underwater / underground (Dive Ball)</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { BallConditionContext } from '~/constants/pokeBalls'

type ContextFlags = Pick<BallConditionContext, 'targetWasBaited' | 'isDarkOrLowLight' | 'isUnderwaterOrUnderground'>

const props = defineProps<{
  modelValue: ContextFlags
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ContextFlags]
}>()

function toggle(key: keyof ContextFlags, value: boolean) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  })
}
</script>

<style lang="scss" scoped>
.context-toggles {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;

  &__label {
    font-size: $font-size-xs;
    color: $color-text-muted;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.context-toggle {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  cursor: pointer;
  font-size: $font-size-xs;
  color: $color-text-secondary;

  input[type="checkbox"] {
    accent-color: $color-accent-teal;
    cursor: pointer;
  }

  &__text {
    user-select: none;
  }

  &:hover {
    color: $color-text;
  }
}
</style>
