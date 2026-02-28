# P1 Specification

## P1: Equipment Integration, Evasion Bonuses, Shield DR, Fainted Penalty, Weapon Moves

### E. Equipment Integration: Weapon Bonuses from Wielded Pokemon

When a trainer wields a Living Weapon, the Pokemon dynamically occupies equipment slots on the trainer. This does NOT modify the trainer's persisted `equipment` JSON field -- it is a combat-time overlay computed from the wield relationship.

#### Dynamic Equipment Overlay

The existing `computeEquipmentBonuses()` function operates on `EquipmentSlots`. For Living Weapon integration, a new function computes the **effective** equipment by merging the trainer's real equipment with the Living Weapon overlay.

File: `app/utils/equipmentBonuses.ts` (add new function)

```typescript
import type { LivingWeaponConfig } from '~/constants/livingWeapon'
import type { WieldRelationship } from '~/types/combat'

/**
 * Compute the effective equipment slots for a trainer who is wielding a Living Weapon.
 * The Living Weapon occupies Main Hand (and Off-Hand for Doublade/Aegislash),
 * REPLACING any existing equipment in those slots.
 *
 * PTU pp.305-306: Living Weapon counts as equipment in the occupied slots.
 *
 * Returns a new EquipmentSlots object (immutable -- does not modify input).
 */
export function computeEffectiveEquipment(
  baseEquipment: EquipmentSlots,
  livingWeaponConfig: LivingWeaponConfig,
  isFainted: boolean
): EquipmentSlots {
  const effective = { ...baseEquipment }

  // Living Weapon always occupies Main Hand
  effective.mainHand = buildLivingWeaponEquippedItem(livingWeaponConfig, 'mainHand', isFainted)

  // Doublade and Aegislash also occupy Off-Hand
  if (livingWeaponConfig.occupiedSlots.includes('offHand')) {
    if (livingWeaponConfig.grantsShield) {
      // Aegislash: Off-Hand is a Light Shield
      effective.offHand = buildLivingWeaponShield(livingWeaponConfig, isFainted)
    } else {
      // Doublade: Off-Hand is the second weapon
      effective.offHand = buildLivingWeaponEquippedItem(livingWeaponConfig, 'offHand', isFainted)
    }
  }

  return effective
}

/**
 * Build an EquippedItem representing a Living Weapon in a hand slot.
 */
function buildLivingWeaponEquippedItem(
  config: LivingWeaponConfig,
  slot: EquipmentSlot,
  isFainted: boolean
): EquippedItem {
  return {
    name: `Living Weapon: ${config.species}`,
    slot,
    description: config.equipmentDescription,
    // Living Weapons as melee weapons don't grant passive DR or evasion
    // (that comes from Doublade dual-wield or Aegislash shield, handled separately)
  }
}

/**
 * Build an EquippedItem representing Aegislash's Light Shield.
 * PTU p.294: Light Shield = +2 Evasion passively.
 */
function buildLivingWeaponShield(
  config: LivingWeaponConfig,
  isFainted: boolean
): EquippedItem {
  return {
    name: `Living Weapon Shield: ${config.species}`,
    slot: 'offHand',
    evasionBonus: 2, // Light Shield passive bonus (PTU p.294)
    canReady: true,
    readiedBonuses: { evasionBonus: 4, damageReduction: 10, appliesSlowed: true },
    description: 'Light Shield from Living Weapon (Aegislash)',
  }
}
```

#### Integration with `computeEquipmentBonuses()`

The existing bonus computation pipeline does NOT change. Instead, callers that compute equipment bonuses for a trainer in combat first check for an active wield relationship and compute effective equipment:

