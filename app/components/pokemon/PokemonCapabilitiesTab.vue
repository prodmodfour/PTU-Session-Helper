<template>
  <div class="tab-content">
    <div v-if="pokemon.capabilities" class="capabilities-grid">
      <div class="cap-item">
        <label>Overland</label>
        <span>{{ pokemon.capabilities.overland || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Swim</label>
        <span>{{ pokemon.capabilities.swim || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Sky</label>
        <span>{{ pokemon.capabilities.sky || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Burrow</label>
        <span>{{ pokemon.capabilities.burrow || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Levitate</label>
        <span>{{ pokemon.capabilities.levitate || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Jump (H/L)</label>
        <span>{{ pokemon.capabilities.jump?.high || 0 }} / {{ pokemon.capabilities.jump?.long || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Power</label>
        <span>{{ pokemon.capabilities.power || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Weight Class</label>
        <span>{{ pokemon.capabilities.weightClass || 0 }}</span>
      </div>
      <div class="cap-item">
        <label>Size</label>
        <span>{{ pokemon.capabilities.size || 'Medium' }}</span>
      </div>
    </div>
    <div v-if="pokemon.capabilities?.otherCapabilities?.length" class="info-section">
      <h4>Other Capabilities</h4>
      <div class="tag-list">
        <span v-for="cap in pokemon.capabilities.otherCapabilities" :key="cap" class="tag">
          {{ cap }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pokemon } from '~/types'

defineProps<{
  pokemon: Pokemon
}>()
</script>

<style lang="scss" scoped>
.tab-content {
  @include pokemon-tab-content;
}

.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-md;
}

.cap-item {
  background: $color-bg-secondary;
  padding: $spacing-md;
  border-radius: $border-radius-md;
  text-align: center;

  label {
    display: block;
    font-size: $font-size-xs;
    color: $color-text-muted;
    margin-bottom: $spacing-xs;
  }

  span {
    font-size: $font-size-lg;
    font-weight: 600;
  }
}

.info-section {
  @include pokemon-info-section;
}

.tag-list {
  @include pokemon-tag-list;
}

.tag {
  @include pokemon-tag;
}

@include pokemon-sheet-keyframes;
</style>
