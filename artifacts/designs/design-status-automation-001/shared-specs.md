# Shared Specifications

## Existing Code Analysis

### What Already Works

| Feature | Implementation | Files |
|---------|---------------|-------|
| Status condition tracking | Array on entity, add/remove via API | `status.post.ts`, `combatant.service.ts` |
| CS auto-apply (decree-005) | Burn -2 Def, Paralysis -4 Speed, Poison -2 SpDef with source tracking | `combatant.service.ts`, `statusConditions.ts` |
| Type immunities (decree-012) | Server-side enforcement with GM override | `status.post.ts`, `typeStatusImmunity.ts` |
| Zero evasion states | Frozen/Asleep/Vulnerable set evasion to 0 | `statusConditions.ts`, evasion calculation |
| Turn progression | `next-turn.post.ts` with phase-aware progression | `next-turn.post.ts` |
| Damage application | Full injury/marker system | `combatant.service.ts` |
| DB sync | Entity changes synced to DB | `entity-update.service.ts` |
| Dice roller | `roll('1d20')` returns `DiceRollResult` | `diceRoller.ts` |
| Move log | Timestamped combat event log | `encounter.ts` types |

### What Needs to Change

| Gap | Description | Primary File |
|-----|-------------|-------------|
| Tick damage | Burn/Poison lose 1 tick HP at end of turn | `next-turn.post.ts` |
| Badly Poisoned escalation | 5 HP, then doubles each round (10, 20, 40...) | `next-turn.post.ts`, new tracking field |
| Save checks | Frozen/Paralysis/Sleep/Confused rolls at turn start/end | New endpoint or `next-turn.post.ts` |
| Turn skip | Frozen/Paralysis fail/Sleep skip full turn | Client-side enforcement + API |
| Confused self-hit | DB 6 typeless physical Struggle on confusion fail | Client-side + damage API |
| Fire thaw | Frozen target hit by Fire/Fighting/Rock/Steel is cured | `status.post.ts` or damage endpoint |
| Sleep wake on damage | Sleeping target wakes when hit by an attack | Damage endpoint |
| Bad Sleep | 2 ticks HP on each Sleep save check | Save check handler |
| Cursed tick | 2 ticks HP at end of turn on Standard Action | `next-turn.post.ts` |

---

## Architecture Decision: Turn-End Processing vs Dedicated Endpoint

**Decision: Hybrid approach — server processes tick damage automatically in `next-turn.post.ts`, save checks use a dedicated endpoint called before advancing turns.**

### Rationale

**Tick damage (Burn, Poison, Cursed):** These are deterministic — they happen automatically at the end of the afflicted's turn if they took a Standard Action (or were prevented from one). The server has all the information needed. Processing in `next-turn.post.ts` ensures they are never forgotten.

**Save checks (Frozen, Paralysis, Sleep, Confused):** These require a d20 roll that the GM sees and may want to verify. They also gate whether the combatant can act at all. A dedicated endpoint `POST /api/encounters/:id/save-check` allows the GM to trigger the check, see the result, and then either let the combatant act or skip their turn. This keeps the GM in control.

**Why not fully automatic?** Fully automatic save checks would change turn progression flow significantly and remove GM agency. The PTU game is GM-mediated — the GM should see the save check result before deciding to advance. This also allows the GM to manually cure conditions or apply ability-based overrides before proceeding.

---

## Data Flow Diagram