```typescript
// In any code path that computes equipment bonuses for a trainer combatant:
function getEffectiveEquipmentBonuses(
  encounter: Encounter,
  combatant: Combatant
): EquipmentCombatBonuses {
  const human = combatant.entity as HumanCharacter
  let equipment = human.equipment ?? {}

  // Check for Living Weapon overlay
  const wieldRel = encounter.wieldRelationships.find(
    r => r.wielderId === combatant.id
  )
  if (wieldRel) {
    const config = LIVING_WEAPON_CONFIG[wieldRel.weaponSpecies]
    if (config) {
      equipment = computeEffectiveEquipment(equipment, config, wieldRel.isFainted)
    }
  }

  return computeEquipmentBonuses(equipment)
}
```

This function will be added to `living-weapon.service.ts` and called from the damage calculation pipeline, evasion computation, and combatant builder refresh.

### F. Doublade Dual-Wield Evasion (+2 Evasion)

**PTU p.305:** "Doublade may be used as two Small Melee Weapons; when one is held in each hand, the user gains +2 to Evasion."

This is distinct from shield evasion -- it is a flat evasion bonus from the dual-wield configuration, not from a shield item. It stacks with other evasion sources.

#### Implementation

The Doublade dual-wield bonus is applied as part of the Living Weapon equipment overlay. Since Doublade occupies both mainHand and offHand, the evasion bonus is tracked on the `LivingWeaponConfig` as `dualWieldEvasionBonus: 2`.

File: `app/utils/equipmentBonuses.ts` (extend `computeEffectiveEquipment`)

When Doublade is wielded, the main hand item carries the dual-wield evasion bonus:

```typescript
function buildLivingWeaponEquippedItem(
  config: LivingWeaponConfig,
  slot: EquipmentSlot,
  isFainted: boolean
): EquippedItem {
  return {
    name: `Living Weapon: ${config.species}`,
    slot,
    description: config.equipmentDescription,
    // Doublade dual-wield bonus: +2 evasion applied on mainHand item
    // to avoid double-counting (only mainHand carries the bonus)
    evasionBonus: slot === 'mainHand' ? config.dualWieldEvasionBonus : 0,
  }
}
```

This means:
- **Honedge** (mainHand only): `evasionBonus: 0` on mainHand. No evasion bonus.
- **Doublade** (mainHand + offHand): `evasionBonus: 2` on mainHand, `evasionBonus: 0` on offHand. Net +2 evasion.
- **Aegislash** (mainHand + shield): `evasionBonus: 0` on mainHand, shield handles its own bonus.

The existing `computeEquipmentBonuses()` sums `evasionBonus` from all items, so this integrates cleanly.

### G. Aegislash Shield DR

**PTU p.305:** "Aegislash may be used as a Small Melee Weapon and a Light Shield."

**PTU p.294:** Light Shield = +2 Evasion passively. Readied: +4 Evasion, 10 DR, Slowed.

When Aegislash is wielded, the off-hand slot is populated with a Light Shield `EquippedItem`. This provides:
- Passive: +2 Evasion (via `evasionBonus: 2` on the shield item)
- Readied: +4 Evasion, 10 DR, Slowed (via `readiedBonuses` on the shield item)

The readied state is managed by the existing shield readied toggle (if implemented) or deferred to GM discretion (existing pattern from design-equipment-001 P2).

**Integration:** The `buildLivingWeaponShield()` function (shown in section E) creates the Light Shield item. `computeEquipmentBonuses()` picks up the evasion bonus automatically.

### H. Fainted Living Weapon: -2 Penalty

**PTU p.305:** "When Fainted, these Pokemon may still be used as inanimate pieces of equipment, but all rolls made with them take a -2 penalty."

#### Penalty Application

The -2 penalty applies to:
1. **Accuracy rolls** made with the weapon (weapon moves use the Living Weapon)
2. **Damage rolls** made with weapon moves (though PTU damage is set-mode, the penalty applies to accuracy)
3. **Evasion bonuses** from the Living Weapon equipment

