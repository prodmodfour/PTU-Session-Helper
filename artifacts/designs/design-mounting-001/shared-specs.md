# Shared Specifications

## Data Flow Diagram

```
MOUNTING IN COMBAT:

  Trainer's Turn (not mounted)
       |
       v
  GM selects "Mount" on adjacent Mountable Pokemon
       |
       +---> POST /api/encounters/:id/mount
       |        |
       |        v
       |     Validate: rider is human, mount has Mountable X,
       |     capacity not full, adjacent, same side, not fainted
       |        |
       |        v
       |     Set mountState on BOTH combatants
       |     Move rider to mount's position
       |     Consume Standard Action (or Free if Expert + 2m shift)
       |        |
       |        v
       |     Return updated encounter + mountResult
       |
  MOUNTED STATE ACTIVE
       |
       v
  Rider's Trainer Turn (mounted)
       |
       +---> Shift uses mount's Movement Capabilities
       |     (movementRemaining decremented on both combatants)
       |
       +---> Can still use Standard Action to order ANOTHER Pokemon
       |     (mount's Standard Action is preserved for its turn)
       |
  Mount's Pokemon Turn
       |
       +---> Uses remaining movementRemaining for Shift
       +---> Standard Action available (attack, use move, etc.)
       +---> BOTH tokens move together
       |
  DAMAGE/PUSH HIT ON EITHER
       |
       v
  Dismount check triggered?
       |
       +---> damage >= 1/4 max HP? OR Push effect? OR Confusion self-damage?
       |        |
       |        YES: include dismountCheck in response
       |        |
       |        v
       |     GM resolves Acrobatics/Athletics vs DC 10
       |     (+3 if Mounted Prowess)
       |        |
       |        +---> PASS: remain mounted
       |        +---> FAIL: GM clicks Dismount
       |                |
       |                v
       |             POST /api/encounters/:id/dismount
       |                |
       |                v
       |             Place rider adjacent to mount
       |             Clear mountState on both
       |
  VOLUNTARY DISMOUNT
       |
       v
  GM selects "Dismount" on mounted rider
       |
       +---> POST /api/encounters/:id/dismount
       |        |
       |        v
       |     Place rider in nearest unoccupied adjacent cell
       |     Clear mountState on both combatants
       |
  MOUNT/RIDER FAINTS
       |
       v
  Mount faints: auto-dismount rider
  Rider faints: clear mount relationship
  Combatant removed: clear mount relationship on partner
```

---

## Data Models

### MountState

```typescript
/**
 * Tracking mount relationship on a combatant.
 * Present on BOTH rider and mount combatants.
 */
interface MountState {
  /** true = this combatant IS the rider; false = this combatant IS the mount */
  isMounted: boolean
  /** Combatant ID of the partner (rider->mount or mount->rider) */
  partnerId: string
  /** Movement remaining for the mount this round (meters) */
  movementRemaining: number
  /** Original Speed Evasion before Ride as One modification (P2) */
  originalSpeedEvasion?: number
  /** Ride as One: whether the initiative swap occurred this round (P2) */
  rideAsOneSwapped?: boolean
}
```

### Extended Combatant Fields

```typescript
interface Combatant {
  // ... existing fields ...

  /** Mount relationship (PTU p.218). Present when part of a mounted pair. */
  mountState?: MountState

  /** Rider class feature usage tracking (P2) */
  featureUsage?: Record<string, { usedThisScene: number; maxPerScene: number }>
}
```

### Extended TurnState Fields (P2)

```typescript
interface TurnState {
  // ... existing fields ...

  /** Distance moved this turn in meters (for Run Up, Overrun, etc.) */
  distanceMovedThisTurn: number
}
```

---

## API Contracts

### POST `/api/encounters/:id/mount`

**Purpose:** Mount a trainer on an adjacent Pokemon with Mountable capability.

**Request:**
```typescript
{
  riderId: string       // Combatant ID of the trainer
  mountId: string       // Combatant ID of the Pokemon
  skipCheck?: boolean   // GM override: skip the DC 10 check
}
```

