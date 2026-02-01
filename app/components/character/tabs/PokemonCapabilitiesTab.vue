<template>
  <div class="tab-content">
    <div v-if="capabilities" class="capabilities-grid">
      <div class="cap-item">
        <label>Overland</label>
        <span>{{ capabilities.overland || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Swim</label>
        <span>{{ capabilities.swim || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Sky</label>
        <span>{{ capabilities.sky || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Burrow</label>
        <span>{{ capabilities.burrow || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Levitate</label>
        <span>{{ capabilities.levitate || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Jump (H/L)</label>
        <span>{{ capabilities.jump?.high || 0 }} / {{ capabilities.jump?.long || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Power</label>
        <span>{{ capabilities.power || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Weight Class</label>
        <span>{{ capabilities.weightClass || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Size</label>
        <span>{{ capabilities.size || 'Medium' }}</span>
      </div>
    </div>

    <div v-if="capabilities?.otherCapabilities?.length" class="info-section">
      <h4>Other Capabilities</h4>
      <div class="tag-list">
        <span v-for="cap in capabilities.otherCapabilities" :key="cap" class="tag">
          {{ cap }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PokemonCapabilities } from '~/types'

defineProps<{
  capabilities: PokemonCapabilities | null
}>()
</script>

<style lang="scss" scoped>
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
}

.cap-item {
  background: $color-bg-tertiary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-md;
  padding: $spacing-sm;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  span {
    font-weight: 600;
    font-size: $font-size-md;
  }
}

.info-section {
  margin-top: $spacing-lg;

  h4 {
    font-size: $font-size-sm;
    color: $color-text-muted;
    margin-bottom: $spacing-sm;
  }
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

.tag {
  font-size: $font-size-xs;
  padding: $spacing-xs $spacing-sm;
  background: $color-bg-secondary;
  border: 1px solid $border-color-default;
  border-radius: $border-radius-sm;
}
</style>