For set-mode damage (current app implementation), the penalty manifests as:
- **-2 to accuracy rolls** when using weapon moves granted by the Living Weapon
- **Shield evasion reduced by 2** (Aegislash fainted: Light Shield gives +0 instead of +2 passive evasion)
- **Doublade dual-wield evasion reduced by 2** (gives +0 instead of +2)

#### Implementation

The `isFainted` flag on `WieldRelationship` is checked when computing equipment bonuses:

```typescript
function buildLivingWeaponEquippedItem(
  config: LivingWeaponConfig,
  slot: EquipmentSlot,
  isFainted: boolean
): EquippedItem {
  const baseDualWieldBonus = slot === 'mainHand' ? config.dualWieldEvasionBonus : 0
  // Fainted penalty: -2 to all bonuses from the Living Weapon
  const faintedPenalty = isFainted ? 2 : 0

  return {
    name: `Living Weapon: ${config.species}${isFainted ? ' (Fainted)' : ''}`,
    slot,
    description: config.equipmentDescription + (isFainted ? ' [Fainted: -2 penalty]' : ''),
    evasionBonus: Math.max(0, baseDualWieldBonus - faintedPenalty),
  }
}

function buildLivingWeaponShield(
  config: LivingWeaponConfig,
  isFainted: boolean
): EquippedItem {
  const faintedPenalty = isFainted ? 2 : 0

  return {
    name: `Living Weapon Shield: ${config.species}${isFainted ? ' (Fainted)' : ''}`,
    slot: 'offHand',
    evasionBonus: Math.max(0, 2 - faintedPenalty), // Light Shield: +2, minus fainted penalty
    canReady: !isFainted, // Cannot ready a fainted Living Weapon shield
    readiedBonuses: !isFainted
      ? { evasionBonus: 4, damageReduction: 10, appliesSlowed: true }
      : undefined,
    description: 'Light Shield from Living Weapon (Aegislash)' +
      (isFainted ? ' [Fainted: -2 penalty]' : ''),
  }
}
```

The -2 accuracy penalty for weapon moves is applied at the move execution layer (when a weapon move is used, if the Living Weapon is fainted, subtract 2 from the accuracy roll). This is tracked via the `isFainted` flag on the wield relationship.

#### Faint State Sync

When a Living Weapon Pokemon faints during combat (HP reaches 0):
1. The `applyDamageToEntity()` function in `combatant.service.ts` handles faint status.
2. The encounter update pipeline checks if the fainted combatant is a wielded Living Weapon.
3. If so, calls `updateWieldFaintedState()` to set `isFainted: true` on the relationship.
4. The wield relationship **persists** -- the Pokemon remains wielded but with the penalty.

When a fainted Living Weapon is healed above 0 HP:
1. The healing pipeline sets `isFainted: false` on the wield relationship.
2. Weapon moves become usable again (while fainted, the Pokemon cannot act as a Pokemon, only as equipment).

### I. Weapon Moves Added to Pokemon Move List

**PTU p.306:** "While used as a Living Weapon, the Pokemon also adds these Moves to its own Move List, so long as their wielder qualifies to access them."

#### Qualification Check

The wielder must have the requisite Combat skill rank to grant the move:
- **Adept moves** (Wounding Strike, Double Swipe): wielder needs Adept Combat skill
- **Master moves** (Bleed!): wielder needs Master Combat skill

```typescript
/**
 * Get the weapon moves a Living Weapon gains while wielded,
 * filtered by the wielder's Combat skill rank.
 *
 * PTU p.306: "so long as their wielder qualifies to access them."
 * PTU p.288: Adept Weapon Moves require Adept Combat.
 * PTU p.290: Master Weapon Moves require Master Combat.
 */
export function getGrantedWeaponMoves(
  config: LivingWeaponConfig,
  wielderCombatRank: SkillRank | undefined
): Move[] {
  const rank = wielderCombatRank ?? 'Untrained'

  return config.grantedMoves
    .filter(wm => meetsSkillRequirement(rank, wm.requiredRank))
    .map(wm => ({
      id: `living-weapon-${wm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: wm.name,
      type: wm.type as PokemonType,
      damageClass: wm.damageClass,
      frequency: wm.frequency as MoveFrequency,
      ac: wm.ac,
      damageBase: wm.damageBase,
      range: wm.range,
      effect: wm.effect,
      keywords: ['Weapon'],
    }))
}
```

#### Move Injection Pattern

Weapon moves are NOT permanently added to the Pokemon's move list in the database. They are injected at runtime when the combatant data is serialized for the client:

```typescript
/**
 * Get the effective move list for a Pokemon combatant,
 * including any Living Weapon moves if wielded.
 *
 * This is called by the combat composable when rendering the
 * Pokemon's available moves.
 */
