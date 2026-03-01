# P0 Specification: Core Healing Item Catalog and HP Restoration

P0 covers the foundational item catalog, the apply-item service for HP restoration, the API endpoint, the encounter store integration, and basic GM UI. Status cures, revives, action economy, and inventory are deferred to P1/P2.

---

## A. Healing Item Catalog Constants

### New File: `app/constants/healingItems.ts`

Define the complete PTU healing item catalog following the same constant-catalog pattern as `equipment.ts`.

```typescript
import type { StatusCondition } from '~/types'

/**
 * Category of healing item.
 */
export type HealingItemCategory = 'restorative' | 'cure' | 'combined' | 'revive'

/**
 * Definition for a single healing item from the PTU catalog.
 */
export interface HealingItemDef {
  readonly name: string
  readonly category: HealingItemCategory
  readonly hpAmount?: number
  readonly healToFull?: boolean
  readonly healToPercent?: number
  readonly curesConditions?: readonly StatusCondition[]
  readonly curesAllPersistent?: boolean
  readonly curesAllStatus?: boolean
  readonly canRevive?: boolean
  readonly repulsive?: boolean
  readonly cost: number
  readonly description: string
}

/**
 * PTU 1.05 Healing Item Catalog
 * Standard healing items from 09-gear-and-items.md (p.276)
 *
 * Items are keyed by name. The catalog is read-only and shared
 * between client and server.
 */
export const HEALING_ITEM_CATALOG: Record<string, HealingItemDef> = {
  // === Basic Restoratives (HP healing) ===
  'Potion': {
    name: 'Potion',
    category: 'restorative',
    hpAmount: 20,
    cost: 200,
    description: 'Heals 20 Hit Points.',
  },
  'Super Potion': {
    name: 'Super Potion',
    category: 'restorative',
    hpAmount: 35,
    cost: 380,
    description: 'Heals 35 Hit Points.',
  },
  'Hyper Potion': {
    name: 'Hyper Potion',
    category: 'restorative',
    hpAmount: 70,
    cost: 800,
    description: 'Heals 70 Hit Points.',
  },

  // === Status Cure Items (P1) ===
  'Antidote': {
    name: 'Antidote',
    category: 'cure',
    curesConditions: ['Poisoned', 'Badly Poisoned'] as const,
    cost: 200,
    description: 'Cures Poison.',
  },
  'Paralyze Heal': {
    name: 'Paralyze Heal',
    category: 'cure',
    curesConditions: ['Paralyzed'] as const,
    cost: 200,
    description: 'Cures Paralysis.',
  },
  'Burn Heal': {
    name: 'Burn Heal',
    category: 'cure',
    curesConditions: ['Burned'] as const,
    cost: 200,
    description: 'Cures Burns.',
  },
  'Ice Heal': {
    name: 'Ice Heal',
    category: 'cure',
    curesConditions: ['Frozen'] as const,
    cost: 200,
    description: 'Cures Freezing.',
  },
  'Full Heal': {
    name: 'Full Heal',
    category: 'cure',
    curesAllPersistent: true,
    cost: 450,
    description: 'Cures all Persistent Status Afflictions.',
  },

  // === Combined Items (P1) ===
  'Full Restore': {
    name: 'Full Restore',
    category: 'combined',
    hpAmount: 80,
    curesAllStatus: true,
    cost: 1450,
    description: 'Heals 80 Hit Points and cures any Status Afflictions.',
  },

  // === Revive Items (P1) ===
  'Revive': {
    name: 'Revive',
    category: 'revive',
    hpAmount: 20,
    canRevive: true,
    cost: 300,
    description: 'Revives fainted Pokemon and sets to 20 Hit Points.',
  },

  // === Repulsive Variants (P1) ===
  'Energy Powder': {
    name: 'Energy Powder',
    category: 'restorative',
    hpAmount: 25,
    repulsive: true,
    cost: 150,
    description: 'Heals 25 Hit Points. Repulsive.',
  },
  'Energy Root': {
    name: 'Energy Root',
    category: 'restorative',
    hpAmount: 70,
    repulsive: true,
    cost: 500,
    description: 'Heals 70 Hit Points. Repulsive.',
  },
  'Heal Powder': {
    name: 'Heal Powder',
    category: 'cure',
    curesAllPersistent: true,
    repulsive: true,
    cost: 350,
    description: 'Cures all Persistent Status Afflictions. Repulsive.',
  },
  'Revival Herb': {
    name: 'Revival Herb',
    category: 'revive',
    healToPercent: 50,
    canRevive: true,
    repulsive: true,
    cost: 350,
    description: 'Revives fainted Pokemon and sets to 50% Hit Points. Repulsive.',
  },
} as const

/**
 * Get all restorative items (HP healing only, no status cure).
 * Used by P0 for filtering the item list to HP-only items.
 */
export function getRestorativeItems(): HealingItemDef[] {
  return Object.values(HEALING_ITEM_CATALOG).filter(
    item => item.category === 'restorative'
  )
}

/**
 * Get all cure items (status removal only).
 */
export function getCureItems(): HealingItemDef[] {
  return Object.values(HEALING_ITEM_CATALOG).filter(
    item => item.category === 'cure'
  )
}

/**
 * Get all items applicable to a given target state.
 * Returns items that would actually have an effect.
 */
export function getApplicableItems(params: {
  currentHp: number
  maxHp: number
  injuries: number
  statusConditions: StatusCondition[]
  isFainted: boolean
}): HealingItemDef[] {
  // Implementation deferred to service layer
  return Object.values(HEALING_ITEM_CATALOG)
}

/** Item category labels for UI display */
export const ITEM_CATEGORY_LABELS: Record<HealingItemCategory, string> = {
  restorative: 'Restorative',
  cure: 'Status Cure',
  combined: 'Full Restore',
  revive: 'Revive',
}
```

