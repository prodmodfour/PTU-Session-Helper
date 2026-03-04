# Shared Specifications

## Vision Capability Model

Per-combatant vision capabilities are stored as an optional field on the `Combatant` interface. These are combat-scoped overrides -- not persisted to the Pokemon or HumanCharacter DB records. The GM toggles them during encounters; they reset when the encounter ends.

### Vision Capability Type

```typescript
// app/utils/visionRules.ts

/**
 * Vision capabilities that negate darkness-based accuracy penalties.
 * PTU 10-indices-and-reference.md pp.37-46, 65-68.
 *
 * - 'darkvision': Negates Blindness and Total Blindness from low-light (PTU p.65-68)
 * - 'blindsense': Negates Blindness and Total Blindness; functions in complete darkness (PTU p.37-46)
 *
 * Both are functionally equivalent for darkness penalty negation.
 * The distinction matters for non-darkness effects (Flash, Illuminate)
 * which are out of scope for this feature.
 */
export type VisionCapability = 'darkvision' | 'blindsense'

/**
 * Per-combatant vision state.
 * Stored on the Combatant struct (JSON within encounter combatants blob).
 * Combat-scoped -- not persisted to entity DB records.
 */
export interface CombatantVisionState {
  /** Active vision capabilities for this combatant */
  capabilities: VisionCapability[]
  /** Source of each capability: 'manual' (GM toggle), 'species' (auto-detected), 'equipment' (goggles) */
  sources: Record<VisionCapability, VisionCapabilitySource>
}

export type VisionCapabilitySource = 'manual' | 'species' | 'equipment'
```

### Combatant Type Extension

```typescript
// app/types/encounter.ts — additions to Combatant interface

export interface Combatant {
  // ... existing fields ...

  // Per-combatant Darkvision/Blindsense tracking (decree-048, feature-025)
  // Combat-scoped — not persisted to the Pokemon/HumanCharacter DB record.
  // GM can toggle manually; P1 auto-detects from species capabilities.
  /** Vision capabilities that negate darkness-based accuracy penalties */
  visionState?: CombatantVisionState
}
```

The field is optional (`?`) so existing encounters without vision state continue to work. When `visionState` is undefined, the combatant has no vision capabilities and receives the full environment penalty.

---

## Vision Rules Utility

Pure functions for checking vision capabilities against environment presets. Follows the same pattern as `weatherRules.ts` -- shared between client and server, auto-imported via Nuxt `utils/`.

### Core Functions

```typescript
// app/utils/visionRules.ts

import type { Combatant, EnvironmentPreset, AccuracyPenaltyEffect } from '~/types/encounter'

/**
 * Check if a combatant's vision capabilities negate a specific accuracy penalty effect.
 *
 * Rules:
 * - Darkvision negates Blindness (-6) and Total Blindness (-10) from darkness
 * - Blindsense negates Blindness (-6) and Total Blindness (-10) from darkness
 * - Both capabilities are equivalent for darkness negation purposes
 *
 * The check matches on the accuracy_penalty effect's description text to determine
 * whether it's a darkness-based penalty (Blindness/Total Blindness).
 * Non-darkness accuracy penalties (e.g., smoke, magical effects) are NOT negated.
 */
export function visionNegatesEffect(
  visionState: CombatantVisionState | undefined,
  effect: AccuracyPenaltyEffect
): boolean

/**
 * Calculate the effective environment accuracy penalty for a specific combatant,
 * accounting for their vision capabilities.
 *
 * @returns The total accuracy penalty after vision negation (0 if fully negated)
 */
export function getEffectiveEnvironmentPenalty(
  preset: EnvironmentPreset | null | undefined,
  visionState: CombatantVisionState | undefined
): number

/**
 * Check if a combatant has any vision capability (Darkvision or Blindsense).
 * Convenience function for UI indicators.
 */
export function hasVisionCapability(combatant: Combatant): boolean

/**
 * Check if a combatant has a specific vision capability.
 */
export function hasSpecificVision(
  combatant: Combatant,
  capability: VisionCapability
): boolean
```

### Darkness Detection Heuristic

The system needs to distinguish darkness-based accuracy penalties from other penalty sources. Since `AccuracyPenaltyEffect` is a generic type, we use the description text and the preset ID to determine darkness context:

```typescript
// app/utils/visionRules.ts

/**
 * Darkness-related preset IDs. Accuracy penalties from these presets
 * can be negated by Darkvision/Blindsense.
 */
export const DARKNESS_PRESET_IDS = ['dim-cave', 'dark-cave'] as const

/**
 * Check if an accuracy penalty effect is darkness-based.
 * Uses preset ID matching -- only known darkness presets are negatable.
 * Custom presets with accuracy penalties are NOT auto-negated (GM discretion).
 */
export function isDarknessBasedPreset(presetId: string): boolean {
  return DARKNESS_PRESET_IDS.includes(presetId as any)
}
```

This approach avoids fragile text matching on description strings. Only the two canonical darkness presets (dim-cave, dark-cave) are automatically negated. Custom presets with accuracy penalties require GM judgment.

---

## Environment Preset Extension

To support per-combatant negation, we need to thread the preset ID through to the penalty calculation. The current `EnvironmentPreset` type already has an `id` field, so no type changes are needed.

The accuracy penalty calculation in `useMoveCalculation.ts` changes from a global computed to a per-target function:

```typescript
// Current (global, same for all targets):
const environmentAccuracyPenalty = computed((): number => { ... })

// New (per-target, checks attacker vision):
function getEnvironmentAccuracyPenalty(attackerId: string): number
```

The penalty applies to the **attacker** (the one making the accuracy roll), not the target. A combatant with Darkvision can see in darkness and hits normally; a combatant without Darkvision suffers the penalty regardless of target.

---

## Data Flow

```
ENVIRONMENT ACCURACY PENALTY WITH VISION (P0):

  MoveTargetModal → getAccuracyThreshold(targetId)
       |
       v
  getEnvironmentAccuracyPenalty()
       |
       v
  Is environment preset active?
       |
       NO ──> return 0
       |
       YES
       |
       v
  Is preset a darkness-based preset? (dim-cave / dark-cave)
       |
       NO ──> return full penalty (vision doesn't negate non-darkness)
       |
       YES
       |
       v
  Does the ATTACKER have Darkvision or Blindsense?
       |
       YES ──> return 0 (penalty fully negated)
       |
       NO ──> return full penalty
```

---

## Constants

```typescript
// app/utils/visionRules.ts

/** Preset IDs whose accuracy penalties are negated by Darkvision/Blindsense */
export const DARKNESS_PRESET_IDS = ['dim-cave', 'dark-cave'] as const

/** All vision capabilities recognized by the system */
export const ALL_VISION_CAPABILITIES: VisionCapability[] = ['darkvision', 'blindsense']

/** Display labels for vision capabilities */
export const VISION_CAPABILITY_LABELS: Record<VisionCapability, string> = {
  darkvision: 'Darkvision',
  blindsense: 'Blindsense'
}
```

---

## No Schema Changes Required

Vision state is stored within the Combatant JSON blob (the `combatants` column on the Encounter model is a JSON string). Adding `visionState` to the Combatant interface requires no Prisma schema changes -- it's just a new optional property within the existing JSON structure.

Existing encounters without `visionState` on their combatants will have `undefined`, which is handled as "no vision capabilities" (full penalty applies). This is backward-compatible.

---

## API Contracts

### New Endpoint: Toggle Vision Capability

```
POST /api/encounters/:id/combatants/:combatantId/vision
```

Request body:
```typescript
{
  capability: VisionCapability   // 'darkvision' | 'blindsense'
  enabled: boolean               // true to add, false to remove
  source?: VisionCapabilitySource // defaults to 'manual'
}
```

Response: Updated `Encounter` object (standard pattern).

This follows the existing pattern of `POST /api/encounters/:id/combatants/:combatantId/status` for per-combatant state changes.

### Extended Damage Calculation (P1 — server-side)

The `POST /api/encounters/:id/calculate-damage` endpoint needs to accept the attacker's vision state to apply correct penalty. Currently it receives the environment preset but not per-combatant vision data. P1 adds:

```typescript
// In calculate-damage request body:
{
  // ... existing fields ...
  attackerVisionState?: CombatantVisionState  // P1: vision capabilities
}
```

---

## Undo/Redo Compatibility

Vision state lives within the Combatant struct, which is captured by the existing undo/redo snapshot system (`JSON.parse(JSON.stringify(encounter))`). Toggling a vision capability produces a new snapshot, and undo restores the previous vision state. No special handling needed.

---

## WebSocket Compatibility

Vision state changes are broadcast via the existing `encounter_update` event, which includes the full combatant array. Group View and Player View will see updated vision indicators automatically. No new WebSocket event type is needed for P0.

---

## Files Changed Summary (All Tiers)

### P0 (Manual Toggle + Client-Side Penalty Negation)
| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/utils/visionRules.ts` | Vision capability types, negation logic, darkness detection |
| **NEW** | `app/components/encounter/VisionCapabilityToggle.vue` | GM toggle for Darkvision/Blindsense per combatant |
| **EDIT** | `app/types/encounter.ts` | Add `visionState` to Combatant interface |
| **EDIT** | `app/composables/useMoveCalculation.ts` | Per-attacker environment penalty with vision check |
| **EDIT** | `app/components/encounter/CombatantCard.vue` | Vision capability indicator |
| **EDIT** | `app/stores/encounter.ts` | Action to toggle vision capability via API |
| **NEW** | `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts` | Vision toggle endpoint |

### P1 (Auto-Detection + Server-Side Integration)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/visionRules.ts` | Species capability parsing, auto-detection functions |
| **EDIT** | `app/server/services/combatant.service.ts` | Auto-populate visionState from species data on combatant build |
| **EDIT** | `app/server/api/encounters/[id]/calculate-damage.post.ts` | Pass attacker vision to penalty calculation |
| **EDIT** | `app/components/encounter/CombatantCard.vue` | Light source indicator |
| **EDIT** | `app/components/encounter/MoveTargetModal.vue` | Show negated penalty in accuracy breakdown |

### P2 (Equipment, Bulk Toggle, Enhanced UI)
| Action | File | Description |
|--------|------|-------------|
| **EDIT** | `app/utils/visionRules.ts` | Equipment-based vision detection (Dark Vision Goggles) |
| **EDIT** | `app/components/encounter/EnvironmentSelector.vue` | Bulk vision toggle button |
| **EDIT** | `app/components/encounter/CombatantCard.vue` | Enhanced vision tooltip with preset context |
| **EDIT** | `app/server/routes/ws.ts` | Vision state in WebSocket encounter sync |
