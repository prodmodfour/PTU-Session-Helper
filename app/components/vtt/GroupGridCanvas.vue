<template>
  <div class="group-grid-container" data-testid="group-grid-container">
    <div class="group-grid-header">
      <h3>Battle Grid</h3>
      <span class="group-grid-size">{{ config.width }}×{{ config.height }}</span>
    </div>
    <div class="group-grid-wrapper">
      <GridCanvas
        ref="gridCanvasRef"
        :config="config"
        :tokens="tokens"
        :combatants="combatants"
        :current-turn-id="currentTurnId"
        :is-gm="false"
        :show-zoom-controls="true"
        :show-coordinates="true"
        :external-movement-preview="movementPreview"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GridConfig, GridPosition, Combatant, MovementPreview } from '~/types'
import GridCanvas from '~/components/vtt/GridCanvas.vue'

interface TokenData {
  combatantId: string
  position: GridPosition
  size: number
}

const props = defineProps<{
  config: GridConfig
  combatants: Combatant[]
  currentTurnId?: string
  movementPreview?: MovementPreview | null
}>()

// Refs
const gridCanvasRef = ref<InstanceType<typeof GridCanvas> | null>(null)

// Computed
const tokens = computed((): TokenData[] => {
  return props.combatants
    .filter(c => c.position)
    .map(c => ({
      combatantId: c.id,
      position: c.position!,
      size: c.tokenSize || 1,
    }))
})

// Expose methods
defineExpose({
  resetView: () => gridCanvasRef.value?.resetView(),
})
</script>

<style lang="scss" scoped>
.group-grid-container {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  background: $glass-bg;
  backdrop-filter: $glass-blur;
  border: 1px solid $glass-border;
  border-radius: $border-radius-lg;
  padding: $spacing-md;
  flex: 1;

  // 4K optimization
  @media (min-width: 3000px) {
    padding: $spacing-lg;
    gap: $spacing-lg;
  }
}

.group-grid-header {
  display: flex;
  align-items: baseline;
  gap: $spacing-sm;

  h3 {
    margin: 0;
    font-size: $font-size-lg;
    color: $color-text;

    // 4K optimization
    @media (min-width: 3000px) {
      font-size: $font-size-xl;
    }
  }
}

.group-grid-size {
  color: $color-text-muted;
  font-size: $font-size-sm;

  // 4K optimization
  @media (min-width: 3000px) {
    font-size: $font-size-md;
  }
}

.group-grid-wrapper {
  flex: 1;
  min-height: 400px;
  border-radius: $border-radius-md;
  overflow: hidden;

  // 4K optimization
  @media (min-width: 3000px) {
    min-height: 600px;
  }
}
</style>
