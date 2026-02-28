# P0 Specification: Core Mount Relationship, API, and Turn Integration

## A. Mount Relationship Data Model

### Problem

There is no data model for tracking which trainer is mounted on which Pokemon during combat. The relationship must survive encounter persistence (undo/redo, save/load) and be accessible to both server and client.

### Design Decision: Encounter-Scoped Mount State

Mount relationships are combat-only state. They exist within the encounter's combatant data, not as persistent DB relationships on the character/Pokemon models. This parallels how other combat-scoped state (turn state, combat stages, positions) is tracked.

Rationale:
- Mounting is a combat action -- it starts and ends within encounters
- Outside combat, mounting doesn't mechanically matter (no grid, no turns)
- The undo/redo snapshot system automatically captures combatant-embedded state
- No schema migration needed for the mount relationship itself

### Extended Types: `app/types/combat.ts`

Add a `MountState` interface to track mount relationships on combatants:

```typescript
/**
 * Mount relationship tracking for a combatant.
 * Present on BOTH the rider (trainer) and mount (Pokemon) combatants.
 *
 * PTU p.218: Mounting is a combat action. Rider uses mount's Movement
 * Capabilities for Shift on trainer turn. Mount keeps unused movement
 * + Standard Action on Pokemon turn.
 */
export interface MountState {
  /** Whether this combatant is currently mounted (rider) or being ridden (mount) */
  isMounted: boolean
  /** Combatant ID of the partner: rider points to mount, mount points to rider */
  partnerId: string
  /**
   * Movement remaining for the mount this round (meters).
   * Set to mount's full movement speed at round start.
   * Consumed by rider's Shift on trainer turn, remainder available to mount on Pokemon turn.
   * Reset each round by resetCombatantsForNewRound.
   */
  movementRemaining: number
}
```

### Extended Combatant: `app/types/encounter.ts`

Add optional `mountState` field to the `Combatant` interface:

```typescript
export interface Combatant {
  // ... existing fields ...

  // Mount relationship (PTU p.218)
  // Present when this combatant is part of a mounted pair
  // Rider (trainer) and mount (Pokemon) each carry a MountState pointing to each other
  mountState?: MountState
}
```

### Why Not a Separate Mount Tracking Array?

An alternative would be a top-level `mountPairs` array on the Encounter. This was rejected because:
1. Combatant-embedded state is already the pattern for all other per-combatant tracking (injuries, stages, turn state, position)
2. The undo/redo snapshot captures `combatants` as a unit -- embedding mount state ensures it's captured automatically
3. Looking up "is this combatant mounted?" is O(1) from `combatant.mountState` vs O(n) searching a pairs array
4. Both rider and mount need quick access to the relationship during movement validation

### Initial State

When a combatant is created via `buildCombatantFromEntity`, `mountState` is `undefined` (not mounted). Mount state is only set via the mount/dismount API endpoints.

---

## B. Mountable Capability Parsing

### Problem

The `Mountable X` capability is stored as a string in `otherCapabilities` (e.g., `"Mountable 1"`, `"Mountable 2"`). No code currently parses this to extract the numeric capacity.

### New Utility: `app/utils/mountingRules.ts`

