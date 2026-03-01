# P2 Specification: Combat Integration (Action Economy, Adjacency, Inventory)

P2 adds the full PTU combat integration: Standard Action enforcement for item use, target action forfeit, self-use as Full-Round Action, adjacency requirements on the VTT grid, and inventory consumption.

**Prerequisite:** P0 and P1 must be fully implemented and reviewed before P2 begins.

---

## J. Standard Action Enforcement

### PTU Rules

PTU Core p.276 (Using Items):
> "Applying Restorative Items, or X Items is a **Standard Action**, which causes the target to forfeit their next Standard Action and Shift Action, unless the user has the 'Medic Training' Edge."

### Implementation

Update `use-item.post.ts` to enforce Standard Action cost:

```typescript
// In use-item.post.ts validation, after finding the user combatant:

// P2: Standard Action enforcement
const isSelfUse = body.userId === body.targetId

if (isSelfUse) {
  // Self-use: Full-Round Action (Standard + Shift)
  if (user.turnState.standardActionUsed || user.turnState.shiftActionUsed) {
    throw createError({
      statusCode: 400,
      message: 'Using an item on yourself requires a Full-Round Action (Standard + Shift). Not enough actions remaining.'
    })
  }
} else {
  // Use on another: Standard Action
  if (user.turnState.standardActionUsed) {
    throw createError({
      statusCode: 400,
      message: 'Using an item requires a Standard Action. Standard Action already used this turn.'
    })
  }
}

// After successful item application:
if (isSelfUse) {
  // Full-Round Action consumes both Standard and Shift
  user.turnState.standardActionUsed = true
  user.turnState.shiftActionUsed = true
} else {
  // Standard Action only
  user.turnState.standardActionUsed = true
}
```

### Turn Validation

The endpoint validates that the user is currently able to act:
- The user must be the current turn's combatant, OR
- The user must be a combatant with a held action (feature-016)

```typescript
// Validate it's the user's turn or they have a held action
const currentTurnId = encounter.turnOrder[encounter.currentTurnIndex]
const isUsersTurn = currentTurnId === body.userId
const hasHeldAction = user.holdAction?.isHolding === true

if (!isUsersTurn && !hasHeldAction) {
  throw createError({
    statusCode: 400,
    message: 'Can only use items on your own turn (or with a held action)'
  })
}
```

### Medic Training Edge Exception

PTU p.276: "unless the user has the 'Medic Training' Edge"

Check if the user (trainer) has the Medic Training edge:

```typescript
// Check for Medic Training edge (skips target action forfeit, Section K)
const hasMedicTraining = user.type === 'human' &&
  ((user.entity as HumanCharacter).edges || [])
    .some(e => e.toLowerCase().includes('medic training'))
```

If the user has Medic Training:
- The Standard Action cost still applies (Medic Training only exempts the TARGET's action forfeit, not the user's action cost)
- The target does NOT forfeit their next actions (Section K)

---

## K. Target Forfeits Actions

### PTU Rules

PTU Core p.276:
> "[Using a Restorative Item is a Standard Action] which causes the **target** to forfeit their next Standard Action and Shift Action"

### Implementation

When an item is used on another combatant (not self), mark the target as forfeiting their next Standard Action and Shift Action:

```typescript
// New field on TurnState or a dedicated tracking field
// Option: Add to combat.ts TurnState

export interface TurnState {
  // ... existing fields ...
  /** Whether this combatant forfeits their Standard Action next turn (item received) */
  forfeitStandardAction?: boolean
  /** Whether this combatant forfeits their Shift Action next turn (item received) */
  forfeitShiftAction?: boolean
}
```

In `use-item.post.ts`, after successful application:

```typescript
// Target forfeits next Standard + Shift Action (unless Medic Training)
if (!isSelfUse && !hasMedicTraining) {
  target.turnState.forfeitStandardAction = true
  target.turnState.forfeitShiftAction = true
}
```

In `next-turn.post.ts`, when processing the target's next turn:

```typescript
// Check for action forfeit from item use
if (currentCombatant.turnState.forfeitStandardAction) {
  currentCombatant.turnState.standardActionUsed = true
  currentCombatant.turnState.forfeitStandardAction = false
}
if (currentCombatant.turnState.forfeitShiftAction) {
  currentCombatant.turnState.shiftActionUsed = true
  currentCombatant.turnState.forfeitShiftAction = false
}
```

### Target May Refuse

PTU p.276: "The target of these items may refuse to stay still and be healed; in that case, the item is not used, and the target does not forfeit their actions."

This is already handled in P0 via the `targetAccepts` request body parameter. When `targetAccepts === false`:
- No item effect is applied
- No action cost is charged to the user
- No action forfeit on the target
- Item is not consumed from inventory

