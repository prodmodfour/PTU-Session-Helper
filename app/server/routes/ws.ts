import { prisma } from '~/server/utils/prisma'
import {
  peers,
  safeSend,
  broadcast,
  broadcastToEncounter,
  broadcastToGroup,
  broadcastToGroupAndPlayers
} from '~/server/utils/websocket'

interface WebSocketEvent {
  type: string
  data: unknown
}

// =============================================
// Pending Requests Map (requestId -> characterId)
// Routes GM responses back to the originating player.
// TTL of 60s prevents unbounded growth.
// =============================================

const PENDING_REQUEST_TTL_MS = 60_000

interface PendingEntry {
  characterId: string
  createdAt: number
}

const pendingRequests = new Map<string, PendingEntry>()

function cleanupPendingRequests() {
  const now = Date.now()
  for (const [requestId, entry] of pendingRequests) {
    if (now - entry.createdAt > PENDING_REQUEST_TTL_MS) {
      pendingRequests.delete(requestId)
    }
  }
}

// Run cleanup every 30 seconds
const cleanupInterval = setInterval(cleanupPendingRequests, 30_000)

// Ensure cleanup stops if the process shuts down
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', () => clearInterval(cleanupInterval))
}

// =============================================
// Helper: Forward event to GM(s) in an encounter
// Registers requestId -> characterId for response routing.
// =============================================

function forwardToGm(encounterId: string | null, event: WebSocketEvent, excludePeer: Parameters<typeof safeSend>[0]) {
  const data = event.data as { requestId?: string; playerId?: string }
  if (data.requestId && data.playerId) {
    pendingRequests.set(data.requestId, {
      characterId: data.playerId,
      createdAt: Date.now()
    })
  }

  const message = JSON.stringify(event)
  for (const [otherPeer, otherInfo] of peers) {
    if (otherPeer === excludePeer || otherInfo.role !== 'gm') continue
    if (encounterId && otherInfo.encounterId !== encounterId) continue
    safeSend(otherPeer, message)
  }
}

// =============================================
// Helper: Route response to a player by requestId
// Looks up pendingRequests, sends to matching player, deletes entry.
// =============================================

function routeToPlayer(requestId: string, event: WebSocketEvent) {
  const entry = pendingRequests.get(requestId)
  if (!entry) return

  const message = JSON.stringify(event)
  for (const [otherPeer, otherInfo] of peers) {
    if (otherInfo.role === 'player' && otherInfo.characterId === entry.characterId) {
      safeSend(otherPeer, message)
    }
  }
  pendingRequests.delete(requestId)
}

// =============================================
// Helper: Send full encounter state
// =============================================

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
        weatherDuration: encounter.weatherDuration ?? 0,
        weatherSource: encounter.weatherSource ?? null,
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

// =============================================
// Helper: Send current tab state to a peer
// =============================================

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

// =============================================
// Helper: Send active scene to a player peer
// Queries DB for the active scene, sends scene_sync message.
// =============================================

async function sendActiveScene(peer: Parameters<typeof safeSend>[0]) {
  try {
    const scene = await prisma.scene.findFirst({
      where: { isActive: true }
    })

    if (!scene) return

    const characters = JSON.parse(scene.characters) as Array<{
      id: string; characterId: string; name: string; groupId?: string | null
    }>
    const pokemon = JSON.parse(scene.pokemon) as Array<{
      id: string; species: string; nickname?: string | null; groupId?: string | null
    }>
    const groups = JSON.parse(scene.groups) as Array<{
      id: string; name: string
    }>

    // Look up which characters are player characters vs NPCs
    const characterIds = characters.map(c => c.characterId)
    const dbCharacters = characterIds.length > 0
      ? await prisma.humanCharacter.findMany({
          where: { id: { in: characterIds } },
          select: { id: true, isPlayerCharacter: true }
        })
      : []
    const pcSet = new Set(dbCharacters.filter(c => c.isPlayerCharacter).map(c => c.id))

    // Look up pokemon owners
    const pokemonIds = pokemon.map(p => p.id)
    const dbPokemon = pokemonIds.length > 0
      ? await prisma.pokemon.findMany({
          where: { id: { in: pokemonIds } },
          select: { id: true, ownerId: true }
        })
      : []
    const ownerMap = new Map(dbPokemon.map(p => [p.id, p.ownerId]))

    const payload = {
      scene: {
        id: scene.id,
        name: scene.name,
        description: scene.description,
        locationName: scene.locationName,
        locationImage: scene.locationImage,
        weather: scene.weather,
        isActive: scene.isActive,
        characters: characters.map(c => ({
          id: c.characterId,
          name: c.name,
          isPlayerCharacter: pcSet.has(c.characterId)
        })),
        pokemon: pokemon.map(p => ({
          id: p.id,
          nickname: p.nickname ?? null,
          species: p.species,
          ownerId: ownerMap.get(p.id) ?? null
        })),
        groups: groups.map(g => ({
          id: g.id,
          name: g.name
        }))
      }
    }

    safeSend(peer, JSON.stringify({
      type: 'scene_sync',
      data: payload
    }))
  } catch {
    // Failed to send active scene - peer may have disconnected
  }
}

// =============================================
// WebSocket Handler
// =============================================

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
          // Client identifies as GM, group, or player
          if (clientInfo) {
            const data = event.data as { role?: 'gm' | 'group' | 'player'; encounterId?: string; characterId?: string }
            clientInfo.role = data.role || 'group'
            clientInfo.encounterId = data.encounterId
            if (data.role === 'player' && data.characterId) {
              clientInfo.characterId = data.characterId
            }

            // If group client, send current tab state
            if (clientInfo.role === 'group') {
              sendTabState(peer)
            }

            // If player client, send active scene
            if (clientInfo.role === 'player') {
              sendActiveScene(peer)
            }
          }
          break

        case 'keepalive':
          // Respond with keepalive_ack to prevent tunnel idle timeout
          safeSend(peer, JSON.stringify({
            type: 'keepalive_ack',
            data: { timestamp: Date.now() }
          }))
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

        case 'scene_request':
          // Player requesting current active scene
          if (clientInfo?.role === 'player') {
            sendActiveScene(peer)
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
          // Player or group submitting an action (for GM to see)
          if ((clientInfo?.role === 'player' || clientInfo?.role === 'group') && clientInfo.encounterId) {
            forwardToGm(clientInfo.encounterId, event, peer)
          }
          break

        case 'player_action_ack':
          // GM acknowledging a player action — route to originating player
          if (clientInfo?.role === 'gm') {
            const data = event.data as { requestId?: string }
            if (data.requestId) {
              routeToPlayer(data.requestId, event)
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
          // Scene data changed, broadcast to group and player views
          if (clientInfo?.role === 'gm') {
            broadcastToGroupAndPlayers(event.type, event.data)
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
