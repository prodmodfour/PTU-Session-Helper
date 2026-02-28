# P2 Specification

## P2: VTT Shared Movement, No Guard Suppression, Forced Blade Forme, Weaponize, Soulstealer

### J. VTT Shared Movement

**PTU p.306:** "If the Living Weapon is also being used as an active Pokemon, the Wielder and the Living Weapon use the Wielder's Movement Speed to shift during each of their turns, and the total amount Shifted during the round cannot exceed the Wielder's Movement Speed."

This is the most complex mechanic in the Living Weapon system. It involves:
1. **Shared position**: wielder and weapon occupy the same grid cell(s).
2. **Shared speed pool**: both use the wielder's movement speed, pooled per round.
3. **Linked movement**: when either combatant moves, the other moves with them.

#### Shared Position Model

When engaged, the Living Weapon Pokemon moves to the wielder's position on the grid. Both tokens occupy the same cell. The weapon's `position` field is synced to the wielder's position.

```typescript
/**
 * Sync a wielded Living Weapon's position to its wielder's position.
 * Called after engage, and after any movement by the wielder.
 */
export function syncWeaponPosition(
  encounter: Encounter,
  wielderId: string
): Encounter {
  const relationship = encounter.wieldRelationships.find(
    r => r.wielderId === wielderId
  )
  if (!relationship) return encounter

  const wielder = encounter.combatants.find(c => c.id === wielderId)
  if (!wielder?.position) return encounter

  const updatedCombatants = encounter.combatants.map(c => {
    if (c.id === relationship.weaponId) {
      return { ...c, position: { ...wielder.position! } }
    }
    return c
  })

  return { ...encounter, combatants: updatedCombatants }
}
```

#### Shared Speed Pool

The wielder's Movement Speed is the shared pool for the round. Both the wielder's Shift action and the weapon's Shift action draw from this pool.

**Tracking:** A new per-round field on the `WieldRelationship`:

```typescript
export interface WieldRelationship {
  // ... existing fields ...

  /** Movement speed used this round (shared pool).
   *  Reset to 0 at the start of each new round.
   *  Total cannot exceed wielder's Movement Speed. */
  movementUsedThisRound: number;
}
```

**Movement Speed Source:** The wielder is a human combatant. Human overland speed defaults to 5 (PTU default trainer speed). If the wielder has equipment or features modifying speed, those apply.

#### Integration with `useGridMovement`

The `useGridMovement` composable handles all VTT movement. It needs to be extended for shared movement:

1. **Before moving a wielded pair**: check remaining shared movement pool.
2. **After a wielder moves**: update the weapon's position to match.
3. **After a weapon moves**: update the wielder's position to match.
4. **Movement cost**: deducted from the shared pool, not from individual combatant movement.

```typescript
// In useGridMovement.ts:

/**
 * Get the effective movement speed for a combatant,
 * accounting for Living Weapon shared movement.
 *
 * For wielded pairs, returns the wielder's speed minus
 * movement already used this round by either party.
 */
export function getEffectiveMovementSpeed(
  encounter: Encounter,
  combatant: Combatant
): number {
  // Check if this combatant is part of a wield relationship
  const relationship = encounter.wieldRelationships.find(
    r => r.wielderId === combatant.id || r.weaponId === combatant.id
  )

  if (!relationship) {
    // Not wielded -- use normal movement speed
    return getOverlandSpeed(combatant)
  }

  // Wielded pair: use wielder's speed, minus shared pool usage
  const wielder = encounter.combatants.find(c => c.id === relationship.wielderId)
  if (!wielder) return getOverlandSpeed(combatant)

  const wielderSpeed = getOverlandSpeed(wielder)
  const remaining = wielderSpeed - (relationship.movementUsedThisRound ?? 0)
  return Math.max(0, remaining)
}
```

#### Movement Sync on Shift

When either the wielder or the weapon shifts:

```typescript
/**
 * Handle linked movement for a wielded Living Weapon pair.
 * Both combatants move together, and the shared pool is updated.
 *
 * @param encounter - Current encounter state
 * @param movingCombatantId - The combatant that initiated the shift
 * @param newPosition - The destination grid position
 * @param movementCost - How many squares of movement were used
 * @returns Updated encounter with both positions synced and pool updated
 */
export function handleLinkedMovement(
  encounter: Encounter,
  movingCombatantId: string,
  newPosition: GridPosition,
  movementCost: number
): Encounter {
  const relationship = encounter.wieldRelationships.find(
    r => r.wielderId === movingCombatantId || r.weaponId === movingCombatantId
  )
  if (!relationship) return encounter

  const partnerId = relationship.wielderId === movingCombatantId
    ? relationship.weaponId
    : relationship.wielderId

  // Update both positions
  const updatedCombatants = encounter.combatants.map(c => {
    if (c.id === movingCombatantId || c.id === partnerId) {
      return { ...c, position: { ...newPosition } }
    }
    return c
  })

  // Update shared movement pool
  const updatedRelationships = encounter.wieldRelationships.map(r => {
    if (r.wielderId === relationship.wielderId) {
      return {
        ...r,
        movementUsedThisRound: (r.movementUsedThisRound ?? 0) + movementCost,
      }
    }
    return r
  })

  return {
    ...encounter,
    combatants: updatedCombatants,
    wieldRelationships: updatedRelationships,
  }
}
```

#### Round Reset

At the start of each new round, reset `movementUsedThisRound` to 0 for all wield relationships:

```typescript
/**
 * Reset shared movement pools for all wield relationships at round start.
 */
export function resetWieldMovementPools(encounter: Encounter): Encounter {
  const updatedRelationships = encounter.wieldRelationships.map(r => ({
    ...r,
    movementUsedThisRound: 0,
  }))
  return { ...encounter, wieldRelationships: updatedRelationships }
}
```

This must be called from the round advancement logic in `encounter.service.ts` / `next-turn.post.ts`.

#### Shared Infrastructure with Mounting (feature-004)

The shared movement pattern is nearly identical for mounted combat (feature-004). Both involve:
- Two combatants sharing a position
- Movement pooled from the "carrier" (wielder / mount)
- Linked movement updates
- Round-based pool reset

The `LinkedPair` concept, `handleLinkedMovement()`, and `getEffectiveMovementSpeed()` are designed to be reusable. When feature-004 is implemented, the `WieldRelationship` and a future `MountRelationship` can both be served by a generalized `LinkedMovementPair` interface:

```typescript
/** Generalized linked pair for shared movement (Living Weapon + Mounting) */
export interface LinkedMovementPair {
  /** Combatant ID of the "carrier" (wielder or mount) -- provides speed */
  carrierId: string;
  /** Combatant ID of the "passenger" (weapon or rider) */
  passengerId: string;
  /** Movement used this round from the shared pool */
  movementUsedThisRound: number;
}
```

This generalization is noted here for future reference but NOT implemented in P2 of this design. The Living Weapon implementation uses `WieldRelationship` directly. Refactoring to the generalized interface should happen when feature-004 is implemented.

### K. No Guard Ability Suppression

**PTU p.306:** "While Wielded, a Living Weapon cannot benefit from its No Guard Ability."

No Guard (PTU p.2240): "The user's moves cannot miss and the user can be targeted by moves that normally would miss. The user's attacks have their Accuracy Checks reduced by a flat -3."

#### Implementation

When computing accuracy for moves made by a wielded Living Weapon, suppress the No Guard effects:

```typescript
/**
 * Check if a Pokemon's No Guard ability is currently active.
 * No Guard is suppressed while the Pokemon is wielded as a Living Weapon.
 *
 * PTU p.306: "While Wielded, a Living Weapon cannot benefit from
 * its No Guard Ability."
 */
export function isNoGuardActive(
  combatant: Combatant,
  encounter: Encounter
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasNoGuard = pokemon.abilities.some(
    a => a.name === 'No Guard'
  )
  if (!hasNoGuard) return false

  // Suppressed while wielded
  const isCurrentlyWielded = encounter.wieldRelationships.some(
    r => r.weaponId === combatant.id
  )
  return !isCurrentlyWielded
}
```

**Integration points:**
- Accuracy calculation (currently in `useMoveCalculation.ts` and `calculate-damage.post.ts`): check `isNoGuardActive()` before applying the -3 AC reduction and auto-hit effects.
- Move targeting: No Guard makes the Pokemon targetable by normally-missing moves. This is suppressed while wielded.

