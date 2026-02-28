# P0: Tick Damage at Turn End (Burn, Poison, Badly Poisoned, Cursed)

## Scope

Automate the HP loss that Burned, Poisoned, Badly Poisoned, and Cursed combatants suffer at the end of their turn. This is the highest-impact gap — tick damage is deterministic, requires no GM input, and forgetting it changes game balance significantly.

---

## PTU Rules (Exact Text)

### Burn (PTU p.246)
> "If a Burned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn."

### Poison (PTU p.247)
> "If a Poisoned Target takes a Standard Action or is prevented from taking a Standard Action by an effect such as Sleep, Flinch, or Paralysis, they lose a Tick of Hit Points at the end of that turn."

### Badly Poisoned (PTU p.247)
> "When Badly Poisoned, the afflicted instead loses 5 Hit Points; this amount is doubled each consecutive round (10, 20, 40, etc)."

### Cursed (PTU p.247)
> "If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points at the end of that turn."

### Tick Definition (PTU p.246)
> "A Tick of Hit Points is equal to 1/10th of a Pokemon or Trainer's Maximum Hit Points."

---

## Design Decisions

### D1: Tick damage always applies (Burn/Poison)

PTU says "takes a Standard Action OR is prevented from taking a Standard Action." Since in combat every turn has a Standard Action (you either use it or are prevented from it), Burn/Poison tick damage fires on EVERY turn. There is no case in combat where a combatant neither takes nor is prevented from taking a Standard Action.

**Exception:** Cursed only triggers when the target actually takes a Standard Action — NOT when prevented. This is a distinct wording: "takes a Standard Action" without the "or is prevented from" clause.

### D2: Tick damage processed in next-turn.post.ts

When the GM clicks "Next Turn," before advancing the turn index, the server processes tick damage for the outgoing combatant. This is deterministic and should not require GM confirmation.

### D3: Badly Poisoned escalation tracking

A new `badlyPoisonedRound` field on the Combatant interface tracks which escalation round the target is on. Starts at 1 when Badly Poisoned is applied, increments at each turn end. Resets to 0 when cured.

**Damage formula:** `5 * 2^(badlyPoisonedRound - 1)`
- Round 1: 5 HP
- Round 2: 10 HP
- Round 3: 20 HP
- Round 4: 40 HP
- Round 5: 80 HP

**Note:** The escalation text says "each consecutive round" meaning each of the target's turns, not each combat round (multiple combatants act per combat round). This tracks per the combatant's individual turns.

### D4: Tick damage can cause injuries and fainting

Tick damage passes through the same `calculateDamage()` function used for move damage, which handles:
- Temporary HP absorption
- HP marker crossing (injuries at 50%, 0%, -50%, -100%)
- Massive damage rule (50%+ of max HP in one hit)
- Fainted status application on reaching 0 HP

### D5: Tick damage uses entity's maxHp, not effective maxHp

PTU says "1/10th of Maximum Hit Points." This uses the base maxHp, not the injury-reduced effective maxHp. The tick is a fixed amount based on the creature's natural health pool.

### D6: Fainted combatants do not take tick damage

If a combatant is already Fainted (HP = 0), they have no status conditions (cleared on faint per PTU p.248) and cannot take tick damage. The faint-clear already happens in `applyDamageToEntity`. As additional safety, skip tick processing for fainted combatants.

### D7: Decree-012 interaction for tick damage

Tick damage from Burn/Poison does NOT need type immunity checking — by the time tick damage fires, the status is already applied. Type immunity was checked at application time per decree-012. If a Fire-type somehow has Burn (via GM override), tick damage still applies.

---

## Implementation Plan

### Step 1: Create status-automation.service.ts

New service file containing pure functions for tick damage calculation.

**File:** `app/server/services/status-automation.service.ts`

