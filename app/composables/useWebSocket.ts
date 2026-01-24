import type { WebSocketEvent, Encounter, Pokemon, HumanCharacter, MoveLogEntry, MovementPreview } from '~/types'

export function useWebSocket() {
  const encounterStore = useEncounterStore()
  const libraryStore = useLibraryStore()

  let ws: WebSocket | null = null
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const movementPreview = ref<MovementPreview | null>(null)

  const connect = () => {
    if (ws?.readyState === WebSocket.OPEN) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws`

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketEvent = JSON.parse(event.data)
          handleMessage(message)
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e)
        }
      }

      ws.onclose = () => {
        isConnected.value = false
        console.log('WebSocket disconnected')
        attemptReconnect()
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
    } catch (e) {
      console.error('Failed to create WebSocket:', e)
    }
  }

  const attemptReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.value), 30000)
    reconnectAttempts.value++

    setTimeout(() => {
      console.log(`Reconnect attempt ${reconnectAttempts.value}`)
      connect()
    }, delay)
  }

  const handleMessage = (message: WebSocketEvent) => {
    switch (message.type) {
      case 'encounter_update':
        encounterStore.updateFromWebSocket(message.data)
        break

      case 'character_update':
        if ('species' in message.data) {
          // It's a Pokemon
          const pokemon = message.data as Pokemon
          const index = libraryStore.pokemon.findIndex(p => p.id === pokemon.id)
          if (index !== -1) {
            libraryStore.pokemon[index] = pokemon
          }
        } else {
          // It's a Human
          const human = message.data as HumanCharacter
          const index = libraryStore.humans.findIndex(h => h.id === human.id)
          if (index !== -1) {
            libraryStore.humans[index] = human
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
        // Request full state sync
        requestSync()
        break

      case 'encounter_served':
        // An encounter was served by the GM
        encounterStore.updateFromWebSocket(message.data.encounter)
        break

      case 'encounter_unserved':
        // An encounter was unserved by the GM
        encounterStore.clearEncounter()
        break

      case 'movement_preview':
        // GM is previewing a move, show it on group view
        movementPreview.value = message.data
        break
    }
  }

  const send = (event: WebSocketEvent) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
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