```
COMBATANT'S TURN START:
  |
  +-- Does combatant have save-check conditions?
  |   (Frozen, Paralyzed, Confused, Asleep, Infatuated, Enraged)
  |       |
  |       YES --> UI shows "Save Check Required" banner
  |       |       GM clicks "Roll Save Check"
  |       |       --> POST /api/encounters/:id/save-check
  |       |       --> Server rolls 1d20, evaluates result per condition
  |       |       --> Returns: { roll, dc, passed, effects }
  |       |           |
  |       |           +-- PASSED: Combatant may act normally
  |       |           |   (Frozen: cured. Confused 16+: cured. Sleep: cured.)
  |       |           |
  |       |           +-- FAILED: Turn restrictions apply
  |       |               (Frozen: cannot act. Paralysis: cannot act.
  |       |                Sleep: cannot act. Confused 1-8: self-hit.)
  |       |
  |       NO --> Combatant acts normally
  |
  v
COMBATANT ACTS (or is restricted)
  |
  v
GM CLICKS "NEXT TURN"
  --> POST /api/encounters/:id/next-turn
  |
  +-- Server checks outgoing combatant for tick damage conditions
  |   |
  |   +-- Burned + took/was-prevented Standard Action?
  |   |   --> Lose 1 tick (floor(maxHp / 10)) HP
  |   |   --> Apply via calculateDamage() for injury tracking
  |   |
  |   +-- Poisoned + took/was-prevented Standard Action?
  |   |   --> Lose 1 tick HP
  |   |
  |   +-- Badly Poisoned?
  |   |   --> Lose escalating damage (5 * 2^(consecutiveRounds-1))
  |   |   --> Increment badlyPoisonedRound counter
  |   |
  |   +-- Cursed + took Standard Action?
  |   |   --> Lose 2 ticks HP
  |   |
  |   +-- Frozen (at turn END)?
  |       --> Roll DC 16 save check (DC 11 for Fire-types)
  |       --> +4 in Sunny, -2 in Hail
  |       --> If passed: cure Frozen
  |
  +-- Log tick damage to moveLog
  +-- Sync HP changes to DB
  +-- Broadcast status_tick event
  |
  v
NEXT COMBATANT'S TURN BEGINS
```

---

## Data Models

### StatusAutomationResult (API response for save checks)

```typescript
/** Result of a status condition save check */
interface SaveCheckResult {
  /** The combatant who made the save check */
  combatantId: string
  /** Which condition triggered the check */
  condition: StatusCondition
  /** The d20 roll result */
  roll: number
  /** The DC that was required */
  dc: number
  /** Whether the save was successful */
  passed: boolean
  /** What happened as a result */
  effect: SaveCheckEffect
  /** Weather modifier applied (if any) */
  weatherModifier?: number
  /** Type modifier applied (Frozen save for Fire-types) */
  typeModifier?: boolean
}

type SaveCheckEffect =
  | { type: 'cured'; condition: StatusCondition }
  | { type: 'can_act' }
  | { type: 'cannot_act'; reason: string }
  | { type: 'self_hit'; damage: number; db: number }
```

### TickDamageResult (returned from next-turn processing)

```typescript
/** Result of automatic tick damage processing */
interface TickDamageResult {
  combatantId: string
  combatantName: string
  condition: StatusCondition
  damage: number
  /** How the damage was calculated */
  formula: string
  /** Current HP after tick damage */
  newHp: number
  /** Whether any injuries were gained */
  injuryGained: boolean
  /** Whether the combatant fainted from tick damage */
  fainted: boolean
  /** For Badly Poisoned: which round of escalation */
  escalationRound?: number
}
```

### Badly Poisoned Tracking

```typescript
/**
 * New field on Combatant interface to track Badly Poisoned escalation.
 * Starts at 1 when Badly Poisoned is applied, increments each turn.
 * Reset to 0 when Badly Poisoned is cured.
 *
 * Damage formula: 5 * 2^(badlyPoisonedRound - 1)
 *   Round 1: 5 HP
 *   Round 2: 10 HP
 *   Round 3: 20 HP
 *   Round 4: 40 HP
 *   Round 5: 80 HP
 *   etc.
 */
badlyPoisonedRound: number  // 0 = not badly poisoned, 1+ = current escalation round
```

