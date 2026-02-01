<template>
  <div class="tab-content">
    <div v-if="skills && Object.keys(skills).length" class="skills-grid">
      <div
        v-for="(rank, skill) in skills"
        :key="skill"
        class="skill-item"
        :class="`skill-item--${String(rank).toLowerCase()}`"
      >
        <label>{{ skill }}</label>
        <span class="skill-rank">{{ rank }}</span>
      </div>
    </div>
    <p v-else class="empty-state">No skills recorded</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  skills?: Record<string, string>
}>()
</script>

<style lang="scss" scoped>
.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: $spacing-sm;
}

.skill-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;

  label {
    font-size: $font-size-sm;
    color: $color-text;
  }

  &--untrained {
    opacity: 0.6;
  }

  &--pathetic {
    border-left: 3px solid $color-danger;
  }

  &--novice {
    border-left: 3px solid $color-text-muted;
  }

  &--adept {
    border-left: 3px solid $color-info;
  }

  &--expert {
    border-left: 3px solid $color-success;
  }

  &--master {
    border-left: 3px solid $color-warning;
  }

  &--virtuoso {
    border-left: 3px solid $color-accent-violet;
  }
}

.skill-rank {
  font-size: $font-size-xs;
  font-weight: 600;
  padding: 2px $spacing-xs;
  background: $color-bg-secondary;
  border-radius: $border-radius-sm;
  text-transform: capitalize;
}

.empty-state {
  color: $color-text-muted;
  font-style: italic;
  text-align: center;
  padding: $spacing-xl;
}
</style>