```typescript
import { calculateDamage as calculateCombatDamage } from '~/server/services/combatant.service'
import type { Combatant, StatusCondition } from '~/types'

/**
 * Calculate tick damage (1/10 max HP, rounded down, minimum 1).
 * PTU p.246: "A Tick of Hit Points is equal to 1/10th of a
 * Pokemon or Trainer's Maximum Hit Points."
 */
export function calculateTickDamage(maxHp: number): number {
  return Math.max(1, Math.floor(maxHp / 10))
}

/**
 * Calculate Badly Poisoned damage for a given escalation round.
 * PTU p.247: "loses 5 Hit Points; this amount is doubled each
 * consecutive round (10, 20, 40, etc)."
 *
 * Formula: 5 * 2^(round - 1)
 */
export function calculateBadlyPoisonedDamage(escalationRound: number): number {
  return 5 * Math.pow(2, Math.max(0, escalationRound - 1))
}

/**
 * Determine what tick damage (if any) a combatant takes at end of turn.
 * Returns array of { condition, damage } entries.
 *
 * Burn/Poison: always fires (Standard Action taken or prevented).
 * Badly Poisoned: always fires, escalating damage.
 * Cursed: only fires if Standard Action was actually taken (not prevented).
 *
 * @param combatant - The combatant whose turn is ending
 * @param standardActionTaken - Whether the combatant actually used a Standard Action
 *                              (as opposed to being prevented by Freeze/Sleep/etc.)
 */
export function getTickDamageEntries(
  combatant: Combatant,
  standardActionTaken: boolean
): Array<{ condition: StatusCondition; damage: number; formula: string; escalationRound?: number }> {
  const entity = combatant.entity
  const statuses: StatusCondition[] = entity.statusConditions || []
  const maxHp = entity.maxHp
  const entries: Array<{ condition: StatusCondition; damage: number; formula: string; escalationRound?: number }> = []

  // Skip if fainted
  if (entity.currentHp <= 0) return entries

  const tick = calculateTickDamage(maxHp)

  // Burn: always fires (took or was prevented from Standard Action)
  if (statuses.includes('Burned')) {
    entries.push({
      condition: 'Burned',
      damage: tick,
      formula: `1/10 max HP (${tick})`
    })
  }

  // Poison: always fires (same trigger as Burn)
  if (statuses.includes('Poisoned')) {
    entries.push({
      condition: 'Poisoned',
      damage: tick,
      formula: `1/10 max HP (${tick})`
    })
  }

  // Badly Poisoned: always fires, escalating
  if (statuses.includes('Badly Poisoned')) {
    const round = combatant.badlyPoisonedRound || 1
    const damage = calculateBadlyPoisonedDamage(round)
    entries.push({
      condition: 'Badly Poisoned',
      damage,
      formula: `5 x 2^${round - 1} = ${damage} HP (round ${round})`,
      escalationRound: round
    })
  }

  // Cursed: ONLY fires if Standard Action was actually taken
  if (statuses.includes('Cursed') && standardActionTaken) {
    entries.push({
      condition: 'Cursed',
      damage: tick * 2,
      formula: `2 ticks (${tick * 2})`
    })
  }

  return entries
}
```

### Step 2: Add badlyPoisonedRound to Combatant

**File:** `app/types/encounter.ts`

Add to `Combatant` interface:
```typescript
// Badly Poisoned escalation round counter (combat-scoped)
// 0 = not badly poisoned, 1+ = current escalation round
// Incremented at each turn end while Badly Poisoned
badlyPoisonedRound: number
```

**File:** `app/server/services/combatant.service.ts`

In `buildCombatantFromEntity()`, initialize:
```typescript
badlyPoisonedRound: 0
```

In `updateStatusConditions()`, when adding 'Badly Poisoned', set `badlyPoisonedRound = 1`. When removing 'Badly Poisoned', set `badlyPoisonedRound = 0`.

### Step 3: Add tick damage constants

**File:** `app/constants/statusConditions.ts`

```typescript
/** Conditions that deal tick damage at end of turn */
export const TICK_DAMAGE_CONDITIONS: StatusCondition[] = [
  'Burned', 'Poisoned', 'Badly Poisoned', 'Cursed'
]
```

### Step 4: Integrate tick damage into next-turn.post.ts

**File:** `app/server/api/encounters/[id]/next-turn.post.ts`

After marking the current combatant as having acted, BEFORE advancing `currentTurnIndex`:

```typescript
// Process tick damage for the outgoing combatant
const tickResults: TickDamageResult[] = []

if (currentCombatant && currentCombatant.entity.currentHp > 0) {
  // Determine if Standard Action was actually taken
  // (as opposed to being prevented by Freeze/Sleep/Paralysis)
  const standardActionTaken = currentCombatant.turnState?.standardActionUsed ?? false

  const tickEntries = getTickDamageEntries(currentCombatant, standardActionTaken)

  for (const entry of tickEntries) {
    const damageResult = calculateDamage(
      entry.damage,
      currentCombatant.entity.currentHp,
      currentCombatant.entity.maxHp,
      currentCombatant.entity.temporaryHp || 0,
      currentCombatant.entity.injuries || 0
    )

    applyDamageToEntity(currentCombatant, damageResult)

    tickResults.push({
      combatantId: currentCombatant.id,
      combatantName: getCombatantName(currentCombatant),
      condition: entry.condition,
      damage: entry.damage,
      formula: entry.formula,
      newHp: damageResult.newHp,
      injuryGained: damageResult.injuryGained,
      fainted: damageResult.fainted,
      escalationRound: entry.escalationRound
    })

    // Sync tick damage to database
    await syncEntityToDatabase(currentCombatant, {
      currentHp: currentCombatant.entity.currentHp,
      temporaryHp: currentCombatant.entity.temporaryHp,
      injuries: currentCombatant.entity.injuries,
      statusConditions: currentCombatant.entity.statusConditions,
      ...(damageResult.injuryGained ? { lastInjuryTime: new Date() } : {})
    })
  }

  // Increment Badly Poisoned escalation counter
  if (currentCombatant.entity.statusConditions?.includes('Badly Poisoned')) {
    currentCombatant.badlyPoisonedRound = (currentCombatant.badlyPoisonedRound || 1) + 1
  }
}
```

