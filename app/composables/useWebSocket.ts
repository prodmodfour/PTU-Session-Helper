import type { WebSocketEvent, Encounter, Pokemon, HumanCharacter, MoveLogEntry, MovementPreview } from '~/types'
import { isPokemon } from '~/types'

// WebSocket configuration constants
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY_MS = 1000
const MAX_RECONNECT_DELAY_MS = 30000

// Lazy getters for stores to avoid initialization issues
const getEncounterStore = () => useEncounterStore()
const getLibraryStore = () => useLibraryStore()
const getGroupViewStore = () => useGroupViewStore()

export function useWebSocket() {

  let ws: WebSocket | null = null
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  const movementPreview = ref<MovementPreview | null>(null)

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      return
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        lastError.value = null
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data)
          handleMessage(message)
        } catch (e) {
          lastError.value = 'Failed to parse WebSocket message'
        }
      }

      ws.onclose = () => {
        isConnected.value = false
        attemptReconnect()
      }

      ws.onerror = () => {
        lastError.value = 'WebSocket connection error'
      }
    } catch (e) {
      lastError.value = 'Failed to create WebSocket connection'
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
      lastError.value = 'Max reconnect attempts reached'
      return
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.value),
      MAX_RECONNECT_DELAY_MS
    )
    reconnectAttempts.value++

    setTimeout(() => {
      connect()
    }, delay)
  }

  const handleMessage = (message: WebSocketEvent) => {
    switch (message.type) {
      case 'encounter_update':
        getEncounterStore().updateFromWebSocket(message.data)
        break

      case 'character_update':
        if (isPokemon(message.data)) {
          const pokemon = message.data as Pokemon
          const store = getLibraryStore()
          const index = store.pokemon.findIndex(p => p.id === pokemon.id)
          if (index !== -1) {
            store.pokemon[index] = pokemon
          }
        } else {
          const human = message.data as HumanCharacter
          const store = getLibraryStore()
          const index = store.humans.findIndex(h => h.id === human.id)
          if (index !== -1) {
            store.humans[index] = human
          }
        }
        break

      case 'turn_change':
        // Trigger any turn change effects/sounds
        break

      case 'move_executed':
        // Could trigger animations or sounds
        break

      case 'sync_request':
        requestSync()
        break

      case 'encounter_served':
        getEncounterStore().updateFromWebSocket(message.data.encounter)
        break

      case 'encounter_unserved':
        getEncounterStore().clearEncounter()
        break

      case 'movement_preview':
        movementPreview.value = message.data
        break

      case 'serve_map':
        getGroupViewStore().setServedMap(message.data)
        break

      case 'clear_map':
        getGroupViewStore().setServedMap(null)
        break

      case 'clear_wild_spawn':
        getGroupViewStore().setWildSpawnPreview(null)
        break
    }
  }

  const send = (event: WebSocketEvent) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    } else {
      lastError.value = 'Cannot send - WebSocket not connected'
    }
  }

  const identify = (role: 'gm' | 'group' | 'player', encounterId?: string) => {
    send({ type: 'identify', data: { role, encounterId } })
  }

  const joinEncounter = (encounterId: string) => {
    send({ type: 'join_encounter', data: { encounterId } })
  }

  const leaveEncounter = () => {
    send({ type: 'leave_encounter', data: null })
  }

  const requestSync = () => {
    send({ type: 'sync_request', data: null })
  }

  const disconnect = () => {
    if (ws) {
      ws.close()
      ws = null
    }
  }

  // Auto-connect on mount
  onMounted(() => {
    connect()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    lastError: readonly(lastError),
    movementPreview: readonly(movementPreview),
    connect,
    disconnect,
    send,
    identify,
    joinEncounter,
    leaveEncounter,
    requestSync
  }
}
