# P1 Spec: Priority Actions, Interrupt Actions, Hold Action

## Scope

P1 builds on the P0 out-of-turn action engine to implement the three remaining out-of-turn action categories: Priority (standard, limited, advanced), Interrupt actions, and the Hold Action mechanic. These are the core mechanisms that let combatants act outside their normal initiative order.

### Matrix Rules Covered

| Rule | Title | Coverage |
|------|-------|----------|
| R040 | Initiative — Holding Action | Full |
| R046 | Priority Action Rules | Full |
| R047 | Priority Limited/Advanced Variants | Full |
| R048 | Interrupt Actions | Full |

### Dependencies

- P0: Out-of-turn action engine, `OutOfTurnAction` type, `out-of-turn.service.ts`
- Existing: `next-turn.post.ts`, `start.post.ts`, `encounter.ts` store, `ws.ts`
- decree-006: Dynamic initiative reorder (affects Hold Action)

---

## Section A: Hold Action (R040)

### A1: PTU Rules

PTU p.227: "Combatants can choose to hold their action until a specified lower Initiative value once per round."

Key rules:
- Must be declared on the combatant's turn (before they act).
- They specify a target initiative value.
- When that initiative value is reached in the turn order, the holding combatant acts.
- Can only hold once per round.
- If the round ends before the held initiative is reached, the action is lost.

### A2: Hold Action Flow

1. **Declare Hold:** On their turn, the combatant declares they are holding. The GM provides the target initiative (or null for "hold until triggered").
2. **Skip Turn:** The combatant's turn is skipped for now. Their `turnState.isHolding` is set to `true`.
3. **Check Queue:** After each subsequent combatant's turn ends, check the hold queue. If the current initiative has reached or passed the held combatant's target, insert the held combatant's turn.
4. **Execute Held Turn:** The held combatant gets a full turn (Standard + Shift + Swift actions).
5. **Round End:** Any unheld actions at round end are lost.

### A3: Server Endpoint

#### `POST /api/encounters/:id/hold-action` (new)

```typescript
// Request:
{
  combatantId: string;
  holdUntilInitiative: number | null; // null = hold indefinitely
}

// Response:
{
  success: true;
  data: Encounter; // Updated with holdQueue entry, combatant skipped
}
```

**Logic:**
1. Validate combatant hasn't acted yet this turn.
2. Validate combatant hasn't held this round already (`holdAction.holdUsedThisRound`).
3. Set `combatant.turnState.isHolding = true` and `holdAction.holdUsedThisRound = true`.
4. Add entry to `encounter.holdQueue`: `{ combatantId, holdUntilInitiative }`.
5. Advance the turn (skip this combatant without consuming actions).
6. Return updated encounter.

#### `POST /api/encounters/:id/release-hold` (new)

Called when a held combatant's target initiative is reached or when the GM manually releases a held action.

```typescript
// Request:
{
  combatantId: string;
}

// Response:
{
  success: true;
  data: Encounter; // Turn order adjusted, held combatant is now active
}
```

**Logic:**
1. Remove combatant from `holdQueue`.
2. Insert combatant into the current turn order at the current position.
3. Set `combatant.turnState.isHolding = false`.
4. Grant full action economy (standard + shift + swift).
5. The combatant is now the active combatant.

### A4: Hold Queue Integration with Turn Progression

In `next-turn.post.ts`, after advancing `currentTurnIndex`:

```typescript
// After incrementing currentTurnIndex, before continuing:
// Check if any held combatants should be released.
const holdQueue = JSON.parse(encounter.holdQueue || '[]');
if (holdQueue.length > 0) {
  const nextCombatantId = turnOrder[currentTurnIndex];
  const nextCombatant = combatants.find(c => c.id === nextCombatantId);
  const nextInit = nextCombatant?.initiative ?? 0;

  for (const held of holdQueue) {
    if (held.holdUntilInitiative !== null && nextInit <= held.holdUntilInitiative) {
      // This held combatant should act now.
      // Insert them before the current turn index.
      // The endpoint handles the insertion.
    }
  }
}
```

The actual insertion is complex because the turn order array needs to be modified mid-round. The `release-hold` endpoint handles this by:
1. Splicing the held combatant into `turnOrder` at `currentTurnIndex`.
2. All subsequent entries shift right by 1.
3. Setting `currentTurnIndex` to point at the newly inserted combatant.

### A5: Interaction with decree-006

When initiative is dynamically reordered (decree-006), held combatants retain their hold. The `holdUntilInitiative` target is an absolute initiative value, not a position in the turn order. If reordering causes combatants to shuffle, the hold still activates when the initiative count reaches the target value.

### A6: UI Component

