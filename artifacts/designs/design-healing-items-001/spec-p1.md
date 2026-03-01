# P1 Specification: Status Cures, Revives, and Combined Items

P1 extends the healing item system from P0 (HP restoration only) to support status cure items, revive items, the Full Restore combined item, and the repulsive item flag. Action economy and inventory are deferred to P2.

**Prerequisite:** P0 must be fully implemented and reviewed before P1 begins.

---

## F. Status Cure Items

### Integration with Status Condition System

Status cure items integrate with the existing `updateStatusConditions()` function in `combatant.service.ts`. This function already handles:

- Removing conditions from the entity's `statusConditions` array
- Reversing CS effects via `reverseStatusCsEffects()` (decree-005)
- Proper stage source tracking for clean reversal

### Cure Resolution Logic

Add cure resolution to `healing-item.service.ts`:

```typescript
import { PERSISTENT_CONDITIONS } from '~/constants/statusConditions'

/**
 * Resolve which conditions an item cures on a specific target.
 * Returns the list of StatusCondition values to remove.
 */
export function resolveConditionsToCure(
  item: HealingItemDef,
  targetConditions: StatusCondition[]
): StatusCondition[] {
  if (!targetConditions || targetConditions.length === 0) return []

  // curesAllStatus: clear all persistent + volatile (but not Fainted/Dead)
  if (item.curesAllStatus) {
    return targetConditions.filter(c => c !== 'Fainted' && c !== 'Dead')
  }

  // curesAllPersistent: clear all persistent conditions
  if (item.curesAllPersistent) {
    const persistentSet = new Set(PERSISTENT_CONDITIONS)
    return targetConditions.filter(c => persistentSet.has(c))
  }

  // curesConditions: clear specific named conditions
  if (item.curesConditions && item.curesConditions.length > 0) {
    const cureSet = new Set(item.curesConditions)
    return targetConditions.filter(c => cureSet.has(c))
  }

  return []
}
```

### Updated `applyHealingItem` for Cure Items

Extend the `applyHealingItem` function in `healing-item.service.ts`:

```typescript
export function applyHealingItem(
  itemName: string,
  target: Combatant
): ItemApplicationResult {
  const item = HEALING_ITEM_CATALOG[itemName]
  // ... existing validation ...

  const effects: ItemApplicationResult['effects'] = {}

  // --- HP Restoration (from P0) ---
  if (item.hpAmount) {
    const healResult = applyHealingToEntity(target, { amount: item.hpAmount })
    effects.hpHealed = healResult.hpHealed
  }
  // ... healToFull, healToPercent (from P0) ...

  // --- Status Cure (P1) ---
  const conditionsToCure = resolveConditionsToCure(
    item,
    target.entity.statusConditions || []
  )
  if (conditionsToCure.length > 0) {
    const statusResult = updateStatusConditions(target, [], conditionsToCure)
    effects.conditionsCured = statusResult.removed
  }

  // --- Repulsive flag ---
  if (item.repulsive) {
    effects.repulsive = true
  }

  return { success: true, itemName, effects }
}
```

### Updated Validation for Cure Items

Extend `validateItemApplication` to check if the target has curable conditions:

```typescript
export function validateItemApplication(
  itemName: string,
  target: Combatant
): string | undefined {
  const item = HEALING_ITEM_CATALOG[itemName]
  if (!item) return `Unknown item: ${itemName}`

  const entity = target.entity
  const isFainted = (entity.statusConditions || []).includes('Fainted')

  // ... existing validation (P0) ...

  // Cure items: target must have at least one curable condition
  if (item.category === 'cure') {
    const curableConditions = resolveConditionsToCure(
      item,
      entity.statusConditions || []
    )
    if (curableConditions.length === 0) {
      if (item.curesAllPersistent) {
        return `Target has no persistent status conditions to cure`
      }
      const conditionNames = (item.curesConditions || []).join(', ')
      return `Target is not affected by ${conditionNames}`
    }
  }

  return undefined
}
```

### P1 Endpoint Update

Remove the P0 category restriction in `use-item.post.ts`:

```typescript
// P0 had:
// const p0AllowedCategories = ['restorative']
// P1 changes to:
const allowedCategories = ['restorative', 'cure', 'combined', 'revive']
```

### Specific Item Behaviors

**Antidote:** Cures both `Poisoned` and `Badly Poisoned`. PTU p.276: "Cures Poison." Since `Badly Poisoned` is a variant of Poison (PTU p.247: "Badly Poisoned is a more severe version of Poison"), the Antidote cures both. The `curesConditions` array includes both.

