# P1: Save Checks (Frozen, Paralysis, Sleep, Confused)

## Scope

Implement save check mechanics for status conditions that gate whether a combatant can act on their turn. This is the second-highest priority because save check failures cause turn skips, which are currently tracked manually by the GM.

---

## PTU Rules (Exact Text)

### Frozen (PTU p.246)
> "The target may not act on their turn and receives no bonuses from Evasion. At the end of each turn, the target may make a DC 16 Save Check to become cured. This DC is lowered to 11 for Fire-Type Pokemon, and Ice-Type Pokemon are immune to becoming Frozen. If a Frozen Target is hit by a Damaging Fire, Fighting, Rock, or Steel Attack, they are cured of the Frozen Condition. Save Checks to cure this condition receive a +4 Bonus in Sunny Weather, and a -2 Penalty in Hail."

### Paralysis (PTU p.247)
> "At the beginning of each turn the target is paralyzed, they must roll a DC 5 Save Check. If they succeed, they may act normally; if they do not, they cannot take any Standard, Shift, or Swift Actions."

### Sleep (PTU p.247)
> "Sleeping Trainers and Pokemon receive no bonuses from Evasion, and cannot take actions except for Free and Swift Actions that would cure Sleep. At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up. Whenever a Sleeping Pokemon takes Damage or loses life from an Attack, they wake up. This does not include loss of life from passive sources such as Poison or Burns, but active attacks and effects that cause Hit Point loss would wake up their target."

### Confused (PTU p.247)
> "At the beginning of their turn, a confused target must roll a Save Check.
> On a roll of 1-8, the confused target hits itself using a Typeless Physical Struggle Attack as a Standard Action and may take no other actions this turn. This attack automatically hits, and deals damage as if it's resisted 1 Step.
> On a roll of 9-15, the target may act normally.
> On a roll of 16 or higher, the target is cured of confusion."

### Bad Sleep (PTU p.247)
> "Whenever the user makes a Save Check to save against Sleep, they lose two ticks of Hit Points. Bad Sleep may only afflict Sleeping targets; if the target is cured of Sleep, they are also cured of Bad Sleep."

### Infatuated (PTU p.247)
> "At the beginning of each turn you are infatuated, roll a Save Check.
> On a result of 1-10, you may not target the Pokemon or Trainer that you are Infatuated towards with a Move or Attack, but may otherwise Shift and use actions normally.
> On 11-18 you may use a Move and Shift without restriction.
> On a roll of 19 or higher, you are cured of the Infatuation."

### Enraged (PTU p.247)
> "While enraged, the target must use a Damaging Physical or Special Move or Struggle Attack. At the end of each turn, roll a DC15 Save Check; if they succeed, they are cured of Rage."

---

## Design Decisions

### D1: Save checks use a dedicated endpoint

`POST /api/encounters/:id/save-check` is called by the GM at the start of a combatant's turn (for Paralysis, Confused, Infatuated) or at the end (for Frozen, Sleep, Enraged). The GM triggers the check, sees the result, and decides how to proceed.

**Why not automatic?** The GM may want to apply abilities (e.g., Shed Skin) or items before the save check. Some conditions have complex outcomes (Confused self-hit requires damage application). The GM needs to see and acknowledge the result.

### D2: Frozen uses automatic end-of-turn save in next-turn.post.ts

Frozen is unique: the target cannot act at all, so there's no GM decision to make during their turn. The save check at turn end determines whether they thaw for next turn. This is processed automatically alongside tick damage in `next-turn.post.ts`.

However, the GM can still manually cure Frozen before the turn ends (e.g., a Fire move from an ally).

### D3: Confused self-hit follows Struggle Attack rules

PTU says the confused self-hit is "a Typeless Physical Struggle Attack as a Standard Action" that "deals damage as if it's resisted 1 Step."

- **Damage Base:** 6 (Struggle Attack DB, PTU p.238)
- **Damage Class:** Physical (uses Attack stat vs own Defense stat)
- **Effectiveness:** "Resisted 1 Step" = 0.5x multiplier (PTU effectiveness)
- **Type:** Typeless (no STAB, no type effectiveness beyond the 1-step resist)
- **Auto-hit:** No accuracy check needed

The save-check endpoint calculates and applies this damage directly.

### D4: Paralysis failure restricts all actions

