# P1 Specification: Auto-Detection + Server-Side Integration

## E. Auto-Detect Vision from Pokemon Species Capabilities

### Problem

P0 requires the GM to manually toggle Darkvision/Blindsense for every combatant. This is tedious for encounters with many Pokemon, especially when the species data already contains capability information.

### Current State of Species Data

The `SpeciesData` model stores capabilities as a text string field (`capabilities: String`). Example values:

- Zubat: `"Overland 1, Sky 4, Jump 2/2, Power 1, Intelligence 2, Blindsense"`
- Hoothoot: `"Overland 2, Sky 5, Jump 2/2, Power 1, Intelligence 3, Darkvision"`
- Charmander: `"Overland 4, Surface 2, Jump 3/3, Power 1, Intelligence 3, Blaze"`

Darkvision and Blindsense are listed as plain capability names within the comma-separated list.

### Design Decision: Parse at Combatant Build Time

When a combatant is built for an encounter (via `combatant.service.buildCombatantFromEntity`), check the Pokemon's species capabilities for Darkvision/Blindsense and auto-populate `visionState` with `source: 'species'`.

This avoids runtime parsing on every accuracy check and follows the existing pattern where combatant properties are computed at build time (e.g., evasions, initiative).

### Change: `app/utils/visionRules.ts`

Add a parsing function:

```typescript
/**
 * Parse vision capabilities from a Pokemon species' capability string.
 * Capabilities are comma-separated values like:
 *   "Overland 4, Sky 6, Jump 3/3, Power 2, Intelligence 4, Darkvision"
 *
 * @param capabilityString - Raw capability text from SpeciesData
 * @returns Array of detected vision capabilities
 */
export function parseVisionFromCapabilities(
  capabilityString: string | null | undefined
): VisionCapability[] {
  if (!capabilityString) return []

  const caps: VisionCapability[] = []
  const normalized = capabilityString.toLowerCase()

  // Check for exact capability names within comma-separated list
  const segments = normalized.split(',').map(s => s.trim())

  for (const segment of segments) {
    if (segment === 'darkvision') caps.push('darkvision')
    if (segment === 'blindsense') caps.push('blindsense')
  }

  return caps
}
```

### Change: `app/server/services/combatant.service.ts`

In `buildCombatantFromEntity`, after the existing combatant construction, auto-populate `visionState` for Pokemon combatants:

```typescript
import { parseVisionFromCapabilities } from '~/utils/visionRules'
import type { CombatantVisionState, VisionCapability } from '~/utils/visionRules'

// Inside buildCombatantFromEntity, after existing combatant construction:

// Auto-detect vision capabilities from species data (P1, feature-025)
if (entityType === 'pokemon') {
  const pokemon = entity as Pokemon
  // Species capabilities are stored on the species data, not the individual Pokemon
  // We need to look up the species' capability string
  const speciesData = await getSpeciesData(pokemon.species)
  if (speciesData?.capabilities) {
    const detectedVision = parseVisionFromCapabilities(speciesData.capabilities)
    if (detectedVision.length > 0) {
      const sources: Record<VisionCapability, VisionCapabilitySource> = {} as any
      for (const cap of detectedVision) {
        sources[cap] = 'species'
      }
      combatant.visionState = {
        capabilities: detectedVision,
        sources
      }
    }
  }
}
```

### Manual Override Preserved

If the GM manually toggles a vision capability after auto-detection, the manual toggle takes precedence. The `source` field tracks provenance:
- `'species'` — auto-detected from species data
- `'manual'` — GM toggled it on/off

