<template>
  <div class="map-view">
    <!-- Map Overlay (fullscreen) -->
    <MapOverlay v-if="servedMap" :map="servedMap" :fullscreen="true" />

    <!-- No Map Served -->
    <div v-else class="map-view__waiting">
      <div class="waiting-card">
        <PhMapTrifold class="waiting-icon" :size="64" />
        <h2>No Map Available</h2>
        <p>The GM will serve a map when exploration begins.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PhMapTrifold } from '@phosphor-icons/vue'

const groupViewStore = useGroupViewStore()

// Poll for served map
let mapPollInterval: ReturnType<typeof setInterval> | null = null

const checkForServedMap = async () => {
  await groupViewStore.fetchServedMap()
}

// Served map computed
const servedMap = computed(() => groupViewStore.servedMap)

onMounted(async () => {
  await checkForServedMap()
  mapPollInterval = setInterval(checkForServedMap, 1000)
})

onUnmounted(() => {
  if (mapPollInterval) {
    clearInterval(mapPollInterval)
    mapPollInterval = null
  }
})
</script>

<style lang="scss" scoped>
.map-view {
  min-height: 100vh;
  background: $gradient-bg-radial;

  &__waiting {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
  }
}

.waiting-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-xxl;
  background: rgba($color-bg-secondary, 0.8);
  border-radius: $border-radius-lg;
  text-align: center;

  h2 {
    margin: 0;
    color: $color-text;
  }

  p {
    margin: 0;
    color: $color-text-muted;
  }
}

.waiting-icon {
  color: $color-primary;
  opacity: 0.7;
}
</style>
