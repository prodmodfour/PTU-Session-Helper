# Shared Specifications

## Data Flow Diagram

```
ROUND START (League Battle):
  Start encounter (start.post.ts)
       |
       v
  trainer_declaration phase begins
  (trainers ordered LOW-to-HIGH speed)
       |
       v
  FOR EACH TRAINER (slowest first):
       |
       +---> GM records declaration (declare.post.ts)
       |          |
       |          v
       |     Declaration stored in encounter.declarations[]
       |          |
       |          v
       +---> GM calls next-turn -> advance to next trainer
       |
  ALL TRAINERS DECLARED
       |
       v
  trainer_resolution phase begins
  (trainers ordered HIGH-to-LOW speed — reversed)
       |
       v
  FOR EACH TRAINER (fastest first):
       |
       +---> UI shows this trainer's declared action
       |          |
       |          v
       +---> GM executes the action (existing move/switch/action endpoints)
       |          |
       |          v
       +---> GM calls next-turn -> advance to next resolution
       |
  ALL RESOLUTIONS COMPLETE
       |
       v
  pokemon phase begins
  (pokemon ordered HIGH-to-LOW speed — existing behavior)
       |
       v
  FOR EACH POKEMON:
       |
       +---> Standard combat flow (unchanged)
       |
  ALL POKEMON ACTED
       |
       v
  New round starts -> clear declarations -> back to trainer_declaration
```

---

## Data Models

### TrainerDeclaration

```typescript
interface TrainerDeclaration {
  combatantId: string      // UUID of the declaring trainer combatant
  trainerName: string      // Display name for UI
  actionType:              // Category of the declared action
    | 'command_pokemon'    // Tell a Pokemon to use a specific move
    | 'switch_pokemon'     // Recall current Pokemon, send out another
    | 'use_item'           // Use an item from inventory
    | 'use_feature'        // Use a Trainer Feature
    | 'orders'             // Issue an Order (Trainer Class feature)
    | 'pass'               // Do nothing
  description: string      // Human-readable description
  targetIds?: string[]     // Optional target combatant IDs
  round: number            // Round number of this declaration
}
```

### Extended Encounter Fields

```typescript
// New field on Encounter interface (app/types/encounter.ts)
declarations: TrainerDeclaration[]

// New Prisma field on Encounter model
declarations  String   @default("[]")  // JSON array
```

### Phase Transition State Machine

```
                    +-----------------------+
                    |  trainer_declaration  |
                    |  (low -> high speed)  |
                    +-----------+-----------+
                                |
                    all trainers declared
                                |
                                v
                    +-----------------------+
                    |  trainer_resolution   |
                    |  (high -> low speed)  |
                    +-----------+-----------+
                                |
                    all trainers resolved
                                |
                                v
                    +-----------------------+
                    |       pokemon         |
                    |  (high -> low speed)  |
                    +-----------+-----------+
                                |
                    all pokemon acted
                                |
                                v
                    NEW ROUND (clear declarations)
                    back to trainer_declaration
```

---

## API Contracts

### POST `/api/encounters/:id/declare`

**Purpose:** Record a trainer's declared action during declaration phase.

**Request:**
```typescript
{
  combatantId: string
  actionType: 'command_pokemon' | 'switch_pokemon' | 'use_item' | 'use_feature' | 'orders' | 'pass'
  description: string
  targetIds?: string[]
}
```

**Response:**
```typescript
{
  success: true
  data: Encounter  // Full encounter state with updated declarations
}
```

**Error codes:**
- `400` — Missing fields, invalid actionType, wrong phase, duplicate declaration, wrong combatant
- `404` — Encounter not found, combatant not found
- `500` — Server error

### POST `/api/encounters/:id/next-turn` (modified)

**Existing endpoint, modified behavior for League Battles:**

When called during `trainer_declaration` phase and all trainers have declared:
- Transitions to `trainer_resolution` phase
- Sets `turnOrder` to trainers in high-to-low speed order (reversed from declaration)
- Resets `currentTurnIndex` to 0

When called during `trainer_resolution` phase and all trainers have resolved:
- Transitions to `pokemon` phase
- Sets `turnOrder` to `pokemonTurnOrder`
- Resets `currentTurnIndex` to 0

When called during `pokemon` phase and all pokemon have acted:
- Starts new round
- Clears `declarations` array
- Transitions back to `trainer_declaration` phase
- Sets `turnOrder` to `trainerTurnOrder` (low-to-high speed)

### POST `/api/encounters/:id/start` (modified)

**Existing endpoint, modified initialization:**

Adds `declarations: JSON.stringify([])` to the encounter update payload.

---

## Turn Order Arrays

The encounter stores three ordered arrays:

| Array | Order | Used By |
|-------|-------|---------|
| `trainerTurnOrder` | Low-to-high speed | `trainer_declaration` phase (declaration order) |
| (reversed `trainerTurnOrder`) | High-to-low speed | `trainer_resolution` phase (resolution order) |
| `pokemonTurnOrder` | High-to-low speed | `pokemon` phase |

The `turnOrder` field is dynamically set to the appropriate array for the current phase:
- Declaration: `turnOrder = trainerTurnOrder`
- Resolution: `turnOrder = [...trainerTurnOrder].reverse()`
- Pokemon: `turnOrder = pokemonTurnOrder`

**Important:** The `trainerTurnOrder` stored in the DB is always in declaration order (low-to-high). Resolution order is computed by reversing it at phase transition time.

---

## Initiative Reorder Interaction (decree-006)

When `reorderInitiativeAfterSpeedChange` is called during a League Battle:

- **During declaration phase:** Undeclared trainers are re-sorted in the remaining declaration slots (ascending speed). Declared trainers are frozen in place.
- **During resolution phase:** Unresolved trainers are re-sorted in the remaining resolution slots (descending speed). Resolved trainers are frozen in place.
- **During pokemon phase:** Standard behavior (unacted pokemon re-sorted descending).

The existing implementation in `encounter.service.ts` already handles this correctly because:
1. It splits turn order into acted (frozen) + unacted (re-sortable)
2. For league battles, it reorders trainer and pokemon lists separately
3. Declaration/resolution use the same `turnOrder` progression mechanism

The `trainerTurnOrder` and `pokemonTurnOrder` fields are updated by the reorder function, ensuring future phase transitions use the updated order.

---

## Edge Cases & Design Decisions

### 1. Declaration is descriptive, not executable

Declarations are free-text descriptions, not machine-parseable commands. The GM types "Switch Charmander for Squirtle" or "Command Pikachu to use Thunderbolt." During resolution, the GM manually executes these actions using existing endpoints. This avoids building a complex action serialization system and handles the infinite variety of trainer actions (items, features, abilities, etc.).

### 2. Declaration then next-turn are separate calls

The GM first submits a declaration (POST `/declare`), then advances the turn (POST `/next-turn`). This is two API calls, not one. Rationale: it mirrors the existing pattern where the GM executes an action then clicks "Next Turn." The `DeclarationPanel` UI combines both into a single "Declare & Next" button for convenience.

### 3. Resolution does not auto-execute

The resolution phase shows the declared action but requires the GM to manually execute it. This is necessary because:
- The declared action may no longer be valid (target fainted, item used up)
- The GM may need to adjudicate edge cases
- Existing action endpoints handle all mechanical effects
- Building an auto-execution system would require serializing every possible trainer action

### 4. Fainted trainers are auto-skipped

If a trainer faints (HP <= 0) before their declaration turn, they are automatically skipped. During resolution, trainers with no declaration are also skipped. This prevents the declaration/resolution phases from stalling.

### 5. Declarations persist for the entire round

Declarations are NOT cleared when transitioning from declaration to resolution. They are cleared at the start of the next round. This allows all views to reference declarations during both the resolution phase and the pokemon phase.

### 6. Full Contact mode is unaffected

All changes are gated behind `battleType === 'trainer'` (League Battle). Full Contact battles continue to use the existing single-pass turn order with no phases.

### 7. Undo/redo compatibility

Since `declarations` is a serializable field on the encounter, the existing undo/redo snapshot system captures and restores it automatically. No special handling needed.

---

## Files Changed Summary

### P0 (Core Declaration/Resolution Flow)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/types/combat.ts` | Add `TrainerDeclaration` interface |
| **EDIT** | `app/types/encounter.ts` | Add `declarations` field to `Encounter` |
| **EDIT** | `app/prisma/schema.prisma` | Add `declarations` JSON field to Encounter model |
| **NEW** | `app/server/api/encounters/[id]/declare.post.ts` | Declaration recording endpoint |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Add `trainer_resolution` phase transition |
| **EDIT** | `app/server/api/encounters/[id]/start.post.ts` | Initialize `declarations` on start |
| **EDIT** | `app/server/services/encounter.service.ts` | Parse/include declarations in response |
| **EDIT** | `app/stores/encounter.ts` | Declaration getters and `submitDeclaration` action |

### P1 (UI, WebSocket, Edge Cases)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/encounter/DeclarationPanel.vue` | GM declaration form |
| **NEW** | `app/components/encounter/DeclarationSummary.vue` | Read-only declaration summary |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Auto-skip fainted/missing-declaration trainers |
| **EDIT** | `app/stores/encounter.ts` | WebSocket handler for declarations |
| **EDIT** | GM encounter page layout | Integrate DeclarationPanel + DeclarationSummary |
| **EDIT** | Group encounter view | Integrate DeclarationSummary |
| **EDIT** | Initiative tracker | Phase labels and visual differentiation |
