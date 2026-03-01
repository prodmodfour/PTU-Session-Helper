# Shared Specifications

## Data Flow Diagram

```
PLAYER REQUESTS CAPTURE/HEALING:
  Player taps "Throw Poke Ball" or "Take a Breather" on their device
       |
       v
  PlayerCapturePanel / PlayerHealingPanel builds request payload
       |
       v
  usePlayerCombat.requestCapture() / requestBreather() called
       |
       v
  Sends player_action WebSocket message with:
    - requestId (unique, for ack tracking)
    - playerId (character ID)
    - playerName
    - action: 'capture' or 'breather'
    - capture-specific: targetPokemonId, ballType, captureRatePreview
    - breather-specific: combatantId, assisted (boolean)
       |
       v
  ws.ts forwardToGm() registers requestId -> characterId
       |
       v
  GM receives player_action event
       |
       v
  PlayerRequestPanel displays request with details:
    - Capture: "[Player] wants to throw [Ball] at [Pokemon] (Rate: X%)"
    - Breather: "[Player] wants to Take a Breather [Assisted/Standard]"
    - [Approve] [Deny] buttons
       |
       +---> GM clicks Approve:
       |       - GM executes the actual game action via existing endpoints
       |         (POST /api/capture/attempt or POST /api/encounters/:id/breather)
       |       - GM sends player_action_ack { status: 'accepted', result: {...} }
       |       - encounter_update broadcast propagates state change to all views
       |       - Player sees success toast
       |
       +---> GM clicks Deny:
               - GM sends player_action_ack { status: 'rejected', reason: '...' }
               - Player sees denial toast with reason
```

---

## Extended PlayerActionType

### Changes to `app/types/player-sync.ts`

```typescript
// Add to existing PlayerActionType union
export type PlayerActionType =
  | 'use_move' | 'shift' | 'struggle' | 'pass'
  | 'use_item' | 'switch_pokemon' | 'maneuver' | 'move_token'
  | 'capture'     // [NEW] Player wants to throw a Poke Ball
  | 'breather'    // [NEW] Player wants to Take a Breather
  | 'use_healing_item'  // [NEW] Player wants to use a healing item (feature-020 dependent)
```

### Extended PlayerActionRequest Fields

```typescript
// Add to existing PlayerActionRequest interface
export interface PlayerActionRequest {
  // ... existing fields ...

  // Capture-specific (action: 'capture')
  targetPokemonId?: string       // Entity ID of the wild Pokemon to capture
  targetPokemonName?: string     // Display name for GM notification
  ballType?: string              // Poke Ball type (default: 'pokeball')
  captureRatePreview?: number    // Client-side capture rate for GM reference
  trainerCombatantId?: string    // Combatant ID of the trainer throwing the ball

  // Breather-specific (action: 'breather')
  combatantId?: string           // Combatant ID requesting the breather
  assisted?: boolean             // Whether requesting assisted breather (PTU p.245)

  // Healing item specific (action: 'use_healing_item')
  healingItemName?: string       // Name from HEALING_ITEM_CATALOG
  healingTargetId?: string       // Combatant ID of the heal target
}
```

---

## Existing Infrastructure Reuse

### WebSocket Protocol (No Changes Needed)

The existing `player_action` / `player_action_ack` event pair handles all new action types. The `action` field discriminates the request type. No new WebSocket event types are needed.

| Event | Direction | Already Exists | Change |
|-------|-----------|---------------|--------|
| `player_action` | Player -> GM | Yes | New `action` values: 'capture', 'breather', 'use_healing_item' |
| `player_action_ack` | GM -> Player | Yes | `result` field carries capture outcome or breather result |
| `forwardToGm()` | Server | Yes | No change |
| `routeToPlayer()` | Server | Yes | No change |
| `pendingRequests` | Server | Yes | No change (60s TTL) |

### Existing API Endpoints (Reused by GM)