**Design notes:**

- The catalog includes ALL items from PTU p.276 upfront, but P0 only processes `restorative` category items. The `cure`, `combined`, and `revive` categories are present in the catalog for data completeness but their effects are not applied until P1.
- The catalog follows the exact same pattern as `EQUIPMENT_CATALOG` in `equipment.ts`: a `Record<string, Def>` with a readonly interface.
- `healToPercent` is used for Revival Herb (50% max HP). The service layer calculates the actual HP from this percentage.
- `curesAllPersistent` and `curesAllStatus` are convenience flags that avoid listing all conditions individually. The service layer uses `PERSISTENT_CONDITIONS` from `statusConditions.ts` to resolve these.

---

## B. Apply-Item Service (HP Restoration)

### New File: `app/server/services/healing-item.service.ts`

This service encapsulates all healing item logic. P0 implements only the HP restoration path; status cure and revive paths are stubbed for P1.

```typescript
import { HEALING_ITEM_CATALOG, type HealingItemDef } from '~/constants/healingItems'
import { applyHealingToEntity, updateStatusConditions } from '~/server/services/combatant.service'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import type { Combatant, StatusCondition } from '~/types'

export interface ItemApplicationResult {
  success: boolean
  itemName: string
  effects: {
    hpHealed?: number
    conditionsCured?: StatusCondition[]
    revived?: boolean
    repulsive?: boolean
  }
  error?: string
}

/**
 * Validate that an item can be applied to a target combatant.
 * Returns an error message if invalid, undefined if valid.
 */
export function validateItemApplication(
  itemName: string,
  target: Combatant
): string | undefined {
  const item = HEALING_ITEM_CATALOG[itemName]
  if (!item) {
    return `Unknown item: ${itemName}`
  }

  const entity = target.entity
  const isFainted = (entity.statusConditions || []).includes('Fainted')

  // Revive items: target must be Fainted
  if (item.canRevive && !isFainted) {
    return `${item.name} can only be used on fainted targets`
  }

  // Non-revive items: target must NOT be Fainted (except Full Restore cures all status)
  if (!item.canRevive && isFainted && !item.curesAllStatus) {
    return `Cannot use ${item.name} on a fainted target`
  }

  // HP items: check if target is already at effective max HP
  if (item.hpAmount || item.healToFull || item.healToPercent) {
    if (!isFainted && !item.canRevive) {
      const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
      if (entity.currentHp >= effectiveMax) {
        return `${target.entity.name || 'Target'} is already at full HP`
      }
    }
  }

  // Cure items: check if target has any curable condition (P1 -- skip in P0)
  // This validation is intentionally lenient in P0; P1 adds stricter checks.

  return undefined
}

/**
 * Apply a healing item's effects to a target combatant.
 *
 * P0: Only processes HP restoration (restorative category).
 * P1: Adds status cure, revive, combined, repulsive handling.
 * P2: Adds action economy, inventory consumption.
 *
 * Mutates the combatant's entity (same pattern as applyDamageToEntity).
 */
export function applyHealingItem(
  itemName: string,
  target: Combatant
): ItemApplicationResult {
  const item = HEALING_ITEM_CATALOG[itemName]
  if (!item) {
    return { success: false, itemName, effects: {}, error: `Unknown item: ${itemName}` }
  }

  const validationError = validateItemApplication(itemName, target)
  if (validationError) {
    return { success: false, itemName, effects: {}, error: validationError }
  }

  const effects: ItemApplicationResult['effects'] = {}

  // --- HP Restoration ---
  if (item.hpAmount) {
    const healResult = applyHealingToEntity(target, { amount: item.hpAmount })
    effects.hpHealed = healResult.hpHealed
  }

  if (item.healToFull) {
    const effectiveMax = getEffectiveMaxHp(target.entity.maxHp, target.entity.injuries || 0)
    const amount = Math.max(0, effectiveMax - target.entity.currentHp)
    if (amount > 0) {
      const healResult = applyHealingToEntity(target, { amount })
      effects.hpHealed = healResult.hpHealed
    }
  }

  if (item.healToPercent) {
    const effectiveMax = getEffectiveMaxHp(target.entity.maxHp, target.entity.injuries || 0)
    const targetHp = Math.floor(effectiveMax * item.healToPercent / 100)
    const amount = Math.max(0, targetHp - target.entity.currentHp)
    if (amount > 0) {
      const healResult = applyHealingToEntity(target, { amount })
      effects.hpHealed = healResult.hpHealed
    }
  }

  // --- Repulsive flag (for UI display, no mechanical effect in P0-P1) ---
  if (item.repulsive) {
    effects.repulsive = true
  }

  return {
    success: true,
    itemName,
    effects
  }
}

/**
 * Get the display name for an entity (Pokemon name/nickname or Human name).
 */
export function getEntityDisplayName(combatant: Combatant): string {
  if (combatant.type === 'pokemon') {
    const pokemon = combatant.entity as any
    return pokemon.nickname || pokemon.species || 'Pokemon'
  }
  return (combatant.entity as any).name || 'Character'
}
```

