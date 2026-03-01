# Testing Strategy

## Overview

Testing follows the project's standard Vitest unit testing approach. Each tier has its own test suite. The design reuses existing capture and healing endpoints -- the new code is primarily UI components and composables that wire into existing infrastructure.

Key testing focus:
1. Type extensions compile correctly (TypeScript coverage)
2. Composable logic: target filtering, request construction, capture rate preview
3. Component behavior: panel state management, button enable/disable, request flow
4. WebSocket integration: request/ack round trip via mocked WS

---

## P0 Test Suite

### PlayerActionType Extensions: `app/tests/unit/types/player-sync-capture.test.ts`

```
Test: PlayerActionType includes new action types
  - 'capture' is a valid PlayerActionType
  - 'breather' is a valid PlayerActionType
  - 'use_healing_item' is a valid PlayerActionType
  - All existing types still valid ('use_move', 'shift', etc.)

Test: PlayerActionRequest capture fields
  - Request with action 'capture' accepts targetPokemonId, ballType, captureRatePreview, trainerCombatantId
  - All capture-specific fields are optional (interface extends without breaking)
  - Existing request shapes (use_item, switch_pokemon) still compile

Test: PlayerActionRequest breather fields
  - Request with action 'breather' accepts combatantId, assisted
  - assisted defaults to false when not provided
```

### usePlayerCombat request functions: `app/tests/unit/composables/usePlayerCombat-capture.test.ts`

```
Test: requestCapture
  - Calls send() with type 'player_action' and action 'capture'
  - Includes requestId, playerId, playerName from buildBaseRequest
  - Includes targetPokemonId, targetPokemonName, ballType, captureRatePreview, trainerCombatantId
  - ballType defaults to 'Poke Ball' when not specified
  - Does not throw when injectedSend is available

Test: requestBreather
  - Calls send() with type 'player_action' and action 'breather'
  - Includes requestId, playerId, playerName from buildBaseRequest
  - Includes combatantId and assisted flag
  - assisted defaults to false when not specified

Test: requestHealingItem
  - Calls send() with type 'player_action' and action 'use_healing_item'
  - Includes healingItemName, healingTargetId, healingTargetName, trainerCombatantId

Test: captureTargets computed
  - Returns only enemy-side Pokemon combatants
  - Excludes fainted Pokemon (currentHp <= 0)
  - Excludes human combatants (trainers)
  - Excludes player-side and ally-side combatants
  - Returns empty array when no encounter loaded
  - Returns empty array when no enemy Pokemon exist
```

### PlayerRequestPanel: `app/tests/unit/components/PlayerRequestPanel.test.ts`

```
Test: Rendering
  - Shows "No pending requests" when empty
  - Shows request card when player_action received
  - Displays player name, action type, target details
  - Capture request shows ball type and capture rate preview
  - Breather request shows standard/assisted label
  - Healing item request shows item name and target name
  - Shows timer counting from receivedAt

Test: Approve/Deny buttons
  - Approve button emits 'approve-capture' with correct payload for capture requests
  - Approve button emits 'approve-breather' with correct payload for breather requests
  - Deny button emits 'deny' with requestId
  - Buttons disabled when request status is 'processing'
  - Multiple pending requests display independently

Test: Request lifecycle
  - Request removed from display after approval emitted
  - Request removed from display after denial emitted
  - Request auto-expires after 60 seconds (visual timeout)
```

---

## P1 Test Suite

### usePlayerCapture: `app/tests/unit/composables/usePlayerCapture.test.ts`

```
Test: fetchCaptureRate
  - Calls getCaptureRate with the Pokemon's entity ID
  - Returns CaptureRateData on success
  - Returns null for non-pokemon combatants
  - Returns null on API error

Test: estimateCaptureRate
  - Calculates rate locally from combatant data
  - Uses real maxHp (decree-015)
  - Returns null for non-pokemon combatants
  - Handles missing statusConditions gracefully (defaults to [])
  - Handles missing injuries gracefully (defaults to 0)
  - Includes evolutionStage and maxEvolutionStage in calculation
```

### PlayerCapturePanel: `app/tests/unit/components/PlayerCapturePanel.test.ts`

