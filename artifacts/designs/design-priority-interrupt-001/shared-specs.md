# Shared Specs: Priority / Interrupt / Attack of Opportunity System

## Overview

This document defines the shared types, interfaces, database schema changes, and constants used across all priority tiers (P0/P1/P2) of the Priority/Interrupt/AoO system.

## PTU Rule Summary

PTU 1.05 defines three categories of out-of-turn actions:

1. **Attack of Opportunity (AoO)** — Free Action + Interrupt; a Struggle Attack triggered by specific adjacent-foe actions. Once per round. (PTU p.241)
2. **Priority Actions** — Declared between turns; user takes their full turn immediately, ignoring initiative. Once per round. Variants: Limited (only the Priority action, rest of turn at normal initiative) and Advanced (can be used even if already acted; gives up next round's turn). (PTU p.228)
3. **Interrupt Actions** — Declared during another's turn in response to a trigger; user takes only the Interrupt action. Once per round. (PTU p.228)

Additionally:
- **Disengage** — Shift 1m without provoking AoO (PTU p.241)
- **Intercept Melee/Ranged** — Full Action + Interrupt maneuvers that redirect attacks (PTU p.242)
- **Hold Action** — A combatant can hold their action until a specified lower initiative value, once per round. (PTU p.227)

## Decree Compliance

- **decree-003**: All tokens are passable; enemy-occupied squares are rough terrain. AoO movement triggers must check adjacency against token positions, not blocking.
- **decree-006**: Dynamic initiative reorder on speed changes. Hold Action interacts with this — held combatants slot into reordered initiative.

## Shared TypeScript Types

### New Types (`app/types/combat.ts` additions)

```typescript
// ============================================================
// Out-of-Turn Action System Types
// ============================================================

/** Categories of out-of-turn actions in PTU */
export type OutOfTurnCategory = 'aoo' | 'priority' | 'priority_limited' | 'priority_advanced' | 'interrupt';

/** Specific trigger events that can provoke an AoO (PTU p.241) */
export type AoOTrigger =
  | 'shift_away'        // Adjacent foe shifts out of adjacent square
  | 'ranged_attack'     // Adjacent foe uses ranged attack not targeting adjacent combatant
  | 'stand_up'          // Adjacent foe stands up (clears Tripped)
  | 'maneuver_other'    // Adjacent foe uses Push/Grapple/Disarm/Trip/Dirty Trick not targeting you
  | 'retrieve_item';    // Adjacent foe uses Standard Action to pick up/retrieve item

/** Trigger events for Interrupt actions (extensible) */
export type InterruptTrigger =
  | 'ally_hit_melee'    // Ally within movement range hit by adjacent melee foe (Intercept Melee)
  | 'ranged_in_range'   // Ranged X-target attack passes within movement range (Intercept Ranged)
  | 'custom';           // Feature-defined Interrupt trigger

/**
 * Conditions that prevent AoO usage (PTU p.241).
 * "Attacks of Opportunity cannot be made by Sleeping, Flinched, or Paralyzed targets."
 */
export const AOO_BLOCKING_CONDITIONS: readonly string[] = [
  'Asleep', 'Bad Sleep', 'Flinched', 'Paralyzed'
] as const;

/**
 * Conditions that prevent Intercept usage (PTU p.242).
 * "cannot attempt Intercepts if they are Asleep, Confused, Enraged, Frozen, Stuck,
 *  Paralyzed, or otherwise unable to move"
 */
export const INTERCEPT_BLOCKING_CONDITIONS: readonly string[] = [
  'Asleep', 'Bad Sleep', 'Confused', 'Enraged', 'Frozen', 'Stuck', 'Paralyzed'
] as const;

/**
 * Represents a pending out-of-turn action that has been detected/offered
 * but not yet resolved. The GM sees these as prompts and decides whether
 * to execute them.
 */
export interface OutOfTurnAction {
  /** Unique ID for this pending action */
  id: string;
  /** Category of out-of-turn action */
  category: OutOfTurnCategory;
  /** Combatant ID who CAN take this action */
  actorId: string;
  /** Combatant ID who triggered this action */
  triggerId: string;
  /** Specific trigger type */
  triggerType: AoOTrigger | InterruptTrigger;
  /** Human-readable description of what triggered this */
  triggerDescription: string;
  /** Round in which this was triggered */
  round: number;
  /** Whether this action has been resolved (accepted, declined, or expired) */
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  /** For Intercept: the attack that triggered it */
  triggerContext?: {
    /** The move/attack being used */
    moveName?: string;
    /** The original target of the attack */
    originalTargetId?: string;
    /** The attacker ID */
    attackerId?: string;
  };
}

/**
 * Tracks per-round usage of once-per-round out-of-turn actions.
 * Stored on each Combatant to enforce the 1/round limit.
 */
export interface OutOfTurnUsage {
  /** Whether this combatant has used their AoO this round */
  aooUsed: boolean;
  /** Whether this combatant has used a Priority action this round */
  priorityUsed: boolean;
  /** Whether this combatant has used an Interrupt action this round */
  interruptUsed: boolean;
}

/**
 * Hold Action state for a combatant.
 * PTU p.227: "Combatants can choose to hold their action until a
 * specified lower Initiative value once per round."
 */
export interface HoldActionState {
  /** Whether this combatant is currently holding their action */
  isHolding: boolean;
  /** The initiative value they are holding until (null = holding indefinitely until triggered) */
  holdUntilInitiative: number | null;
  /** Whether the hold has been consumed this round (can only hold once per round) */
  holdUsedThisRound: boolean;
}

/**
 * Extended TurnState with out-of-turn tracking.
 * These fields are added to the existing TurnState interface.
 */
export interface TurnStateExtensions {
  /** Out-of-turn action usage tracking for this round */
  outOfTurnUsage: OutOfTurnUsage;
  /** Hold action state */
  holdAction: HoldActionState;
}
```

### Combatant Extensions (`app/types/encounter.ts`)

The `Combatant` interface gains these fields (backward compatible — all optional with defaults):

```typescript
// Added to Combatant interface:
{
  /** Out-of-turn action usage for the current round */
  outOfTurnUsage?: OutOfTurnUsage;

  /** Whether this combatant used Disengage this turn (prevents AoO on their shift) */
  disengaged?: boolean;
}
```

### Encounter Extensions (`app/types/encounter.ts`)

The `Encounter` interface gains:

```typescript
// Added to Encounter interface:
{
  /** Pending out-of-turn actions awaiting GM resolution */
  pendingOutOfTurnActions: OutOfTurnAction[];

  /** Hold action queue — combatants who held and their target initiative */
  holdQueue: Array<{ combatantId: string; holdUntilInitiative: number | null }>;
}
```

## Database Schema Changes

### Encounter Model (`app/prisma/schema.prisma`)

New JSON columns on the Encounter model:

```prisma
model Encounter {
  // ... existing fields ...

  // Out-of-turn action system (feature-016)
  // JSON array of OutOfTurnAction — pending actions awaiting GM resolution
  pendingActions    String @default("[]")
  // JSON array of { combatantId, holdUntilInitiative } — held action queue
  holdQueue         String @default("[]")
}
```

The `outOfTurnUsage` and `disengaged` fields are stored within each combatant's JSON blob (the `combatants` column), following the existing pattern for `turnState`, `tempConditions`, etc. No separate columns needed.

## Constants

### AoO Trigger Detection Constants (`app/constants/aooTriggers.ts` — new file)

```typescript
/**
 * Maps AoO trigger types to their detection context.
 * Used by the trigger detection service to determine which triggers
 * to check based on the action being taken.
 */
export const AOO_TRIGGER_MAP = {
  /** PTU p.241: "An adjacent foe Shifts out of a Square adjacent to you." */
  shift_away: {
    checkOn: 'movement',
    description: 'shifted away from an adjacent enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Ranged Attack that does not target someone adjacent to it." */
  ranged_attack: {
    checkOn: 'attack',
    description: 'used a ranged attack while adjacent to an enemy'
  },
  /** PTU p.241: "An adjacent foe stands up." */
  stand_up: {
    checkOn: 'status_change',
    description: 'stood up from Tripped while adjacent to an enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Push, Grapple, Disarm, Trip, or Dirty Trick Maneuver that does not target you." */
  maneuver_other: {
    checkOn: 'maneuver',
    description: 'used a combat maneuver not targeting an adjacent enemy'
  },
  /** PTU p.241: "An adjacent foe uses a Standard Action to pick up or retrieve an item." */
  retrieve_item: {
    checkOn: 'item_action',
    description: 'picked up an item while adjacent to an enemy'
  }
} as const;
```

## WebSocket Events (New)

Added to the WebSocket handler (`app/server/routes/ws.ts`):

| Event | Direction | Description |
|-------|-----------|-------------|
| `aoo_triggered` | Server -> All | AoO opportunity detected; GM sees prompt |
| `aoo_resolved` | GM -> Server -> All | GM accepted/declined AoO |
| `interrupt_triggered` | Server -> All | Interrupt opportunity detected |
| `interrupt_resolved` | GM -> Server -> All | GM resolved interrupt |
| `priority_declared` | GM -> Server -> All | Priority action declared between turns |
| `priority_resolved` | GM -> Server -> All | Priority action resolved |
| `hold_action` | GM -> Server -> All | Combatant holding their action |
| `hold_released` | GM -> Server -> All | Held action released at target initiative |

## Service Layer

### New Service: `app/server/services/out-of-turn.service.ts`

Central service for all out-of-turn action logic. Pure functions where possible, DB operations where needed.

```typescript
// Core functions (P0):
export function detectAoOTriggers(params: AoODetectionParams): OutOfTurnAction[]
export function canUseAoO(combatant: Combatant): { allowed: boolean; reason?: string }
export function resolveAoO(encounter: Encounter, actionId: string, accepted: boolean): Encounter
export function getAdjacentEnemies(combatantId: string, combatants: Combatant[]): Combatant[]

// Hold Action functions (P1):
export function holdAction(encounter: Encounter, combatantId: string, targetInit: number | null): Encounter
export function releaseHeldAction(encounter: Encounter, combatantId: string): Encounter
export function checkHoldQueue(encounter: Encounter, currentInit: number): { combatantId: string } | null

// Priority functions (P1):
export function declarePriority(encounter: Encounter, combatantId: string, variant: 'standard' | 'limited' | 'advanced'): Encounter
export function canUsePriority(combatant: Combatant, variant: string): { allowed: boolean; reason?: string }

// Interrupt functions (P1):
export function declareInterrupt(encounter: Encounter, combatantId: string, trigger: InterruptTrigger): Encounter
export function canUseInterrupt(combatant: Combatant): { allowed: boolean; reason?: string }

// Intercept functions (P2):
export function detectInterceptOpportunity(params: InterceptDetectionParams): OutOfTurnAction[]
export function canIntercept(combatant: Combatant): { allowed: boolean; reason?: string }
export function resolveInterceptMelee(encounter: Encounter, interceptorId: string, targetId: string): Encounter
export function resolveInterceptRanged(encounter: Encounter, interceptorId: string, squarePos: GridPosition): Encounter
```

## Backward Compatibility

All new fields use optional types or have defaults:
- `outOfTurnUsage` defaults to `{ aooUsed: false, priorityUsed: false, interruptUsed: false }`
- `disengaged` defaults to `false`
- `pendingActions` defaults to `[]`
- `holdQueue` defaults to `[]`

Existing encounters without these fields continue to work. The `resetCombatantsForNewRound()` function in `next-turn.post.ts` will be extended to reset `outOfTurnUsage` and `disengaged` for each combatant.

## Adjacency Calculation

Shared utility for determining which combatants are adjacent (PTU p.231: squares touching, including diagonals). Used by AoO trigger detection and Intercept range checking.

```typescript
// app/utils/adjacency.ts (new file)

/**
 * Check if two grid positions are adjacent (including diagonals).
 * For multi-cell tokens, checks if ANY cell of one token is adjacent
 * to ANY cell of the other token.
 */
export function areAdjacent(
  posA: GridPosition, sizeA: number,
  posB: GridPosition, sizeB: number
): boolean

/**
 * Get all combatants adjacent to a given combatant.
 * Uses grid positions and token sizes.
 */
export function getAdjacentCombatants(
  combatantId: string,
  combatants: Combatant[]
): Combatant[]

/**
 * Check if a combatant was adjacent before a move and is no longer adjacent after.
 * Used for shift_away AoO trigger detection.
 */
export function wasAdjacentBeforeMove(
  moverId: string, oldPos: GridPosition,
  observerId: string, observerPos: GridPosition,
  moverSize: number, observerSize: number
): boolean
```