Note: Honedge and Doublade have No Guard as their Basic Ability 1. This means while wielded, they lose their primary ability's effects. Aegislash has Stance Change as Basic Ability 1, so this suppression only affects Honedge/Doublade.

### L. Aegislash Forced Blade Forme

**PTU p.306:** "an Aegislash is automatically in Blade forme [while wielded]."

**Stance Change (PTU p.2481-2491):** Aegislash has Shield Stance (default) and Sword Stance (Blade forme). In Sword Stance, Attack swaps with Defense and Special Attack swaps with Special Defense.

#### Implementation

When Aegislash is engaged as a Living Weapon:
1. Force Aegislash into Blade forme (Sword Stance).
2. Swap Attack/Defense and SpAtk/SpDef in `currentStats`.
3. The Stance Change ability is suppressed (cannot switch back to Shield while wielded).

When Aegislash is disengaged:
1. Revert to the forme Aegislash was in before being wielded.
2. If Aegislash should be in Shield forme (default), swap stats back.

#### Tracking

Add a field to the `WieldRelationship` to track whether the Aegislash was already in Blade forme when engaged:

```typescript
export interface WieldRelationship {
  // ... existing fields ...

  /** For Aegislash: was the Pokemon already in Blade forme when engaged?
   *  If false, disengage will revert to Shield forme.
   *  Undefined for non-Aegislash. */
  wasInBladeFormeOnEngage?: boolean;
}
```

#### Stat Swap Function

```typescript
/**
 * Swap Aegislash between Shield Stance and Sword Stance (Blade forme).
 * Swaps Attack<->Defense and SpAtk<->SpDef in currentStats.
 *
 * Returns a new Pokemon entity (immutable).
 */
export function swapAegislashStance(pokemon: Pokemon): Pokemon {
  const stats = pokemon.currentStats
  return {
    ...pokemon,
    currentStats: {
      ...stats,
      attack: stats.defense,
      defense: stats.attack,
      specialAttack: stats.specialDefense,
      specialDefense: stats.specialAttack,
    },
  }
}
```

#### Engage Flow for Aegislash

```typescript
// During engage, if the weapon is Aegislash:
if (weaponSpecies === 'Aegislash') {
  const pokemon = weaponCombatant.entity as Pokemon
  const isAlreadyBlade = pokemon.currentStats.attack > pokemon.currentStats.defense
  // Note: heuristic -- Blade forme has higher Attack than Defense.
  // More robust: track forme state explicitly on combatant.

  if (!isAlreadyBlade) {
    // Force into Blade forme
    const bladePokemon = swapAegislashStance(pokemon)
    weaponCombatant = { ...weaponCombatant, entity: bladePokemon }
  }

  relationship.wasInBladeFormeOnEngage = isAlreadyBlade
}
```

#### Stance Change Suppression

While wielded, Aegislash cannot use King's Shield, Protect, or other moves that trigger Shield Stance. The Stance Change ability is effectively locked in Blade forme.

This is enforced by:
1. Checking `isWielded(combatant)` before allowing Stance Change triggers.
2. If wielded, skip the Stance Change stat swap logic.

### M. Weaponize Ability: Intercept for Wielder

**Weaponize (PTU p.2874-2878):** "While being wielded as a Living Weapon and being actively Commanded as a Pokemon, the user may Intercept for its Wielder as a Free Action."

Weaponize is an Advanced Ability (Adv Ability 3) available to Honedge, Doublade, and Aegislash.

#### Implementation

Intercept is an existing PTU maneuver that redirects an attack targeting one combatant to another (the interceptor). Weaponize makes this a Free Action instead of the normal Standard Action, and removes the adjacency requirement (wielder and weapon are always co-located).

```typescript
/**
 * Check if a Pokemon can use Weaponize to intercept for its wielder.
 *
 * Requirements:
 * 1. The Pokemon has the Weaponize ability
 * 2. The Pokemon is currently wielded as a Living Weapon
 * 3. The Pokemon is NOT fainted (must be "actively commanded")
 * 4. The Pokemon has not already intercepted this round (if per-round limit applies)
 */
export function canUseWeaponize(
  encounter: Encounter,
  combatant: Combatant
): boolean {
  if (combatant.type !== 'pokemon') return false

  const pokemon = combatant.entity as Pokemon
  const hasWeaponize = pokemon.abilities.some(a => a.name === 'Weaponize')
  if (!hasWeaponize) return false

  // Must be wielded
  const relationship = encounter.wieldRelationships.find(
    r => r.weaponId === combatant.id
  )
  if (!relationship) return false

  // Must not be fainted (PTU: "actively Commanded")
  if (relationship.isFainted) return false

  return true
}
```

