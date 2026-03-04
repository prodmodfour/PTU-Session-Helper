# P0 Specification: Manual Vision Toggle + Client-Side Penalty Negation

## A. Vision Rules Utility

### Problem

No code exists to determine whether a combatant should be exempt from darkness-based accuracy penalties. The `environmentAccuracyPenalty` computed in `useMoveCalculation.ts` applies the same flat penalty to every combatant, regardless of Darkvision or Blindsense.

### Design Decision: Pure Utility Functions

Vision negation checks are pure functions in a new utility file (`app/utils/visionRules.ts`). This follows the same pattern as `weatherRules.ts` -- pure logic shared between client and server, auto-imported by Nuxt.

Rationale:
- Vision negation is a PTU rules question (capability lookup), not a DB question
- Pure functions are trivially testable
- Both client (accuracy display) and server (damage calculation) need the same logic

### New Utility: `app/utils/visionRules.ts`

```typescript
/**
 * PTU 1.05 Vision Capability Rules
 *
 * Pure functions for Darkvision/Blindsense checks against
 * darkness-based accuracy penalties (decree-048).
 *
 * Darkvision (PTU 10-indices:65-68):
 *   "Never has their vision hampered by a loss of light.
 *    They can even see in total darkness and are never Blind
 *    or affected by Total Blindness due to low-light conditions."
 *
 * Blindsense (PTU 10-indices:37-46):
 *   "Can function even in complete darkness, as if they had Darkvision,
 *    and they can never be Blinded."
 */

import type { Combatant, EnvironmentPreset, AccuracyPenaltyEffect } from '~/types/encounter'

// ============================================
// TYPES
// ============================================

export type VisionCapability = 'darkvision' | 'blindsense'
export type VisionCapabilitySource = 'manual' | 'species' | 'equipment'

export interface CombatantVisionState {
  capabilities: VisionCapability[]
  sources: Record<VisionCapability, VisionCapabilitySource>
}

// ============================================
// CONSTANTS
// ============================================

/** Preset IDs whose accuracy penalties are negated by Darkvision/Blindsense */
export const DARKNESS_PRESET_IDS = ['dim-cave', 'dark-cave'] as const

/** All vision capabilities */
export const ALL_VISION_CAPABILITIES: VisionCapability[] = ['darkvision', 'blindsense']

/** Display labels */
export const VISION_CAPABILITY_LABELS: Record<VisionCapability, string> = {
  darkvision: 'Darkvision',
  blindsense: 'Blindsense'
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Check if a preset's accuracy penalties are darkness-based
 * and therefore negatable by vision capabilities.
 *
 * Only canonical darkness presets (dim-cave, dark-cave) qualify.
 * Custom presets with accuracy penalties are NOT auto-negated.
 */
export function isDarknessBasedPreset(presetId: string): boolean {
  return (DARKNESS_PRESET_IDS as readonly string[]).includes(presetId)
}

/**
 * Check if a combatant has any vision capability.
 */
export function hasVisionCapability(combatant: Combatant): boolean {
  return (combatant.visionState?.capabilities?.length ?? 0) > 0
}

/**
 * Check if a combatant has a specific vision capability.
 */
export function hasSpecificVision(
  combatant: Combatant,
  capability: VisionCapability
): boolean {
  return combatant.visionState?.capabilities?.includes(capability) ?? false
}

/**
 * Calculate the effective environment accuracy penalty for the attacker,
 * accounting for their vision capabilities.
 *
 * The penalty applies to the ATTACKER (the one rolling accuracy).
 * A combatant with Darkvision sees in darkness and is not penalized.
 *
 * @param preset - Active environment preset (null = no preset)
 * @param attackerVisionState - Attacker's vision capabilities
 * @returns Total accuracy penalty after vision negation
 */
export function getEffectiveEnvironmentPenalty(
  preset: EnvironmentPreset | null | undefined,
  attackerVisionState: CombatantVisionState | undefined
): number {
  if (!preset) return 0

  let penalty = 0
  for (const effect of preset.effects) {
    if (effect.type !== 'accuracy_penalty' || !effect.accuracyPenalty) continue

    // Check if this penalty is darkness-based and negatable
    if (isDarknessBasedPreset(preset.id) && attackerVisionState?.capabilities?.length) {
      // Any vision capability (Darkvision or Blindsense) negates darkness penalties
      // per PTU RAW: both fully negate Blindness and Total Blindness from darkness
      continue  // Skip this penalty — negated by vision
    }

    penalty += effect.accuracyPenalty
  }

  return penalty
}
```

### Design Notes

- **Attacker-centric:** The penalty applies to the accuracy roll, which belongs to the attacker. If a Zubat (Blindsense) attacks in a dark cave, it hits normally. If a Charmander (no vision capability) attacks the same Zubat, the Charmander still suffers the penalty.
- **Binary negation:** Vision fully negates the penalty (0), not partially. PTU RAW says Darkvision means "never Blind or affected by Total Blindness due to low-light conditions" -- there is no partial reduction.
- **Custom presets excluded:** Only `dim-cave` and `dark-cave` are auto-negated. A GM-created "Smoke Bomb" preset with an accuracy penalty would NOT be negated by Darkvision, because smoke is not darkness.