```typescript
/**
 * Mounting rules and capability parsing for PTU Pokemon mounting system.
 *
 * PTU p.306-307: "Mountable X: This Pokemon may serve as a mount for
 * X average Trainers regardless of Power Capability and ignoring
 * penalties for weight carried."
 *
 * PTU p.218: Mounting is a Standard Action with Acrobatics/Athletics DC 10.
 * Expert skill: mount as Free Action during Shift (2m+ movement).
 */

/**
 * Parse the Mountable capability from a Pokemon's otherCapabilities.
 * Returns the capacity (number of trainers it can carry), or 0 if not mountable.
 *
 * Matches patterns: "Mountable 1", "Mountable 2", "Mountable X" (treated as 1).
 * Case-insensitive. Handles leading/trailing whitespace.
 */
export function parseMountableCapacity(otherCapabilities: string[]): number {
  if (!otherCapabilities || otherCapabilities.length === 0) return 0

  for (const cap of otherCapabilities) {
    const match = cap.trim().match(/^mountable\s+(\d+)$/i)
    if (match) {
      return parseInt(match[1], 10)
    }
    // Handle bare "Mountable" without a number (treat as 1)
    if (cap.trim().toLowerCase() === 'mountable') {
      return 1
    }
  }

  return 0
}

/**
 * Check if a Pokemon combatant has the Mountable capability.
 */
export function isMountable(combatant: Combatant): boolean {
  if (combatant.type !== 'pokemon') return false
  const pokemon = combatant.entity as Pokemon
  const caps = pokemon.capabilities?.otherCapabilities
  if (!caps) return false
  return parseMountableCapacity(caps) > 0
}

/**
 * Get the mount capacity of a Pokemon combatant.
 * Returns 0 if not a Pokemon or not mountable.
 */
export function getMountCapacity(combatant: Combatant): number {
  if (combatant.type !== 'pokemon') return 0
  const pokemon = combatant.entity as Pokemon
  const caps = pokemon.capabilities?.otherCapabilities
  if (!caps) return 0
  return parseMountableCapacity(caps)
}

/**
 * Count how many riders are currently mounted on a given mount.
 * Searches all combatants for riders pointing to this mount's ID.
 */
export function countCurrentRiders(mountId: string, combatants: Combatant[]): number {
  return combatants.filter(
    c => c.mountState?.isMounted && c.mountState.partnerId === mountId
  ).length
}

/**
 * PTU p.218: Mount check DC is 10 for Acrobatics or Athletics.
 */
export const MOUNT_CHECK_DC = 10

/**
 * PTU p.218: Dismount check DC is 10.
 * Triggered by: damage >= 1/4 max HP, Push effects, mount Confusion self-damage.
 */
export const DISMOUNT_CHECK_DC = 10

/**
 * PTU p.139: Mounted Prowess edge grants +3 to remain-mounted checks.
 */
export const MOUNTED_PROWESS_REMAIN_BONUS = 3

/**
 * Check if a trainer has the Mounted Prowess edge.
 */
export function hasMountedProwess(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  return (human.edges ?? []).some(
    edge => edge.toLowerCase().includes('mounted prowess')
  )
}

/**
 * Check if a trainer's Acrobatics or Athletics skill is at least Expert.
 * Used to determine if mounting can be done as a Free Action during Shift.
 * PTU p.218: "If your Acrobatics or Athletics is at least Expert..."
 */
export function hasExpertMountingSkill(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  const skills = human.skills ?? {}
  const expertOrAbove: SkillRank[] = ['Expert', 'Master']
  const acrobatics = skills['Acrobatics'] ?? skills['acrobatics']
  const athletics = skills['Athletics'] ?? skills['athletics']
  return expertOrAbove.includes(acrobatics as SkillRank) ||
         expertOrAbove.includes(athletics as SkillRank)
}

/**
 * Determine the action cost for mounting.
 * PTU p.218:
 * - Standard Action (Acrobatics/Athletics DC 10) by default
 * - Free Action during Shift if Expert Acrobatics/Athletics AND 2m+ movement
 * - Mounted Prowess: auto-succeed the check (still costs the action)
 */
export function getMountActionCost(
  combatant: Combatant
): 'standard' | 'free_with_shift' {
  if (hasExpertMountingSkill(combatant)) {
    return 'free_with_shift'
  }
  return 'standard'
}

/**
 * Check whether damage triggers a dismount check.
 * PTU p.218: "damage equal or greater to 1/4th of the target's Max Hit Points"
 * Per decree-004: uses real HP damage after temp HP absorption.
 */
export function triggersDismountCheck(hpDamage: number, maxHp: number): boolean {
  return hpDamage >= Math.floor(maxHp / 4)
}
```

### Import Types

The utility needs imports from types. The actual file will import:
```typescript
import type { Combatant, Pokemon, HumanCharacter } from '~/types'
import type { SkillRank } from '~/types/character'
```

---

## C. Mount/Dismount API Endpoints

### New Endpoint: `app/server/api/encounters/[id]/mount.post.ts`

Mounts a trainer on a Pokemon. Records the mount relationship on both combatants.