**File:** `app/components/encounter/HoldActionButton.vue` (new)

A button in the turn action panel that lets the GM declare a hold action for the current combatant.

```vue
<template>
  <div v-if="canHold" class="hold-action">
    <button class="btn btn-hold" @click="showHoldDialog = true">
      <PhPause :size="16" /> Hold Action
    </button>

    <div v-if="showHoldDialog" class="hold-dialog">
      <label>Hold until initiative:</label>
      <input
        v-model.number="targetInitiative"
        type="number"
        :max="currentInitiative - 1"
        min="0"
        placeholder="Enter initiative value"
      />
      <div class="hold-dialog-actions">
        <button class="btn btn-confirm" @click="confirmHold">
          <PhCheck :size="14" /> Confirm
        </button>
        <button class="btn btn-cancel" @click="showHoldDialog = false">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
```

The turn panel also shows held combatants with a distinct visual:
- Held combatants in the initiative list show a pause icon.
- Their entry is dimmed but visible with a "Holding until Init X" label.

---

## Section B: Priority Actions (R046, R047)

### B1: PTU Rules

PTU p.228:

**Priority (Standard):**
- "If the user has not already acted this turn, an action with the Priority keyword may be declared to act immediately; the user takes their full turn, ignoring initiative."
- "This counts as their turn for the round."
- "A priority action may not be declared during someone else's turn; it must be declared between turns."
- Once per round.

**Priority (Limited):**
- "Like Priority except the user may not take their full turn; they may only take the action that itself has Priority and take the rest of their turn on their own Initiative Count."
- Example: Orders are Priority (Limited) — only Standard Action consumed.

**Priority (Advanced):**
- "Priority (Advanced) actions don't require that the user hasn't acted that turn; if they have, they simply give up their turn on the following round."

### B2: Priority Action Flow

#### Standard Priority:
1. **Declare** — Between turns (after one combatant finishes, before the next starts), the GM declares a Priority action for a combatant.
2. **Validate** — Combatant has not acted this round. Combatant has not used Priority this round.
3. **Insert Turn** — The combatant immediately takes their full turn (interrupting the normal turn order).
4. **Mark** — `outOfTurnUsage.priorityUsed = true`, `hasActed = true` (they used their turn).
5. **Resume** — Normal turn order continues. The combatant's original position in the turn order is skipped (they already acted).

#### Limited Priority:
1. **Declare** — Same as standard.
2. **Validate** — Same as standard.
3. **Execute Action Only** — The combatant takes ONLY the Priority action (Standard Action consumed).
4. **Mark** — `outOfTurnUsage.priorityUsed = true`, `turnState.standardActionUsed = true`.
5. **Remainder** — On their normal initiative count, the combatant takes the rest of their turn (Shift + Swift actions remaining).

#### Advanced Priority:
1. **Declare** — Can be declared even if the combatant has already acted this round.
2. **Validate** — Only checks `outOfTurnUsage.priorityUsed === false`.
3. **Execute Action Only** — Takes only the Priority action.
4. **Mark** — `outOfTurnUsage.priorityUsed = true`.
5. **Penalty** — If the combatant had already acted, they give up their turn on the following round (flagged for skip).

### B3: Server Endpoint

#### `POST /api/encounters/:id/priority` (new)

```typescript
// Request:
{
  combatantId: string;
  variant: 'standard' | 'limited' | 'advanced';
  actionDescription?: string; // What the combatant is doing
}

// Response:
{
  success: true;
  data: {
    encounter: Encounter;
    turnInserted: boolean; // Whether a full turn was inserted
    skipNextRound: boolean; // For Advanced: whether next round turn is forfeited
  }
}
```

**Logic:**

For **Standard**:
1. Validate: `!combatant.hasActed`, `!outOfTurnUsage.priorityUsed`.
2. Insert combatant into `turnOrder` at current position.
3. Set full action economy.
4. Mark their original turn position for skipping.
5. Broadcast `priority_declared` event.

For **Limited**:
1. Validate: `!combatant.hasActed`, `!outOfTurnUsage.priorityUsed`.
2. DO NOT insert a full turn. Instead, mark the Priority action as consuming a Standard Action.
3. Set `turnState.standardActionUsed = true` but keep the combatant's normal turn in the order.
4. On their normal turn, they have Shift + Swift only.
5. Broadcast `priority_declared` event.

For **Advanced**:
1. Validate: `!outOfTurnUsage.priorityUsed` (no `hasActed` check).
2. Mark the Priority action as consuming a Standard Action.
3. If `combatant.hasActed === true`, flag them for next-round skip: `combatant.skipNextRound = true`.
4. Broadcast `priority_declared` event.

### B4: Next-Round Skip for Advanced Priority

