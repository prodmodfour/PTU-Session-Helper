# Shared Specifications

## Data Flow Diagram

```
GM USES ITEM ON COMBATANT:
  GM clicks "Use Item" on a combatant's turn panel
       |
       v
  UseItemModal opens
       |
       +---> GM selects item from catalog (filtered to applicable items)
       +---> GM selects target combatant (defaults to current combatant)
       |
       v
  Client calls POST /api/encounters/:id/use-item
       |
       v
  Server validates:
       |
       +---> Does the item exist in the catalog?
       +---> Is the target valid? (alive for healing, fainted for revive)
       +---> Is the target at less than effective max HP? (for HP items)
       +---> Does the target have the curable condition? (for cure items)
       +---> (P2) Does the user have a Standard Action available?
       +---> (P2) Is the user adjacent to the target? (VTT grid check)
       +---> (P2) Does the user have the item in inventory?
       |
       v
  Server executes item effect:
       |
       +---> HP Restoration: call applyHealingToEntity with item's HP amount
       +---> Status Cure: call updateStatusConditions to remove condition(s)
       +---> Revive: clear Fainted, set HP to revive amount
       +---> Full Restore: heal HP + clear all status
       +---> (P2) Consume item from inventory
       +---> (P2) Mark Standard Action as used
       +---> (P2) Mark target as forfeiting next Standard+Shift Action
       +---> Save encounter state
       |
       v
  WebSocket broadcast: item_used event
       |
       v
  Client updates encounter store
```

---

## Healing Item Catalog Type

### New File: `app/constants/healingItems.ts`

```typescript
/**
 * Category of healing item.
 * - 'restorative': heals HP (Potion, Super Potion, etc.)
 * - 'cure': removes status conditions (Antidote, Burn Heal, etc.)
 * - 'combined': heals HP AND cures status (Full Restore)
 * - 'revive': restores from Fainted status
 */
export type HealingItemCategory = 'restorative' | 'cure' | 'combined' | 'revive'

/**
 * Definition for a single healing item from the PTU catalog.
 * Follows the same constant-catalog pattern as EQUIPMENT_CATALOG.
 */
export interface HealingItemDef {
  /** Display name (matches PTU book exactly) */
  readonly name: string
  /** Item category */
  readonly category: HealingItemCategory
  /** HP healed (undefined for pure cure items) */
  readonly hpAmount?: number
  /** Whether this heals to full HP (Max Potion behavior) */
  readonly healToFull?: boolean
  /** Whether this heals to a percentage of max HP */
  readonly healToPercent?: number
  /** Status conditions this item cures (undefined for pure restorative) */
  readonly curesConditions?: readonly StatusCondition[]
  /** Whether this cures ALL persistent status conditions */
  readonly curesAllPersistent?: boolean
  /** Whether this cures ALL status conditions (persistent + volatile) */
  readonly curesAllStatus?: boolean
  /** Whether this item can revive from Fainted */
  readonly canRevive?: boolean
  /** Whether this item is repulsive (may lower Pokemon loyalty) */
  readonly repulsive?: boolean
  /** Cost in PokeDollars */
  readonly cost: number
  /** PTU rulebook description */
  readonly description: string
}
```

---

## API Types

### UseItemRequest (Request body for POST /api/encounters/:id/use-item)

```typescript
export interface UseItemRequest {
  /** Name of the item being used (key in HEALING_ITEM_CATALOG) */
  itemName: string
  /** Combatant ID of the user applying the item */
  userId: string
  /** Combatant ID of the target receiving the item */
  targetId: string
  /** Whether the target accepts the item (default: true). PTU: target may refuse. */
  targetAccepts?: boolean
}
```

### UseItemResult (Response from the endpoint)