**Design notes:**

- `applyHealingItem` mutates the combatant's entity (same pattern as `applyDamageToEntity`). The caller is responsible for persisting the state.
- HP healing goes through `applyHealingToEntity`, which already handles:
  - Capping at injury-reduced effective max HP (decree-017)
  - Removing Fainted status when healed from 0 HP
- `healToPercent` for Revival Herb calculates against effective max HP (decree-017).
- `healToFull` is not used by any P0 item but is included for future Max Potion-style items.
- Status cure and revive logic is stubbed (catalog entries exist, service returns appropriate errors for now).

---

## C. Apply-Item API Endpoint

### New File: `app/server/api/encounters/[id]/use-item.post.ts`

This endpoint applies a healing item to a combatant within an active encounter. It follows the same pattern as `heal.post.ts`.

```typescript
/**
 * Use a healing item on a combatant in an active encounter.
 *
 * Request body:
 * - itemName: string -- key in HEALING_ITEM_CATALOG
 * - userId: string -- combatant ID of the item user
 * - targetId: string -- combatant ID of the item target
 * - targetAccepts?: boolean -- whether the target agrees (default: true)
 *
 * P0: HP restoration only. Status cures and revives return errors.
 * P1: Status cure, revive, combined items.
 * P2: Action economy (Standard Action cost), adjacency check, inventory.
 */
import { loadEncounter, findCombatant, saveEncounterCombatants, buildEncounterResponse }
  from '~/server/services/encounter.service'
import { syncHealingToDatabase } from '~/server/services/entity-update.service'
import { applyHealingItem, validateItemApplication, getEntityDisplayName }
  from '~/server/services/healing-item.service'
import { HEALING_ITEM_CATALOG } from '~/constants/healingItems'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Encounter ID is required' })
  }

  if (!body.itemName || !body.userId || !body.targetId) {
    throw createError({
      statusCode: 400,
      message: 'itemName, userId, and targetId are required'
    })
  }

  // Validate item exists
  const item = HEALING_ITEM_CATALOG[body.itemName]
  if (!item) {
    throw createError({
      statusCode: 400,
      message: `Unknown item: ${body.itemName}`
    })
  }

  // P0: Only allow restorative items
  // P1 will add: 'cure', 'combined', 'revive'
  const p0AllowedCategories = ['restorative']
  if (!p0AllowedCategories.includes(item.category)) {
    throw createError({
      statusCode: 400,
      message: `${item.name} is not yet supported (status cure/revive items coming in P1)`
    })
  }

  // Target may refuse
  if (body.targetAccepts === false) {
    return {
      success: true,
      data: null,
      itemResult: {
        itemName: body.itemName,
        refused: true,
        message: 'Target refused the item. Item was not consumed.'
      }
    }
  }

  try {
    const { record, combatants } = await loadEncounter(id)
    const user = findCombatant(combatants, body.userId)
    const target = findCombatant(combatants, body.targetId)

    // Validate item can be applied to target
    const validationError = validateItemApplication(body.itemName, target)
    if (validationError) {
      throw createError({ statusCode: 400, message: validationError })
    }

    // Apply item
    const itemResult = applyHealingItem(body.itemName, target)

    if (!itemResult.success) {
      throw createError({ statusCode: 400, message: itemResult.error || 'Item application failed' })
    }

    // Sync to database
    await syncHealingToDatabase(
      target,
      target.entity.currentHp,
      target.entity.temporaryHp || 0,
      target.entity.injuries || 0,
      target.entity.statusConditions || []
    )

    await saveEncounterCombatants(id, combatants)

    const response = buildEncounterResponse(record, combatants)

    return {
      success: true,
      data: response,
      itemResult: {
        itemName: body.itemName,
        userName: getEntityDisplayName(user),
        targetName: getEntityDisplayName(target),
        ...itemResult.effects,
        refused: false
      }
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    const message = error instanceof Error ? error.message : 'Failed to use item'
    throw createError({ statusCode: 500, message })
  }
})
```