On a failed Paralysis save, the combatant "cannot take any Standard, Shift, or Swift Actions." The server marks their turn state as fully restricted. The GM can still advance past them with Next Turn.

Implementation: The save-check response includes the restriction, and the client-side UI disables action buttons. The `turnState` is updated server-side.

### D5: Sleep save check at turn END, not start

PTU says "At the end of the sleeper's turns, they may make a DC 16 Save Check to wake up." Sleep saves happen when the GM clicks Next Turn, alongside Frozen saves. The sleeper's turn is effectively a skip (they can't act), and at the end they get a chance to wake.

### D6: Bad Sleep tick damage fires on each Sleep save check

When a combatant with Bad Sleep makes a Sleep save check, they lose 2 ticks of HP. This happens regardless of whether the save succeeds or fails. Processed as part of the Sleep save check in `next-turn.post.ts`.

### D7: Infatuated and Enraged are lower priority but included

Infatuated and Enraged are less common in practice but follow the same save check pattern. They are included in the P1 endpoint for completeness.

---

## Implementation Plan

### Step 1: Add save check evaluation functions to status-automation.service.ts

**File:** `app/server/services/status-automation.service.ts`

```typescript
import { rollDie } from '~/utils/diceRoller'
import { getSetDamage, applyStageModifier, STAGE_MULTIPLIERS } from '~/utils/damageCalculation'
import type { Combatant, StatusCondition, Pokemon, HumanCharacter } from '~/types'

/** Save check timing categories */
export type SaveCheckTiming = 'turn_start' | 'turn_end'

/** Which conditions need save checks at turn start vs turn end */
export const TURN_START_SAVES: StatusCondition[] = ['Paralyzed', 'Confused', 'Infatuated']
export const TURN_END_SAVES: StatusCondition[] = ['Frozen', 'Asleep', 'Enraged']

/**
 * Evaluate a save check for a specific condition.
 * Returns the roll, DC, pass/fail, and resulting effect.
 */
export function evaluateSaveCheck(
  combatant: Combatant,
  condition: StatusCondition,
  weather: string | null
): SaveCheckResult {
  const roll = rollDie(20)

  switch (condition) {
    case 'Frozen':
      return evaluateFrozenSave(combatant, roll, weather)
    case 'Paralyzed':
      return evaluateParalysisSave(combatant, roll)
    case 'Asleep':
      return evaluateSleepSave(combatant, roll)
    case 'Confused':
      return evaluateConfusedSave(combatant, roll)
    case 'Infatuated':
      return evaluateInfatuatedSave(combatant, roll)
    case 'Enraged':
      return evaluateEnragedSave(combatant, roll)
    default:
      throw new Error(`No save check for condition: ${condition}`)
  }
}

function evaluateFrozenSave(
  combatant: Combatant,
  roll: number,
  weather: string | null
): SaveCheckResult {
  // Base DC 16, lowered to 11 for Fire-types
  const isFireType = combatant.type === 'pokemon' &&
    ((combatant.entity as Pokemon).types || []).includes('Fire')
  let baseDC = isFireType ? 11 : 16

  // Weather modifiers: +4 Sunny bonus, -2 Hail penalty
  // Bonus LOWERS the effective DC (easier to save)
  // Penalty RAISES the effective DC (harder to save)
  let weatherModifier = 0
  if (weather === 'Sunny' || weather === 'Sun') {
    weatherModifier = 4  // +4 bonus to roll = lower effective DC
    baseDC -= 4
  } else if (weather === 'Hail') {
    weatherModifier = -2  // -2 penalty to roll = higher effective DC
    baseDC += 2
  }

  const passed = roll >= baseDC
  const dc = isFireType ? 11 : 16  // Report the base DC for display

  return {
    combatantId: combatant.id,
    condition: 'Frozen',
    roll,
    dc,
    passed,
    weatherModifier: weatherModifier !== 0 ? weatherModifier : undefined,
    typeModifier: isFireType,
    effect: passed
      ? { type: 'cured', condition: 'Frozen' }
      : { type: 'cannot_act', reason: 'Frozen solid — cannot act' }
  }
}

function evaluateParalysisSave(
  combatant: Combatant,
  roll: number
): SaveCheckResult {
  const dc = 5
  const passed = roll >= dc

  return {
    combatantId: combatant.id,
    condition: 'Paralyzed',
    roll,
    dc,
    passed,
    effect: passed
      ? { type: 'can_act' }
      : { type: 'cannot_act', reason: 'Paralyzed — cannot take Standard, Shift, or Swift Actions' }
  }
}

function evaluateSleepSave(
  combatant: Combatant,
  roll: number
): SaveCheckResult {
  const dc = 16
  const passed = roll >= dc

  return {
    combatantId: combatant.id,
    condition: 'Asleep',
    roll,
    dc,
    passed,
    effect: passed
      ? { type: 'cured', condition: 'Asleep' }
      : { type: 'cannot_act', reason: 'Still asleep — cannot take actions' }
  }
}

function evaluateConfusedSave(
  combatant: Combatant,
  roll: number
): SaveCheckResult {
  if (roll >= 16) {
    // Cured
    return {
      combatantId: combatant.id,
      condition: 'Confused',
      roll,
      dc: 0,  // Multi-threshold
      passed: true,
      effect: { type: 'cured', condition: 'Confused' }
    }
  } else if (roll >= 9) {
    // Act normally
    return {
      combatantId: combatant.id,
      condition: 'Confused',
      roll,
      dc: 0,
      passed: true,
      effect: { type: 'can_act' }
    }
  } else {
    // Self-hit: DB 6 Typeless Physical Struggle, resisted 1 step (0.5x)
    const selfHitDamage = calculateConfusedSelfHit(combatant)
    return {
      combatantId: combatant.id,
      condition: 'Confused',
      roll,
      dc: 0,
      passed: false,
      effect: { type: 'self_hit', damage: selfHitDamage, db: 6 }
    }
  }
}

function evaluateInfatuatedSave(
  combatant: Combatant,
  roll: number
): SaveCheckResult {
  if (roll >= 19) {
    return {
      combatantId: combatant.id,
      condition: 'Infatuated',
      roll,
      dc: 0,
      passed: true,
      effect: { type: 'cured', condition: 'Infatuated' }
    }
  } else if (roll >= 11) {
    return {
      combatantId: combatant.id,
      condition: 'Infatuated',
      roll,
      dc: 0,
      passed: true,
      effect: { type: 'can_act' }
    }
  } else {
    return {
      combatantId: combatant.id,
      condition: 'Infatuated',
      roll,
      dc: 0,
      passed: false,
      effect: { type: 'cannot_act', reason: 'Infatuated — cannot target infatuator with Moves or Attacks' }
    }
  }
}

function evaluateEnragedSave(
  combatant: Combatant,
  roll: number
): SaveCheckResult {
  const dc = 15
  const passed = roll >= dc

  return {
    combatantId: combatant.id,
    condition: 'Enraged',
    roll,
    dc,
    passed,
    effect: passed
      ? { type: 'cured', condition: 'Enraged' }
      : { type: 'cannot_act', reason: 'Enraged — must use a damaging Physical/Special Move or Struggle' }
  }
}

/**
 * Calculate confused self-hit damage.
 * PTU: "Typeless Physical Struggle Attack" at DB 6, "resisted 1 Step" (0.5x).
 * Uses the combatant's own Attack stat vs their own Defense stat.
 */
export function calculateConfusedSelfHit(combatant: Combatant): number {
  const entity = combatant.entity
  const stages = entity.stageModifiers || { attack: 0, defense: 0 }

  let attackStat: number
  let defenseStat: number

  if (combatant.type === 'pokemon') {
    const pokemon = entity as Pokemon
    attackStat = pokemon.currentStats.attack
    defenseStat = pokemon.currentStats.defense
  } else {
    const human = entity as HumanCharacter
    attackStat = human.stats.attack
    defenseStat = human.stats.defense
  }

  // Apply combat stages
  const effectiveAttack = applyStageModifier(attackStat, stages.attack || 0)
  const effectiveDefense = applyStageModifier(defenseStat, stages.defense || 0)

  // DB 6 set damage (from chart)
  const setDamage = getSetDamage(6)

  // Formula: setDamage + attack - defense, then x0.5 (resisted 1 step)
  const preMult = Math.max(1, setDamage + effectiveAttack - effectiveDefense)
  const finalDamage = Math.max(1, Math.floor(preMult * 0.5))

  return finalDamage
}

/**
 * Get which save check conditions a combatant has that need checking
 * at the specified timing.
 */
export function getPendingSaveChecks(
  combatant: Combatant,
  timing: SaveCheckTiming
): StatusCondition[] {
  const statuses: StatusCondition[] = combatant.entity.statusConditions || []
  const pool = timing === 'turn_start' ? TURN_START_SAVES : TURN_END_SAVES
  return statuses.filter(s => pool.includes(s))
}
```

