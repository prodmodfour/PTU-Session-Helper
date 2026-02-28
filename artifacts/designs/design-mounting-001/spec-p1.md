# P1 Specification: VTT Integration, Dismount Checks, Edge Effects, UI

## E. VTT Linked Token Movement

### Problem

When a trainer is mounted on a Pokemon, the two tokens must move as a single unit on the VTT grid. Currently, each token is independent -- moving one does not affect the other.

### Design: Stacked Token Rendering

When a rider is mounted, the rider's token is visually overlaid on the mount's token. The rider token is rendered at a smaller scale on top of the mount token, creating a clear visual "stacked" effect.

**New Component: `app/components/vtt/VTTMountedToken.vue`**

A wrapper component that renders a mount token with the rider token overlaid:

```typescript
interface Props {
  mountToken: TokenData
  riderToken: TokenData
  cellSize: number
  mountCombatant: Combatant
  riderCombatant: Combatant
  // ... all other VTTToken props forwarded
}
```

Rendering approach:
- Mount token renders at full size (normal VTTToken)
- Rider token renders at 60% scale, positioned in the lower-right quadrant of the mount token
- A small mount icon badge appears on the mount token to indicate it's carrying a rider
- Both tokens' HP bars are visible (mount full-width at bottom, rider smaller above it)

Alternative considered: Merging into a single composite token. Rejected because it loses the ability to independently select and inspect each combatant.

### Modified: VTT Grid Rendering

The VTT grid renderer must:

1. **Skip rendering rider tokens at their own position.** When a rider is mounted, their token is rendered by the `VTTMountedToken` component at the mount's position, not independently.

2. **Detect mounted pairs.** The grid renderer iterates combatants and identifies mounted pairs:

```typescript
// In grid rendering composable:
const mountedPairs = computed(() => {
  if (!encounter.value) return []
  const pairs: { mountId: string; riderId: string }[] = []
  for (const c of encounter.value.combatants) {
    if (c.mountState && !c.mountState.isMounted && c.mountState.partnerId) {
      // This is a mount -- find its rider
      pairs.push({ mountId: c.id, riderId: c.mountState.partnerId })
    }
  }
  return pairs
})

const mountedRiderIds = computed(() =>
  new Set(mountedPairs.value.map(p => p.riderId))
)
```

3. **Filter rider tokens from independent rendering:**

```typescript
// In token rendering loop:
const independentTokens = tokens.value.filter(
  t => !mountedRiderIds.value.has(t.combatantId)
)
```

### Modified: Movement Execution for Linked Pairs

When a mounted combatant is moved (either rider or mount), both tokens must update position:

**Modified: `app/stores/encounterGrid.ts` (or relevant movement handler)**

```typescript
// Movement handler modification:
async function moveToken(combatantId: string, to: GridPosition) {
  const encounter = encounterStore.encounter
  if (!encounter) return

  const combatant = encounter.combatants.find(c => c.id === combatantId)
  if (!combatant) return

  // Determine if this is a mounted pair move
  const partnerId = combatant.mountState?.partnerId
  const isMountedPair = !!partnerId

  if (isMountedPair) {
    // Move both combatants to the same position
    // Decrement movementRemaining on both
    const distance = calculateMoveDistance(combatant.position!, to)

    const updatedCombatants = encounter.combatants.map(c => {
      if (c.id === combatantId || c.id === partnerId) {
        return {
          ...c,
          position: { ...to },
          mountState: c.mountState ? {
            ...c.mountState,
            movementRemaining: Math.max(0, c.mountState.movementRemaining - distance)
          } : undefined
        }
      }
      return c
    })

    // Persist via API...
  } else {
    // Standard single-token movement (existing behavior)
  }
}
```

### Movement Speed Source for Riders

When the VTT shows movement range for a mounted rider, the range must use the mount's capabilities:

**Modified: `app/composables/useGridMovement.ts`**

The `getSpeed` and `getMaxPossibleSpeed` functions must account for mounted state:

```typescript
// In getSpeed():
if (combatant && combatant.mountState?.isMounted) {
  // Mounted rider: use mount's remaining movement
  return combatant.mountState.movementRemaining
}

// In getMaxPossibleSpeed():
if (combatant && combatant.mountState?.isMounted) {
  // For movement range display, use mount's remaining movement
  return applyMovementModifiers(combatant, combatant.mountState.movementRemaining)
}
```