---

## B. Combatant Type Extension

### Problem

The `Combatant` interface has no field for vision capabilities.

### Change: `app/types/encounter.ts`

Add `visionState` as an optional field on the Combatant interface:

```typescript
export interface Combatant {
  // ... existing fields (after forecastOriginalTypes) ...

  // Per-combatant Darkvision/Blindsense tracking (decree-048, feature-025)
  // Combat-scoped — not persisted to the Pokemon/HumanCharacter DB record.
  // GM toggles manually in P0; P1 auto-detects from species capabilities.
  /** Vision capabilities that negate darkness accuracy penalties */
  visionState?: CombatantVisionState
}
```

Import the type from `visionRules.ts`:
```typescript
import type { CombatantVisionState } from '~/utils/visionRules'
```

### Backward Compatibility

- `visionState` is optional (`?`), so existing encounters parse without errors.
- When `visionState` is `undefined`, `getEffectiveEnvironmentPenalty` returns the full penalty (no negation). This matches current behavior.

---

## C. GM Toggle UI

### Problem

The GM has no way to mark a combatant as having Darkvision or Blindsense during an encounter.

### New Component: `app/components/encounter/VisionCapabilityToggle.vue`

A small inline toggle shown in the CombatantCard's GM actions area. Appears only when a darkness-based environment preset is active, to avoid clutter in non-dark encounters.

```
+---------------------------------------------+
| [CombatantCard: Zubat]                      |
|   Lv.12  Poison/Flying                      |
|   ████████████████████  45/45 HP             |
|   [Blindsense] ✓                            |
|   Status: ---                                |
+---------------------------------------------+

| [CombatantCard: Charmander]                 |
|   Lv.8  Fire                                |
|   ██████████████░░░░░░  30/38 HP             |
|   [Darkvision] ☐  [Blindsense] ☐            |
|   Status: ---                                |
+---------------------------------------------+
```

Implementation:

```vue
<!-- app/components/encounter/VisionCapabilityToggle.vue -->
<template>
  <div v-if="showVisionToggles" class="vision-toggle">
    <label
      v-for="cap in ALL_VISION_CAPABILITIES"
      :key="cap"
      class="vision-toggle__item"
    >
      <input
        type="checkbox"
        :checked="hasCap(cap)"
        @change="toggleVision(cap, ($event.target as HTMLInputElement).checked)"
      />
      <span class="vision-toggle__label">{{ VISION_CAPABILITY_LABELS[cap] }}</span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ALL_VISION_CAPABILITIES, VISION_CAPABILITY_LABELS, hasSpecificVision } from '~/utils/visionRules'
import type { VisionCapability } from '~/utils/visionRules'

const props = defineProps<{
  combatant: Combatant
  showVisionToggles: boolean
}>()

const emit = defineEmits<{
  toggleVision: [capability: VisionCapability, enabled: boolean]
}>()

const hasCap = (cap: VisionCapability) => hasSpecificVision(props.combatant, cap)

const toggleVision = (cap: VisionCapability, enabled: boolean) => {
  emit('toggleVision', cap, enabled)
}
</script>
```

### Visibility Condition

The toggle only appears when:
1. The encounter has an active environment preset, AND
2. The preset is a darkness-based preset (`isDarknessBasedPreset(preset.id)`)

This keeps the UI clean for non-dark encounters. The GM can always override by setting a darkness preset.

### Parent Integration (CombatantCard.vue)

CombatantCard receives a new prop `showVisionToggles` and emits `toggleVision`. The parent page wires this to the encounter store action.

---

## D. Accuracy Penalty Integration

### Problem

`environmentAccuracyPenalty` in `useMoveCalculation.ts` is a global computed that returns the same penalty for all targets. It needs to become attacker-aware.

### Change: `app/composables/useMoveCalculation.ts`

Replace the global `environmentAccuracyPenalty` computed with a function that checks the attacker's vision state:

```typescript
// BEFORE (global, same for all):
const environmentAccuracyPenalty = computed((): number => {
  const preset = encounterStore.activeEnvironmentPreset
  if (!preset) return 0
  let penalty = 0
  for (const effect of preset.effects) {
    if (effect.type === 'accuracy_penalty' && effect.accuracyPenalty) {
      penalty += effect.accuracyPenalty
    }
  }
  return penalty
})

// AFTER (attacker-aware):
const environmentAccuracyPenalty = computed((): number => {
  const preset = encounterStore.activeEnvironmentPreset
  if (!preset) return 0
  // per decree-048: Darkvision/Blindsense negate darkness penalties
  return getEffectiveEnvironmentPenalty(preset, actor.value.visionState)
})
```