The vision toggle endpoint (P0) already handles add/remove. If the GM removes an auto-detected capability, it stays removed (the combatant's `visionState` is the source of truth, not the species data). Auto-detection only runs at combatant build time.

---

## F. Light Source Tracking

### Problem

PTU rules specify that light sources illuminate a burst area around them, reducing darkness severity. A Pokemon with Illuminate or a trainer carrying a lantern creates a lit area that negates Blindness (but not necessarily Total Blindness unless the light is strong enough).

### Design Decision: Defer to P2

Light source tracking requires spatial awareness (burst range around the light source position) and interaction with the VTT grid system. This is significantly more complex than the binary per-combatant toggle.

For P1, light sources remain a GM text note (the `custom` effect in the presets already describes light source rules). The GM can manually grant Darkvision to combatants within light source range as a workaround.

### Rationale

- Light source range is position-dependent and changes as tokens move
- Different light sizes (small/medium/large Pokemon) have different burst radii
- Illuminate ability modifies the radius
- Implementing this properly requires integrating with the VTT burst measurement system
- The manual toggle from P0 provides a sufficient workaround

---

## G. Server-Side Accuracy Penalty Integration

### Problem

The `POST /api/encounters/:id/calculate-damage` endpoint currently does not account for per-combatant vision capabilities when calculating accuracy thresholds.

### Current State

The calculate-damage endpoint receives an encounter ID and can look up the environment preset, but it applies the same global penalty. The client-side composable (P0) already handles vision negation for the GM's accuracy display, but the server needs parity for:
- Automated damage calculations (e.g., future auto-resolve features)
- Data integrity (server is the source of truth for combat outcomes)

### Change: `app/server/api/encounters/[id]/calculate-damage.post.ts`

Look up the attacker combatant's `visionState` from the encounter's combatants array and pass it through to the penalty calculation:

```typescript
import { getEffectiveEnvironmentPenalty } from '~/utils/visionRules'

// In the damage calculation handler:

// Get environment penalty accounting for attacker vision (feature-025)
const attackerCombatant = combatants.find(c => c.id === attackerId)
const environmentPenalty = getEffectiveEnvironmentPenalty(
  encounter.environmentPreset,
  attackerCombatant?.visionState
)
```

This replaces the current global penalty lookup with the per-combatant-aware function.

### Change: `app/components/encounter/MoveTargetModal.vue`

Show the penalty negation in the accuracy breakdown when the attacker has vision capabilities:

```vue
<!-- Accuracy breakdown detail -->
<div v-if="environmentPenaltyNegated" class="accuracy-detail accuracy-detail--negated">
  <PhEye :size="14" />
  Darkness penalty negated ({{ attackerVisionLabel }})
</div>
```

New computed:

```typescript
const environmentPenaltyNegated = computed(() => {
  const preset = encounterStore.activeEnvironmentPreset
  if (!preset || !isDarknessBasedPreset(preset.id)) return false
  return hasVisionCapability(actor.value)
})

const attackerVisionLabel = computed(() => {
  if (hasSpecificVision(actor.value, 'blindsense')) return 'Blindsense'
  if (hasSpecificVision(actor.value, 'darkvision')) return 'Darkvision'
  return ''
})
```

---

## P2 Specification: Equipment, Bulk Toggle, Enhanced UI

### H. Dark Vision Goggles Equipment Integration

When the equipment system tracks worn items, check for "Dark Vision Goggles" in the trainer's equipment and auto-grant Darkvision with `source: 'equipment'`. This depends on the equipment system supporting parsed item effects (currently equipment is represented as stat bonuses, not capability grants).

### I. Bulk Vision Toggle

Add a button to the EnvironmentSelector component: "Set Vision for All" that opens a modal allowing the GM to toggle Darkvision/Blindsense for multiple combatants at once. Useful when setting up a dark cave encounter with many combatants.

```
[Environment: Dark Cave]
[Set Vision for All...]
  ┌─────────────────────────────────┐
  │ Bulk Vision Toggle              │
  │                                 │
  │ ☑ Zubat (Blindsense - species) │
  │ ☐ Charmander                    │
  │ ☑ Hoothoot (Darkvision - species)│
  │ ☐ Trainer: Ash                  │
  │                                 │
  │ [Apply]  [Cancel]               │
  └─────────────────────────────────┘
```

### J. Preset-Aware Vision Tooltips

Enhance the CombatantCard vision indicator to show contextual information:
- When a darkness preset is active: "Darkvision: Darkness penalty negated (-6 Blindness)"
- When no darkness preset: "Darkvision: No darkness penalties active"
- For combatants without vision: "No Darkvision -- suffering -6 Blindness penalty"

### K. WebSocket Sync for Vision State

Vision state is already included in the combatants JSON blob, which is broadcast via `encounter_update`. For P2, add explicit vision change events for real-time Group View updates:

```typescript
// New WebSocket event
{
  type: 'vision_change',
  data: {
    combatantId: string,
    capability: VisionCapability,
    enabled: boolean
  }
}
```

This enables the Group View to show visual feedback (e.g., a brief flash on the CombatantCard) when the GM toggles vision, rather than silently updating on the next full encounter sync.

---

## Implementation Order (P1)

1. Add `parseVisionFromCapabilities` to `app/utils/visionRules.ts`
2. Wire auto-detection into `combatant.service.ts` buildCombatantFromEntity
3. Update `calculate-damage.post.ts` to use per-combatant vision penalty
4. Add negation indicator to MoveTargetModal accuracy breakdown
5. Write unit tests for species capability parsing