When curing `Badly Poisoned`:
- The combatant's `badlyPoisonedRound` counter should be reset to 0
- Add to `applyHealingItem`:
```typescript
if (conditionsToCure.includes('Badly Poisoned')) {
  target.badlyPoisonedRound = 0
}
```

**Paralyze Heal:** Cures `Paralyzed`. Reverses the -4 Speed CS via `reverseStatusCsEffects` (handled automatically by `updateStatusConditions`). This also triggers initiative recalculation per decree-006 (handled by the caller if applicable).

**Burn Heal:** Cures `Burned`. Reverses the -2 Defense CS (decree-005, automatic).

**Ice Heal:** Cures `Frozen`. Restores evasion (Frozen sets evasion to 0 per PTU p.246; this is handled by the evasion recalculation on status change).

**Full Heal:** Cures all persistent conditions. Uses `curesAllPersistent: true` flag. Resolves to `PERSISTENT_CONDITIONS` from `statusConditions.ts`: Burned, Frozen, Paralyzed, Poisoned, Badly Poisoned.

**Heal Powder:** Same as Full Heal but with `repulsive: true`.

---

## G. Revive Items

### Revive Logic

Revive items have special handling: they target Fainted combatants and restore them to a specific HP amount.

```typescript
// In applyHealingItem, add revive handling:

// --- Revive (P1) ---
if (item.canRevive) {
  const entity = target.entity
  const isFainted = (entity.statusConditions || []).includes('Fainted')

  if (!isFainted) {
    return {
      success: false,
      itemName,
      effects: {},
      error: `${item.name} can only be used on fainted targets`
    }
  }

  // Remove Fainted status
  entity.statusConditions = (entity.statusConditions || []).filter(
    (s: StatusCondition) => s !== 'Fainted'
  )
  effects.revived = true

  // Set HP based on item type
  if (item.hpAmount) {
    // Revive: sets to fixed amount (20 HP)
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    entity.currentHp = Math.min(item.hpAmount, effectiveMax)
    effects.hpHealed = entity.currentHp
  } else if (item.healToPercent) {
    // Revival Herb: sets to percentage of max HP (50%)
    const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
    entity.currentHp = Math.floor(effectiveMax * item.healToPercent / 100)
    effects.hpHealed = entity.currentHp
  }
}
```

**Critical detail:** Revive items do NOT go through `applyHealingToEntity` because that function has Fainted-removal logic that triggers at the 0-to-positive HP transition. For revives, we handle the Fainted removal explicitly before setting HP. This avoids double-processing.

### Revive Validation

Update `validateItemApplication`:

```typescript
// Revive items: target must be Fainted
if (item.canRevive) {
  if (!isFainted) {
    return `${item.name} can only be used on fainted targets`
  }
  // Revive items are always valid on fainted targets
  return undefined
}
```

### Specific Revive Behaviors

**Revive:** Sets HP to 20 (or effective max HP if effective max is below 20). The Fainted condition is removed. No status conditions are cured (Fainted already clears P/V conditions on faint per PTU p.248).

**Revival Herb:** Sets HP to 50% of effective max HP (rounded down). Fainted removed. Repulsive.

---

## H. Full Restore (Combined HP + Status Cure)

Full Restore is the most complex item: it heals 80 HP AND cures all status afflictions.

### Application Order

1. Cure all status conditions first (so CS effects are reversed before HP healing)
2. Heal 80 HP (capped at effective max HP)

```typescript
// In applyHealingItem for 'combined' category:

if (item.category === 'combined') {
  // Step 1: Cure conditions (curesAllStatus)
  const conditionsToCure = resolveConditionsToCure(
    item,
    target.entity.statusConditions || []
  )
  if (conditionsToCure.length > 0) {
    const statusResult = updateStatusConditions(target, [], conditionsToCure)
    effects.conditionsCured = statusResult.removed

    // Reset Badly Poisoned counter if cured
    if (conditionsToCure.includes('Badly Poisoned')) {
      target.badlyPoisonedRound = 0
    }
  }

  // Step 2: Heal HP
  if (item.hpAmount) {
    const healResult = applyHealingToEntity(target, { amount: item.hpAmount })
    effects.hpHealed = healResult.hpHealed
  }
}
```

### Full Restore Validation

Full Restore is valid if the target has:
- HP below effective max (healing effect), OR
- At least one curable status condition (cure effect)

If both HP is full AND no conditions to cure, the item has no effect and should be rejected:

```typescript
if (item.category === 'combined') {
  const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
  const isFullHp = entity.currentHp >= effectiveMax
  const curableConditions = resolveConditionsToCure(
    item,
    entity.statusConditions || []
  )
  if (isFullHp && curableConditions.length === 0) {
    return `${item.name} would have no effect (full HP, no curable conditions)`
  }
}
```

### Full Restore and Fainted Status

PTU p.276 says Full Restore "cures any Status Afflictions." The `curesAllStatus: true` flag resolves to all conditions EXCEPT Fainted and Dead (see `resolveConditionsToCure`). Full Restore does NOT revive from Fainted -- that requires a Revive item. This matches the video game behavior where Full Restore does not work on fainted Pokemon.

---

## I. Repulsive Items

### Mechanical Effect

PTU p.276: Repulsive medicines "decrease a Pokemon's loyalty with repeated use." The app does not currently track Pokemon loyalty, so the repulsive flag has no mechanical effect.

### Implementation

For P1, the repulsive flag is:
1. Stored in the `HealingItemDef` as `repulsive: boolean`
2. Returned in the `ItemApplicationResult.effects.repulsive` field
3. Displayed in the UI with a warning indicator (Phosphor `PhWarning` icon)
4. Logged in the move history / item use log

No loyalty modification is implemented. When loyalty tracking is added in a future feature, the repulsive flag will be used to apply loyalty penalties.

### UI Display

In `UseItemModal.vue`, repulsive items show:
- A `PhWarning` icon next to the item name
- "Repulsive" badge in a muted/warning color
- Tooltip: "May decrease Pokemon loyalty with repeated use"

---

## Updated `useHealingItems` Composable

Extend `getApplicableItems` for P1 categories:

```typescript
function getApplicableItems(
  target: Combatant,
  allowedCategories: HealingItemCategory[] = ['restorative', 'cure', 'combined', 'revive']
): HealingItemDef[] {
  const entity = target.entity
  const isFainted = (entity.statusConditions || []).includes('Fainted')
  const effectiveMax = getEffectiveMaxHp(entity.maxHp, entity.injuries || 0)
  const isFullHp = entity.currentHp >= effectiveMax

  return Object.values(HEALING_ITEM_CATALOG).filter(item => {
    if (!allowedCategories.includes(item.category)) return false

    // Restorative: only if not at full HP and not fainted
    if (item.category === 'restorative') {
      return !isFullHp && !isFainted
    }

    // Cure: only if target has a matching condition and is not fainted
    if (item.category === 'cure') {
      if (isFainted) return false
      const curableConditions = resolveConditionsToCure(item, entity.statusConditions || [])
      return curableConditions.length > 0
    }

    // Combined: if not fainted and (not full HP or has curable conditions)
    if (item.category === 'combined') {
      if (isFainted) return false
      const curableConditions = resolveConditionsToCure(item, entity.statusConditions || [])
      return !isFullHp || curableConditions.length > 0
    }

    // Revive: only if fainted
    if (item.category === 'revive') {
      return isFainted
    }

    return false
  })
}
```

---

## Updated UseItemModal UI (P1 Additions)

The modal expands to show all item categories in grouped sections:

```
+-------------------------------------------+
| Use Item                              [X] |
|-------------------------------------------|
| User: [Trainer Name]                      |
| Target: [Dropdown: combatant list]        |
|-------------------------------------------|
|                                           |
| Restoratives:                             |
| +---------------------------------------+ |
| | [PhHeart] Potion         +20 HP  $200 | |
| | [PhHeart] Super Potion   +35 HP  $380 | |
| +---------------------------------------+ |
|                                           |
| Status Cures:                             |
| +---------------------------------------+ |
| | [PhPill] Antidote   Cures Poison $200 | |
| | [PhPill] Burn Heal  Cures Burn   $200 | |
| +---------------------------------------+ |
|                                           |
| Combined:                                 |
| +---------------------------------------+ |
| | [PhStar] Full Restore  80HP+All $1450 | |
| +---------------------------------------+ |
|                                           |
| Revives: (shown only if target is fainted)|
| +---------------------------------------+ |
| | [PhHeartBreak] Revive     20HP   $300 | |
| | [PhWarning] Revival Herb  50%HP  $350 | |
| +---------------------------------------+ |
|                                           |
| [Target Refuses]  [Cancel]  [Apply Item]  |
+-------------------------------------------+
```

Items are dynamically filtered based on the selected target's state. Categories with no applicable items are hidden. Repulsive items show a `PhWarning` badge.