The `getAccuracyThreshold` function already uses `environmentAccuracyPenalty.value`, so no further changes are needed in the threshold calculation. The penalty is now 0 for attackers with Darkvision/Blindsense in darkness presets.

### Import Addition

```typescript
import { getEffectiveEnvironmentPenalty } from '~/utils/visionRules'
```

---

## E. Vision Indicator on CombatantCard

### Problem

No visual feedback shows which combatants have vision capabilities.

### Change: `app/components/encounter/CombatantCard.vue`

Add a small badge near the combatant name or below the type badges:

```vue
<!-- Vision capability indicator (decree-048, feature-025) -->
<div v-if="hasVision" class="combatant-card__vision">
  <PhEye :size="14" weight="bold" />
  <span v-if="hasDarkvision">Darkvision</span>
  <span v-if="hasBlindsense">Blindsense</span>
</div>
```

Uses the Phosphor `PhEye` icon (no emojis per project rules). The indicator is subtle -- a small icon with text, styled with a muted color. It only appears when the combatant has at least one vision capability.

### Computed Properties

```typescript
const hasVision = computed(() => hasVisionCapability(props.combatant))
const hasDarkvision = computed(() => hasSpecificVision(props.combatant, 'darkvision'))
const hasBlindsense = computed(() => hasSpecificVision(props.combatant, 'blindsense'))
```

---

## F. Store Action + API Endpoint

### Problem

No mechanism exists to persist a vision capability toggle.

### Store Action: `app/stores/encounter.ts`

```typescript
async toggleVisionCapability(
  combatantId: string,
  capability: VisionCapability,
  enabled: boolean
) {
  if (!this.encounter) return

  try {
    const response = await $fetch(
      `/api/encounters/${this.encounter.id}/combatants/${combatantId}/vision`,
      {
        method: 'POST',
        body: { capability, enabled, source: 'manual' }
      }
    )
    if (response.success) {
      this.encounter = response.data
      getHistory().pushSnapshot('Toggle vision capability')
    }
  } catch (e) {
    alert(`Failed to toggle vision capability: ${e}`)
  }
}
```

### API Endpoint: `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts`

```typescript
/**
 * Toggle a vision capability on a combatant.
 * POST /api/encounters/:id/combatants/:combatantId/vision
 *
 * Body: { capability: 'darkvision' | 'blindsense', enabled: boolean, source?: string }
 *
 * Per decree-048: Darkvision/Blindsense negate darkness accuracy penalties.
 */
export default defineEventHandler(async (event) => {
  const encounterId = getRouterParam(event, 'id')!
  const combatantId = getRouterParam(event, 'combatantId')!
  const body = await readBody(event)

  const { capability, enabled, source = 'manual' } = body

  // Validate capability
  if (!['darkvision', 'blindsense'].includes(capability)) {
    throw createError({ statusCode: 400, message: `Invalid vision capability: ${capability}` })
  }

  // Load encounter
  const encounter = await prisma.encounter.findUnique({ where: { id: encounterId } })
  if (!encounter) {
    throw createError({ statusCode: 404, message: 'Encounter not found' })
  }

  const combatants = JSON.parse(encounter.combatants as string)
  const combatant = combatants.find((c: any) => c.id === combatantId)
  if (!combatant) {
    throw createError({ statusCode: 404, message: 'Combatant not found' })
  }

  // Initialize visionState if absent
  if (!combatant.visionState) {
    combatant.visionState = { capabilities: [], sources: {} }
  }

  if (enabled) {
    // Add capability if not already present
    if (!combatant.visionState.capabilities.includes(capability)) {
      combatant.visionState.capabilities.push(capability)
    }
    combatant.visionState.sources[capability] = source
  } else {
    // Remove capability
    combatant.visionState.capabilities = combatant.visionState.capabilities.filter(
      (c: string) => c !== capability
    )
    delete combatant.visionState.sources[capability]
  }

  // Clean up: remove visionState entirely if empty
  if (combatant.visionState.capabilities.length === 0) {
    delete combatant.visionState
  }

  // Persist
  await prisma.encounter.update({
    where: { id: encounterId },
    data: { combatants: JSON.stringify(combatants) }
  })

  // Return full encounter response (standard pattern)
  const updatedEncounter = await buildEncounterResponse(encounterId)
  return { success: true, data: updatedEncounter }
})
```

This follows the existing pattern of per-combatant endpoints (e.g., status conditions, stage modifiers).

---

## Implementation Order

1. Create `app/utils/visionRules.ts` with types and pure functions
2. Add `visionState` to `Combatant` in `app/types/encounter.ts`
3. Create `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts`
4. Add `toggleVisionCapability` action to `app/stores/encounter.ts`
5. Update `environmentAccuracyPenalty` in `app/composables/useMoveCalculation.ts`
6. Create `VisionCapabilityToggle.vue` component
7. Integrate toggle and indicator into `CombatantCard.vue`
