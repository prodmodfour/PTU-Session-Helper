/**
 * Shared pending action request tracking.
 *
 * Maps requestId -> characterId so GM acknowledgments can be routed
 * back to the originating player. Used by both the WebSocket handler
 * (ws.ts) and the REST fallback endpoint (action-request.post.ts).
 *
 * Entries auto-expire after 60 seconds via periodic cleanup.
 */

const PENDING_REQUEST_TTL_MS = 60_000
const CLEANUP_INTERVAL_MS = 30_000

interface PendingEntry {
  characterId: string
  createdAt: number
}

const pendingRequests = new Map<string, PendingEntry>()

/**
 * Register a pending action request for response routing.
 * Called when a player submits an action (via WS or REST).
 */
export function registerPendingRequest(requestId: string, characterId: string): void {
  pendingRequests.set(requestId, {
    characterId,
    createdAt: Date.now()
  })
}

/**
 * Look up and consume a pending request entry.
 * Returns the characterId if found, null if expired or not found.
 * Deletes the entry after retrieval (single-use).
 */
export function consumePendingRequest(requestId: string): string | null {
  const entry = pendingRequests.get(requestId)
  if (!entry) return null
  pendingRequests.delete(requestId)
  return entry.characterId
}

/**
 * Look up a pending request without consuming it.
 * Used when the caller needs to check existence before routing.
 */
export function getPendingRequest(requestId: string): PendingEntry | null {
  return pendingRequests.get(requestId) ?? null
}

/**
 * Remove expired entries from the pending requests map.
 */
function cleanupPendingRequests(): void {
  const now = Date.now()
  for (const [requestId, entry] of pendingRequests) {
    if (now - entry.createdAt > PENDING_REQUEST_TTL_MS) {
      pendingRequests.delete(requestId)
    }
  }
}

// Run cleanup every 30 seconds
const cleanupInterval = setInterval(cleanupPendingRequests, CLEANUP_INTERVAL_MS)

// Ensure cleanup stops if the process shuts down
if (typeof process !== 'undefined' && process.on) {
  process.on('beforeExit', () => clearInterval(cleanupInterval))
}
