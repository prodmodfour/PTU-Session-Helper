# P0 Specification

## P0: Data Model, Capability Parsing, Engage/Disengage, Wield State

### A. Wield Relationship Data Model

The wield relationship is **encounter-scoped** (combat state only), not persisted to the database. This matches the PTU rules: a trainer can only wield a Living Weapon during an encounter, and the wield state is part of the combat snapshot (undo/redo compatible).

#### Why Encounter-Scoped (Not DB-Persisted)

1. **Engage/disengage are combat actions.** They consume Standard/Swift actions and only make sense within an active encounter.
2. **Undo/redo compatibility.** The encounter store uses snapshots. Wield state stored in the encounter object is automatically captured and restored.
3. **No between-combat state needed.** PTU does not track "who is wielding what" outside combat. At encounter start, no one is wielded.
4. **Simpler implementation.** No Prisma migration, no new DB tables, no cross-entity consistency issues.

#### Data Structure: `WieldRelationship`

Stored on the `Encounter` object as an array of active wield relationships.

```typescript
// File: app/types/combat.ts (new interface)

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
}
```

#### Encounter Extension

```typescript
// File: app/types/encounter.ts (add to Encounter interface)

export interface Encounter {
  // ... existing fields ...

  // Living Weapon wield relationships (encounter-scoped)
  // Populated via engage/disengage endpoints during combat
  wieldRelationships: WieldRelationship[];
}
```

Default: `[]` (empty array). Serialized as part of the encounter JSON in the DB `combatants` field (existing JSON column that holds the full encounter state).

#### Combatant Extension

Add wield state flags to the `Combatant` interface so UI and logic can quickly determine a combatant's wield status without scanning the relationships array.

```typescript
// File: app/types/encounter.ts (add to Combatant interface)

export interface Combatant {
  // ... existing fields ...

  // Living Weapon state
  /** If this combatant is a trainer currently wielding a Living Weapon */
  wieldingWeaponId?: string;
  /** If this combatant is a Pokemon currently being wielded as a Living Weapon */
  wieldedByTrainerId?: string;
}
```

These are denormalized from `wieldRelationships` for O(1) lookup. They are always kept in sync by the engage/disengage service functions.

### B. Living Weapon Capability Parsing

Parse the `Living Weapon` capability from a Pokemon's `otherCapabilities` string array to determine if a Pokemon can be wielded, and what weapon type it provides.

#### Constants File

File: `app/constants/livingWeapon.ts`

```typescript
import type { WieldRelationship } from '~/types/combat'

/**
 * Living Weapon species configuration.
 * Maps species name to its weapon properties per PTU pp.305-306.
 */
export interface LivingWeaponConfig {
  /** Species name (must match Pokemon.species exactly) */
  species: string;
  /** Weapon type for PTU weapon proficiency checks */
  weaponType: 'Simple' | 'Fine';
  /** Equipment slots occupied when wielded */
  occupiedSlots: ('mainHand' | 'offHand')[];
  /** Whether this counts as a shield (Aegislash) */
  grantsShield: boolean;
  /** Evasion bonus from dual-wielding (Doublade only) */
  dualWieldEvasionBonus: number;
  /** Weapon moves granted to the Pokemon while wielded */
  grantedMoves: LivingWeaponMove[];
  /** Human-readable equipment description */
  equipmentDescription: string;
}

/**
 * A weapon move granted by the Living Weapon capability.
 * Added to the Pokemon's move list while wielded.
 */
export interface LivingWeaponMove {
  name: string;
  type: 'Normal';
  frequency: 'EOT' | 'Scene x2';
  ac: number;
  damageBase: number;
  damageClass: 'Physical';
  range: string;
  effect: string;
  /** Adept or Master weapon move tier */
  tier: 'Adept' | 'Master';
  /** Required Combat skill rank for the wielder to grant this move */
  requiredRank: 'Adept' | 'Master';
}

// === Weapon Move Definitions (PTU pp.288-290) ===

const WOUNDING_STRIKE: LivingWeaponMove = {
  name: 'Wounding Strike',
  type: 'Normal',
  frequency: 'EOT',
  ac: 2,
  damageBase: 6,
  damageClass: 'Physical',
  range: 'WR, 1 Target',
  effect: 'The target loses a Tick of Hit Points.',
  tier: 'Adept',
  requiredRank: 'Adept',
}

const DOUBLE_SWIPE: LivingWeaponMove = {
  name: 'Double Swipe',
  type: 'Normal',
  frequency: 'EOT',
  ac: 2,
  damageBase: 4,
  damageClass: 'Physical',
  range: 'WR, 2 Targets; or WR, 1 Target, Double Strike',
  effect: 'None',
  tier: 'Adept',
  requiredRank: 'Adept',
}

const BLEED: LivingWeaponMove = {
  name: 'Bleed!',
  type: 'Normal',
  frequency: 'Scene x2',
  ac: 2,
  damageBase: 9,
  damageClass: 'Physical',
  range: 'WR, 1 Target',
  effect: 'The target loses a Tick of Hit Points at the start of their next three turns.',
  tier: 'Master',
  requiredRank: 'Master',
}

// === Species Configuration ===

export const LIVING_WEAPON_CONFIG: Record<string, LivingWeaponConfig> = {
  'Honedge': {
    species: 'Honedge',
    weaponType: 'Simple',
    occupiedSlots: ['mainHand'],
    grantsShield: false,
    dualWieldEvasionBonus: 0,
    grantedMoves: [WOUNDING_STRIKE],
    equipmentDescription: 'Small Melee Weapon (Simple)',
  },
  'Doublade': {
    species: 'Doublade',
    weaponType: 'Simple',
    occupiedSlots: ['mainHand', 'offHand'],
    grantsShield: false,
    dualWieldEvasionBonus: 2,
    grantedMoves: [DOUBLE_SWIPE],
    equipmentDescription: 'Two Small Melee Weapons (Simple, +2 Evasion)',
  },
  'Aegislash': {
    species: 'Aegislash',
    weaponType: 'Fine',
    occupiedSlots: ['mainHand', 'offHand'],
    grantsShield: true,
    dualWieldEvasionBonus: 0,
    grantedMoves: [WOUNDING_STRIKE, BLEED],
    equipmentDescription: 'Small Melee Weapon + Light Shield (Fine)',
  },
}

/**
 * All species that have the Living Weapon capability.
 */
export const LIVING_WEAPON_SPECIES = Object.keys(LIVING_WEAPON_CONFIG)
```