### Step 2: Create save-check.post.ts endpoint

**File:** `app/server/api/encounters/[id]/save-check.post.ts`

```typescript
/**
 * POST /api/encounters/:id/save-check
 *
 * Roll a save check for a combatant's status condition.
 * Called by the GM at the start of a combatant's turn (Paralysis, Confused, Infatuated)
 * or triggered automatically at turn end (Frozen, Sleep, Enraged via next-turn.post.ts).
 *
 * For Confused self-hit: applies damage directly.
 * For cured conditions: removes the condition.
 * For turn restrictions: marks the combatant's turnState.
 */
```

**Request body:**
```typescript
{
  combatantId: string
  condition: StatusCondition
}
```

**Processing:**
1. Validate encounter exists and is active
2. Find combatant, verify they have the specified condition
3. Call `evaluateSaveCheck()` with combatant, condition, and encounter weather
4. Apply effects:
   - `cured`: Remove the condition via `updateStatusConditions()`
   - `can_act`: No state change needed
   - `cannot_act`: Update `combatant.turnState` to reflect restrictions
   - `self_hit`: Calculate and apply confused self-hit damage
5. If condition is `Asleep` and combatant has `Bad Sleep`: apply 2 ticks HP loss
6. Save updated combatants to encounter
7. Sync entity changes to DB
8. Return save check result