The GM confirms the refusal via the UI (a "Target Refuses" button in the UseItemModal).

---

## L. Self-Use as Full-Round Action

### PTU Rules

PTU Core p.276:
> "If you use a Restorative Item on yourself it is a Full-Round action, but you do not forfeit any further actions."

### Implementation

Self-use is detected when `userId === targetId` in the request body.

For self-use:
1. Consumes both Standard Action AND Shift Action (Full-Round Action)
2. Does NOT trigger action forfeit on the target (self)
3. The user can still take Swift Actions (Full-Round does not consume Swift)

```typescript
if (isSelfUse) {
  user.turnState.standardActionUsed = true
  user.turnState.shiftActionUsed = true
  // No forfeit on self
}
```

### UI Indication

The UseItemModal shows different labels based on whether the user is targeting self vs. another:
- Self-use: "Full-Round Action (Standard + Shift)"
- Use on other: "Standard Action"

If the user has already used their Shift Action, self-use is disabled (Full-Round requires both unused).

---

## M. Adjacency Requirement

### PTU Rules

PTU Core p.276 describes items as being physically applied to the target. In combat, this requires the user to be adjacent to (or the same as) the target on the VTT grid.

Adjacency means within 1 meter (1 grid cell) in PTU. For the item use case, we use the same adjacency check as other melee-range interactions.

### Implementation

Add adjacency validation in `healing-item.service.ts`:

```typescript
import { ptuDiagonalDistance } from '~/utils/gridDistance'
import type { GridPosition } from '~/types'

/**
 * Check if the user is adjacent to the target (within 1m on VTT grid).
 * PTU p.276: Items are applied by physical contact.
 *
 * Returns { adjacent: boolean, distance: number }
 *
 * Special cases:
 * - Self-use: always adjacent
 * - No grid/positions: always adjacent (gridless play)
 */
export function checkItemRange(
  userPosition: GridPosition | undefined,
  targetPosition: GridPosition | undefined,
  isSelfUse: boolean
): { adjacent: boolean; distance: number } {
  if (isSelfUse) return { adjacent: true, distance: 0 }
  if (!userPosition || !targetPosition) return { adjacent: true, distance: 0 }

  const dx = targetPosition.x - userPosition.x
  const dy = targetPosition.y - userPosition.y
  const distance = ptuDiagonalDistance(dx, dy)

  return {
    adjacent: distance <= 1,
    distance
  }
}
```

In `use-item.post.ts`:

```typescript
// P2: Adjacency check
const isSelfUse = body.userId === body.targetId
const rangeResult = checkItemRange(
  user.position,
  target.position,
  isSelfUse
)

if (!rangeResult.adjacent) {
  throw createError({
    statusCode: 400,
    message: `Must be adjacent to target to use items (current distance: ${rangeResult.distance}m)`
  })
}
```

### Edge Case: Multi-Cell Tokens

For large Pokemon (tokenSize > 1), adjacency is measured from the nearest edge of the token, not the center. Use the existing `adjacency.ts` utility if available, or compute edge-to-edge distance:

```typescript
// If tokens have size > 1, check adjacency to the nearest cell of the target
import { isAdjacentToToken } from '~/utils/adjacency'

if (!isAdjacentToToken(user.position, user.tokenSize, target.position, target.tokenSize)) {
  throw createError({
    statusCode: 400,
    message: 'Must be adjacent to the target to use items'
  })
}
```

---

## N. Inventory Consumption

### Current Inventory System

From `app/types/character.ts`, `HumanCharacter` already has:

```typescript
inventory: InventoryItem[]
```

Where `InventoryItem` is:

```typescript
export interface InventoryItem {
  id: string
  name: string
  quantity: number
  effect?: string
}
```

### Inventory Integration

When using an item in combat, deduct 1 from the trainer's inventory:

**In `use-item.post.ts`:**

```typescript
// P2: Inventory consumption
// Find the item in the user's (or trainer's) inventory
const trainer = user.type === 'human' ? user : findTrainerForPokemon(combatants, user)
if (!trainer) {
  throw createError({
    statusCode: 400,
    message: 'Cannot determine which trainer owns the item'
  })
}

const trainerEntity = trainer.entity as HumanCharacter
const inventoryItem = (trainerEntity.inventory || []).find(
  inv => inv.name === body.itemName
)

if (!inventoryItem || inventoryItem.quantity <= 0) {
  throw createError({
    statusCode: 400,
    message: `${body.itemName} not found in trainer's inventory`
  })
}

