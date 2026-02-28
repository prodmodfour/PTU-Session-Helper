# Shared Specifications

## Type Definitions

### New Types (app/types/combat.ts)

```typescript
/**
 * A Living Weapon wield relationship within an encounter.
 * Tracks which trainer combatant is wielding which Pokemon combatant.
 *
 * PTU pp.305-306: Living Weapon can be wielded as equipment.
 * Engage = Standard Action. Disengage = Swift Action.
 */
export interface WieldRelationship {
  /** Combatant ID of the wielding trainer */
  wielderId: string;
  /** Combatant ID of the Living Weapon Pokemon */
  weaponId: string;
  /** Species of the Living Weapon (determines weapon type, moves, bonuses) */
  weaponSpecies: 'Honedge' | 'Doublade' | 'Aegislash';
  /** Whether the Living Weapon is fainted (PTU: still usable, -2 penalty) */
  isFainted: boolean;
  /** Movement speed used this round (shared pool, P2) */
  movementUsedThisRound: number;
  /** For Aegislash: was the Pokemon already in Blade forme when engaged? (P2) */
  wasInBladeFormeOnEngage?: boolean;
}
```

### Extended Types

#### Combatant (app/types/encounter.ts)

```typescript
export interface Combatant {
  // ... existing fields ...

  /** If this combatant is a trainer currently wielding a Living Weapon */
  wieldingWeaponId?: string;
  /** If this combatant is a Pokemon currently being wielded as a Living Weapon */
  wieldedByTrainerId?: string;
}
```

#### Encounter (app/types/encounter.ts)

```typescript
export interface Encounter {
  // ... existing fields ...

  /** Living Weapon wield relationships (encounter-scoped) */
  wieldRelationships: WieldRelationship[];
}
```

### Living Weapon Constants (app/constants/livingWeapon.ts)

```typescript
export interface LivingWeaponConfig {
  species: string;
  weaponType: 'Simple' | 'Fine';
  occupiedSlots: ('mainHand' | 'offHand')[];
  grantsShield: boolean;
  dualWieldEvasionBonus: number;
  grantedMoves: LivingWeaponMove[];
  equipmentDescription: string;
}

export interface LivingWeaponMove {
  name: string;
  type: 'Normal';
  frequency: 'EOT' | 'Scene x2';
  ac: number;
  damageBase: number;
  damageClass: 'Physical';
  range: string;
  effect: string;
  tier: 'Adept' | 'Master';
  requiredRank: 'Adept' | 'Master';
}
```

### Weapon Move Data

Full weapon move definitions per PTU pp.288-290:

| Move | Type | Freq | AC | DB | Class | Range | Effect | Tier |
|------|------|------|-----|-----|-------|-------|--------|------|
| Wounding Strike | Normal | EOT | 2 | 6 (2d6+8 / 15) | Physical | WR, 1 Target | Target loses a Tick of HP | Adept |
| Double Swipe | Normal | EOT | 2 | 4 (1d8+6 / 11) | Physical | WR, 2 Targets or WR, 1 Target Double Strike | None | Adept |
| Bleed! | Normal | Scene x2 | 2 | 9 (2d10+10 / 21) | Physical | WR, 1 Target | Target loses Tick of HP at start of next 3 turns | Master |

"WR" = Weapon Range (for Small Melee Weapons, this is Melee range -- adjacent targets).

---

## Entity Builder Updates

### Encounter Initialization

When creating an encounter (via `start.post.ts` or encounter builder), initialize `wieldRelationships` to an empty array:

```typescript
// In encounter creation / start:
const encounter: Encounter = {
  // ... existing fields ...
  wieldRelationships: [],
}
```

### Combatant Builder

No changes to `buildCombatantFromEntity()` for P0. The `wieldingWeaponId` and `wieldedByTrainerId` fields are optional and undefined by default.

For P1, a `refreshCombatantBonuses()` function recalculates equipment-derived stats when a wield relationship changes:

```typescript
/**
 * Recalculate a trainer combatant's equipment-derived bonuses after
 * a wield relationship change (engage or disengage).
 *
 * Updates: evasion values (physical, special, speed).
 * Does NOT update initiative (that requires separate recalculation).
 */
export function refreshCombatantEquipmentBonuses(
  encounter: Encounter,
  combatant: Combatant
): Combatant {
  if (combatant.type !== 'human') return combatant

  const human = combatant.entity as HumanCharacter
  const stats = human.stats
  const stages = human.stageModifiers

  // Get effective equipment (accounting for Living Weapon overlay)
  const bonuses = getEffectiveEquipmentBonuses(encounter, combatant)

  return {
    ...combatant,
    physicalEvasion: calculateEvasion(
      stats.defense || 0,
      stages.defense || 0,
      bonuses.evasionBonus,
      bonuses.statBonuses.defense ?? 0
    ),
    specialEvasion: calculateEvasion(
      stats.specialDefense || 0,
      stages.specialDefense || 0,
      bonuses.evasionBonus,
      bonuses.statBonuses.specialDefense ?? 0
    ),
    speedEvasion: calculateEvasion(
      stats.speed || 0,
      stages.speed || 0,
      bonuses.evasionBonus,
      bonuses.statBonuses.speed ?? 0
    ),
  }
}
```

