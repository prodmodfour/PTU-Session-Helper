<template>
  <div class="breather-shift-banner" data-testid="breather-shift-banner">
    <div class="breather-shift-banner__icon">
      <img src="/icons/phosphor/arrows-out-cardinal.svg" alt="" class="banner-icon" />
    </div>
    <div class="breather-shift-banner__content">
      <p class="breather-shift-banner__title">
        Breather Shift Required
      </p>
      <p class="breather-shift-banner__desc">
        <strong>{{ combatantName }}</strong> must Shift away from all adjacent enemies using full movement.
        <span class="breather-shift-banner__rule">(PTU p.245)</span>
      </p>
    </div>
    <div class="breather-shift-banner__actions">
      <button
        class="btn btn--sm btn--primary"
        @click="$emit('focusToken')"
      >
        Move on Grid
      </button>
      <button
        class="btn btn--sm btn--secondary"
        @click="$emit('dismiss')"
      >
        Dismiss
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  combatantName: string
}>()

defineEmits<{
  focusToken: []
  dismiss: []
}>()
</script>

<style lang="scss" scoped>
.breather-shift-banner {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  padding: $spacing-md $spacing-lg;
  background: linear-gradient(135deg, rgba($color-warning, 0.15) 0%, rgba($color-warning, 0.05) 100%);
  border: 1px solid rgba($color-warning, 0.4);
  border-radius: $border-radius-md;
  animation: banner-slide-in 0.3s ease-out;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba($color-warning, 0.2);
    border-radius: $border-radius-sm;
    flex-shrink: 0;

    .banner-icon {
      width: 20px;
      height: 20px;
      filter: brightness(0) saturate(100%) invert(69%) sepia(63%) saturate(588%) hue-rotate(2deg) brightness(103%) contrast(96%);
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    margin: 0 0 $spacing-xs;
    font-weight: 600;
    font-size: $font-size-sm;
    color: $color-warning;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  &__desc {
    margin: 0;
    font-size: $font-size-sm;
    color: $color-text;
    line-height: 1.4;
  }

  &__rule {
    color: $color-text-muted;
    font-size: $font-size-xs;
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    flex-shrink: 0;
  }
}

@keyframes banner-slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