export function getEffectiveMoveList(
  encounter: Encounter,
  combatant: Combatant
): Move[] {
  if (combatant.type !== 'pokemon') return []

  const pokemon = combatant.entity as Pokemon
  const baseMoves = pokemon.moves ?? []

  // Check if this Pokemon is currently wielded
  const wieldRel = encounter.wieldRelationships.find(
    r => r.weaponId === combatant.id
  )
  if (!wieldRel) return baseMoves

  // Get the wielder's Combat skill rank
  const wielder = encounter.combatants.find(c => c.id === wieldRel.wielderId)
  if (!wielder || wielder.type !== 'human') return baseMoves

  const human = wielder.entity as HumanCharacter
  const combatRank = (human.skills?.Combat ?? 'Untrained') as SkillRank

  // Get config and filter moves by wielder qualification
  const config = LIVING_WEAPON_CONFIG[wieldRel.weaponSpecies]
  if (!config) return baseMoves

  const weaponMoves = getGrantedWeaponMoves(config, combatRank)

  // Merge: base moves + weapon moves (avoid duplicates by name)
  const existingNames = new Set(baseMoves.map(m => m.name))
  const newMoves = weaponMoves.filter(m => !existingNames.has(m.name))

  return [...baseMoves, ...newMoves]
}
```

#### Weapon Move Usage During Faint

When the Living Weapon is fainted, it cannot use moves (it is only equipment). The weapon moves remain on the Pokemon's conceptual move list but are not actionable since fainted Pokemon cannot take turns.

If a future implementation adds "inanimate weapon attack" (trainer uses the weapon directly), the -2 penalty from section H would apply.

### P1 Integration Summary

| Combat Step | Without Living Weapon | With Living Weapon |
|-------------|----------------------|-------------------|
| Equipment slots | Trainer's persisted equipment | Living Weapon overlays Main Hand + Off-Hand |
| Evasion calculation | Equipment evasion from shields | + Doublade dual-wield (+2) or Aegislash shield (+2) |
| Shield DR | From equipped shield item | Aegislash provides Light Shield DR |
| Fainted penalty | N/A | -2 to all Living Weapon bonuses (evasion, accuracy) |
| Pokemon move list | Base moves from species/level | + Weapon moves (filtered by wielder Combat rank) |
| Weapon move accuracy | N/A | -2 if Living Weapon is fainted |

### P1 Code Path Integration Points

Every code path that currently calls `computeEquipmentBonuses()` for a trainer in combat must be updated to use `getEffectiveEquipmentBonuses()` instead (which accounts for the Living Weapon overlay). Known locations:

1. `buildCombatantFromEntity()` in `combatant.service.ts` -- initial evasion and initiative calculation
2. `calculateCurrentInitiative()` in `combatant.service.ts` -- speed CS for initiative reorder
3. `calculate-damage.post.ts` -- DR from equipment for damage reduction
4. `useMoveCalculation.ts` -- evasion computation for accuracy checks

Since `buildCombatantFromEntity()` is called at encounter start (before any wield relationships exist), the Living Weapon overlay only affects **recalculations** during combat (after engage). A new function `refreshCombatantBonuses()` will be added to recalculate evasion and DR when a wield relationship changes.

---