**Important caveat:** The mount's movement modifiers (Slowed, Speed CS) apply to the mount's movement, not the rider's personal conditions. When a mounted rider moves, the relevant conditions are those on the MOUNT, not the rider. The mount's movement capabilities include terrain awareness (Swim, Burrow, Sky).

To handle this, the movement system must look up the mount combatant for condition checks:

```typescript
// When calculating effective movement for a mounted rider:
const mountCombatant = findCombatant(combatant.mountState.partnerId)
if (mountCombatant) {
  // Use mount's conditions for movement modifier calculations
  return applyMovementModifiers(mountCombatant, combatant.mountState.movementRemaining)
}
```

### WebSocket: Movement Preview for Mounted Pairs

When broadcasting movement previews for mounted tokens, both the rider and mount positions must be included:

```typescript
// Modified MovementPreview to support paired movement:
// Existing interface stays the same, but the broadcast includes
// a preview for BOTH combatants in the pair

if (isMountedPair) {
  broadcastMovementPreview({
    combatantId: combatantId,  // The one being actively moved
    fromPosition: from,
    toPosition: to,
    distance,
    isValid
  })
  broadcastMovementPreview({
    combatantId: partnerId,    // The partner follows
    fromPosition: from,        // Same origin (they share position)
    toPosition: to,            // Same destination
    distance,
    isValid
  })
}
```

---

## F. Dismount Check on Damage/Push

### Problem

PTU p.218 specifies two triggers for forced dismount checks:
1. The rider OR mount takes damage >= 1/4 of THEIR max HP
2. The rider or mount is hit by a Push effect
3. The mount hurts itself in Confusion

No dismount checks currently exist in the codebase.

### Design: Server-Side Dismount Check Trigger

The dismount check is triggered server-side during damage application and Push execution. The check result is included in the API response, and the GM can override the result.

**Modified: Damage Application Endpoint(s)**

After damage is calculated and applied, check if a dismount is triggered:

```typescript
// In damage application handler:
import { triggersDismountCheck, DISMOUNT_CHECK_DC, MOUNTED_PROWESS_REMAIN_BONUS, hasMountedProwess } from '~/utils/mountingRules'

// After applying damage to target...
const damagedCombatant = combatants.find(c => c.id === targetId)

// Check if damaged combatant is part of a mounted pair
let dismountCheckTriggered = false
let dismountCheckRiderId: string | null = null

if (damagedCombatant?.mountState) {
  const isRider = damagedCombatant.mountState.isMounted
  const isMount = !damagedCombatant.mountState.isMounted && damagedCombatant.mountState.partnerId

  // PTU p.218: "If either you or your Pokemon who is being used as a Mount
  // are hit by a damaging attack that deals damage equal or greater to
  // 1/4th of the target's Max Hit Points"
  // Per decree-004: use real HP damage after temp HP absorption
  if (triggersDismountCheck(damageResult.hpDamage, damagedCombatant.entity.maxHp)) {
    dismountCheckTriggered = true
    if (isRider) {
      dismountCheckRiderId = damagedCombatant.id
    } else if (isMount) {
      dismountCheckRiderId = damagedCombatant.mountState.partnerId
    }
  }
}
```

**Response includes dismount check info:**

```typescript
// Added to damage response:
dismountCheck?: {
  triggered: boolean
  riderId: string
  mountId: string
  dc: number                    // Always 10
  mountedProwessBonus: number   // +3 if rider has Mounted Prowess, 0 otherwise
  reason: 'damage' | 'push' | 'confusion'
}
```

The GM then manually resolves the check (rolls Acrobatics/Athletics vs DC 10, potentially with +3 from Mounted Prowess). If the check fails, the GM clicks "Dismount" which calls the dismount endpoint.

**Why not auto-resolve?** The app doesn't currently have an automated skill check system. Skills are recorded as ranks (Untrained/Novice/Adept/Expert/Master), not numeric modifiers. The GM manually rolls and adjudicates skill checks. Automating this would require implementing the full PTU skill check system (2d6 + skill rank bonus), which is out of scope for this feature.

### Push Effect Integration

When a Push effect hits a mounted combatant, the dismount check is triggered regardless of damage:

```typescript
// In Push maneuver handler (if/when implemented):
// Or in any move with Push keyword processing:
if (targetCombatant.mountState) {
  // Push triggers dismount check on the rider
  const riderId = targetCombatant.mountState.isMounted
    ? targetCombatant.id
    : targetCombatant.mountState.partnerId

  // Include dismount check in response
  dismountCheck = {
    triggered: true,
    riderId,
    mountId: targetCombatant.mountState.isMounted
      ? targetCombatant.mountState.partnerId
      : targetCombatant.id,
    dc: DISMOUNT_CHECK_DC,
    mountedProwessBonus: hasMountedProwess(riderCombatant) ? MOUNTED_PROWESS_REMAIN_BONUS : 0,
    reason: 'push'
  }
}
```

### Confusion Self-Damage

PTU p.218: "If a rider's mount hurts itself in Confusion, the rider must make an Acrobatics or Athletics Check with a DC of 10 to remain mounted."

When Confusion self-damage is applied to a mount, trigger a dismount check. This is handled in the same damage application path, with an additional check for self-inflicted Confusion damage.

---

## G. Mounted Prowess Edge Effect

### Problem

The Mounted Prowess edge is stored as a string in character edges but has no mechanical effect. Per PTU p.139:
- Auto-succeed mounting checks (Acrobatics/Athletics DC 10)
- +3 bonus to remain-mounted checks

### Implementation

The edge effect is integrated into the mounting rules utility and surfaced through the mount/dismount API responses:

1. **Mount endpoint:** When `hasMountedProwess(riderCombatant)` is true, the response includes `checkAutoSuccess: true`. The UI shows "Auto-success (Mounted Prowess)" instead of prompting for a roll.

2. **Dismount check:** When a dismount check is triggered, the response includes `mountedProwessBonus: 3` if the rider has the edge. The GM adds this to their roll.

No changes to the edge data model are needed -- the string matching in `hasMountedProwess()` is sufficient.

---

## H. Intercept Bonus Between Rider and Mount

### Problem

PTU p.218: "It is very easy for you and your Pokemon to Intercept attacks for each other while you are Mounted due to the lack of distance."

PTU p.242: Intercept requires being within Movement Range of the ally. For mounted pairs, this distance requirement is waived (distance = 0).

### Implementation

This is a display/reference feature, not a mechanical automation. The Intercept maneuver is not currently automated in the app -- it's tracked manually by the GM.

**Approach:** Add a visual indicator and tooltip on mounted tokens:

```typescript
// In mounted token display:
// Show "Easy Intercept" badge/tooltip on mounted pairs
// This serves as a reminder to the GM that the distance requirement is waived
```

The mount controls panel (section I) will include a note: "Rider and mount may Intercept for each other without distance requirement (PTU p.218)."

If/when the Intercept maneuver is automated in a future feature, the mounting system will need to provide a check:

```typescript
// Future: in intercept validation
export function isEasyIntercept(
  interceptorId: string,
  targetId: string,
  combatants: Combatant[]
): boolean {
  const interceptor = combatants.find(c => c.id === interceptorId)
  if (!interceptor?.mountState) return false
  return interceptor.mountState.partnerId === targetId
}
```

---

## I. UI Mount Indicators

### New Component: `app/components/encounter/MountControls.vue`

A panel in the GM encounter view that provides mount/dismount controls for the current turn's combatant.

**Displays when:**
- A human combatant's turn is active AND adjacent Pokemon have Mountable capability (show "Mount" button)
- A mounted rider's turn is active (show "Dismount" button, mount info, remaining movement)
- A ridden mount's turn is active (show rider info, remaining movement)

**Panel contents:**

```
Mount Controls:
  [If trainer, not mounted, adjacent mountable Pokemon exist]
  > Mount on: [dropdown of adjacent mountable Pokemon]
  > [Mount] button (shows action cost: "Standard Action" or "Free Action during Shift")
  > [Skip Check] checkbox (GM override)

  [If rider, currently mounted]
  > Mounted on: [mount name] (Overland [X])
  > Movement remaining: [Y]m of [X]m
  > [Dismount] button
  > Easy Intercept reminder
  > Mounted Prowess: [Active/Not Active]

  [If mount, currently carrying rider]
  > Carrying: [rider name]
  > Movement remaining: [Y]m of [X]m
  > [Standard Action available]
```

### Modified: VTT Token Display

**Modified: `app/components/vtt/VTTToken.vue`**

Add mount state visual indicators:

```typescript
// New CSS classes:
'vtt-token--mounted-rider': isMountedRider,   // Rider token (rendered small on top of mount)
'vtt-token--mounted-mount': isMountedMount,    // Mount token (has rider indicator)

// New computed:
const isMountedRider = computed(() =>
  props.combatant?.mountState?.isMounted === true
)
const isMountedMount = computed(() =>
  props.combatant?.mountState?.isMounted === false &&
  !!props.combatant?.mountState?.partnerId
)
```