**Response:**
```typescript
{
  success: true
  data: {
    encounter: Encounter
    mountResult: {
      riderId: string
      mountId: string
      actionCost: 'standard' | 'free_with_shift'
      checkRequired: boolean
      checkAutoSuccess: boolean
      mounted: true
    }
  }
}
```

**Error codes:**
- `400` -- Rider not human, mount not Pokemon, not Mountable, capacity full, already mounted, not adjacent, different side, rider Fainted/Stuck/Frozen, mount Fainted
- `404` -- Encounter or combatant not found
- `500` -- Server error

### POST `/api/encounters/:id/dismount`

**Purpose:** Dismount a trainer from their mounted Pokemon.

**Request:**
```typescript
{
  riderId: string        // Combatant ID of the trainer
  forced?: boolean       // True if forced dismount (damage/push/confusion)
  skipCheck?: boolean    // GM override: skip remain-mounted check
}
```

**Response:**
```typescript
{
  success: true
  data: {
    encounter: Encounter
    dismountResult: {
      riderId: string
      mountId: string
      riderPosition: GridPosition | null  // null = manual placement needed
      forced: boolean
      dismounted: true
    }
  }
}
```

**Error codes:**
- `400` -- Rider not mounted, invalid rider ID
- `404` -- Encounter or combatant not found
- `500` -- Server error

---

## Constants

```typescript
// app/utils/mountingRules.ts

/** PTU p.218: DC for mounting a Pokemon */
export const MOUNT_CHECK_DC = 10

/** PTU p.218: DC for remaining mounted (dismount check) */
export const DISMOUNT_CHECK_DC = 10

/** PTU p.139: Mounted Prowess bonus to remain-mounted checks */
export const MOUNTED_PROWESS_REMAIN_BONUS = 3

/** PTU p.218: Minimum shift distance for Expert-level free mount */
export const FREE_MOUNT_MIN_SHIFT = 2

/** Default trainer movement speed (meters) */
export const TRAINER_DEFAULT_SPEED = 5
```

---

## Mount State Machine

```
                      +-----------------+
                      |   NOT MOUNTED   |
                      |  (default)      |
                      +--------+--------+
                               |
                   Mount Action (Standard or Free)
                   Validation passes
                               |
                               v
                      +-----------------+
                      |    MOUNTED      |
                      | rider.mountState|
                      | mount.mountState|
                      +--------+--------+
                               |
              +----------------+----------------+
              |                |                |
     Voluntary Dismount   Forced Dismount   Faint/Removal
     (rider's choice)     (failed check)    (auto-clear)
              |                |                |
              v                v                v
                      +-----------------+
                      |   NOT MOUNTED   |
                      |  State cleared  |
                      +--------+--------+
```

---

## Movement During Mount State

### Rider's Trainer Turn
```
Rider uses mount's Movement Capabilities to Shift:
  - movementRemaining (on BOTH mountStates) -= distance
  - BOTH combatant positions update to new position
  - Rider's shiftActionUsed = true
  - Mount's shiftActionUsed is NOT set (mount can still Shift on its own turn)
  - Mount's standardActionUsed is NOT set (preserved for Pokemon turn)
```

### Mount's Pokemon Turn
```
Mount uses remaining movementRemaining to Shift:
  - movementRemaining (on BOTH mountStates) -= distance
  - BOTH combatant positions update to new position
  - Mount's shiftActionUsed = true
  - Mount can use its Standard Action (attack, move, etc.)
```

### New Round Reset
```
For each combatant with mountState:
  - Recalculate movementRemaining from mount's Overland (+ Agility Training if applicable)
  - Apply movement modifiers (Slowed, Speed CS) at movement time, not at reset
```

---

## Token Rendering Rules

### VTT Token Display When Mounted

| Condition | Rendering |
|-----------|-----------|
| Rider is mounted | Rider token NOT rendered at its own grid position |
| Mount has rider | Mount token rendered with rider overlay (60% scale, lower-right) |
| Mount has rider (selected) | Both combatant info visible in selection panel |
| Rider's turn (mounted) | Mount token highlighted as current turn (both are "active") |
| Mount's turn | Mount token highlighted as current turn |

### Token Selection Behavior

