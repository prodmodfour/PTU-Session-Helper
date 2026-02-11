import type { WebSocketEvent } from '~/types'

interface GroupViewWebSocketOptions {
  send: (event: WebSocketEvent) => void
  isConnected: Readonly<Ref<boolean>>
  onMessage: (listener: (message: WebSocketEvent) => void) => () => void
}

export function useGroupViewWebSocket(options: GroupViewWebSocketOptions) {
  const { send, isConnected, onMessage } = options
  const groupViewTabsStore = useGroupViewTabsStore()

  const handleMessage = (message: WebSocketEvent) => {
    switch (message.type) {
      case 'tab_change':
      case 'tab_state':
        groupViewTabsStore.handleTabChange(message.data)
        break
      case 'scene_activated':
        groupViewTabsStore.handleSceneActivated(message.data)
        break
      case 'scene_deactivated':
        groupViewTabsStore.handleSceneDeactivated(message.data)
        break
      case 'scene_update':
        groupViewTabsStore.handleSceneUpdate(message.data)
        break
      case 'scene_positions_updated':
        groupViewTabsStore.handleScenePositionsUpdated(message.data.positions)
        break
      case 'scene_character_added':
        groupViewTabsStore.handleSceneCharacterAdded(message.data)
        break
      case 'scene_character_removed':
        groupViewTabsStore.handleSceneCharacterRemoved(message.data)
        break
      case 'scene_pokemon_added':
        groupViewTabsStore.handleScenePokemonAdded(message.data)
        break
      case 'scene_pokemon_removed':
        groupViewTabsStore.handleScenePokemonRemoved(message.data)
        break
      case 'scene_group_created':
        groupViewTabsStore.handleSceneGroupCreated(message.data)
        break
      case 'scene_group_updated':
        groupViewTabsStore.handleSceneGroupUpdated(message.data)
        break
      case 'scene_group_deleted':
        groupViewTabsStore.handleSceneGroupDeleted(message.data)
        break
    }
  }

  const requestTabSync = () => {
    send({ type: 'tab_sync_request', data: null })
  }

  // Register message listener
  const removeListener = onMessage(handleMessage)

  // Request tab sync when connection is established
  watch(isConnected, (connected) => {
    if (connected) {
      requestTabSync()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    removeListener()
  })

  return {
    requestTabSync
  }
}
