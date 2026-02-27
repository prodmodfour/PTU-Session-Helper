# P1 Specification: UI Enhancements, WebSocket Sync, Edge Cases

## E. Declaration UI Panel

### New Component: `app/components/encounter/DeclarationPanel.vue`

A GM-facing panel that appears during the `trainer_declaration` phase. It shows the current trainer and prompts the GM to record their declared action.

**Behavior:**
- Visible only when `currentPhase === 'trainer_declaration'` and `isLeagueBattle`
- Shows the declaring trainer's name, speed, and position in declaration order
- Provides a form with:
  - Action type dropdown: Command Pokemon, Switch Pokemon, Use Item, Use Feature, Orders, Pass
  - Description text input (free-text, required)
  - Optional target selector (for commands/switches)
- "Declare" button submits via `encounterStore.submitDeclaration()` then auto-calls `encounterStore.nextTurn()` to advance
- Shows a progress indicator: "Declaring: 2 of 4 trainers"

**Template sketch:**

```vue
<template>
  <div v-if="showDeclarationPanel" class="declaration-panel">
    <div class="declaration-header">
      <PhTextAlignLeft :size="20" />
      <span class="phase-label">Declaration Phase</span>
      <span class="progress">{{ declarationProgress }}</span>
    </div>

    <div class="declaring-trainer">
      <span class="trainer-name">{{ currentTrainerName }}</span>
      <span class="trainer-speed">Speed: {{ currentTrainerSpeed }}</span>
    </div>

    <div class="declaration-form">
      <select v-model="actionType" class="action-type-select">
        <option value="command_pokemon">Command Pokemon</option>
        <option value="switch_pokemon">Switch Pokemon</option>
        <option value="use_item">Use Item</option>
        <option value="use_feature">Use Feature</option>
        <option value="orders">Orders</option>
        <option value="pass">Pass</option>
      </select>

      <textarea
        v-model="description"
        placeholder="Describe the declared action..."
        class="declaration-description"
        rows="2"
      />

      <button
        class="btn btn-primary"
        :disabled="!canDeclare"
        @click="submitDeclaration"
      >
        <PhCheck :size="16" />
        Declare & Next
      </button>
    </div>
  </div>
</template>
```

**Script logic:**

```typescript
const encounterStore = useEncounterStore()

const showDeclarationPanel = computed(() =>
  encounterStore.isLeagueBattle &&
  encounterStore.currentPhase === 'trainer_declaration' &&
  encounterStore.currentCombatant?.type === 'human'
)

const currentTrainerName = computed(() => {
  const c = encounterStore.currentCombatant
  if (!c) return ''
  return (c.entity as { name: string }).name
})

const currentTrainerSpeed = computed(() => {
  const c = encounterStore.currentCombatant
  if (!c) return 0
  return c.initiative
})

const declarationProgress = computed(() => {
  const trainers = encounterStore.trainersByTurnOrder
  const declared = encounterStore.currentDeclarations.length
  return `${declared + 1} of ${trainers.length}`
})

const canDeclare = computed(() =>
  actionType.value !== '' && description.value.trim() !== ''
)

async function submitDeclaration() {
  const combatant = encounterStore.currentCombatant
  if (!combatant) return

  try {
    encounterStore.captureSnapshot('Declare action')
    await encounterStore.submitDeclaration(
      combatant.id,
      actionType.value,
      description.value.trim(),
      selectedTargetIds.value.length > 0 ? selectedTargetIds.value : undefined
    )
    await encounterStore.nextTurn()

    // Reset form for next declaration
    actionType.value = ''
    description.value = ''
    selectedTargetIds.value = []
  } catch (error: any) {
    alert(`Declaration failed: ${error.message}`)
  }
}
```

---

## F. Resolution Summary Display

### New Component: `app/components/encounter/DeclarationSummary.vue`

Displays all declarations made during the current round. Visible during both the resolution phase and the pokemon phase (so all players can reference what trainers declared).

**Behavior:**
- Shows a compact list of all declarations for the current round
- During `trainer_resolution`: highlights the currently-resolving trainer's declaration
- During `pokemon` phase: shows full list as reference (collapsed by default)
- Visible on GM view, Group view, and Player view

**Template sketch:**