**Request body:**

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
      checkAutoSuccess: boolean  // true if Mounted Prowess
      mounted: true
    }
  }
}
```

**Validation rules:**

1. Encounter must be active
2. `riderId` must be a human-type combatant
3. `mountId` must be a pokemon-type combatant
4. The Pokemon must have the Mountable capability (`parseMountableCapacity > 0`)
5. The Pokemon's current rider count must be below its Mountable capacity
6. The rider must not already be mounted on another Pokemon
7. The rider and mount must be on the same side (players can't mount enemy Pokemon)
8. The rider and mount must be adjacent on the grid (if grid is enabled) -- within 1 cell
9. The rider must not be Fainted, Stuck, or Frozen
10. The mount must not be Fainted

**Implementation logic:**

```typescript
// After validation...

const actionCost = getMountActionCost(riderCombatant)
const autoSuccess = hasMountedProwess(riderCombatant)

// Set mount state on BOTH combatants (immutable pattern)
const mountMovement = getMovementSpeedForMount(mountCombatant)

const updatedCombatants = combatants.map(c => {
  if (c.id === riderId) {
    return {
      ...c,
      mountState: {
        isMounted: true,
        partnerId: mountId,
        movementRemaining: mountMovement
      },
      // Move rider to mount's position (they share the same grid square)
      position: mountCombatant.position ? { ...mountCombatant.position } : c.position,
      // Consume Standard Action if not Expert-level free mount
      turnState: actionCost === 'standard'
        ? { ...c.turnState, standardActionUsed: true }
        : c.turnState
    }
  }
  if (c.id === mountId) {
    return {
      ...c,
      mountState: {
        isMounted: false,  // mount is being ridden, not riding
        partnerId: riderId,
        movementRemaining: mountMovement
      }
    }
  }
  return c
})
```

**Mount movement speed calculation:**

```typescript
/**
 * Get the base movement speed for a mount Pokemon.
 * Uses the mount's Overland capability as the primary movement speed.
 * Sky and Swim speeds are also available when appropriate terrain/context.
 * Movement modifiers (Slowed, Speed CS) are applied at movement time, not at mount time.
 */
function getMovementSpeedForMount(mount: Combatant): number {
  if (mount.type !== 'pokemon') return 5
  const pokemon = mount.entity as Pokemon
  return pokemon.capabilities?.overland ?? 5
}
```

### New Endpoint: `app/server/api/encounters/[id]/dismount.post.ts`

Dismounts a trainer from a Pokemon. Clears the mount relationship on both combatants.

**Request body:**

```typescript
{
  riderId: string        // Combatant ID of the trainer
  forced?: boolean       // True if forced dismount (damage/push/confusion)
  skipCheck?: boolean    // GM override: skip the remain-mounted check
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
      forced: boolean
      dismounted: true
    }
  }
}
```

**Validation rules:**

1. Encounter must be active
2. `riderId` must have an active `mountState` (must be mounted)
3. The mount partner must still exist in combatants

**Dismount position logic:**

When dismounting, the rider needs to be placed adjacent to the mount (they can't stay on the same square due to no-stacking rule). The server places the rider in the nearest unoccupied adjacent cell. If all adjacent cells are occupied, the GM must manually place the rider (the endpoint returns a flag indicating manual placement is needed).

```typescript
/**
 * Find the best adjacent cell for a dismounting rider.
 * Prefers cells in this order: same-row right, same-row left,
 * same-col down, same-col up, diagonals.
 * Returns null if all adjacent cells are occupied.
 */
function findDismountPosition(
  mountPosition: GridPosition,
  mountSize: number,
  occupiedCells: Set<string>,
  gridWidth: number,
  gridHeight: number
): GridPosition | null {
  // Generate candidate positions around the mount's footprint
  const candidates: GridPosition[] = []

  // Right side, left side, below, above, then diagonals
  for (let dy = 0; dy < mountSize; dy++) {
    candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y + dy }) // right
    candidates.push({ x: mountPosition.x - 1, y: mountPosition.y + dy })          // left
  }
  for (let dx = 0; dx < mountSize; dx++) {
    candidates.push({ x: mountPosition.x + dx, y: mountPosition.y + mountSize }) // below
    candidates.push({ x: mountPosition.x + dx, y: mountPosition.y - 1 })          // above
  }
  // Diagonals
  candidates.push({ x: mountPosition.x - 1, y: mountPosition.y - 1 })
  candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y - 1 })
  candidates.push({ x: mountPosition.x - 1, y: mountPosition.y + mountSize })
  candidates.push({ x: mountPosition.x + mountSize, y: mountPosition.y + mountSize })

  for (const pos of candidates) {
    if (pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight) continue
    if (!occupiedCells.has(`${pos.x},${pos.y}`)) return pos
  }

  return null // All adjacent cells occupied -- GM must place manually
}
```

### New Service: `app/server/services/mounting.service.ts`

Encapsulates the business logic for mount/dismount operations, keeping the API handlers thin:

```typescript
/**
 * Mounting Service
 *
 * Handles mount/dismount business logic for PTU combat encounters.
 * Pure functions that operate on combatant arrays -- no DB access.
 * API endpoints call these functions and handle persistence.
 */

