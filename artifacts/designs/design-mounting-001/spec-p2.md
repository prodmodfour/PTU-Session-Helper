# P2 Specification: Rider Trainer Class Feature Implementations

## Overview

The Rider trainer class (PTU pp.102-103) has 7 features that build on the core mounting system. P2 implements mechanical support for each feature, ranging from passive effects (auto-applied when conditions are met) to active abilities (triggered by the GM).

All Rider features are gated behind the trainer having the "Rider" class in their `trainerClasses` array. Feature checks use the `features` array on the `HumanCharacter` entity.

### Common Pattern: Feature Detection

```typescript
// In app/utils/mountingRules.ts (or a new riderFeatures.ts):

export function hasRiderClass(combatant: Combatant): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  return (human.trainerClasses ?? []).includes('Rider')
}

export function hasRiderFeature(combatant: Combatant, featureName: string): boolean {
  if (combatant.type !== 'human') return false
  const human = combatant.entity as HumanCharacter
  return (human.features ?? []).some(
    f => f.toLowerCase() === featureName.toLowerCase()
  )
}
```

---

## J. Rider Class Feature: Rider (Agility Training Doubling)

### PTU Rules (p.103)

> **Rider** [Class] [+Speed]
> Prerequisites: Mounted Prowess, Agility Training, Novice Acrobatics or Athletics
> Static
> Effect: While you are Mounted on a Pokemon under the effects of Agility Training, the bonuses from Agility Training are doubled.

### Current State

Agility Training grants: +1 Movement Capabilities, +4 Initiative. The app does not currently track Training effects on Pokemon (they are applied manually by the GM). The Rider feature's doubling would need to be tracked as an active modifier.

### Design

Since Training effects are not yet automated in the app, the Rider class doubling is implemented as a **reference indicator** and a **manual modifier helper**:

1. **Detection:** When a mounted rider has the Rider class feature AND the mount has Agility Training active (tracked as a flag), the system displays a reminder that bonuses are doubled.

2. **Mount Controls panel addition:**
   ```
   [If rider has Rider class AND mounted]
   > Agility Training Active: [Toggle]
   > When ON: "Agility Training bonuses are DOUBLED (Rider class)"
   >   +2 to Movement Capabilities (instead of +1)
   >   +8 to Initiative (instead of +4)
   ```

3. **Movement speed modifier:** When Agility Training is active on a mounted Rider's mount, the mount's movement speed gets +2 instead of +1.

   ```typescript
   // In getSpeed / getMovementSpeedForMount:
   if (combatant.mountState?.isMounted) {
     const mount = findCombatant(combatant.mountState.partnerId)
     const rider = combatant

     let agilityBonus = 0
     if (mount?.tempConditions?.includes('Agile')) {
       agilityBonus = 1  // Base Agility Training
       if (hasRiderFeature(rider, 'Rider')) {
         agilityBonus = 2  // Doubled by Rider class
       }
     }

     const baseSpeed = getMountSpeed(mount) + agilityBonus
     return baseSpeed
   }
   ```

4. **Initiative modifier:** When Agility Training is active, the initiative bonus for the mount is +4 (or +8 with Rider doubling). This integrates with the initiative recalculation system (decree-006).

**Tracking Agility Training state:** Add `'Agile'` as a recognized `tempCondition` on combatants. The GM toggles this via the Training/Orders system (which currently doesn't exist in the app -- this becomes a reference display until Training is automated).

**Deferred:** Full automation of Training effects is a separate feature. The Rider doubling is designed to plug into that system when it exists.

---

## K. Ramming Speed (Run Up Ability)

### PTU Rules (p.103)

> **Ramming Speed** [+Speed]
> Prerequisites: Rider
> At-Will -- Extended Action
> Target: Your Pokemon with at least 2 Tutor Points
> Effect: The target loses 2 Tutor Points and gains the Run Up Ability.

### Design

Ramming Speed is an out-of-combat Extended Action that permanently modifies a Pokemon. It consumes 2 Tutor Points and adds the Run Up ability.

**Run Up Ability (PTU p.103 context):**
Run Up is referenced by Conqueror's March and Overrun. The ability itself needs to be defined:

> **Run Up**: Static. When this Pokemon Shifts, attacks made on the same turn with Dash or Pass range Moves gain a +1 bonus to their Damage Rolls for every 3 meters the Pokemon moved this turn.

**Implementation:**

1. **No combat automation needed for Ramming Speed itself** -- it's an Extended Action (out of combat, modifies the Pokemon's ability list).