| Click Target | Effect |
|-------------|--------|
| Click mounted token (any area) | Select the MOUNT combatant by default |
| Click rider overlay area specifically | Select the RIDER combatant |
| Double-click mounted token | Toggle between rider and mount selection |

### Movement Range Display

| Who Is Moving | Range Source | Visual |
|--------------|-------------|--------|
| Rider on trainer turn | mount's movementRemaining | Blue highlight cells |
| Mount on Pokemon turn | mount's movementRemaining | Blue highlight cells |
| Unmounted trainer | trainer's personal speed (5m) | Blue highlight cells |
| Unmounted Pokemon | Pokemon's Overland | Blue highlight cells |

---

## Undo/Redo Compatibility

Mount state is embedded in the `Combatant` objects within the encounter's `combatants` array. The existing undo/redo snapshot system (`EncounterSnapshot`) captures the full combatant array, so mount state is automatically included in snapshots.

No special undo/redo handling is needed. Restoring a snapshot restores the mount state exactly as it was.

---

## Dismount Check Triggers

| Trigger | PTU Reference | DC | Who Checks |
|---------|--------------|-----|------------|
| Rider takes >= 1/4 max HP damage | p.218 | 10 | Rider |
| Mount takes >= 1/4 max HP damage | p.218 | 10 | Rider |
| Rider hit by Push effect | p.218 | 10 | Rider |
| Mount hit by Push effect | p.218 | 10 | Rider |
| Mount hurts itself in Confusion | p.218 | 10 | Rider |
| Mount faints | -- | Auto | Auto-dismount |
| Rider faints | -- | Auto | Auto-clear |

### Mounted Prowess Effect on Checks

| Check Type | Without Mounted Prowess | With Mounted Prowess |
|-----------|------------------------|---------------------|
| Mount check (DC 10) | Roll Acrobatics/Athletics vs DC 10 | Auto-success |
| Remain-mounted check (DC 10) | Roll Acrobatics/Athletics vs DC 10 | Roll with +3 bonus |

---

## Files Changed Summary (All Tiers)

### P0 (Core: Data Model, Parsing, API, Turn Integration)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/types/combat.ts` | Add `MountState` interface |
| **EDIT** | `app/types/encounter.ts` | Add `mountState?` to Combatant |
| **NEW** | `app/utils/mountingRules.ts` | Capability parsing, DC constants, skill checks |
| **NEW** | `app/server/services/mounting.service.ts` | Mount/dismount business logic |
| **NEW** | `app/server/api/encounters/[id]/mount.post.ts` | Mount action endpoint |
| **NEW** | `app/server/api/encounters/[id]/dismount.post.ts` | Dismount action endpoint |
| **EDIT** | `app/composables/useGridMovement.ts` | Rider uses mount speed, linked movement |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Reset mount movement on new round |
| **EDIT** | `app/server/services/combatant.service.ts` | Faint clears mount state |
| **EDIT** | `app/stores/encounter.ts` | Mount/dismount actions, mount state getters |

### P1 (VTT Integration, Dismount Checks, UI)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/vtt/VTTMountedToken.vue` | Stacked token rendering |
| **EDIT** | `app/components/vtt/VTTToken.vue` | Mount state CSS classes, badges |
| **NEW** | `app/components/encounter/MountControls.vue` | GM mount control panel |
| **EDIT** | `app/stores/encounterGrid.ts` | Linked token movement |
| **EDIT** | `app/server/routes/ws.ts` | `mount_change` broadcast event |
| **EDIT** | Damage endpoint(s) | Dismount check trigger |
| **EDIT** | Initiative tracker | Mount relationship display |

### P2 (Rider Class Features)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/mountingRules.ts` | Rider feature detection |
| **EDIT** | `app/types/combat.ts` | TurnState.distanceMovedThisTurn, featureUsage |
| **EDIT** | `app/composables/useGridMovement.ts` | Distance tracking per turn |
| **EDIT** | `app/server/services/mounting.service.ts` | Ride as One evasion, initiative swap |
| **EDIT** | `app/utils/damageCalculation.ts` | Overrun modifier, Lean In resistance |
| **EDIT** | `app/components/encounter/MountControls.vue` | Feature activation UI |