export interface MountResult {
  updatedCombatants: Combatant[]
  riderId: string
  mountId: string
  actionCost: 'standard' | 'free_with_shift'
  checkRequired: boolean
  checkAutoSuccess: boolean
}

export interface DismountResult {
  updatedCombatants: Combatant[]
  riderId: string
  mountId: string
  riderPosition: GridPosition | null  // null = GM must place manually
  forced: boolean
}

/**
 * Execute a mount action. Returns new combatant array (immutable).
 * Throws if validation fails.
 */
export function executeMount(
  combatants: Combatant[],
  riderId: string,
  mountId: string,
  gridWidth: number,
  gridHeight: number
): MountResult { /* ... */ }

/**
 * Execute a dismount action. Returns new combatant array (immutable).
 * Throws if validation fails.
 */
export function executeDismount(
  combatants: Combatant[],
  riderId: string,
  forced: boolean,
  gridWidth: number,
  gridHeight: number,
  occupiedCells: Set<string>
): DismountResult { /* ... */ }

/**
 * Reset mount movement for a new round.
 * Called by resetCombatantsForNewRound.
 * Sets movementRemaining to mount's full movement speed for all active mount pairs.
 */
export function resetMountMovement(combatants: Combatant[]): Combatant[] { /* ... */ }

/**
 * Clear mount state when a combatant is removed from encounter.
 * If the removed combatant is a rider, clear mount state on the mount.
 * If the removed combatant is a mount, force-dismount the rider.
 */
export function clearMountOnRemoval(
  combatants: Combatant[],
  removedId: string
): Combatant[] { /* ... */ }

/**
 * Clear mount state when a combatant faints.
 * PTU: when mount faints, rider is automatically dismounted.
 * When rider faints, the mount relationship is cleared.
 */