**Turn state for Paralysis failure:**
```typescript
combatant.turnState = {
  hasActed: false,
  standardActionUsed: true,   // Prevented
  shiftActionUsed: true,      // Prevented
  swiftActionUsed: true,      // Prevented
  canBeCommanded: true,
  isHolding: false
}
```

### Step 3: Integrate end-of-turn saves into next-turn.post.ts

After processing tick damage for the outgoing combatant, process end-of-turn save checks:

```typescript
// Process end-of-turn save checks (Frozen, Sleep, Enraged)
const endOfTurnSaves: SaveCheckResult[] = []

if (currentCombatant && currentCombatant.entity.currentHp > 0) {
  const endSaveConditions = getPendingSaveChecks(currentCombatant, 'turn_end')

  for (const condition of endSaveConditions) {
    const saveResult = evaluateSaveCheck(currentCombatant, condition, weather)
    endOfTurnSaves.push(saveResult)

    if (saveResult.effect.type === 'cured') {
      // Remove the condition
      const removeStatus = saveResult.effect.condition
      updateStatusConditions(currentCombatant, [], [removeStatus])

      // If Sleep is cured, also cure Bad Sleep
      if (removeStatus === 'Asleep') {
        const hasBadSleep = currentCombatant.entity.statusConditions?.includes('Bad Sleep')
        if (hasBadSleep) {
          updateStatusConditions(currentCombatant, [], ['Bad Sleep'])
        }
      }

      // Sync to DB
      await syncEntityToDatabase(currentCombatant, {
        statusConditions: currentCombatant.entity.statusConditions,
        stageModifiers: currentCombatant.entity.stageModifiers
      })
    }

    // Bad Sleep: lose 2 ticks on each Sleep save check (pass or fail)
    if (condition === 'Asleep' &&
        currentCombatant.entity.statusConditions?.includes('Bad Sleep') &&
        currentCombatant.entity.currentHp > 0) {
      const tick = calculateTickDamage(currentCombatant.entity.maxHp)
      const badSleepDamage = tick * 2
      // Apply damage...
      // Add to tickResults for logging
    }
  }
}
```

### Step 4: Add save check action to encounter store

**File:** `app/stores/encounter.ts`

```typescript
async rollSaveCheck(combatantId: string, condition: StatusCondition) {
  if (!this.encounter) return

  try {
    const response = await $fetch<{
      data: Encounter
      saveCheck: SaveCheckResult
    }>(`/api/encounters/${this.encounter.id}/save-check`, {
      method: 'POST',
      body: { combatantId, condition }
    })
    this.encounter = response.data
    return response.saveCheck
  } catch (e: any) {
    this.error = e.message || 'Failed to roll save check'
    throw e
  }
}
```

### Step 5: Create SaveCheckBanner component

