<template>
  <div class="player-skeleton" aria-busy="true" aria-label="Loading character data">
    <!-- Header skeleton -->
    <div class="player-skeleton__header">
      <div class="player-skeleton__avatar skeleton-shimmer"></div>
      <div class="player-skeleton__name-block">
        <div class="player-skeleton__line player-skeleton__line--name skeleton-shimmer"></div>
        <div class="player-skeleton__line player-skeleton__line--sub skeleton-shimmer"></div>
      </div>
    </div>

    <!-- HP bar skeleton -->
    <div class="player-skeleton__hp">
      <div class="player-skeleton__hp-track skeleton-shimmer"></div>
      <div class="player-skeleton__line player-skeleton__line--hp-label skeleton-shimmer"></div>
    </div>

    <!-- Stats grid skeleton -->
    <div class="player-skeleton__section">
      <div class="player-skeleton__section-header skeleton-shimmer"></div>
      <div class="player-skeleton__stats-grid">
        <div v-for="i in 6" :key="i" class="player-skeleton__stat-cell skeleton-shimmer"></div>
      </div>
    </div>

    <!-- Combat info skeleton -->
    <div class="player-skeleton__section">
      <div class="player-skeleton__section-header skeleton-shimmer"></div>
      <div class="player-skeleton__combat-row">
        <div v-for="i in 3" :key="i" class="player-skeleton__combat-cell skeleton-shimmer"></div>
      </div>
    </div>

    <!-- Additional sections skeleton -->
    <div class="player-skeleton__section">
      <div class="player-skeleton__section-header skeleton-shimmer"></div>
    </div>
    <div class="player-skeleton__section">
      <div class="player-skeleton__section-header skeleton-shimmer"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.player-skeleton {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
  padding: $spacing-md;
  padding-bottom: $player-nav-clearance;

  &__header {
    display: flex;
    align-items: center;
    gap: $spacing-md;
    padding: $spacing-md;
    background: $glass-bg;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: $border-radius-full;
  }

  &__name-block {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
  }

  &__line {
    border-radius: $border-radius-sm;

    &--name {
      height: 20px;
      width: 60%;
    }

    &--sub {
      height: 14px;
      width: 40%;
    }

    &--hp-label {
      height: 12px;
      width: 80px;
    }
  }

  &__hp {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    padding: 0 $spacing-md;
  }

  &__hp-track {
    height: 8px;
    border-radius: $border-radius-full;
    width: 100%;
  }

  &__section {
    background: $glass-bg;
    border: 1px solid $glass-border;
    border-radius: $border-radius-lg;
    overflow: hidden;
  }

  &__section-header {
    height: 40px;
    border-radius: 0;
  }

  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: $spacing-sm;
  }

  &__stat-cell {
    height: 48px;
    border-radius: $border-radius-sm;
  }

  &__combat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-xs;
    padding: $spacing-sm;
  }

  &__combat-cell {
    height: 40px;
    border-radius: $border-radius-sm;
  }
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    $color-bg-tertiary 0%,
    rgba(255, 255, 255, 0.06) 50%,
    $color-bg-tertiary 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