**UI Integration:** When an attack targets the wielder, the GM should see a prompt or indicator that the Living Weapon can intercept as a Free Action (no action cost). The intercept logic itself reuses the existing intercept maneuver implementation, but:
- Action cost: Free (not Standard)
- Adjacency: auto-satisfied (same position)
- The weapon takes the hit instead of the wielder

### N. Soulstealer Ability: Heal on Faint/Kill

**Soulstealer (PTU p.2417-2423):** "The user's attack causes a foe to Faint -- remove one Injury and recover 25% of Max HP. If the triggering attack killed its target, the user instead removes all Injuries and recovers all Hit Points."

Soulstealer is a High Ability available to Honedge, Doublade, and Aegislash.

#### Implementation

Soulstealer triggers after a faint caused by the user's attack. It should be checked in the damage application pipeline:

```typescript
/**
 * Check and apply Soulstealer ability after a faint.
 *
 * PTU p.2417-2423:
 * - Scene frequency, Free Action
 * - Trigger: the user's attack causes a foe to Faint
 * - Effect: remove 1 Injury + heal 25% max HP
 * - If the attack killed (brought to below -100% HP threshold): full heal + remove all Injuries
 *
 * Returns a HealResult if Soulstealer triggered, null otherwise.
 */
export function checkSoulstealer(
  attacker: Combatant,
  damageResult: DamageResult,
  encounter: Encounter
): { triggered: boolean; isKill: boolean } | null {
  if (attacker.type !== 'pokemon') return null

  const pokemon = attacker.entity as Pokemon
  const hasSoulstealer = pokemon.abilities.some(a => a.name === 'Soulstealer')
  if (!hasSoulstealer) return null

  if (!damageResult.fainted) return null

  // Check if this is a "kill" (unrevivable death) vs a regular faint.
  // PTU kill threshold: -100% HP (crossed the second negative marker).
  // This is a GM-adjudicated event; for automation, we check if the
  // target's unclamped HP went below -(maxHp).
  // For simplicity, treat all faints as regular faints unless the GM
  // explicitly marks a kill. This can be enhanced later.
  const isKill = false // Placeholder: kill detection requires GM input

  return { triggered: true, isKill }
}

/**
 * Apply Soulstealer healing to the attacker.
 */
export function applySoulstealerHealing(
  combatant: Combatant,
  isKill: boolean
): HealResult {
  const entity = combatant.entity
  const maxHp = entity.maxHp

  if (isKill) {
    // Full heal + remove all injuries
    return applyHealingToEntity(combatant, {
      amount: maxHp,
      healInjuries: entity.injuries,
    })
  } else {
    // 25% heal + remove 1 injury
    return applyHealingToEntity(combatant, {
      amount: Math.floor(maxHp * 0.25),
      healInjuries: 1,
    })
  }
}
```

**Integration:** After `applyDamageToEntity()` causes a faint, check if the attacker has Soulstealer and apply healing. This hooks into the same damage pipeline that handles injury tracking and faint status.

**Scene Frequency:** Soulstealer is "Scene - Free Action". Track usage in the move log or on a per-scene counter on the combatant. Prevent triggering more than once per scene.

### P2 Integration Summary

| Mechanic | Current Behavior | P2 Behavior |
|----------|-----------------|-------------|
| VTT movement for wielded pair | Independent positions | Shared position, shared speed pool |
| No Guard ability | Always active on Honedge/Doublade | Suppressed while wielded |
| Aegislash Stance Change | Free forme switching | Locked in Blade forme while wielded |
| Weaponize intercept | Not implemented | Free Action intercept for wielder |
| Soulstealer healing | Not implemented | Auto-heal on causing faint |
| Movement pool reset | N/A | Reset at round start for all wield pairs |

---
