# P0: Player Action Request Extensions + GM Request Panel

## Goal

Extend the player action type system to support capture and healing actions, and build the GM-side request display panel. P0 delivers the plumbing that P1 (capture) and P2 (healing) build on.

---

## Section A: Extend PlayerActionType

### File: `app/types/player-sync.ts`

Add three new action types to the existing `PlayerActionType` union:

```typescript
export type PlayerActionType =
  | 'use_move' | 'shift' | 'struggle' | 'pass'
  | 'use_item' | 'switch_pokemon' | 'maneuver' | 'move_token'
  | 'capture'           // NEW: throw a Poke Ball
  | 'breather'          // NEW: Take a Breather maneuver
  | 'use_healing_item'  // NEW: use a healing item (feature-020 dependent)
```

### File: `app/types/player-sync.ts` (PlayerActionRequest)

Add new optional fields to the existing `PlayerActionRequest` interface:

```typescript
export interface PlayerActionRequest {
  // ... existing fields unchanged ...

  // Capture-specific (action: 'capture')
  targetPokemonId?: string
  targetPokemonName?: string
  ballType?: string
  captureRatePreview?: number
  trainerCombatantId?: string

  // Breather-specific (action: 'breather')
  combatantId?: string
  assisted?: boolean

  // Healing item specific (action: 'use_healing_item')
  healingItemName?: string
  healingTargetId?: string
  healingTargetName?: string
}
```

**Rationale:** Extending the existing interface with optional fields follows the Open/Closed principle -- existing code that constructs `PlayerActionRequest` for other actions is unaffected.

---

## Section B: Player-Side Request Functions

### File: `app/composables/usePlayerCombat.ts`

Add two new request functions alongside existing `requestUseItem`, `requestSwitchPokemon`, `requestManeuver`:

```typescript
/**
 * Request to throw a Poke Ball at a target Pokemon.
 * Capture is a Standard Action (PTU p.227).
 * GM must approve before executing the capture attempt.
 */
const requestCapture = (params: {
  targetPokemonId: string
  targetPokemonName: string
  ballType?: string
  captureRatePreview?: number
  trainerCombatantId: string
}): void => {
  const request: PlayerActionRequest = {
    ...buildBaseRequest(),
    action: 'capture',
    targetPokemonId: params.targetPokemonId,
    targetPokemonName: params.targetPokemonName,
    ballType: params.ballType ?? 'Poke Ball',
    captureRatePreview: params.captureRatePreview,
    trainerCombatantId: params.trainerCombatantId
  }
  send({ type: 'player_action', data: request })
}

/**
 * Request to Take a Breather.
 * Full Action (PTU p.245): uses both Standard and Shift actions.
 * GM must approve before executing the breather.
 */
const requestBreather = (params: {
  combatantId: string
  assisted?: boolean
}): void => {
  const request: PlayerActionRequest = {
    ...buildBaseRequest(),
    action: 'breather',
    combatantId: params.combatantId,
    assisted: params.assisted ?? false
  }
  send({ type: 'player_action', data: request })
}

/**
 * Request to use a healing item (requires feature-020).
 * Using items is a Standard Action (PTU p.276).
 * GM must approve before applying the item.
 */
const requestHealingItem = (params: {
  healingItemName: string
  healingTargetId: string
  healingTargetName: string
  trainerCombatantId: string
}): void => {
  const request: PlayerActionRequest = {
    ...buildBaseRequest(),
    action: 'use_healing_item',
    healingItemName: params.healingItemName,
    healingTargetId: params.healingTargetId,
    healingTargetName: params.healingTargetName,
    trainerCombatantId: params.trainerCombatantId
  }
  send({ type: 'player_action', data: request })
}
```

Add these to the return object of `usePlayerCombat()`.

---

## Section C: GM-Side Player Request Panel

### New File: `app/components/encounter/PlayerRequestPanel.vue` (~200 lines)