#### Capability Parser

File: `app/utils/combatantCapabilities.ts` (add new function)

```typescript
import { LIVING_WEAPON_CONFIG, type LivingWeaponConfig } from '~/constants/livingWeapon'

/**
 * Check if a Pokemon has the Living Weapon capability.
 * Checks both the species name (known Living Weapon species) and
 * the otherCapabilities string array for "Living Weapon".
 *
 * Returns the weapon config if found, null otherwise.
 */
export function getLivingWeaponConfig(pokemon: Pokemon): LivingWeaponConfig | null {
  // Primary check: known Living Weapon species
  const config = LIVING_WEAPON_CONFIG[pokemon.species]
  if (config) return config

  // Fallback: check otherCapabilities for "Living Weapon" string
  // This supports homebrew Pokemon that may have the capability
  const otherCaps = pokemon.capabilities?.otherCapabilities ?? []
  const hasLivingWeapon = otherCaps.some(
    cap => cap.trim().toLowerCase() === 'living weapon'
  )

  if (hasLivingWeapon) {
    // Unknown species with Living Weapon -- default to Honedge config
    // GM can adjust via custom equipment if needed
    return {
      ...LIVING_WEAPON_CONFIG['Honedge'],
      species: pokemon.species,
      equipmentDescription: `Living Weapon (${pokemon.species})`,
    }
  }

  return null
}
```

### C. Engage/Disengage API Endpoints

#### `POST /api/encounters/:id/living-weapon/engage`

Establishes a wield relationship between a trainer and a Living Weapon Pokemon.

**PTU Rule:** Re-engaging is a Standard Action (PTU p.306).

```typescript
// Request body:
{
  wielderId: string;   // Combatant ID of the trainer
  weaponId: string;    // Combatant ID of the Living Weapon Pokemon
}

// Response:
{
  success: true,
  data: {
    wieldRelationship: WieldRelationship,
    // Updated combatant snapshots (for client state sync)
    wielder: Combatant,
    weapon: Combatant,
  }
}
```