**Validation chain (P0):**

1. Encounter ID, itemName, userId, targetId all present
2. Item exists in `HEALING_ITEM_CATALOG`
3. Item category is `restorative` (P0 scope)
4. Target not refused (`targetAccepts !== false`)
5. User combatant exists in encounter
6. Target combatant exists in encounter
7. Item can be applied (not already at full HP, not fainted for restorative items)

**P1 adds:** cure/revive/combined category support, condition validation
**P2 adds:** action economy (step 10), adjacency check (step 11), inventory consumption (step 12)

---

## D. Encounter Store Action

### Updated Store: `app/stores/encounter.ts`

Add a `useItem` action to the encounter store:

```typescript
// In the actions block of useEncounterStore:

/** Use a healing item on a combatant */
async useItem(
  itemName: string,
  userId: string,
  targetId: string,
  options?: { targetAccepts?: boolean }
) {
  if (!this.encounter) return

  try {
    const response = await $fetch<{
      success: boolean
      data: Encounter
      itemResult: {
        itemName: string
        userName: string
        targetName: string
        hpHealed?: number
        conditionsCured?: StatusCondition[]
        revived?: boolean
        repulsive?: boolean
        refused: boolean
      }
    }>(`/api/encounters/${this.encounter.id}/use-item`, {
      method: 'POST',
      body: {
        itemName,
        userId,
        targetId,
        targetAccepts: options?.targetAccepts ?? true
      }
    })

    if (response.data) {
      this.encounter = response.data
    }
    return response.itemResult
  } catch (e: any) {
    this.error = e.message || 'Failed to use item'
    throw e
  }
}
```

---

## E. Basic GM UI (UseItemModal)

### New Composable: `app/composables/useHealingItems.ts`