```vue
<template>
  <div v-if="hasDeclarations" class="declaration-summary">
    <div class="summary-header" @click="expanded = !expanded">
      <PhListBullets :size="18" />
      <span>Trainer Declarations (Round {{ currentRound }})</span>
      <PhCaretDown :size="14" :class="{ rotated: expanded }" />
    </div>

    <div v-show="expanded" class="summary-list">
      <div
        v-for="declaration in roundDeclarations"
        :key="declaration.combatantId"
        class="declaration-item"
        :class="{
          'is-resolving': isCurrentlyResolving(declaration.combatantId),
          'is-resolved': isResolved(declaration.combatantId)
        }"
      >
        <span class="trainer-name">{{ declaration.trainerName }}</span>
        <span class="action-badge" :class="declaration.actionType">
          {{ formatActionType(declaration.actionType) }}
        </span>
        <span class="declaration-text">{{ declaration.description }}</span>
        <PhCheck v-if="isResolved(declaration.combatantId)" :size="14" class="resolved-icon" />
      </div>
    </div>
  </div>
</template>
```

**Script logic:**

```typescript
const encounterStore = useEncounterStore()

const expanded = ref(true)

const hasDeclarations = computed(() =>
  encounterStore.currentDeclarations.length > 0
)

const roundDeclarations = computed(() =>
  encounterStore.currentDeclarations
)

const currentRound = computed(() =>
  encounterStore.currentRound
)

function isCurrentlyResolving(combatantId: string): boolean {
  if (encounterStore.currentPhase !== 'trainer_resolution') return false
  return encounterStore.currentCombatant?.id === combatantId
}

function isResolved(combatantId: string): boolean {
  if (encounterStore.currentPhase !== 'trainer_resolution') return false
  const turnOrder = encounterStore.encounter?.turnOrder ?? []
  const currentIndex = encounterStore.encounter?.currentTurnIndex ?? 0
  const combatantIndex = turnOrder.indexOf(combatantId)
  return combatantIndex >= 0 && combatantIndex < currentIndex
}

function formatActionType(type: string): string {
  const labels: Record<string, string> = {
    command_pokemon: 'Command',
    switch_pokemon: 'Switch',
    use_item: 'Item',
    use_feature: 'Feature',
    orders: 'Orders',
    pass: 'Pass'
  }
  return labels[type] ?? type
}
```

### Integration Points

The `DeclarationSummary` should be placed in:
- **GM encounter page**: Below the initiative tracker, above the turn actions
- **Group encounter view**: In the encounter info section
- **Player view**: In the combat info section (if implemented)

The `DeclarationPanel` replaces the normal `TurnActions` during declaration phase:
- When `currentPhase === 'trainer_declaration'`, show `DeclarationPanel` instead of move/action controls
- When `currentPhase === 'trainer_resolution'`, show normal `TurnActions` with the declaration summary as context

---

## G. WebSocket Sync for Declarations

### New WebSocket Events

Add declaration-related events to the broadcast system:

**Events to add:**

```typescript
// Client -> Server (via existing broadcast pattern)
'trainer_declared'    // Fired after a trainer records a declaration
'phase_transition'    // Fired when transitioning between declaration/resolution/pokemon

// These are broadcast from GM to all connected clients
```

**Implementation in existing endpoints:**

The `declare.post.ts` endpoint should trigger a WebSocket broadcast after recording a declaration. Follow the existing pattern from damage/heal/status endpoints:

```typescript
// At the end of declare.post.ts, after DB update:
// The caller (GM page) will broadcast via the existing ws pattern:
// ws.send(JSON.stringify({ type: 'trainer_declared', data: { encounterId, declaration } }))
```

The `next-turn.post.ts` already triggers `turn_change` broadcasts. The phase transition information is included in the encounter response (via `currentPhase`), so existing WebSocket sync for `encounter_update` / `turn_change` will propagate phase changes.

**Additional broadcast needed:** When declarations are submitted, broadcast the updated declarations array so Group/Player views can see new declarations in real-time:

```typescript
// WebSocket message type
{
  type: 'declaration_update',
  data: {
    encounterId: string,
    declarations: TrainerDeclaration[],
    currentPhase: TurnPhase
  }
}
```

### Encounter Store WebSocket Handler

Update `updateFromWebSocket` in `encounter.ts` to handle declarations:

```typescript
updateFromWebSocket(data: Encounter) {
  // ... existing handling ...

  // Update declarations
  if (data.declarations !== undefined) {
    this.encounter.declarations = data.declarations
  }
}
```

---

## H. Edge Cases

### H1. Trainer Faints During Declaration Phase

**Scenario:** Trainer A declares. Before Trainer B (next in order) declares, some external effect causes Trainer B to faint (e.g., end-of-turn poison from a previous round).

**Resolution:** Skip the fainted trainer's declaration. When `next-turn` advances to a fainted trainer during declaration phase, auto-skip them (they cannot act). Their declaration slot is simply empty -- no entry in the `declarations` array. During resolution, they have no declaration to resolve and are automatically skipped.

**Implementation:** In `next-turn.post.ts`, after advancing `currentTurnIndex` in declaration phase, check if the new current combatant is fainted. If so, skip forward:

```typescript
// After advancing currentTurnIndex in declaration phase:
if (currentPhase === 'trainer_declaration') {
  // Auto-skip fainted trainers
  while (currentTurnIndex < turnOrder.length) {
    const nextId = turnOrder[currentTurnIndex]
    const nextCombatant = combatants.find((c: any) => c.id === nextId)
    if (nextCombatant && nextCombatant.entity.currentHp > 0) break
    currentTurnIndex++
  }
}
```

Similarly, during resolution phase, skip trainers who have no declaration (either because they were fainted or for any other reason):

```typescript
// After advancing currentTurnIndex in resolution phase:
if (currentPhase === 'trainer_resolution') {
  const declarations = JSON.parse(encounter.declarations || '[]')
  while (currentTurnIndex < turnOrder.length) {
    const nextId = turnOrder[currentTurnIndex]
    const hasDeclaration = declarations.some(
      (d: TrainerDeclaration) => d.combatantId === nextId && d.round === currentRound
    )
    if (hasDeclaration) break
    currentTurnIndex++
  }
}
```

### H2. Speed Change During Declaration Phase

**Scenario:** Trainer A declares a "Use Feature" that somehow changes Speed CS (rare but possible via certain Trainer Features). Per decree-006, initiative should reorder immediately.

**Resolution:** The initiative reorder function (`reorderInitiativeAfterSpeedChange`) already handles league battle mode. When speed changes during declaration phase:
1. Recalculate initiative for all combatants
2. Re-sort remaining (undeclared) trainers in the declaration order
3. Trainers who already declared retain their position (they've already committed)
4. This is consistent with decree-006: "combatants who have already acted retain their position"

No additional code needed -- the existing `reorderInitiativeAfterSpeedChange` in `encounter.service.ts` already preserves acted positions and respects league battle phase. The declaration phase uses the same turn progression mechanism, so the reorder will correctly treat declared trainers as "acted."

### H3. Adding/Removing Combatants Mid-Declaration

**Scenario:** A new trainer or Pokemon is added to the encounter during the declaration phase (e.g., a reinforcement arrives).

**Resolution:**
- **New trainer added during declaration phase:** They are appended to the remaining (undeclared) portion of the trainer turn order, sorted by initiative. They get to declare.
- **Trainer removed during declaration phase:** Their declaration (if any) is removed from the declarations array. If it was their turn, auto-advance.
- **Pokemon added/removed:** No effect on declaration/resolution phases. Pokemon turn order is updated for the pokemon phase.

This is handled by the existing combatant add/remove endpoints which rebuild turn orders.

### H4. Undo During Declaration/Resolution

**Scenario:** The GM uses undo during the declaration or resolution phase.

**Resolution:** The undo system works by restoring full encounter snapshots. Since `declarations` is now part of the encounter state, undo will naturally restore the previous declarations array along with the phase and turn index. No special handling needed -- the existing undo/redo mechanism captures the full encounter state including the new `declarations` field.

### H5. Held/Ready Actions in Declaration Phase

**Scenario:** Can a trainer "hold" their declaration to act later?

**Resolution:** No. The PTU rule is explicit: "Trainers declare their actions in order from lowest to highest speed." The order is mandatory. A trainer cannot skip their declaration slot. If they want to do nothing, they declare "Pass." The hold/ready action mechanic applies to the pokemon phase only.

### H6. Declaration Phase Display in Initiative Tracker

The existing `InitiativeTracker` component (or equivalent) should visually distinguish the three phases:

- **Declaration phase:** Show trainers in low-to-high speed order with a "Declaring..." label. Show a distinct color/icon for the declaration phase.
- **Resolution phase:** Show trainers in high-to-low speed order with declared actions visible. Highlight the currently-resolving trainer.
- **Pokemon phase:** Standard initiative display (existing behavior).

The phase label should be prominently displayed:
- `trainer_declaration` -> "Trainer Declaration Phase (Low -> High Speed)"
- `trainer_resolution` -> "Trainer Resolution Phase (High -> Low Speed)"
- `pokemon` -> "Pokemon Phase"

---

## Summary of File Changes (P1)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/DeclarationPanel.vue` | GM form for recording trainer declarations |
| **NEW** | `app/components/encounter/DeclarationSummary.vue` | Read-only summary of current round declarations |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Auto-skip fainted/missing-declaration trainers |
| **EDIT** | `app/stores/encounter.ts` | Add `updateFromWebSocket` handling for declarations |
| **EDIT** | GM encounter page | Integrate DeclarationPanel and DeclarationSummary |
| **EDIT** | Group encounter view | Integrate DeclarationSummary |
| **EDIT** | Initiative tracker component | Phase labels and visual differentiation |