---

## WebSocket Sync

### New Event Types

```typescript
// living_weapon_engage: trainer wields a Living Weapon Pokemon
{
  type: 'living_weapon_engage',
  encounterId: string,
  wieldRelationship: WieldRelationship,
}

// living_weapon_disengage: wield relationship broken
{
  type: 'living_weapon_disengage',
  encounterId: string,
  wielderId: string,
  weaponId: string,
}
```

These events are broadcast to all clients in the encounter room (same pattern as `damage_applied`, `status_change`, etc.). The Group View and Player View handle them by:
1. Updating the local encounter state with the new wield relationships.
2. Refreshing combatant display to show wield indicators.
3. Syncing VTT token positions for shared movement.

### Existing Event Reuse

- `encounter_update`: used for the full encounter state sync after wield changes.
- `character_update`: NOT used (wield state is encounter-scoped, not character-persisted).

---

## Migration Plan

No database migration is needed. All Living Weapon state is encounter-scoped and stored within the existing encounter JSON. The `Encounter` model's `combatants` field (JSON column) already holds the full encounter state including all combatant data and will naturally include `wieldRelationships` when serialized.

Default value: `wieldRelationships: []` in new encounters. Existing encounters without this field will have it defaulted to `[]` by the encounter deserializer.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Equipment overlay conflicts with real equipment | Medium | Living Weapon replaces Main Hand/Off-Hand explicitly; other slots untouched. Clear precedence: Living Weapon > normal equipment for occupied slots. |
| Shared movement pool complexity on VTT | High | P2 only. Isolated behind wield relationship check. Movement composable changes are additive, not modifying existing non-wielded movement. |
| Undo/redo consistency | Low | Wield state is part of encounter snapshot. Standard undo/redo captures full state. |
| Pokemon fainting mid-wield | Medium | Explicit `isFainted` flag on relationship. Wield persists through faint. Bonuses recalculated with penalty. |
| Aegislash forme swap correctness | Medium | Explicit stat swap function tested against known base stats. Track pre-engage forme to revert on disengage. |
| No Guard suppression edge cases | Low | Simple boolean check on `isWielded()`. Suppression is total (no partial No Guard). |
| Weapon move frequency tracking | Low | Weapon moves use same frequency tracking as normal moves. IDs are prefixed to avoid collision with natural moves. |
| Existing code paths computing equipment bonuses | High | L2 lesson: must find and update ALL code paths. Known paths documented in P1 spec. |
| Homebrew Living Weapon species | Low | Fallback to Honedge config for unknown species with "Living Weapon" capability. |

---

## Decisions & Trade-offs

1. **Encounter-scoped vs DB-persisted wield state**: Encounter-scoped. Wield relationships are combat actions (engage/disengage consume actions). Between encounters, no wield state exists. This avoids a Prisma migration and is undo/redo compatible.

2. **Dynamic equipment overlay vs modifying equipment JSON**: Overlay. The trainer's persisted equipment is never modified by wielding. The Living Weapon computes effective equipment at runtime. This prevents data corruption if the encounter is abandoned or the app crashes mid-combat.

3. **Weapon moves as runtime injection vs DB persistence**: Runtime injection. Weapon moves are added to the Pokemon's move list only in the client-facing API response, not in the database. This ensures clean separation: the Pokemon's actual move list is never polluted by weapon moves.

4. **Shared movement pool as relationship field vs separate tracker**: Relationship field. The `movementUsedThisRound` lives directly on `WieldRelationship`. This keeps all wield state in one place and is captured by undo/redo snapshots.

5. **Fainted penalty applied to equipment bonuses vs separate penalty system**: Applied to equipment bonuses. The -2 penalty is directly subtracted from the Living Weapon's generated equipment bonuses (evasion, etc.). This reuses the existing equipment bonus pipeline without a new penalty mechanism.

6. **Aegislash forme detection heuristic vs explicit tracking**: Heuristic (Attack > Defense = Blade forme) for P2. A more robust approach (explicit forme field on Pokemon) is desirable but requires a broader change outside this design's scope.

7. **Soulstealer kill detection**: Deferred to GM input. PTU kill rules are complex and GM-adjudicated. The implementation detects faint automatically but treats "kill" as a manual trigger.

8. **Generalized LinkedMovementPair for Mounting reuse**: Designed but NOT implemented. The shared movement functions use `WieldRelationship` directly. Refactoring to a generalized interface is deferred to feature-004 implementation.

---