export function clearMountOnFaint(
  combatants: Combatant[],
  faintedId: string,
  gridWidth: number,
  gridHeight: number
): { combatants: Combatant[]; dismounted: boolean } { /* ... */ }
```

---

## D. Mount State in Combat Turn System

### Trainer Turn: Rider Uses Mount's Movement

PTU p.218: "When mounted on a Pokemon, you may Shift during your Trainer turn using your Mount's Movement Capabilities instead of your own."

**Modified: `app/composables/useGridMovement.ts`**

The `getSpeed` function must check if the combatant is a mounted rider. If so, the movement speed comes from the mount's capabilities (Overland/Swim/Sky/Burrow as appropriate), not the trainer's base 5m.

```typescript
// In getSpeed():
// Check if combatant is a mounted rider
if (combatant.mountState?.isMounted) {
  // Rider uses mount's remaining movement, not their own speed
  return combatant.mountState.movementRemaining
}
```

Key behaviors:
1. When a mounted rider Shifts on their trainer turn, `movementRemaining` on BOTH the rider's and mount's `mountState` is decremented by the distance moved.
2. On the mount's Pokemon turn, it uses whatever `movementRemaining` is left.
3. `movementRemaining` is reset at round start.

**Modified: Movement execution (grid store / movement API)**

When a mounted rider moves, BOTH the rider and mount tokens move together:

```typescript
// When processing movement for a mounted rider:
if (movingCombatant.mountState?.isMounted) {
  const mountId = movingCombatant.mountState.partnerId

  // Update BOTH positions to the destination
  updatedCombatants = combatants.map(c => {
    if (c.id === movingCombatant.id || c.id === mountId) {
      return {
        ...c,
        position: newPosition,
        mountState: c.mountState ? {
          ...c.mountState,
          movementRemaining: c.mountState.movementRemaining - distanceMoved
        } : undefined
      }
    }
    return c
  })
}
```

Similarly, when the mount moves on its Pokemon turn:

```typescript
// When processing movement for a ridden mount:
if (mountCombatant.mountState && !mountCombatant.mountState.isMounted) {
  const riderId = mountCombatant.mountState.partnerId

  // Update BOTH positions to the destination
  updatedCombatants = combatants.map(c => {
    if (c.id === mountCombatant.id || c.id === riderId) {
      return {
        ...c,
        position: newPosition,
        mountState: c.mountState ? {
          ...c.mountState,
          movementRemaining: c.mountState.movementRemaining - distanceMoved
        } : undefined
      }
    }
    return c
  })
}
```

### Pokemon Turn: Mount's Remaining Actions

PTU p.218: "During Pokemon turns, your Mount may use any unused movement to Shift, and may take a Standard Action as normal if you use your Pokemon turn on it."

The mount's Standard Action is unaffected by mounting. On its Pokemon turn, the mount can:
1. Use remaining `movementRemaining` to Shift
2. Take its Standard Action (attack, use a move, etc.)

The key constraint: the rider's trainer turn must be able to order the mount to Shift while ordering a DIFFERENT Pokemon to act:

PTU p.218: "You may use your Mount to Shift on your turn while using your Pokemon turn to order another Pokemon in battle."

This means:
- During the rider's trainer turn, they can Shift (using mount's movement) AND order a different Pokemon as their Standard Action.
- The mount's Standard Action is saved for its own Pokemon turn.

**Implementation:** The rider's Shift uses the mount's movement but does NOT consume the mount's Standard Action. The mount's turn state (standardActionUsed, shiftActionUsed) is independent.

### Encounter Start: No Mount State on Start

Mount state is not set during encounter start. Trainers must explicitly mount during combat. This matches PTU rules where mounting is a combat action.

### New Round Reset

**Modified: `resetCombatantsForNewRound` in encounter service / next-turn**

```typescript
// In resetCombatantsForNewRound:
// Reset mount movement for new round
if (combatant.mountState) {
  const mountPartner = combatants.find(c => c.id === combatant.mountState!.partnerId)
  if (mountPartner && combatant.mountState.partnerId && !combatant.mountState.isMounted) {
    // This is the mount (not the rider) -- recalculate movement
    const mountSpeed = getOverlandSpeed(combatant)
    combatant.mountState = {
      ...combatant.mountState,
      movementRemaining: mountSpeed
    }
  }
  if (combatant.mountState.isMounted && mountPartner) {
    // This is the rider -- sync movement with mount
    const mountSpeed = getOverlandSpeed(mountPartner)
    combatant.mountState = {
      ...combatant.mountState,
      movementRemaining: mountSpeed
    }
  }
}
```

### Combatant Removal / Faint Integration

When a combatant is removed from an encounter or faints:
1. If the combatant is a mount with a rider, force-dismount the rider (place adjacent).
2. If the combatant is a rider, clear mount state on the mount.

This hooks into the existing `removeCombatant` and `applyDamageToEntity` code paths:

```typescript
// In applyDamageToEntity (combatant.service.ts):
// After checking for faint...
if (damageResult.fainted && combatant.mountState) {
  // Will be handled by the calling endpoint which has access to all combatants
  // The endpoint calls clearMountOnFaint from mounting.service.ts
}
```

---

## Summary of File Changes (P0)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/types/combat.ts` | Add `MountState` interface |
| **EDIT** | `app/types/encounter.ts` | Add `mountState?: MountState` to `Combatant` |
| **NEW** | `app/utils/mountingRules.ts` | Capability parsing, DC constants, skill checks |
| **NEW** | `app/server/services/mounting.service.ts` | Mount/dismount business logic (pure functions) |
| **NEW** | `app/server/api/encounters/[id]/mount.post.ts` | Mount action endpoint |
| **NEW** | `app/server/api/encounters/[id]/dismount.post.ts` | Dismount action endpoint |
| **EDIT** | `app/composables/useGridMovement.ts` | Rider uses mount's movement speed; linked movement |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Reset mount movement on new round |
| **EDIT** | `app/server/services/combatant.service.ts` | Faint clears mount state (hook for endpoints) |
| **EDIT** | `app/stores/encounter.ts` | Add mount/dismount actions, mount state getters |
