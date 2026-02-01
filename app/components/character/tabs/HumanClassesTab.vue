<template>
  <div class="tab-content">
    <div v-if="trainerClasses?.length" class="info-section">
      <h4>Trainer Classes</h4>
      <div class="tag-list">
        <span v-for="tc in trainerClasses" :key="tc" class="tag tag--class">{{ tc }}</span>
      </div>
    </div>

    <div v-if="features?.length" class="info-section">
      <h4>Features</h4>
      <div class="tag-list">
        <span v-for="feat in features" :key="feat" class="tag tag--feature">{{ feat }}</span>
      </div>
    </div>

    <div v-if="edges?.length" class="info-section">
      <h4>Edges</h4>
      <div class="tag-list">
        <span v-for="edge in edges" :key="edge" class="tag tag--edge">{{ edge }}</span>
      </div>
    </div>

    <p v-if="!trainerClasses?.length && !features?.length && !edges?.length" class="empty-state">
      No classes, features, or edges recorded
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  trainerClasses?: string[]
  features?: string[]
  edges?: string[]
}>()
</script>

<style lang="scss" scoped>
.info-section {
  margin-bottom: $spacing-lg;

  &:last-child {
    margin-bottom: 0;
  }

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  font-size: $font-size-sm;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;

  &--class {
    background: rgba($color-accent-violet, 0.15);
    border-color: rgba($color-accent-violet, 0.3);
    color: $color-accent-violet;
  }

  &--feature {
    background: rgba($color-accent-teal, 0.15);
    border-color: rgba($color-accent-teal, 0.3);
    color: $color-accent-teal;
  }

  &--edge {
    background: rgba($color-warning, 0.15);
    border-color: rgba($color-warning, 0.3);
    color: $color-warning;
  }
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