```typescript
import { HEALING_ITEM_CATALOG, type HealingItemDef, type HealingItemCategory }
  from '~/constants/healingItems'
import { getEffectiveMaxHp } from '~/utils/restHealing'
import type { Combatant, StatusCondition } from '~/types'

/**
 * Composable for healing item selection and application.
 * Provides filtered item lists and validation for the UseItemModal.
 */
export function useHealingItems() {
  const encounterStore = useEncounterStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Get items that would have an effect on the target.
   * P0: Only restorative items (HP healing).
   * P1: Adds cure, revive, combined items.
   */
  function getApplicableItems(
    target: Combatant,
    allowedCategories: HealingItemCategory[] = ['restorative']
  ): HealingItemDef[] {
    const entity = target.entity
    const isFainted = (entity.statusConditions || []).includes('Fainted')
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    const isFullHp = entity.currentHp >= effectiveMax

    return Object.values(HEALING_ITEM_CATALOG).filter(item => {
      // Category filter
      if (!allowedCategories.includes(item.category)) return false

      // Restorative: only if not at full HP and not fainted
      if (item.category === 'restorative') {
        return !isFullHp && !isFainted
      }

      // Cure: only if has a matching condition (P1)
      // Revive: only if fainted (P1)
      // Combined: always applicable if not at full HP (P1)

      return false
    })
  }

  /**
   * Execute item use via the encounter store.
   */
  async function useItem(
    itemName: string,
    userId: string,
    targetId: string,
    targetAccepts: boolean = true
  ) {
    loading.value = true
    error.value = null
    try {
      const result = await encounterStore.useItem(itemName, userId, targetId, { targetAccepts })
      return result
    } catch (e: any) {
      error.value = e.message || 'Failed to use item'
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Get all items in the catalog, grouped by category.
   */
  function getItemsByCategory(): Record<HealingItemCategory, HealingItemDef[]> {
    const grouped: Record<HealingItemCategory, HealingItemDef[]> = {
      restorative: [],
      cure: [],
      combined: [],
      revive: [],
    }
    for (const item of Object.values(HEALING_ITEM_CATALOG)) {
      grouped[item.category].push(item)
    }
    return grouped
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    getApplicableItems,
    getItemsByCategory,
    useItem,
  }
}
```

### New Component: `app/components/encounter/UseItemModal.vue`

A modal triggered from the encounter combat UI when the GM clicks "Use Item" on a combatant's turn panel.

**Component behavior:**

1. Opens with the current combatant as the default user (the one applying the item)
2. Displays a target selector (defaults to the user for self-use, or all combatants for item use on others)
3. Loads applicable items from `useHealingItems().getApplicableItems(target)`
4. Items displayed as a scrollable list with name, HP amount, cost, and description
5. Items that would have no effect are grayed out with a tooltip explaining why
6. Confirm button calls `useHealingItems().useItem()`
7. Shows result summary (HP healed, conditions cured) before closing
8. Supports "Target Refuses" button per PTU rules (item not consumed)

**Props:**
```typescript
interface UseItemModalProps {
  /** Combatant ID of the user applying the item */
  userId: string
  /** Whether the modal is visible */
  visible: boolean
}
```

**Emits:** `@close`, `@item-used`

**Layout:**

```
+-------------------------------------------+
| Use Item                              [X] |
|-------------------------------------------|
| User: [Trainer Name]                      |
| Target: [Dropdown: combatant list]        |
|-------------------------------------------|
| Available Items:                          |
| +---------------------------------------+ |
| | [PhFirstAidKit] Potion      +20 HP    | |
| | Heals 20 Hit Points.         $200     | |
| +---------------------------------------+ |
| | [PhFirstAidKit] Super Potion +35 HP   | |
| | Heals 35 Hit Points.         $380     | |
| +---------------------------------------+ |
| | [PhFirstAidKit] Hyper Potion +70 HP   | |
| | Heals 70 Hit Points.         $800     | |
| +---------------------------------------+ |
|                                           |
| [Target Refuses]  [Cancel]  [Apply Item]  |
+-------------------------------------------+
```

The component uses Phosphor Icons (`PhFirstAidKit`, `PhPill`, `PhHeart`) for item category indicators. No emojis.

### Integration Point: Encounter Turn Panel

The existing encounter turn panel needs a "Use Item" button that:
- Appears for all combatants (trainers use items, Pokemon can receive items)
- Opens `UseItemModal` with the current combatant as the user
- Is always available in P0 (no action economy enforcement yet)
- Uses `PhFirstAidKit` Phosphor icon

---

## WebSocket Broadcast

After a successful item use, broadcast an `item_used` event:

```typescript
// In use-item.post.ts, after DB save:
broadcastToEncounter(encounterId, {
  type: 'item_used',
  data: {
    encounterId: id,
    itemName: body.itemName,
    userName: getEntityDisplayName(user),
    targetName: getEntityDisplayName(target),
    effects: itemResult.effects
  }
})
```

The Group View encounter panel will display item use events in the combat log alongside move/damage events.