```
Test: Target selection
  - Shows enemy Pokemon as capture targets
  - Excludes fainted Pokemon
  - Excludes player/ally Pokemon
  - Shows Pokemon sprite, name, and HP
  - Selecting a target shows capture rate preview
  - "No wild Pokemon to capture" shown when no targets

Test: Capture rate preview
  - Displays CaptureRateDisplay component with fetched rate
  - Shows loading state while fetching
  - Shows action cost reminder (Standard Action, AC 6)
  - CaptureRateDisplay shows breakdown on hover

Test: Request submission
  - "Request Capture" button disabled when no target selected
  - "Request Capture" button disabled when capture rate shows canBeCaptured = false
  - Clicking "Request Capture" emits request-sent event
  - Request includes targetPokemonId, targetPokemonName, ballType, captureRatePreview, trainerCombatantId
  - Button shows "Waiting for GM..." during pending state
  - Cancel button clears selection and closes panel

Test: Visibility rules
  - Panel hidden when active combatant is Pokemon
  - Panel hidden during Pokemon phase in League Battles
  - Capture button disabled when Standard Action used
```

---

## P2 Test Suite

### PlayerHealingPanel: `app/tests/unit/components/PlayerHealingPanel.test.ts`

```
Test: Take a Breather tab
  - Shows breather description (reset stages, cure volatile, etc.)
  - Shows action cost as "Full Action (Standard + Shift)"
  - Shows Tripped + Vulnerable warning
  - "Request Breather" disabled when Standard Action used
  - "Request Breather" disabled when Shift Action used
  - Clicking "Request Breather" emits request-sent with combatantId and assisted: false
  - Assisted checkbox toggleable
  - Clicking "Request Breather" with assisted checked emits assisted: true
  - Assisted checkbox disabled when no adjacent ally detected
  - Assisted description visible only when checkbox checked

Test: Healing Items tab (feature-020 dependent)
  - Tab hidden when HEALING_ITEM_CATALOG not available
  - Tab visible when HEALING_ITEM_CATALOG exists with items
  - Shows items from trainer inventory that match catalog
  - "No items" message when inventory is empty
  - Selecting item shows target selection
  - Target list shows player-side combatants with HP < maxHp
  - Selecting target sends use_healing_item request with item name, target ID, trainer combatant ID
  - Request includes healingItemName, healingTargetId, healingTargetName

Test: Panel integration
  - Panel closes on cancel
  - Panel closes when turn ends
  - Tab state persists within same turn
  - Both tabs accessible when both features available
  - Only breather tab when healing items not available
```

---

## Integration Test Notes

No Playwright e2e tests are defined for this feature. Integration testing will be covered by:
1. Manual testing with GM + player views open simultaneously
2. WebSocket round-trip verification (player request -> GM sees panel -> approve -> player gets ack)
3. UX exploration sessions (ux-session-004 or later -- covers capture workflows)

---

## Test Coverage Targets

| Layer | File | Target |
|-------|------|--------|
| Types | `player-sync.ts` extensions | TypeScript compilation (no runtime tests) |
| Composable | `usePlayerCapture.ts` | 90%+ (all branches) |
| Composable | `usePlayerCombat.ts` (new functions) | 80%+ (request construction paths) |
| Component | `PlayerRequestPanel.vue` | 80%+ (render + event emission) |
| Component | `PlayerCapturePanel.vue` | 80%+ (target selection + request flow) |
| Component | `PlayerHealingPanel.vue` | 80%+ (breather + item tabs) |

---

## PTU Rule Verification Checklist

These tests explicitly verify PTU book values:

- [ ] Capture is a Standard Action (R032 -- button disabled when Standard Action used)
- [ ] Poke Ball throwing accuracy is AC 6 (R004 -- displayed in panel)
- [ ] Capture rate uses 1d100 system (decree-013 -- via existing calculateCaptureRate)
- [ ] Capture rate uses real max HP (decree-015 -- via existing getCaptureRate)
- [ ] Stuck/Slow bonuses are separate (decree-014 -- via existing calculateCaptureRate)
- [ ] Take a Breather is a Full Action (R019 -- button disabled when either Standard/Shift used)
- [ ] Take a Breather resets stages, cures volatile, applies Tripped+Vulnerable (R018 -- described in UI, executed by existing breather endpoint)
- [ ] Assisted breather applies Tripped+ZeroEvasion instead (R018 -- checkbox + description)
- [ ] Healing item use is a Standard Action (R041 -- button disabled when Standard Action used, handled by existing feature-020 endpoint)