2. **Reference tracking:** The MountControls panel can show a "Ramming Speed" section if the rider has this feature, listing eligible Pokemon (those with 2+ Tutor Points that don't already have Run Up).

3. **Run Up ability effect** (combat-time): When a Pokemon with Run Up makes a Dash or Pass range move after Shifting, a damage bonus is applied. This requires:
   - Tracking distance moved this turn on the combatant
   - Checking if the move has Dash or Pass range
   - Adding floor(distanceMoved / 3) to the damage roll

   ```typescript
   // Future: in damage calculation
   if (attackerHasAbility(attacker, 'Run Up') && isDashOrPassMove(move)) {
     const distanceMoved = attacker.turnState.distanceMovedThisTurn ?? 0
     const runUpBonus = Math.floor(distanceMoved / 3)
     damageBonus += runUpBonus
   }
   ```

**Scope:** The Ramming Speed feature itself is a simple Tutor Point trade. The Run Up ability effect requires distance tracking per turn, which is a new field on `TurnState`:

```typescript
// Extended TurnState:
export interface TurnState {
  // ... existing fields ...

  /** Distance moved this turn in meters (for Run Up, Overrun, etc.) */
  distanceMovedThisTurn: number
}
```

This field is reset to 0 at turn start and incremented by the movement handler each time the combatant moves.

---

## L. Conqueror's March (Pass-Range Moves)

### PTU Rules (p.103)

> **Conqueror's March** [Orders][+Speed]
> Prerequisites: Ramming Speed, Adept Acrobatics or Athletics
> At-Will -- Standard Action
> Target: Your Pokemon with Run Up
> Effect: This round, if being used as a Mount, the target may use Dash, Burst, Blast, Cone, or Line range Moves with a range of Pass instead of their usual range.

### Design

Conqueror's March is an Order (Standard Action) that modifies the mount's move ranges for the current round. When active:
- Dash, Burst, Blast, Cone, and Line range moves become Pass range
- "Pass" range means the move hits all targets along the path of movement during a Shift

**Implementation:**

1. **Track Conqueror's March as an active flag** on the mount combatant for the current round:

   ```typescript
   // Add to tempConditions or a new field:
   combatant.tempConditions = [...(combatant.tempConditions ?? []), 'ConquerorsMarsh']
   ```

2. **Move range override:** When the mount attacks with a qualifying move AND has `ConquerorsMarsh` active:
   - The move's effective range becomes "Pass" (hits targets along the movement path)
   - The GM selects targets from the path the mount traveled during its Shift

3. **UI:** The MountControls panel shows "Conqueror's March" as an activatable Order when:
   - The rider has the feature
   - The mount has Run Up
   - The mount is currently being ridden
   - The rider's Standard Action is available

4. **Clearing:** `ConquerorsMarsh` is cleared at the end of the round (tempConditions are round-scoped).

**Pass Range Mechanics (deferred detail):**
Pass range move targeting requires knowing the mount's movement path for this turn. The movement system already computes A* paths. The path cells become the targeting area for Pass moves. Full implementation of Pass range targeting is complex and may be deferred to a VTT targeting enhancement feature. For P2, the flag is tracked and displayed, but the GM manually selects targets.

---

## M. Ride as One (Shared Speed Evasion + Initiative Sharing)

### PTU Rules (p.103)

> **Ride as One** [+Speed]
> Prerequisites: Rider
> Static
> Effect: While you are Mounted, you and your Mount each use the highest of each other's Speed Evasion. If both you and your Mount have the same Speed Evasion, you instead each receive a +1 bonus to Speed Evasion. Whenever one of you receives Initiative, either of you may take your turn. When the next person would receive initiative, the person that did not take their turn then takes it.

### Design: Speed Evasion Sharing

When a rider with "Ride as One" is mounted:

1. **Speed Evasion override:** Both rider and mount use the higher of their two Speed Evasions.

   ```typescript
   // In evasion recalculation for mounted pairs:
   export function applyRideAsOneEvasion(
     rider: Combatant,
     mount: Combatant
   ): { riderSpeedEvasion: number; mountSpeedEvasion: number } {
     if (!hasRiderFeature(rider, 'Ride as One')) {
       return {
         riderSpeedEvasion: rider.speedEvasion,
         mountSpeedEvasion: mount.speedEvasion
       }
     }

     const riderSE = rider.speedEvasion
     const mountSE = mount.speedEvasion

     if (riderSE === mountSE) {
       // Same: +1 bonus to both
       return {
         riderSpeedEvasion: riderSE + 1,
         mountSpeedEvasion: mountSE + 1
       }
     }

     // Different: both use the higher
     const higher = Math.max(riderSE, mountSE)
     return {
       riderSpeedEvasion: higher,
       mountSpeedEvasion: higher
     }
   }
   ```

2. **When to apply:** Speed Evasion is recalculated:
   - On mount (when the pair is formed)
   - On dismount (revert to individual values)
   - On any evasion-modifying effect

3. **Store the original values** so they can be restored on dismount:

   ```typescript
   // In MountState (extended):
   export interface MountState {
     // ... existing fields ...
     /** Original Speed Evasion before Ride as One modification */
     originalSpeedEvasion?: number
   }
   ```

### Design: Initiative Sharing

"Whenever one of you receives Initiative, either of you may take your turn."

This is the most complex part of Ride as One. When the initiative order reaches either the rider or the mount, the GM can choose which one acts:

1. **Turn system modification:** When the current turn is a Ride as One pair member, the GM gets a choice:
   - "Take turn as [Rider Name]"
   - "Take turn as [Mount Name]"

2. **Tracking who acted:** The partner who didn't act takes the NEXT initiative slot in place of the one that did:

   PTU: "When the next person would receive initiative, the person that did not take their turn then takes it."

   This means if the mount acts when the rider's initiative comes up, the rider acts when the mount's initiative comes up (and vice versa).

3. **Implementation approach:**

   ```typescript
   // Track initiative swap state on the mount pair:
   export interface MountState {
     // ... existing fields ...
     /** Ride as One: which combatant acts at the next initiative slot */
     rideAsOneSwapped?: boolean
   }
   ```

   When the first pair member's initiative arrives:
   - If `rideAsOneSwapped` is false/undefined: both are eligible, GM chooses
   - After GM chooses, set `rideAsOneSwapped = true` and record who acted
   - When the second pair member's initiative arrives: the other MUST act (no choice)
   - Reset `rideAsOneSwapped` at round end

4. **UI:** The turn tracker shows a choice dialog when a Ride as One pair's turn comes up.

---

## N. Lean In (Burst/Blast/Cone/Line Resistance)

### PTU Rules (p.103)

> **Lean In** [+Speed]
> Prerequisites: Ride as One
> Scene x2 -- Free Action
> Trigger: You and your Mount both take Damage from a Burst, Blast, Cone, or Line
> Effect: Both you and your Mount Resist the attack one step further.

### Design

Lean In is a reactive Free Action triggered when both rider and mount are hit by the same area attack.

1. **Detection:** When damage is applied to BOTH members of a mounted pair from the same AoE attack:
   - Check if the rider has "Lean In" feature
   - Check if Lean In has remaining uses this scene (max 2)

2. **Effect:** "Resist one step further" means the damage resistance is increased by one level. In PTU, the resistance steps are: Normal -> Resisted -> Double Resisted -> Triple Resisted (etc.). Each step halves the damage.

3. **Implementation:**

   ```typescript
   // In damage calculation pipeline:
   // When processing an AoE move that hits both rider and mount:
   if (isAoEMove(move) && isMountedPair(targetIds, combatants)) {
     const rider = getRider(targetIds, combatants)
     if (hasRiderFeature(rider, 'Lean In') && getLeanInUsesRemaining(rider) > 0) {
       // Both rider and mount resist one step further
       // This modifies the effectiveness multiplier
       riderDamageMultiplier = applyResistStep(riderDamageMultiplier)
       mountDamageMultiplier = applyResistStep(mountDamageMultiplier)
       decrementLeanInUses(rider)
     }
   }
   ```

4. **Usage tracking:** Lean In is Scene x2 frequency. Track usage in the combatant's move usage system (same pattern as move frequency tracking). Add to a `featureUsage` record on the combatant:

   ```typescript
   // In Combatant or a new field:
   featureUsage?: Record<string, { usedThisScene: number; maxPerScene: number }>
   ```

5. **UI:** The MountControls panel shows "Lean In" with remaining uses. When an AoE hits both members, a prompt appears asking if the rider wants to activate Lean In.

---

## O. Cavalier's Reprisal (Counter-Attack)

### PTU Rules (p.103)

> **Cavalier's Reprisal** [+Speed]
> Prerequisites: Ride as One, Expert Acrobatics or Athletics
> 1 AP -- Free Action
> Trigger: An adjacent foe hits your Mount with an attack
> Effect: You may make a Struggle Attack against the triggering foe.

### Design

Cavalier's Reprisal is a reactive Free Action that costs 1 AP. It triggers when an adjacent enemy hits the mount.

1. **Detection:** When the mount takes a hit from an adjacent enemy:
   - Check if the rider has "Cavalier's Reprisal"
   - Check if the attacker is adjacent to the mounted pair
   - Check if the rider has 1+ AP remaining

2. **Effect:** The rider makes a Struggle Attack (Physical, DB 1, Melee range) against the triggering foe. This is a standard attack roll that the GM resolves manually.

3. **Implementation:**

   ```typescript
   // In damage application response (when mount is hit):
   if (damagedCombatant.mountState && !damagedCombatant.mountState.isMounted) {
     const riderId = damagedCombatant.mountState.partnerId
     const rider = combatants.find(c => c.id === riderId)

     if (rider && hasRiderFeature(rider, "Cavalier's Reprisal")) {
       const riderEntity = rider.entity as HumanCharacter
       const hasAp = riderEntity.currentAp >= 1

       // Check adjacency of attacker to the mounted pair
       const isAttackerAdjacent = isAdjacent(attacker.position, damagedCombatant.position, damagedCombatant.tokenSize)

       if (hasAp && isAttackerAdjacent) {
         // Include reprisal opportunity in response
         reprisalOpportunity = {
           riderId,
           targetId: attackerId,
           apCost: 1,
           attackType: 'Struggle Attack (DB 1, Physical, Melee)'
         }
       }
     }
   }
   ```

4. **UI:** When a reprisal opportunity is included in the damage response, the MountControls panel shows a "Cavalier's Reprisal" button. Clicking it deducts 1 AP from the rider and prompts the GM to resolve the Struggle Attack.

5. **AP tracking:** The rider's `currentAp` is decremented. This uses the existing AP system on `HumanCharacter`.

---

## P. Overrun (Speed Stat to Damage)

### PTU Rules (p.103)

> **Overrun** [+Speed]
> Prerequisites: Conqueror's March, Expert Acrobatics or Athletics
> Scene x2 -- Free Action
> Trigger: Your Mount with Run Up makes a Damage Roll for a Dash or Pass Move
> Effect: Your Pokemon adds their Speed Stat in addition to their normal attacking Stat to their Damage Roll. The target gains Damage Reduction against this attack equal to their own Speed Stat.

### Design

Overrun modifies the damage formula for qualifying attacks.

1. **Trigger:** The mount has Run Up, is making a Dash or Pass range move, and the rider has "Overrun" with uses remaining.

2. **Effect on damage calculation:**
   - Add mount's Speed stat to the damage roll (in addition to the normal attacking stat)
   - Target gains DR equal to their own Speed stat for this attack only

3. **Implementation:**

   ```typescript
   // In damage calculation:
   if (attackerIsMount && hasRunUp(attacker) && isDashOrPassMove(move)) {
     const rider = getRiderFor(attacker, combatants)
     if (rider && hasRiderFeature(rider, 'Overrun') && getOverrunUsesRemaining(rider) > 0) {
       // Add mount's Speed to damage
       const mountSpeed = (attacker.entity as Pokemon).currentStats.speed
       const speedCS = attacker.entity.stageModifiers?.speed ?? 0
       const effectiveSpeed = applyStageModifier(mountSpeed, speedCS)
       damageBonus += effectiveSpeed

       // Target gets DR equal to their Speed
       const targetSpeed = target.entity.currentStats?.speed ?? target.entity.stats?.speed ?? 0
       const targetSpeedCS = target.entity.stageModifiers?.speed ?? 0
       const targetEffectiveSpeed = applyStageModifier(targetSpeed, targetSpeedCS)
       targetDR += targetEffectiveSpeed

       decrementOverrunUses(rider)
     }
   }
   ```

4. **Usage tracking:** Scene x2 frequency, tracked in `featureUsage` (same as Lean In).

5. **UI:** When a qualifying move is used by a ridden mount with Run Up, the damage calculation panel shows an "Activate Overrun" option with:
   - Bonus damage: +[mount Speed stat]
   - Target DR: +[target Speed stat]
   - Remaining uses: [X/2]

---

## Summary of File Changes (P2)

| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/mountingRules.ts` | Add Rider class feature detection, feature checks |
| **NEW** | `app/utils/riderFeatures.ts` (optional) | Rider-specific feature logic if mountingRules grows too large |
| **EDIT** | `app/types/combat.ts` | Add `distanceMovedThisTurn` to TurnState, `featureUsage` to Combatant, extend MountState |
| **EDIT** | `app/composables/useGridMovement.ts` | Distance tracking per turn for Run Up/Overrun |
| **EDIT** | `app/server/services/mounting.service.ts` | Ride as One evasion sharing, initiative swap logic |
| **EDIT** | `app/server/api/encounters/[id]/next-turn.post.ts` | Initiative swap for Ride as One, distance reset |
| **EDIT** | `app/utils/damageCalculation.ts` | Overrun damage modifier, Lean In resistance step |
| **EDIT** | `app/components/encounter/MountControls.vue` | Feature activation buttons, usage counters, Agility Training toggle |
| **EDIT** | `app/stores/encounter.ts` | Feature activation actions, usage tracking |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` (or equivalent) | Cavalier's Reprisal trigger, Lean In trigger |
| **EDIT** | `app/constants/trainerClasses.ts` | Add Rider feature names as constants for reliable matching |

---

## Implementation Notes

### Feature Automation Level

Not all Rider features need full automation at P2. The priority is:

| Feature | Automation Level | Rationale |
|---------|-----------------|-----------|
| Rider (Agility Training doubling) | **Reference + modifier** | Training effects are manual; provide a toggle and display |
| Ramming Speed | **Reference only** | Extended Action, out of combat |
| Conqueror's March | **Flag tracking** | Range override requires targeting system changes |
| Ride as One (Evasion) | **Full automation** | Evasion values are already computed, easy to modify |
| Ride as One (Initiative) | **UI choice + tracking** | Requires initiative system awareness |
| Lean In | **Trigger detection + prompt** | GM activates, system tracks usage |
| Cavalier's Reprisal | **Trigger detection + prompt** | GM resolves attack, system tracks AP |
| Overrun | **Damage modifier + prompt** | Plugs into existing damage calculation |

### Dependency Chain

```
Rider class base -> Mounted Prowess edge -> Mount system (P0)
                                         -> Dismount checks (P1)

Rider feature: Rider -> Agility Training (separate feature, not implemented)
Ramming Speed -> Run Up ability -> Conqueror's March -> Overrun
Rider -> Ride as One -> Lean In
                     -> Cavalier's Reprisal
```

### Distance Tracking Requirement

Multiple Rider features (Run Up damage bonus, Overrun) require knowing how far a combatant moved this turn. The `distanceMovedThisTurn` field on TurnState is a prerequisite for both. It is reset at turn start and incremented by the movement handler.

This field is also useful beyond Rider features (future: calculating momentum-based effects, tracking whether a Pokemon "Shifted" vs "didn't move").
