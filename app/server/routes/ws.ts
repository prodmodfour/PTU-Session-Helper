import { prisma } from '~/server/utils/prisma'
import {
  peers,
  safeSend,
  broadcast,
  broadcastToEncounter,
  broadcastToGroup
} from '~/server/utils/websocket'

interface WebSocketEvent {
  type: string
  data: unknown
}

// Send full encounter state
async function sendEncounterState(peer: Parameters<typeof safeSend>[0], encounterId: string) {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (encounter) {
      const parsed = {
        id: encounter.id,
        name: encounter.name,
        battleType: encounter.battleType,
        weather: encounter.weather ?? null,
        combatants: JSON.parse(encounter.combatants),
        currentRound: encounter.currentRound,
        currentTurnIndex: encounter.currentTurnIndex,
        turnOrder: JSON.parse(encounter.turnOrder),
        isActive: encounter.isActive,
        isPaused: encounter.isPaused,
        isServed: encounter.isServed,
        moveLog: JSON.parse(encounter.moveLog),
        defeatedEnemies: JSON.parse(encounter.defeatedEnemies)
      }

      peer.send(JSON.stringify({
        type: 'encounter_update',
        data: parsed
      }))
    }
  } catch {
    // Failed to send encounter state - peer may have disconnected
  }
}

// Send current tab state to a peer
async function sendTabState(peer: Parameters<typeof safeSend>[0]) {
  try {
    const state = await prisma.groupViewState.findUnique({
      where: { id: 'singleton' }
    })

    if (state) {
      peer.send(JSON.stringify({
        type: 'tab_state',
        data: {
          activeTab: state.activeTab,
          activeSceneId: state.activeSceneId
        }
      }))
    }
  } catch {
    // Failed to send tab state
  }
}

export default defineWebSocketHandler({
  open(peer) {
    // Default to group role until identified
    peers.set(peer, { role: 'group' })

    // Send welcome message
    peer.send(JSON.stringify({
      type: 'connected',
      data: { peerId: peer.id }
    }))
  },

  message(peer, message) {
    try {
      const event: WebSocketEvent = JSON.parse(message.text())
      const clientInfo = peers.get(peer)

      switch (event.type) {
        case 'identify':
          // Client identifies as GM or group
          if (clientInfo) {
            const data = event.data as { role?: 'gm' | 'group'; encounterId?: string }
            clientInfo.role = data.role || 'group'
            clientInfo.encounterId = data.encounterId

            // If group client, send current tab state
            if (clientInfo.role === 'group') {
              sendTabState(peer)
            }
          }
          break

        case 'join_encounter':
          // Join a specific encounter room
          if (clientInfo) {
            const data = event.data as { encounterId: string }
            clientInfo.encounterId = data.encounterId
            // Send current encounter state
            sendEncounterState(peer, data.encounterId)
          }
          break

        case 'leave_encounter':
          // Leave encounter room
          if (clientInfo) {
            clientInfo.encounterId = undefined
          }
          break

        case 'sync_request':
          // Client requesting full state sync
          if (clientInfo?.encounterId) {
            sendEncounterState(peer, clientInfo.encounterId)
          }
          break

        case 'tab_sync_request':
          // Client requesting tab state
          if (clientInfo?.role === 'group') {
            sendTabState(peer)
          }
          break

        case 'encounter_update':
          // GM updates encounter state, broadcast to all viewers
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'turn_change':
          // Turn changed, notify all viewers
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'damage_applied':
          // Damage was applied to a combatant
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'heal_applied':
          // Healing was applied
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'status_change':
          // Status condition changed
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'move_executed':
          // A move was used
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'combatant_added':
          // A combatant was added to encounter
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'combatant_removed':
          // A combatant was removed from encounter
          if (clientInfo?.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'player_action':
          // Group submitting an action (for GM to see)
          if (clientInfo?.role === 'group' && clientInfo.encounterId) {
            // Forward to GM(s)
            const groupEncounterId = clientInfo.encounterId
            for (const [otherPeer, otherInfo] of peers) {
              if (
                otherPeer !== peer &&
                otherInfo.role === 'gm' &&
                otherInfo.encounterId === groupEncounterId
              ) {
                safeSend(otherPeer, JSON.stringify(event))
              }
            }
          }
          break

        case 'serve_encounter':
          // GM serves an encounter to group views
          if (clientInfo?.role === 'gm') {
            const data = event.data as { encounterId: string }
            if (data.encounterId) {
              broadcastToEncounter(data.encounterId, {
                type: 'encounter_served',
                data: event.data
              }, peer)
              // Also broadcast to all group clients not in a specific encounter
              for (const [otherPeer, otherInfo] of peers) {
                if (otherPeer !== peer && otherInfo.role === 'group') {
                  safeSend(otherPeer, JSON.stringify({
                    type: 'encounter_served',
                    data: event.data
                  }))
                }
              }
            }
          }
          break

        case 'encounter_unserved':
          // GM unserves an encounter
          if (clientInfo?.role === 'gm') {
            const data = event.data as { encounterId?: string }
            if (data.encounterId) {
              // Broadcast to all group clients
              for (const [otherPeer, otherInfo] of peers) {
                if (otherPeer !== peer && otherInfo.role === 'group') {
                  safeSend(otherPeer, JSON.stringify({
                    type: 'encounter_unserved',
                    data: event.data
                  }))
                }
              }
            }
          }
          break

        case 'character_update':
          // Character data changed
          broadcast(event, peer)
          break

        case 'movement_preview':
          // GM previewing a move, broadcast to group views
          if (clientInfo?.role === 'gm' && clientInfo.encounterId) {
            broadcastToEncounter(clientInfo.encounterId, event, peer)
          }
          break

        case 'scene_update':
          // Scene data changed, broadcast to group views
          if (clientInfo?.role === 'gm') {
            broadcastToGroup(event.type, event.data)
          }
          break
      }
    } catch {
      // Failed to handle WebSocket message
    }
  },

  close(peer) {
    peers.delete(peer)
  },

  error(peer) {
    peers.delete(peer)
  }
})