**Validation Rules:**
1. `wielderId` must reference a human combatant in the encounter.
2. `weaponId` must reference a Pokemon combatant in the encounter.
3. The Pokemon must have the Living Weapon capability (via `getLivingWeaponConfig()`).
4. The Pokemon must be on the same side as the trainer (players can only wield their own team's Pokemon).
5. The trainer must not already be wielding another Living Weapon.
6. The Pokemon must not already be wielded by another trainer.
7. The trainer must have the requisite Combat skill rank for the weapon type:
   - Simple weapons (Honedge, Doublade): Novice Combat or higher
   - Fine weapons (Aegislash): Adept Combat or higher
   - **Note:** Skill rank check uses the wielder's `skills.Combat` field. If the field is missing, default to 'Untrained' (cannot wield).
8. The Pokemon must be adjacent to the trainer on the VTT grid (if positions are set), OR positions are not set (non-VTT encounter).

**Side Effects:**
- Creates a `WieldRelationship` entry on the encounter.
- Sets `wieldingWeaponId` on the wielder combatant.
- Sets `wieldedByTrainerId` on the weapon combatant.
- Marks the trainer's Standard Action as used for this turn.
- Emits `living_weapon_engage` WebSocket event (new event type).

#### `POST /api/encounters/:id/living-weapon/disengage`

Breaks a wield relationship. Either party can disengage.

**PTU Rule:** Disengage is a Swift Action (PTU p.306).

```typescript
// Request body:
{
  // Either the wielder or weapon combatant ID -- the endpoint
  // resolves the relationship from either side.
  combatantId: string;
}

// Response:
{
  success: true,
  data: {
    removedRelationship: WieldRelationship,
    wielder: Combatant,
    weapon: Combatant,
  }
}
```

**Validation Rules:**
1. `combatantId` must be part of an active wield relationship (as wielder or weapon).
2. The combatant whose turn it is must have a Swift Action available.

**Side Effects:**
- Removes the `WieldRelationship` from the encounter.
- Clears `wieldingWeaponId` on the wielder.
- Clears `wieldedByTrainerId` on the weapon.
- Marks a Swift Action as used for the disengaging combatant.
- Emits `living_weapon_disengage` WebSocket event.

### D. Wield State Tracking in Combat

#### Living Weapon Service

File: `app/server/services/living-weapon.service.ts`

Core service functions for managing wield state within an encounter. All functions are pure (operate on encounter data structures, no DB calls) except the top-level endpoint handlers.

```typescript
import type { Encounter, Combatant, WieldRelationship } from '~/types'
import type { Pokemon } from '~/types/character'
import { getLivingWeaponConfig } from '~/utils/combatantCapabilities'
import { LIVING_WEAPON_CONFIG } from '~/constants/livingWeapon'

/**
 * Find the wield relationship for a given combatant (as wielder or weapon).
 * Returns null if the combatant is not part of any wield relationship.
 */
export function findWieldRelationship(
  encounter: Encounter,
  combatantId: string
): WieldRelationship | null {
  return encounter.wieldRelationships.find(
    r => r.wielderId === combatantId || r.weaponId === combatantId
  ) ?? null
}

/**
 * Create a new wield relationship and update combatant flags.
 * Returns a new encounter object with the relationship added (immutable).
 *
 * Does NOT validate preconditions -- caller must validate first.
 */
export function engageLivingWeapon(
  encounter: Encounter,
  wielderId: string,
  weaponId: string,
  weaponSpecies: string,
  isFainted: boolean
): Encounter {
  const species = weaponSpecies as WieldRelationship['weaponSpecies']

  const relationship: WieldRelationship = {
    wielderId,
    weaponId,
    weaponSpecies: species,
    isFainted,
  }

  // Update combatant flags (immutable)
  const updatedCombatants = encounter.combatants.map(c => {
    if (c.id === wielderId) {
      return { ...c, wieldingWeaponId: weaponId }
    }
    if (c.id === weaponId) {
      return { ...c, wieldedByTrainerId: wielderId }
    }
    return c
  })

  return {
    ...encounter,
    combatants: updatedCombatants,
    wieldRelationships: [...encounter.wieldRelationships, relationship],
  }
}

/**
 * Remove a wield relationship and clear combatant flags.
 * Returns a new encounter object with the relationship removed (immutable).
 */
export function disengageLivingWeapon(
  encounter: Encounter,
  combatantId: string
): Encounter {
  const relationship = findWieldRelationship(encounter, combatantId)
  if (!relationship) return encounter

  const { wielderId, weaponId } = relationship

  const updatedCombatants = encounter.combatants.map(c => {
    if (c.id === wielderId) {
      const { wieldingWeaponId, ...rest } = c
      return rest as Combatant
    }
    if (c.id === weaponId) {
      const { wieldedByTrainerId, ...rest } = c
      return rest as Combatant
    }
    return c
  })

  return {
    ...encounter,
    combatants: updatedCombatants,
    wieldRelationships: encounter.wieldRelationships.filter(
      r => r.wielderId !== relationship.wielderId
    ),
  }
}

/**
 * Check if a combatant is currently being wielded as a Living Weapon.
 */
export function isWielded(combatant: Combatant): boolean {
  return combatant.wieldedByTrainerId !== undefined
}

/**
 * Check if a combatant is currently wielding a Living Weapon.
 */
export function isWielding(combatant: Combatant): boolean {
  return combatant.wieldingWeaponId !== undefined
}

/**
 * Get the wielded Pokemon combatant for a trainer.
 * Returns null if the trainer is not wielding.
 */
export function getWieldedWeapon(
  encounter: Encounter,
  wielderId: string
): Combatant | null {
  const relationship = encounter.wieldRelationships.find(
    r => r.wielderId === wielderId
  )
  if (!relationship) return null

  return encounter.combatants.find(c => c.id === relationship.weaponId) ?? null
}

/**
 * Get the wielder trainer combatant for a weapon Pokemon.
 * Returns null if the Pokemon is not wielded.
 */
export function getWielder(
  encounter: Encounter,
  weaponId: string
): Combatant | null {
  const relationship = encounter.wieldRelationships.find(
    r => r.weaponId === weaponId
  )
  if (!relationship) return null

  return encounter.combatants.find(c => c.id === relationship.wielderId) ?? null
}

/**
 * Update wield relationship fainted state when a Living Weapon Pokemon faints.
 * PTU p.305: fainted Living Weapons are still usable as inanimate equipment.
 * Returns updated encounter (immutable).
 */
export function updateWieldFaintedState(
  encounter: Encounter,
  weaponCombatantId: string,
  isFainted: boolean
): Encounter {
  const updatedRelationships = encounter.wieldRelationships.map(r => {
    if (r.weaponId === weaponCombatantId) {
      return { ...r, isFainted }
    }
    return r
  })

  return {
    ...encounter,
    wieldRelationships: updatedRelationships,
  }
}
```

#### Combat Skill Rank Validation

The wielder must have the required Combat skill rank to use the weapon:

```typescript
import type { SkillRank } from '~/types/character'

const SKILL_RANK_ORDER: readonly SkillRank[] = [
  'Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master'
]

/**
 * Check if a skill rank meets or exceeds a required rank.
 */
export function meetsSkillRequirement(
  actualRank: SkillRank | undefined,
  requiredRank: SkillRank
): boolean {
  const actual = actualRank ?? 'Untrained'
  return SKILL_RANK_ORDER.indexOf(actual) >= SKILL_RANK_ORDER.indexOf(requiredRank)
}
```

For Living Weapon:
- Simple weapons (Honedge, Doublade) require Novice Combat. PTU weapon proficiency: Simple weapons need Novice rank.
- Fine weapons (Aegislash) require Adept Combat. PTU weapon proficiency: Fine weapons need Adept rank.

#### WebSocket Events

Two new event types for real-time sync:

```typescript
// living_weapon_engage: broadcast when a trainer engages a Living Weapon
{
  type: 'living_weapon_engage',
  encounterId: string,
  wieldRelationship: WieldRelationship,
}

// living_weapon_disengage: broadcast when a wield relationship is broken
{
  type: 'living_weapon_disengage',
  encounterId: string,
  wielderId: string,
  weaponId: string,
}
```

These follow the existing pattern of combat events (`damage_applied`, `status_change`, etc.) and are relayed by the WebSocket server to all clients in the encounter room.

#### Encounter Start / End

- **Encounter start:** `wieldRelationships` is initialized to `[]`. No one is wielded at combat start.
- **Encounter end:** Wield relationships are discarded (encounter-scoped data). No cleanup needed.
- **Combatant removal:** If a wielded Pokemon or wielding trainer is removed from the encounter, the wield relationship is automatically dissolved (disengage without action cost).

### P0 Data Flow

```
1. Pokemon has "Living Weapon" in otherCapabilities
   -> getLivingWeaponConfig() returns LivingWeaponConfig

2. Trainer uses "Engage" action (Standard Action)
   -> POST /api/encounters/:id/living-weapon/engage
   -> Validates: adjacency, capability, skill rank, not already wielding
   -> Creates WieldRelationship on Encounter
   -> Sets combatant flags (wieldingWeaponId, wieldedByTrainerId)
   -> Broadcasts living_weapon_engage

3. Either party uses "Disengage" action (Swift Action)
   -> POST /api/encounters/:id/living-weapon/disengage
   -> Removes WieldRelationship
   -> Clears combatant flags
   -> Broadcasts living_weapon_disengage

4. Undo/redo captures full encounter state including wieldRelationships
```

---
