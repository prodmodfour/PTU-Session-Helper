<template>
  <div class="group-view">
    <!-- Tab Content -->
    <Transition name="fade" mode="out-in">
      <component :is="activeTabComponent" :key="activeTab" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
import LobbyView from './_components/LobbyView.vue'
import SceneView from './_components/SceneView.vue'
import EncounterView from './_components/EncounterView.vue'
import MapView from './_components/MapView.vue'

definePageMeta({
  layout: 'group'
})

useHead({
  title: 'PTU - Group View'
})

const groupViewTabsStore = useGroupViewTabsStore()
const { isConnected } = useWebSocket()

// Active tab from store
const activeTab = computed(() => groupViewTabsStore.activeTab)

// Map tab names to components
const tabComponents = {
  lobby: LobbyView,
  scene: SceneView,
  encounter: EncounterView,
  map: MapView
}

const activeTabComponent = computed(() => {
  return tabComponents[activeTab.value] || LobbyView
})

// Poll for tab state and handle WebSocket events
let pollInterval: ReturnType<typeof setInterval> | null = null

const checkTabState = async () => {
  await groupViewTabsStore.fetchTabState()
}

// Setup WebSocket listener for tab changes
const setupWebSocketListener = () => {
  if (typeof window === 'undefined') return

  const ws = (window as any).__ptuWebSocket as WebSocket | undefined
  if (!ws) return

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)

      switch (data.type) {
        case 'tab_change':
          groupViewTabsStore.handleTabChange(data.data)
          break
        case 'tab_state':
          groupViewTabsStore.handleTabChange(data.data)
          break
        case 'scene_activated':
          groupViewTabsStore.handleSceneActivated(data.data)
          break
        case 'scene_deactivated':
          groupViewTabsStore.handleSceneDeactivated(data.data)
          break
        case 'scene_update':
          groupViewTabsStore.handleSceneUpdate(data.data)
          break
      }
    } catch {
      // Failed to parse WebSocket message
    }
  }

  ws.addEventListener('message', handleMessage)

  // Cleanup on unmount
  onUnmounted(() => {
    ws.removeEventListener('message', handleMessage)
  })
}

onMounted(async () => {
  // Fetch initial tab state
  await checkTabState()

  // Poll as fallback (slower interval since we have WebSocket)
  pollInterval = setInterval(checkTabState, 5000)

  // Setup WebSocket listener
  setupWebSocketListener()
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
})

// Watch for WebSocket connection to request tab state
watch(isConnected, (connected) => {
  if (connected) {
    // Request current tab state via WebSocket
    const ws = (window as any).__ptuWebSocket as WebSocket | undefined
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'tab_sync_request' }))
    }
  }
})
</script>

<style lang="scss" scoped>
.group-view {
  min-height: 100vh;
  background: $gradient-bg-radial;
}

// Tab transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