**Visual treatment for mounted mount token:**
- A small rider icon badge in the top-right corner (like the size badge)
- A subtle border glow or outline to distinguish from unmounted tokens
- The rider's HP bar as a secondary thin bar above the mount's HP bar

### Modified: Initiative Tracker

The initiative tracker should show mount relationships:

- Mounted rider entries show a mount icon and the mount's name
- Ridden mount entries show a rider icon and the rider's name
- This provides at-a-glance awareness of mount relationships during turn tracking

### Encounter Store Getters and Actions

**Modified: `app/stores/encounter.ts`**

```typescript
getters: {
  // ... existing getters ...

  /** Get mount state for a specific combatant */
  getMountState: (state) => (combatantId: string): MountState | undefined => {
    const c = state.encounter?.combatants.find(c => c.id === combatantId)
    return c?.mountState
  },

  /** Get all mounted pairs in the encounter */
  mountedPairs: (state): { riderId: string; mountId: string }[] => {
    if (!state.encounter) return []
    return state.encounter.combatants
      .filter(c => c.mountState?.isMounted)
      .map(c => ({ riderId: c.id, mountId: c.mountState!.partnerId }))
  },

  /** Check if current turn combatant can mount something */
  canMount: (state): boolean => {
    // Current combatant must be human, not mounted, not fainted
    // Adjacent Pokemon must have Mountable capability
    // ... (computed from current state)
    return false // placeholder
  },

  /** Check if current turn combatant can dismount */
  canDismount: (state): boolean => {
    const current = state.encounter?.combatants.find(
      c => c.id === state.encounter!.turnOrder[state.encounter!.currentTurnIndex]
    )
    return current?.mountState?.isMounted === true
  }
},

actions: {
  // ... existing actions ...

  async mountPokemon(riderId: string, mountId: string, skipCheck?: boolean) {
    if (!this.encounter) return
    try {
      const response = await $fetch(`/api/encounters/${this.encounter.id}/mount`, {
        method: 'POST',
        body: { riderId, mountId, skipCheck }
      })
      this.encounter = response.data.encounter
      return response.data.mountResult
    } catch (e: any) {
      this.error = e.message || 'Failed to mount'
      throw e
    }
  },

  async dismountPokemon(riderId: string, forced?: boolean, skipCheck?: boolean) {
    if (!this.encounter) return
    try {
      const response = await $fetch(`/api/encounters/${this.encounter.id}/dismount`, {
        method: 'POST',
        body: { riderId, forced, skipCheck }
      })
      this.encounter = response.data.encounter
      return response.data.dismountResult
    } catch (e: any) {
      this.error = e.message || 'Failed to dismount'
      throw e
    }
  }
}
```

### WebSocket Events

New WebSocket events for mount state changes:

```typescript
// New broadcast events:
'mount_change' — { riderId, mountId, action: 'mount' | 'dismount', forced?: boolean }
```

The Group View updates its token rendering when receiving mount_change events, showing/hiding the stacked token display.

---

## Summary of File Changes (P1)

| Action | File | Description |
|--------|------|-------------|
| **NEW** | `app/components/vtt/VTTMountedToken.vue` | Stacked token rendering for mounted pairs |
| **EDIT** | `app/components/vtt/VTTToken.vue` | Mount state CSS classes, rider/mount badges |
| **NEW** | `app/components/encounter/MountControls.vue` | GM mount/dismount control panel |
| **EDIT** | `app/composables/useGridMovement.ts` | Mount-aware speed, linked pair movement, mount condition checks |
| **EDIT** | `app/stores/encounter.ts` | Mount/dismount actions, mount state getters, canMount/canDismount |
| **EDIT** | `app/stores/encounterGrid.ts` | Linked token movement for mounted pairs |
| **EDIT** | `app/server/api/encounters/[id]/damage.post.ts` (or equivalent) | Dismount check trigger on 1/4 HP damage |
| **EDIT** | `app/utils/mountingRules.ts` | Dismount check trigger logic, intercept check |
| **EDIT** | `app/server/routes/ws.ts` | Add `mount_change` broadcast event |
| **EDIT** | Initiative tracker component | Mount relationship display |
| **EDIT** | GM encounter page layout | Integrate MountControls panel |
| **EDIT** | Group encounter view | Handle mount_change events, mounted token rendering |