```typescript
export interface UseItemResult {
  /** Whether the item was successfully applied */
  success: boolean
  /** Name of item used */
  itemName: string
  /** What the item did */
  effects: {
    hpHealed?: number
    conditionsCured?: StatusCondition[]
    revived?: boolean
    repulsive?: boolean
  }
  /** Updated combatant state */
  targetName: string
  userName: string
  /** (P2) Action cost applied */
  actionCost?: 'standard' | 'full_round'
}
```

---

## Existing Code Integration Points

### HP Healing: `combatant.service.ts`

The existing `applyHealingToEntity(combatant, options)` function handles:
- HP healing capped at injury-reduced effective max HP (decree-017)
- Fainted removal when healed from 0 HP
- Temp HP granting

For P0 healing items, we call this directly:
```typescript
const healResult = applyHealingToEntity(combatant, { amount: item.hpAmount })
```

### Status Cure: `combatant.service.ts`

The existing `updateStatusConditions(combatant, addStatuses, removeStatuses)` function handles:
- Status removal with CS effect reversal (decree-005)
- Proper tracking of stage sources

For P1 cure items, we call:
```typescript
const statusResult = updateStatusConditions(combatant, [], conditionsToCure)
```

### DB Sync: `entity-update.service.ts`

After applying item effects, sync to DB via `syncHealingToDatabase()` (same pattern as heal.post.ts).

### Effective Max HP

All HP healing from items is capped at the injury-reduced effective max HP, via `getEffectiveMaxHp(maxHp, injuries)` from `restHealing.ts`. This is already built into `applyHealingToEntity`.

---

## WebSocket Event

### item_used

Broadcast when an item is applied to a combatant.

```typescript
{
  type: 'item_used',
  data: {
    encounterId: string
    itemName: string
    userName: string
    targetName: string
    effects: {
      hpHealed?: number
      conditionsCured?: StatusCondition[]
      revived?: boolean
    }
  }
}
```

---

## Healing Item Catalog (Full Reference)

All items from PTU Core p.276:

| Item | Category | HP | Conditions Cured | Revive | Repulsive | Cost |
|------|----------|----|------------------|--------|-----------|------|
| Potion | restorative | 20 | - | No | No | $200 |
| Super Potion | restorative | 35 | - | No | No | $380 |
| Hyper Potion | restorative | 70 | - | No | No | $800 |
| Antidote | cure | - | Poisoned, Badly Poisoned | No | No | $200 |
| Paralyze Heal | cure | - | Paralyzed | No | No | $200 |
| Burn Heal | cure | - | Burned | No | No | $200 |
| Ice Heal | cure | - | Frozen | No | No | $200 |
| Full Heal | cure | - | All Persistent | No | No | $450 |
| Full Restore | combined | 80 | All Status | No | No | $1450 |
| Revive | revive | 20 | Fainted | Yes | No | $300 |
| Energy Powder | restorative | 25 | - | No | Yes | $150 |
| Energy Root | restorative | 70 | - | No | Yes | $500 |
| Heal Powder | cure | - | All Persistent | No | Yes | $350 |
| Revival Herb | revive | 50% max | Fainted | Yes | Yes | $350 |

---

## Existing Code Paths to Preserve

The new item endpoint is **separate** from the existing heal endpoint:

| Endpoint | Purpose | Preserved? |
|----------|---------|-----------|
| `POST /api/encounters/:id/heal` | GM manually heals a combatant (arbitrary HP amount, injuries) | YES -- unchanged |
| `POST /api/encounters/:id/use-item` | **NEW** -- Apply a specific PTU item with catalog-defined effects | NEW |

The existing heal endpoint remains as a raw GM tool for arbitrary healing (out-of-combat adjustments, custom effects). The new use-item endpoint enforces PTU item rules.

---

## Non-Combat Item Use

P0-P1 scoped to in-combat use only (encounters). Out-of-combat item use (from character sheets) is deferred to a future feature. The catalog constants are available for future out-of-combat integration.

For P0-P1, the endpoint requires an active encounter ID. Out-of-combat healing continues to use the existing rest healing endpoints and the raw character/pokemon PATCH endpoints.