A panel component displayed in the GM encounter view that shows incoming player action requests with approve/deny buttons.

**Props:**
```typescript
interface Props {
  encounterId: string
}
```

**State:**
```typescript
// Pending requests from players
const pendingRequests = ref<Map<string, DisplayedRequest>>(new Map())

interface DisplayedRequest {
  requestId: string
  playerId: string
  playerName: string
  action: PlayerActionType
  // Capture fields
  targetPokemonId?: string
  targetPokemonName?: string
  ballType?: string
  captureRatePreview?: number
  trainerCombatantId?: string
  // Breather fields
  combatantId?: string
  assisted?: boolean
  // Healing item fields
  healingItemName?: string
  healingTargetId?: string
  healingTargetName?: string
  // Display state
  receivedAt: number
  status: 'pending' | 'processing' | 'resolved'
}
```

**Template structure:**
```
<div class="player-requests">
  <h3>Player Requests</h3>
  <div v-if="pendingList.length === 0" class="player-requests__empty">
    No pending requests
  </div>
  <div v-for="req in pendingList" :key="req.requestId" class="player-requests__card">
    <div class="player-requests__header">
      <span class="player-requests__player">{{ req.playerName }}</span>
      <span class="player-requests__action">{{ formatAction(req) }}</span>
      <span class="player-requests__timer">{{ formatTimer(req.receivedAt) }}</span>
    </div>
    <div class="player-requests__details">
      <!-- Capture details -->
      <template v-if="req.action === 'capture'">
        Throw {{ req.ballType }} at {{ req.targetPokemonName }}
        <span v-if="req.captureRatePreview" class="player-requests__rate">
          (Rate: {{ req.captureRatePreview }}%)
        </span>
      </template>
      <!-- Breather details -->
      <template v-else-if="req.action === 'breather'">
        Take a Breather {{ req.assisted ? '(Assisted)' : '(Standard)' }}
      </template>
      <!-- Healing item details -->
      <template v-else-if="req.action === 'use_healing_item'">
        Use {{ req.healingItemName }} on {{ req.healingTargetName }}
      </template>
      <!-- Existing actions (use_item, switch_pokemon, maneuver) -->
      <template v-else>
        {{ formatGenericAction(req) }}
      </template>
    </div>
    <div class="player-requests__actions">
      <button
        class="btn btn--sm btn--success"
        :disabled="req.status !== 'pending'"
        @click="handleApprove(req)"
      >
        <PhCheck :size="16" /> Approve
      </button>
      <button
        class="btn btn--sm btn--danger"
        :disabled="req.status !== 'pending'"
        @click="handleDeny(req)"
      >
        <PhX :size="16" /> Deny
      </button>
    </div>
  </div>
</div>
```

**Approve handler (capture):**
```typescript
const handleApprove = async (req: DisplayedRequest) => {
  req.status = 'processing'

  try {
    if (req.action === 'capture') {
      // GM executes the capture via existing useCapture composable
      // The capture result is sent back to the player via ack
      emit('approve-capture', {
        requestId: req.requestId,
        targetPokemonId: req.targetPokemonId,
        trainerCombatantId: req.trainerCombatantId,
        ballType: req.ballType
      })
    } else if (req.action === 'breather') {
      emit('approve-breather', {
        requestId: req.requestId,
        combatantId: req.combatantId,
        assisted: req.assisted
      })
    } else if (req.action === 'use_healing_item') {
      emit('approve-healing-item', {
        requestId: req.requestId,
        healingItemName: req.healingItemName,
        healingTargetId: req.healingTargetId,
        trainerCombatantId: req.trainerCombatantId
      })
    } else {
      // Generic approval for existing action types
      emit('approve-generic', { requestId: req.requestId, request: req })
    }
  } catch {
    req.status = 'pending'
  }
}
```

**Deny handler:**
```typescript
const handleDeny = (req: DisplayedRequest) => {
  const reason = '' // Could add an input for reason, but keeping it simple
  emit('deny', { requestId: req.requestId, reason })
  removeRequest(req.requestId)
}
```