New field on Combatant: `skipNextRound?: boolean` (default `false`).

In `resetCombatantsForNewRound()`:
```typescript
// Check for Advanced Priority penalty
if (c.skipNextRound) {
  c.hasActed = true; // Pre-mark as acted so they skip
  c.skipNextRound = false; // Clear the flag
} else {
  c.hasActed = false;
}
```

### B5: UI Component

**File:** `app/components/encounter/PriorityActionPanel.vue` (new)

Appears between turns (when no combatant is in the middle of acting). Shows a list of combatants who are eligible for Priority actions.

```vue
<template>
  <div class="priority-panel">
    <div class="priority-header">
      <PhLightning :size="20" />
      <span>Priority Actions Available</span>
    </div>

    <div class="priority-instruction">
      Between turns — declare Priority actions before proceeding.
    </div>

    <div v-for="combatant in eligibleCombatants" :key="combatant.id" class="priority-combatant">
      <span class="combatant-name">{{ getName(combatant) }}</span>
      <div class="priority-buttons">
        <button @click="declarePriority(combatant.id, 'standard')">
          Priority (Full Turn)
        </button>
        <button @click="declarePriority(combatant.id, 'limited')">
          Priority (Limited)
        </button>
        <button @click="declarePriority(combatant.id, 'advanced')">
          Priority (Advanced)
        </button>
      </div>
    </div>

    <button class="btn btn-proceed" @click="$emit('proceed')">
      <PhArrowRight :size="16" /> No Priority — Continue
    </button>
  </div>
</template>
```

This panel is shown in a "between turns" state. The GM can either declare a Priority action or click "Continue" to proceed to the next combatant's turn.

### B6: Between-Turns State

To support Priority declaration between turns, the turn progression needs a new intermediate state. Currently, `next-turn.post.ts` immediately advances to the next combatant. With Priority, there is a brief window between turns.

**Approach:** Add a client-side "between turns" state in the encounter store. When `nextTurn()` completes, the store enters a `betweenTurns: true` state. The UI shows the Priority panel. When the GM clicks "Continue" (or declares a Priority), the state transitions to the next combatant's turn. This is purely client-side — the server does not need a between-turns phase.

```typescript
// In encounter store state:
betweenTurns: false as boolean;

// In nextTurn() action, after server response:
this.betweenTurns = true;

// When GM clicks "Continue" or Priority resolves:
this.betweenTurns = false;
```

---

## Section C: Interrupt Actions (R048)

### C1: PTU Rules

PTU p.228: "Interrupt Moves may be declared in the middle of another combatant's turn to allow the user to take an action. They work similarly to Priority (Advanced, Limited) effects in that they only allow you to take the action that has Interrupt and not a full turn."

Key rules:
- Triggered during another combatant's turn.
- Only the Interrupt action can be taken (not a full turn).
- Once per round.
- Specific triggers depend on the Interrupt action itself.

### C2: Interrupt Action Flow

1. **Trigger Detection** — During another combatant's turn, a triggering event occurs (e.g., an ally is hit for Intercept).
2. **Eligibility Check** — Check if any combatant has an Interrupt action available and hasn't used Interrupt this round.
3. **GM Prompt** — Present the Interrupt opportunity (similar to AoO prompt from P0).
4. **Resolution** — If accepted, the Interrupt action executes. The reactor's `outOfTurnUsage.interruptUsed = true`.
5. **Resume** — The original combatant's turn continues.

### C3: Server Endpoint

#### `POST /api/encounters/:id/interrupt` (new)

```typescript
// Request:
{
  combatantId: string;     // Who is interrupting
  interruptAction: string; // What action they are using (e.g., 'intercept_melee')
  triggerId: string;       // Who/what triggered it
  triggerType: InterruptTrigger;
  context?: {
    moveName?: string;
    originalTargetId?: string;
    attackerId?: string;
  };
}

// Response:
{
  success: true;
  data: {
    encounter: Encounter;
    interruptResolved: boolean;
  }
}
```

### C4: Interrupt as OutOfTurnAction

Interrupts use the same `OutOfTurnAction` infrastructure from P0:
- Category: `'interrupt'`
- Status: `'pending'` -> `'accepted'` / `'declined'`
- Stored in `pendingOutOfTurnActions` on the encounter

The main difference from AoO is that Interrupts can be triggered by a wider variety of events and are typically associated with specific moves or features, not just the standard Struggle Attack.

### C5: Generic Interrupt Support

P1 provides the generic Interrupt framework. Specific interrupt actions (like Intercept Melee/Ranged) are implemented in P2. The framework supports:

- Registering an interrupt trigger type
- Checking eligibility (conditions, once-per-round)
- Prompting the GM
- Resolving the interrupt
- Logging to move log

---

## Section D: Integration with League Battles (decree-021)

### D1: Priority in League Battles

In League Battles with the three-phase system (declaration -> resolution -> pokemon):
- Priority can be declared between any phases.
- During the declaration phase, a trainer could declare a Priority action instead of making a normal declaration.
- This is consistent with PTU rules: "A priority action may not be declared during someone else's turn; it must be declared between turns."

### D2: Interrupt in League Battles

Interrupt actions work the same in League Battles. They can be triggered during any combatant's turn (trainer resolution or pokemon phase).

### D3: Hold in League Battles

Hold Action works within each phase:
- A trainer can hold during the declaration phase (hold their declaration until a lower-speed trainer declares first).
- A pokemon can hold during the pokemon phase.
- Holding does not cross phase boundaries.

---

## Section E: Round Lifecycle with All Out-of-Turn Actions

### E1: Full Round Flow

```
Round Start
  -> resetCombatantsForNewRound() [clear outOfTurnUsage, check skipNextRound]
  -> [BETWEEN TURNS: Priority window]
  -> Combatant 1's Turn
    -> [Mid-turn: Interrupt/AoO triggers possible]
  -> Turn End
  -> [BETWEEN TURNS: Priority window]
  -> Check Hold Queue
  -> Combatant 2's Turn
    -> [Mid-turn: Interrupt/AoO triggers possible]
  -> Turn End
  -> [BETWEEN TURNS: Priority window]
  -> Check Hold Queue
  -> ... continue for all combatants ...
  -> Round End
    -> Expire any unresolved pending actions
    -> Clear hold queue
```

### E2: Priority Resolution Order

If multiple combatants want to use Priority at the same time, resolve in initiative order (highest speed first). This mirrors the PTU principle that faster combatants get to react first.

---

## Section F: Edge Cases

### F1: Priority During Declaration Phase
If a trainer declares Priority during the League Battle declaration phase, they immediately take their turn (for Standard Priority) or take the Priority action (for Limited/Advanced). Their declaration slot is consumed.

### F2: Hold + Priority Conflict
A combatant who is holding cannot also declare Priority (they chose to hold instead). A holding combatant has technically "declared" their action type already.

### F3: Interrupt Consumes Next Turn
PTU p.229: "Interrupts may still be used but consume the next Round's Pokemon turn as usual." For League Battles, if a Pokemon uses an Interrupt, it gives up its turn next round (similar to Advanced Priority penalty). Add `skipNextRound = true`.

### F4: Priority Across Phases
In League Battles, Priority can only be declared between TURNS, not between PHASES. The between-turns window exists after each combatant's turn within a phase, and between phases.

### F5: Empty Hold Queue at Round End
The hold queue is cleared at round start. If a combatant held but their target initiative was never reached (e.g., they held until initiative 5 but all remaining combatants had initiative > 5), their held action is lost.

---

## Files Changed (P1)

### New Files
| File | Description |
|------|-------------|
| `app/server/api/encounters/[id]/hold-action.post.ts` | Hold action endpoint |
| `app/server/api/encounters/[id]/release-hold.post.ts` | Release held action endpoint |
| `app/server/api/encounters/[id]/priority.post.ts` | Priority action endpoint |
| `app/server/api/encounters/[id]/interrupt.post.ts` | Generic interrupt endpoint |
| `app/components/encounter/HoldActionButton.vue` | Hold action UI |
| `app/components/encounter/PriorityActionPanel.vue` | Priority declaration UI |

### Modified Files
| File | Changes |
|------|---------|
| `app/server/services/out-of-turn.service.ts` | Add holdAction, releaseHeldAction, declarePriority, declareInterrupt functions |
| `app/server/api/encounters/[id]/next-turn.post.ts` | Integrate hold queue check, skipNextRound logic |
| `app/types/combat.ts` | Add skipNextRound to Combatant |
| `app/types/encounter.ts` | Add holdQueue to Encounter |
| `app/stores/encounter.ts` | Add betweenTurns state, hold/priority/interrupt actions |
| `app/server/routes/ws.ts` | Add priority_declared, hold_action, hold_released, interrupt_triggered events |

### Estimated Commit Count: 8-10

1. Add Hold Action service functions
2. Add Hold Action endpoint
3. Add Release Hold endpoint + turn progression integration
4. Add Priority service functions (standard/limited/advanced)
5. Add Priority endpoint
6. Add between-turns state in encounter store
7. Add Interrupt service functions (generic framework)
8. Add Interrupt endpoint
9. Add HoldActionButton and PriorityActionPanel UI components
10. Add WebSocket events for all P1 actions
