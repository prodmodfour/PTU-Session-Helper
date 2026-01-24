import type { Peer } from 'crossws'
import { prisma } from '~/server/utils/prisma'

interface WebSocketEvent {
  type: string
  data: any
}

interface ClientInfo {
  role: 'gm' | 'group'
  encounterId?: string
}

// Store connected peers with their info
const peers = new Map<Peer, ClientInfo>()

// Safely send message to a peer
function safeSend(peer: Peer, message: string) {
  try {
    peer.send(message)
  } catch {
    // Peer may have disconnected, remove from map
    peers.delete(peer)
  }
}

// Broadcast to all connected peers
function broadcast(event: WebSocketEvent, excludePeer?: Peer) {
  const message = JSON.stringify(event)
  for (const [peer] of peers) {
    if (peer !== excludePeer) {
      safeSend(peer, message)
    }
  }
}

// Broadcast to peers watching a specific encounter
function broadcastToEncounter(encounterId: string, event: WebSocketEvent, excludePeer?: Peer) {
  const message = JSON.stringify(event)
  for (const [peer, info] of peers) {
    if (peer !== excludePeer && info.encounterId === encounterId) {
      safeSend(peer, message)
    }
  }
}

// Send full encounter state
async function sendEncounterState(peer: Peer, encounterId: string) {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: encounterId }
    })

    if (encounter) {
      const parsed = {
        id: encounter.id,
        name: encounter.name,
        battleType: encounter.battleType,
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
  } catch (error) {
    console.error('Failed to send encounter state:', error)
  }
}

export default defineWebSocketHandler({
  open(peer) {
    console.log(`WebSocket connected: ${peer.id}`)
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
            clientInfo.role = event.data.role || 'group'
            clientInfo.encounterId = event.data.encounterId
            console.log(`Peer ${peer.id} identified as ${clientInfo.role}`)
          }
          break

        case 'join_encounter':
          // Join a specific encounter room
          if (clientInfo) {
            clientInfo.encounterId = event.data.encounterId
            console.log(`Peer ${peer.id} joined encounter ${event.data.encounterId}`)
            // Send current encounter state
            sendEncounterState(peer, event.data.encounterId)
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
          if (clientInfo?.role === 'gm' && event.data.encounterId) {
            broadcastToEncounter(event.data.encounterId, {
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
          break

        case 'encounter_unserved':
          // GM unserves an encounter
          if (clientInfo?.role === 'gm' && event.data.encounterId) {
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

        default:
          console.log(`Unknown WebSocket event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error)
    }
  },

  close(peer) {
    console.log(`WebSocket disconnected: ${peer.id}`)
    peers.delete(peer)
  },

  error(peer, error) {
    console.error(`WebSocket error for peer ${peer.id}:`, error)
  }
})

// Export helper for use in API routes to notify WebSocket clients
export function notifyEncounterUpdate(encounterId: string, encounter: any) {
  broadcastToEncounter(encounterId, {
    type: 'encounter_update',
    data: encounter
  })
}

export function notifyTurnChange(encounterId: string, turnData: any) {
  broadcastToEncounter(encounterId, {
    type: 'turn_change',
    data: turnData
  })
}

export function notifyMoveExecuted(encounterId: string, moveData: any) {
  broadcastToEncounter(encounterId, {
    type: 'move_executed',
    data: moveData
  })
}