**Important placement:** Tick damage happens AFTER the combatant's actions but BEFORE the turn index advances. This matches PTU's "at the end of that turn" timing.

### Step 5: Return tick damage results in response

Add `tickDamage` to the next-turn response:
```typescript
return {
  success: true,
  data: response,
  tickDamage: tickResults.length > 0 ? tickResults : undefined
}
```

### Step 6: Add move log entries for tick damage

Each tick damage event should be logged to the encounter's moveLog for the combat transcript:

```typescript
if (tickResults.length > 0) {
  const moveLog = JSON.parse(encounter.moveLog)
  for (const tick of tickResults) {
    moveLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      round: currentRound,
      actorId: tick.combatantId,
      actorName: tick.combatantName,
      moveName: `${tick.condition} Tick`,
      damageClass: 'Status',
      targets: [{
        id: tick.combatantId,
        name: tick.combatantName,
        hit: true,
        damage: tick.damage,
        injury: tick.injuryGained
      }],
      notes: tick.formula
    })
  }
  updateData.moveLog = JSON.stringify(moveLog)
}
```

### Step 7: Broadcast tick damage via WebSocket

After saving the encounter update, broadcast tick damage events to connected clients:

```typescript
for (const tick of tickResults) {
  broadcastToEncounter(id, {
    type: 'status_tick',
    data: {
      encounterId: id,
      combatantId: tick.combatantId,
      combatantName: tick.combatantName,
      condition: tick.condition,
      damage: tick.damage,
      newHp: tick.newHp,
      fainted: tick.fainted,
      formula: tick.formula
    }
  })
}
```

---

## Helper: getCombatantName

A small utility needed for logging:

```typescript
function getCombatantName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as Pokemon
    return pokemon.nickname || pokemon.species
  }
  return (combatant.entity as HumanCharacter).name
}
```

This should be extracted into `status-automation.service.ts` or a shared utility.

---

## Declaration Phase Interaction (League Battles)

During League Battle `trainer_declaration` phase, trainers are only declaring actions — not executing them. Temp conditions are not cleared during declaration (existing logic). Tick damage should also NOT fire during declaration phase, because declaration is not a real turn.

**Guard:** Only process tick damage when `currentPhase !== 'trainer_declaration'`.

During `trainer_resolution` phase, tick damage DOES fire for resolving trainers (this is their actual turn).

---

## Edge Cases

### E1: Multiple tick damage sources stack
A combatant with both Burn and Curse loses 1 tick (Burn) + 2 ticks (Curse) = 3 ticks total. Each is processed independently and each can independently cause injuries.

### E2: Tick damage causes faint mid-processing
If the first tick entry (e.g., Burn) causes the combatant to faint, the faint-clear in `applyDamageToEntity` removes all Persistent/Volatile conditions. The loop should check `currentHp > 0` before processing subsequent entries.

### E3: Badly Poisoned + Poisoned cannot co-exist
In PTU, Badly Poisoned replaces Poisoned (it's a worsened form). The status application code should replace Poisoned with Badly Poisoned (removing Poisoned when adding Badly Poisoned). If both somehow exist, only Badly Poisoned damage applies (higher severity). The `getTickDamageEntries` function already handles this by having separate checks — if both are present, both would fire, which is incorrect. Add a guard: if Badly Poisoned is present, skip Poisoned tick.

### E4: Undo/Redo compatibility
Since tick damage modifies entity HP, injuries, and status conditions — and these are stored in the encounter's combatants JSON — the existing undo/redo snapshot system captures the state before and after tick damage. No special handling needed.

### E5: Temporary HP absorbs tick damage
The existing `calculateDamage()` function handles Temporary HP absorption. Tick damage follows the same path — Temporary HP absorbs tick damage first.

---

## Acceptance Criteria

- [ ] Burned combatant loses floor(maxHp / 10) HP at turn end
- [ ] Poisoned combatant loses floor(maxHp / 10) HP at turn end
- [ ] Badly Poisoned combatant loses escalating damage (5, 10, 20, 40...) at turn end
- [ ] Badly Poisoned escalation counter increments each turn
- [ ] Badly Poisoned escalation resets when condition is cured
- [ ] Cursed combatant loses 2 ticks only when Standard Action was actually used
- [ ] Tick damage causes injuries when crossing HP markers
- [ ] Tick damage causes faint at 0 HP
- [ ] Fainted combatant does not take tick damage
- [ ] Tick damage logged to moveLog
- [ ] Tick damage broadcast via WebSocket
- [ ] Tick damage included in next-turn API response
- [ ] No tick damage during League Battle declaration phase
- [ ] Multiple tick sources stack independently
- [ ] Badly Poisoned supersedes Poisoned (no double-tick)