**File:** `app/components/encounter/SaveCheckBanner.vue`

A banner displayed at the top of the encounter panel when the current combatant has pending save checks.

**Behavior:**
- Shows which save checks are required (e.g., "Paralysis Save Required")
- "Roll Save" button triggers `rollSaveCheck()`
- After rolling, shows the result (roll, DC, pass/fail)
- For Confused: shows the self-hit damage if failed (1-8)
- For Paralysis fail: disables action buttons in the UI
- For Frozen: informs GM the combatant cannot act
- For multiple conditions: processes them in order

**Display logic:**
```
IF currentCombatant has Paralyzed/Confused/Infatuated:
  Show "Turn Start Save Check" banner
  GM must roll before taking actions

IF currentCombatant has Frozen:
  Show "Frozen — Cannot Act" banner
  Save check happens automatically at turn end (via next-turn)

IF currentCombatant has Asleep:
  Show "Asleep — Cannot Act" banner
  Save check happens automatically at turn end (via next-turn)
```

### Step 6: Create SaveCheckResult component

**File:** `app/components/encounter/SaveCheckResult.vue`

Displays the result of a save check in a dismissible notification.

**Props:** `saveCheck: SaveCheckResult`

**Display:**
- Roll value with d20 icon
- DC or threshold range
- Pass/fail badge
- Effect description
- Condition badge (color-coded)

---

## Edge Cases

### E1: Sleeping combatant is also Confused
PTU p.247: "Sleeping targets cannot make Save Checks to be cured of Rage, Infatuation, or Confusion, but they also cannot hurt themselves in Confusion."

If both Sleep and Confusion are active, skip the Confusion save check. Sleep takes priority. The Confused check only fires if the combatant is awake.

### E2: Multiple save check conditions
A combatant could have both Paralysis and Confusion. Process them in order:
1. Paralysis check first (if fails, skip Confusion — can't act anyway)
2. Confusion check (only if Paralysis passed)

### E3: Frozen + Burn interaction
A Burned target that gets Frozen still takes Burn tick damage (they were prevented from taking a Standard Action). The Frozen save check at turn end can free them for next turn.

### E4: Confused self-hit can cause injuries and faint
The self-hit is real damage processed through `calculateDamage()`. It can trigger injuries, HP marker crossings, and fainting. If the combatant faints from confusion self-hit, their conditions are cleared.

### E5: Weather changes mid-round affect Frozen saves
The save check reads the encounter's current weather at the time it fires. If weather changed earlier in the round, the new weather applies.

### E6: Save check during League Battle phases
- **Declaration phase:** No save checks (not the trainer's real turn)
- **Resolution phase:** Trainer save checks fire here (Paralysis, Confusion for trainers)
- **Pokemon phase:** Standard behavior

### E7: Enraged restriction is informational
The Enraged save check result tells the GM the combatant "must use a damaging Physical/Special Move or Struggle." The server does not enforce this — the GM ensures the correct move is used. Enforcement is too complex for automation (requires knowing all the combatant's moves).

---

## Acceptance Criteria

- [ ] Paralysis save: DC 5 at turn start, fail prevents Standard/Shift/Swift actions
- [ ] Confused save: 1-8 self-hit (DB 6 Physical Struggle, 0.5x), 9-15 act normally, 16+ cured
- [ ] Confused self-hit applies real damage (injuries, faint possible)
- [ ] Frozen save: DC 16 (11 for Fire-type) at turn end, pass = cured
- [ ] Frozen weather modifiers: +4 Sunny, -2 Hail
- [ ] Sleep save: DC 16 at turn end, pass = cured
- [ ] Bad Sleep: 2 ticks HP loss on each Sleep save check (pass or fail)
- [ ] Bad Sleep auto-cured when Sleep is cured
- [ ] Infatuated save: 1-10 restricted, 11-18 ok, 19+ cured
- [ ] Enraged save: DC 15 at turn end, pass = cured
- [ ] Sleep/Confusion priority: Sleep suppresses Confusion check
- [ ] Paralysis/Confusion priority: Paralysis fail suppresses Confusion check
- [ ] Save check results logged to moveLog
- [ ] Save check results broadcast via WebSocket
- [ ] SaveCheckBanner shows for current combatant with pending checks
- [ ] SaveCheckResult displays roll, DC, outcome
- [ ] No save checks during League Battle declaration phase