// After successful item application:
// Deduct from inventory (create new array, immutable)
trainerEntity.inventory = (trainerEntity.inventory || []).map(inv => {
  if (inv.name === body.itemName) {
    return { ...inv, quantity: inv.quantity - 1 }
  }
  return inv
}).filter(inv => inv.quantity > 0) // Remove empty stacks

// Sync inventory to DB
await prisma.humanCharacter.update({
  where: { id: trainer.entityId },
  data: {
    inventory: JSON.stringify(trainerEntity.inventory)
  }
})
```

### Find Trainer for Pokemon

When a Pokemon is being given an item, the trainer who owns that Pokemon uses their inventory:

```typescript
/**
 * Find the trainer combatant who owns a Pokemon combatant.
 * Used for inventory resolution when a Pokemon receives an item.
 */
function findTrainerForPokemon(
  combatants: Combatant[],
  pokemonCombatant: Combatant
): Combatant | undefined {
  const pokemon = pokemonCombatant.entity as Pokemon
  const ownerId = pokemon.ownerId

  if (!ownerId) return undefined

  return combatants.find(
    c => c.type === 'human' && c.entityId === ownerId
  )
}
```

### GM Override

The GM should be able to use items even if the trainer doesn't have them in inventory (for convenience, corrections, or NPC item use). Add an optional `skipInventory` parameter:

```typescript
export interface UseItemRequest {
  // ... existing fields ...
  /** (P2) Skip inventory check and consumption (GM override) */
  skipInventory?: boolean
}
```

When `skipInventory: true`:
- No inventory check is performed
- No inventory deduction occurs
- The item still applies its effects normally
- This is the default for P0/P1 (no inventory enforcement)

### Adding Items to Inventory

Items can be added to trainer inventory via the existing character update endpoints (PATCH `/api/characters/:id`). The `inventory` field is already a JSON column in the Prisma schema. No new endpoint is needed for adding items -- the GM edits inventory through the character sheet.

### UI Update: Item Quantities

In the UseItemModal, show the trainer's inventory quantities next to each item:

```
| [PhHeart] Potion     +20 HP  $200  x3 |
| [PhHeart] Super Potion +35 HP $380 x1 |
| [PhHeart] Hyper Potion +70 HP $800 x0 | <-- grayed out, cannot use
```

Items with 0 quantity are shown grayed out with "(out of stock)" tooltip. A toggle allows "GM Mode" which bypasses inventory (uses `skipInventory: true`).

---

## Updated UseItemModal UI (P2 Additions)

The modal now shows action cost information and inventory quantities:

```
+-------------------------------------------+
| Use Item                              [X] |
|-------------------------------------------|
| User: [Trainer Name]  [Standard Action]   |
| Target: [Dropdown]  [Self = Full-Round]   |
| Range: Adjacent (1m)  [OK / Too Far]     |
|-------------------------------------------|
|                                           |
| Restoratives:            Qty              |
| +---------------------------------------+ |
| | [PhHeart] Potion      +20 HP  x3      | |
| | [PhHeart] Super Potion +35 HP x1      | |
| | [PhHeart] Hyper Potion +70 HP x0 [--] | |
| +---------------------------------------+ |
|                                           |
| Action Cost: Standard Action              |
| Target: Forfeits next Standard + Shift    |
|  (unless user has Medic Training)         |
|                                           |
| [GM Mode: Skip Inventory]                |
| [Target Refuses]  [Cancel]  [Apply Item]  |
+-------------------------------------------+
```

### Disabled States

The "Apply Item" button is disabled when:
- No item is selected
- Selected item has 0 quantity (unless GM Mode)
- User has no Standard Action available
- User is too far from target (not adjacent)
- Self-use and user has no Full-Round Action available (Standard or Shift already used)

### Action Cost Display

- "Standard Action" when targeting another combatant
- "Full-Round Action (Standard + Shift)" when targeting self
- Grayed out text showing which actions are already used

---

## WebSocket Event Update (P2)

The `item_used` event includes action economy details:

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
    // P2 additions:
    actionCost: 'standard' | 'full_round'
    targetForfeitsActions: boolean
    inventoryConsumed: boolean
    remainingQuantity?: number
  }
}
```

---

## Implementation Order within P2

1. **J. Standard Action enforcement** -- modify `use-item.post.ts` to check/consume actions
2. **L. Self-use Full-Round Action** -- detect self-use, consume both actions
3. **K. Target forfeits actions** -- add forfeit fields to TurnState, apply in next-turn
4. **M. Adjacency requirement** -- add range check function, validate in endpoint
5. **N. Inventory consumption** -- inventory lookup, deduction, DB sync, GM override
6. Update UseItemModal UI with action cost, quantities, disabled states