This field lives on the `Combatant` interface (in the encounter's combatants JSON), not on the entity. It is combat-scoped and resets when the condition is cured or the encounter ends.

### Sleep Wake-on-Damage Flag

No new field needed. When damage is applied to a Sleeping combatant via the damage endpoint, the endpoint checks for Sleep and cures it. This is a check in the damage application code path, not a new data structure.

### Frozen Fire-Thaw Flag

No new field needed. When a damaging Fire/Fighting/Rock/Steel move hits a Frozen target, the move execution code checks for Frozen and cures it. This is a check in the move execution code path.

---

## API Contracts

### POST `/api/encounters/:id/save-check`

**Purpose:** Roll a save check for a combatant's status condition at turn start.

**Request:**
```typescript
{
  combatantId: string
  condition: StatusCondition  // Which condition to check
}
```

**Response:**
```typescript
{
  success: true
  data: Encounter  // Updated encounter state
  saveCheck: SaveCheckResult
}
```

**Error codes:**
- `400` — Combatant doesn't have the specified condition
- `400` — Condition doesn't have a save check mechanic
- `404` — Encounter or combatant not found

**Behavior by condition:**

| Condition | Timing | DC | Pass | Fail |
|-----------|--------|-----|------|------|
| Frozen | End of turn | 16 (11 for Fire-type) | Cured | Cannot act |
| Paralysis | Start of turn | 5 | Can act normally | Cannot take Standard/Shift/Swift |
| Sleep | End of turn | 16 | Wakes up (cured) | Stays asleep |
| Confused | Start of turn | 9-15 = act, 16+ = cured | Act normally or cured | 1-8: self-hit (DB 6 Struggle) |

**Note on Frozen timing:** PTU says "At the end of each turn." However, Frozen prevents acting entirely, so the save check functionally gates the NEXT turn. The server rolls the Frozen save check at turn end (in next-turn processing) and stores the result. On the Frozen combatant's next turn, the UI shows whether they can act.

**Revised: Frozen uses automatic processing in next-turn.post.ts** (see P0 spec for details).

### POST `/api/encounters/:id/next-turn` (modified)

**Added behavior:** Before advancing to the next combatant, process tick damage for the outgoing combatant.

**Additional response fields:**
```typescript
{
  success: true
  data: Encounter
  tickDamage?: TickDamageResult[]  // Tick damage applied this turn-end
  frozenSave?: SaveCheckResult     // Frozen save check result (if applicable)
}
```

---

## WebSocket Events

### New Events

```typescript
// Tick damage applied at turn end
{
  type: 'status_tick',
  data: {
    encounterId: string
    combatantId: string
    combatantName: string
    condition: string      // 'Burned', 'Poisoned', 'Badly Poisoned', 'Cursed'
    damage: number
    newHp: number
    fainted: boolean
    formula: string        // e.g., "1/10 max HP (7)"
  }
}

// Save check result
{
  type: 'save_check',
  data: {
    encounterId: string
    combatantId: string
    combatantName: string
    condition: string
    roll: number
    dc: number
    passed: boolean
    effect: string         // Human-readable: "Cured!", "Cannot act", "Self-hit for 15 damage"
  }
}

// Condition auto-cured (fire thaw, wake on damage, etc.)
{
  type: 'condition_auto_cure',
  data: {
    encounterId: string
    combatantId: string
    combatantName: string
    condition: string
    reason: string         // "Hit by Fire move", "Took damage while asleep"
  }
}
```

---

## PTU Rules Reference (Exact Mechanics)

### Save Checks (PTU p.246-247)

All save checks are 1d20. Results compared against DC.

| Condition | DC | Timing | Pass Effect | Fail Effect |
|-----------|-----|--------|-------------|-------------|
| Frozen | 16 (11 for Fire-type) | End of each turn | Cured | Cannot act next turn |
| Paralysis | 5 | Start of each turn | Act normally | No Standard/Shift/Swift actions |
| Sleep | 16 | End of sleeper's turn | Wake up (cured) | Stay asleep |
| Confused | 1-8 fail, 9-15 ok, 16+ cured | Start of each turn | 9-15: act normally, 16+: cured | 1-8: self-hit DB 6 Struggle |
| Infatuated | 1-10 partial, 11-18 ok, 19+ cured | Start of each turn | 11-18: unrestricted, 19+: cured | 1-10: can't target infatuator |
| Enraged | 15 | End of each turn | Cured | Must use damaging Physical/Special move |

### Tick Damage (PTU p.246-247)

| Condition | Trigger | Amount |
|-----------|---------|--------|
| Burned | Takes/prevented Standard Action | 1 tick = floor(maxHp / 10) |
| Poisoned | Takes/prevented Standard Action | 1 tick = floor(maxHp / 10) |
| Badly Poisoned | Each turn | 5 HP, doubling each consecutive round (10, 20, 40...) |
| Cursed | Takes Standard Action | 2 ticks = floor(maxHp / 10) * 2 |
| Bad Sleep | On each Sleep save check | 2 ticks = floor(maxHp / 10) * 2 |

**"Takes a Standard Action or is prevented from taking a Standard Action"** — This means Burn/Poison tick happens on EVERY turn, because either you took a Standard Action or you were prevented from one (by Sleep, Flinch, Paralysis, Frozen, etc.). The only case where tick damage would NOT apply is if the combatant somehow has a turn where they neither take nor are prevented from taking a Standard Action — which in practice never happens during combat.

### Weather Modifiers for Save Checks

| Weather | Condition | Modifier |
|---------|-----------|----------|
| Sunny | Frozen | +4 bonus to save (DC effectively 12, or 7 for Fire-type) |
| Hail | Frozen | -2 penalty to save (DC effectively 18, or 13 for Fire-type) |

### Auto-Cure Conditions

| Trigger | Cures |
|---------|-------|
| Hit by damaging Fire/Fighting/Rock/Steel move | Frozen |
| Sleeping target takes damage from an Attack | Sleep (NOT from Burn/Poison tick) |
| Sleeping target cured | Bad Sleep (automatically cured with Sleep) |
| Target faints | All Persistent + Volatile conditions |

---

## Constants to Add

```typescript
// app/constants/statusConditions.ts additions

/** Conditions that require a save check */
export const SAVE_CHECK_CONDITIONS: StatusCondition[] = [
  'Frozen', 'Paralyzed', 'Asleep', 'Confused', 'Infatuated', 'Enraged'
]

/** Conditions that deal tick damage */
export const TICK_DAMAGE_CONDITIONS: StatusCondition[] = [
  'Burned', 'Poisoned', 'Badly Poisoned', 'Cursed'
]

/** Save check DCs by condition */
export const SAVE_CHECK_DCS: Record<string, number> = {
  'Frozen': 16,
  'Paralyzed': 5,
  'Asleep': 16,
  'Infatuated': 0,  // Multi-threshold, handled specially
  'Enraged': 15
  // Confused: multi-threshold, handled specially
}

/** Moves types that thaw Frozen targets */
export const FROZEN_THAW_TYPES: string[] = ['Fire', 'Fighting', 'Rock', 'Steel']
```

---

## Files Changed Summary (All Tiers)

### P0 (Tick Damage + Badly Poisoned Escalation)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/server/services/status-automation.service.ts` | Pure functions for tick damage calculation and save checks |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Call tick damage processing before advancing turn |
| **EDIT** | `app/types/encounter.ts` | Add `badlyPoisonedRound` to Combatant |
| **EDIT** | `app/constants/statusConditions.ts` | Add tick damage / save check constants |
| **EDIT** | `app/server/services/combatant.service.ts` | Initialize `badlyPoisonedRound` in combatant builder |
| **EDIT** | `app/server/services/entity-update.service.ts` | Sync tick damage HP to DB |

### P1 (Save Checks)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/server/api/encounters/[id]/save-check.post.ts` | Save check endpoint |
| **EDIT** | `app/server/services/status-automation.service.ts` | Add save check evaluation functions |
| **EDIT** | `app/stores/encounter.ts` | Add `rollSaveCheck` action |
| **NEW** | `app/components/encounter/SaveCheckBanner.vue` | UI banner for pending save checks |
| **NEW** | `app/components/encounter/SaveCheckResult.vue` | Display save check results |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Add Frozen end-of-turn save check |

### P2 (Auto-Cure + Ability Interactions)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` | Wake sleeping targets on attack damage |
| **EDIT** | `app/server/api/encounters/[id]/status.post.ts` | Auto-cure Bad Sleep when Sleep is removed |
| **EDIT** | `app/server/api/encounters/[id]/move.post.ts` (or damage path) | Fire thaw for Frozen targets |
| **EDIT** | `app/constants/statusConditions.ts` | Weather modifier constants |
| **EDIT** | `app/server/services/status-automation.service.ts` | Weather-aware save check DCs |