**WS listener setup:**
The component listens for `player_action` events that come in for the new action types (`capture`, `breather`, `use_healing_item`). This is wired through the encounter store or a direct WS message listener on the GM page.

---

## Section D: Wire PlayerRequestPanel into GM Encounter View

### File: `app/components/encounter/EncounterView.vue` (or equivalent GM encounter component)

Add `PlayerRequestPanel` to the GM's encounter view, positioned near the combatant list or action area.

```vue
<!-- Player Requests (visible to GM only) -->
<PlayerRequestPanel
  v-if="encounter"
  :encounter-id="encounter.id"
  @approve-capture="handleApproveCapture"
  @approve-breather="handleApproveBreather"
  @approve-healing-item="handleApproveHealingItem"
  @approve-generic="handleApproveGeneric"
  @deny="handleDenyRequest"
/>
```

**GM approve handlers (in parent component):**

```typescript
const handleApproveCapture = async (data: {
  requestId: string
  targetPokemonId: string
  trainerCombatantId: string
  ballType: string
}) => {
  // 1. Roll accuracy (AC 6) using existing useCapture.rollAccuracyCheck()
  // 2. If hit, call useCapture.attemptCapture() with encounter context
  // 3. Send player_action_ack with result
  const { rollAccuracyCheck, attemptCapture } = useCapture()
  const accuracyResult = rollAccuracyCheck()

  const result = await attemptCapture({
    pokemonId: data.targetPokemonId,
    trainerId: playerStore.characterId!, // The trainer requesting
    accuracyRoll: accuracyResult.roll,
    encounterContext: {
      encounterId: encounter.value!.id,
      trainerCombatantId: data.trainerCombatantId
    }
  })

  // Send ack to player
  send({
    type: 'player_action_ack',
    data: {
      requestId: data.requestId,
      status: 'accepted',
      result: {
        accuracyRoll: accuracyResult.roll,
        captured: result?.captured ?? false,
        captureRate: result?.captureRate,
        roll: result?.roll,
        reason: result?.reason
      }
    }
  })
}

const handleApproveBreather = async (data: {
  requestId: string
  combatantId: string
  assisted: boolean
}) => {
  // Call existing breather endpoint
  const result = await $fetch(`/api/encounters/${encounter.value!.id}/breather`, {
    method: 'POST',
    body: {
      combatantId: data.combatantId,
      assisted: data.assisted
    }
  })

  // Refresh encounter state
  await encounterStore.fetchEncounter(encounter.value!.id)

  // Send ack to player
  send({
    type: 'player_action_ack',
    data: {
      requestId: data.requestId,
      status: 'accepted',
      result: result
    }
  })
}

const handleDenyRequest = (data: { requestId: string; reason: string }) => {
  send({
    type: 'player_action_ack',
    data: {
      requestId: data.requestId,
      status: 'rejected',
      reason: data.reason || 'GM declined the request'
    }
  })
}
```

---

## P0 File Summary

| File | Type | Change | Lines |
|------|------|--------|-------|
| `app/types/player-sync.ts` | Modified | Add 'capture', 'breather', 'use_healing_item' to PlayerActionType + new request fields | +25 |
| `app/composables/usePlayerCombat.ts` | Modified | Add requestCapture, requestBreather, requestHealingItem functions | +60 |
| `app/components/encounter/PlayerRequestPanel.vue` | New | GM-side request display + approve/deny | ~200 |
| GM encounter view component | Modified | Wire PlayerRequestPanel with event handlers | +80 |

**Estimated commits:** 3-4

**Acceptance criteria:**
- New action types compile without errors
- GM sees incoming player requests in real time
- Approve/deny buttons trigger correct actions and send acks
- Denied requests show toast on player side
- Requests expire after 60 seconds (matching pendingRequests TTL)
