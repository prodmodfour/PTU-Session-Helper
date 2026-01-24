<template>
  <div class="map-page">
    <div class="map-header">
      <h1>Region Map</h1>
      <div class="map-actions">
        <button
          class="btn btn--primary"
          :disabled="mapServing"
          @click="serveMapToGroup"
        >
          {{ mapServing ? 'Serving...' : 'Serve to TV' }}
        </button>
        <button
          class="btn btn--secondary"
          @click="clearMapFromGroup"
        >
          Clear from TV
        </button>
      </div>
    </div>

    <div class="map-container">
      <MapOverlay :map="currentMap" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'gm'
})

const groupViewStore = useGroupViewStore()
const encounterStore = useEncounterStore()
const { send } = useWebSocket()
const mapServing = ref(false)

// Load served encounter on mount to check if one is active
onMounted(async () => {
  if (!encounterStore.encounter) {
    await encounterStore.loadServedEncounter()
  }
})

const currentMap = {
  id: 'pokemon-ranger-region',
  name: 'Pokemon Ranger Campaign',
  locations: [],
  connections: []
}

const serveMapToGroup = async () => {
  console.log('[Map] Serve button clicked')
  mapServing.value = true
  try {
    // Clear any other served content first
    try {
      if (encounterStore.encounter?.isServed) {
        console.log('[Map] Unserving encounter...')
        await encounterStore.unserveEncounter()
        send({ type: 'encounter_unserved', data: {} })
      }
    } catch (e) {
      console.warn('[Map] Failed to unserve encounter:', e)
    }

    try {
      console.log('[Map] Clearing wild spawn...')
      await groupViewStore.clearWildSpawnPreview()
      send({ type: 'clear_wild_spawn', data: null })
    } catch (e) {
      console.warn('[Map] Failed to clear wild spawn:', e)
    }

    console.log('[Map] Serving map...', currentMap)
    await groupViewStore.serveMap(currentMap)

    // Broadcast map via WebSocket to other instances
    const mapWithTimestamp = { ...currentMap, timestamp: Date.now() }
    send({ type: 'serve_map', data: mapWithTimestamp })
    console.log('[Map] Map served successfully')
  } catch (error) {
    console.error('[Map] Failed to serve map:', error)
  } finally {
    mapServing.value = false
  }
}

const clearMapFromGroup = async () => {
  try {
    await groupViewStore.clearServedMap()
    send({ type: 'clear_map', data: null })
  } catch (error) {
    console.error('Failed to clear map:', error)
  }
}
</script>

<style lang="scss" scoped>
.map-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  height: calc(100vh - 80px);
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $color-text;
  }
}

.map-actions {
  display: flex;
  gap: $spacing-sm;
}

.map-container {
  flex: 1;
  position: relative;
  background: #1a1a2e;
  border-radius: $border-radius-lg;
  overflow: hidden;
  min-height: 500px;
}
</style>