| Endpoint | Purpose | Called By |
|----------|---------|----------|
| `POST /api/capture/rate` | Get capture rate for a Pokemon | Player (preview), GM (verification) |
| `POST /api/capture/attempt` | Execute capture attempt | GM only (after approving player request) |
| `POST /api/encounters/:id/breather` | Execute Take a Breather | GM only (after approving player request) |
| `POST /api/encounters/:id/use-item` | Apply healing item | GM only (after approving, if feature-020 implemented) |

### Existing Composables (Reused)

| Composable | Used For | By |
|------------|----------|-----|
| `useCapture.getCaptureRate()` | Capture rate preview in player panel | Player |
| `useCapture.calculateCaptureRateLocal()` | Client-side rate calculation | Player |
| `useCapture.rollAccuracyCheck()` | Not used by player (GM rolls) | -- |
| `usePlayerCombat.buildBaseRequest()` | Request construction | Player |
| `usePlayerWebSocket.sendAction()` | Promise-based action with ack tracking | Player |

---

## GM-Side Request Display

### PlayerRequestPanel Component

A new component displayed in the GM encounter view that shows incoming player action requests. This component is shared across all tiers (capture, breather, healing items).

**Location:** `app/components/encounter/PlayerRequestPanel.vue`

**Data model:**

```typescript
interface DisplayedRequest {
  requestId: string
  playerId: string
  playerName: string
  action: PlayerActionType
  description: string        // Human-readable summary
  details: Record<string, string | number | boolean>  // Key-value pairs for detail display
  receivedAt: number         // Timestamp for TTL display
  status: 'pending' | 'approved' | 'denied'
}
```

**Behavior:**
- Listens for `player_action` events via the encounter store or WS listener
- Displays pending requests as cards with player name, action description, and approve/deny buttons
- On approve: GM executes the relevant action (capture/breather/item) and sends `player_action_ack`
- On deny: GM sends `player_action_ack` with `status: 'rejected'` and optional reason
- Requests auto-expire visually after 60 seconds (matching server-side TTL)
- Multiple requests can be pending simultaneously (Map keyed by requestId)

---

## AoO Interaction (feature-016)

Capture (Standard Action) and Take a Breather (Full Action) are both actions that can trigger Attacks of Opportunity if the acting combatant is in a threatened square. The feature-016 AoO system detects triggers when the GM executes the actual game action, not when the player submits the request.

**Flow with AoO:**
1. Player requests capture -> GM approves -> GM calls capture API
2. If capture consumes a Standard Action and the trainer is in a threatened square, the AoO system on the GM side detects the trigger
3. GM resolves the AoO before or after the capture (per their judgment)
4. The player is not involved in AoO resolution -- it happens on the GM side

This means no AoO detection code is needed in the player view. The existing AoO trigger detection in the encounter store handles it when the GM executes the approved action.

---

## Error Handling Pattern

All player requests follow the same error handling pattern:

```typescript
// In PlayerCapturePanel / PlayerHealingPanel
try {
  const ack = await sendAction({
    action: 'capture',
    targetPokemonId: selectedTarget.value.entityId,
    // ... other fields
  })

  if (ack.status === 'accepted') {
    showToast('Capture attempt approved!', 'success')
    // Result details in ack.result
  } else {
    showToast(`Request denied: ${ack.reason || 'GM declined'}`, 'error')
  }
} catch (err) {
  // Timeout (60s) or WS disconnection
  showToast('Request timed out -- ask GM directly', 'error')
}
```

---

## Mobile UX Patterns

All new panels follow the existing PlayerCombatActions design:
- **44x44px minimum touch targets** for all buttons
- **BEM naming** with `combat-actions__` prefix for style scoping
- **Expandable panels** (same pattern as item/switch/maneuver panels)
- **Toast notifications** for request status feedback
- **Single-action flow**: tap button -> select target (if needed) -> confirm -> wait for GM
- **Panels auto-close** when turn ends (existing watcher in PlayerCombatActions)
