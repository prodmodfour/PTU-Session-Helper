# Testing Strategy

## Overview

Testing follows the project's standard Vitest unit testing approach. Each tier has its own test suite. Tests are structured to cover:
1. Pure utility/service functions (no mocking needed)
2. API endpoints (Prisma mocking required)
3. Composable logic (store mocking required)

---

## P0 Test Suite

### Healing Item Catalog: `app/tests/unit/constants/healingItems.test.ts`

```
Test: HEALING_ITEM_CATALOG structure
  - every entry has required fields (name, category, cost, description)
  - category values are valid ('restorative' | 'cure' | 'combined' | 'revive')
  - HP amounts are positive integers where defined
  - cost values are positive integers
  - no duplicate keys
  - total count matches expected (14 items from PTU p.276)

Test: getRestorativeItems()
  - returns only 'restorative' category items
  - includes Potion, Super Potion, Hyper Potion, Energy Powder, Energy Root
  - does not include cure, combined, or revive items

Test: getCureItems()
  - returns only 'cure' category items
  - includes Antidote, Paralyze Heal, Burn Heal, Ice Heal, Full Heal, Heal Powder

Test: Item HP amounts match PTU book
  - Potion: 20
  - Super Potion: 35
  - Hyper Potion: 70
  - Full Restore: 80
  - Revive: 20
  - Energy Powder: 25
  - Energy Root: 70
  - Revival Herb: healToPercent = 50

Test: Item costs match PTU book
  - Potion: 200, Super Potion: 380, Hyper Potion: 800
  - Antidote: 200, Paralyze Heal: 200, Burn Heal: 200, Ice Heal: 200
  - Full Heal: 450, Full Restore: 1450, Revive: 300
  - Energy Powder: 150, Energy Root: 500, Heal Powder: 350, Revival Herb: 350

Test: Repulsive flag
  - Energy Powder, Energy Root, Heal Powder, Revival Herb have repulsive: true
  - Potion, Super Potion, Hyper Potion, etc. do NOT have repulsive: true
```

### Healing Item Service: `app/tests/unit/services/healing-item.service.test.ts`

```
Test: validateItemApplication
  - returns undefined for valid Potion use on damaged target
  - returns error for unknown item name
  - returns error for Potion on target already at full HP
  - returns error for Potion on target at effective max HP (with injuries)
  - returns error for restorative item on Fainted target
  - returns undefined for Potion on target with injuries (HP < effective max)

Test: applyHealingItem - Potion
  - heals exactly 20 HP on target with 30/50 HP
  - caps healing at effective max HP (decree-017)
    - target with 45/50 HP and 0 injuries: heals 5, not 20
    - target with 18/50 HP and 3 injuries: heals to floor(50*7/10)=35, not 38
  - does not heal past injury-reduced max HP
  - returns correct effects object

Test: applyHealingItem - Super Potion
  - heals exactly 35 HP on target with sufficient HP gap
  - caps at effective max HP

Test: applyHealingItem - Hyper Potion
  - heals exactly 70 HP on target with sufficient HP gap
  - caps at effective max HP

Test: applyHealingItem - unknown item
  - returns success: false with error message

Test: applyHealingItem - target at full HP
  - returns success: false with error message
```

### API Endpoint: `app/tests/unit/api/encounters/use-item.test.ts`

```
Test: POST /api/encounters/:id/use-item
  - 400 if encounter ID missing
  - 400 if itemName missing
  - 400 if userId missing
  - 400 if targetId missing
  - 400 if item not in catalog
  - 400 if item category not supported (P0: only restorative)
  - 400 if target at full HP (restorative on full HP target)
  - 200 with correct heal result for valid Potion use
  - target refuses: returns success with refused=true, no healing applied
  - healing amount capped at effective max HP
```

---

## P1 Test Suite

### Status Cure Tests: `app/tests/unit/services/healing-item-cures.test.ts`

```
Test: resolveConditionsToCure
  - Antidote resolves [Poisoned] when target is Poisoned
  - Antidote resolves [Badly Poisoned] when target is Badly Poisoned
  - Antidote resolves [Poisoned, Badly Poisoned] when target has both
  - Burn Heal resolves [Burned] when target is Burned
  - Ice Heal resolves [Frozen] when target is Frozen
  - Paralyze Heal resolves [Paralyzed] when target is Paralyzed
  - Full Heal resolves all persistent conditions on target
  - Full Heal does NOT resolve volatile conditions (Confused, Flinched, etc.)
  - Full Heal does NOT resolve Fainted or Dead
  - Heal Powder resolves same as Full Heal (all persistent)
  - curesAllStatus (Full Restore) resolves all except Fainted/Dead
  - empty list when target has no matching conditions
  - empty list when target has no conditions at all

Test: applyHealingItem - Antidote
  - removes Poisoned condition from target
  - removes Badly Poisoned and resets badlyPoisonedRound to 0
  - reverses CS effect (-2 SpDef) via updateStatusConditions (decree-005)
  - returns conditionsCured in effects
  - error when target is not Poisoned

Test: applyHealingItem - Burn Heal
  - removes Burned condition
  - reverses CS effect (-2 Def) via updateStatusConditions (decree-005)

Test: applyHealingItem - Paralyze Heal
  - removes Paralyzed condition
  - reverses CS effect (-4 Speed) via updateStatusConditions (decree-005)

Test: applyHealingItem - Ice Heal
  - removes Frozen condition

Test: applyHealingItem - Full Heal
  - removes all persistent conditions at once
  - reverses all CS effects from persistent conditions
  - does not affect volatile conditions

Test: applyHealingItem - Full Restore
  - heals 80 HP AND removes all non-Fainted conditions
  - cures persistent AND volatile conditions (except Fainted/Dead)
  - HP healing capped at effective max HP
  - error when target is Fainted (cannot Full Restore a fainted target)
  - valid when target has only status conditions (HP already full)
  - valid when target has only HP damage (no conditions)
  - error when target is full HP and has no conditions

Test: applyHealingItem - Revive
  - removes Fainted condition and sets HP to 20
  - HP capped at effective max HP (if effective max < 20)
  - error when target is NOT Fainted
  - does not restore status conditions (Fainted already cleared them)

Test: applyHealingItem - Revival Herb
  - removes Fainted and sets HP to 50% of effective max HP
  - sets repulsive flag in effects

Test: Repulsive items
  - Energy Powder returns repulsive: true in effects
  - Energy Root returns repulsive: true in effects
  - Heal Powder returns repulsive: true in effects
  - Revival Herb returns repulsive: true in effects
  - Potion does NOT return repulsive
```

---

## P2 Test Suite

### Action Economy Tests: `app/tests/unit/services/healing-item-actions.test.ts`

```
Test: Standard Action enforcement
  - use-item succeeds when user has Standard Action available
  - use-item fails when user's Standard Action already used
  - use-item marks user's Standard Action as used after success
  - self-use requires both Standard and Shift available
  - self-use marks both Standard and Shift as used

Test: Target action forfeit
  - target.turnState.forfeitStandardAction set to true after item use
  - target.turnState.forfeitShiftAction set to true after item use
  - forfeit NOT set when user has Medic Training edge
  - forfeit NOT set on self-use
  - forfeit cleared and actions consumed on target's next turn

Test: Self-use Full-Round Action
  - self-use detected when userId === targetId
  - self-use fails when Standard Action already used
  - self-use fails when Shift Action already used
  - self-use consumes both Standard and Shift Action
  - self-use does NOT trigger action forfeit on self

Test: Medic Training edge
  - target does not forfeit actions when user has Medic Training
  - user still pays Standard Action cost
```

### Adjacency Tests: `app/tests/unit/services/healing-item-range.test.ts`

```
Test: checkItemRange
  - self-use: always adjacent (distance 0)
  - no positions: always adjacent (gridless play)
  - adjacent cells (distance 1): adjacent = true
  - diagonal cells: adjacent = true (distance 1 in PTU diagonal)
  - distance 2+: adjacent = false
  - reports correct distance for non-adjacent
```

### Inventory Tests: `app/tests/unit/services/healing-item-inventory.test.ts`

```
Test: Inventory consumption
  - deducts 1 from item quantity on use
  - removes item from inventory when quantity reaches 0
  - fails when item not in inventory (quantity 0)
  - fails when item not in inventory (no matching entry)
  - GM override (skipInventory) skips inventory check
  - GM override does not deduct from inventory

Test: Find trainer for Pokemon
  - finds trainer combatant by Pokemon's ownerId
  - returns undefined when Pokemon has no owner
  - returns undefined when owner is not in encounter
```

---

## Test Coverage Targets

| Layer | File | Target |
|-------|------|--------|
| Constants | `healingItems.ts` | 100% (pure data, trivial) |
| Service | `healing-item.service.ts` | 90%+ (all branches) |
| API | `use-item.post.ts` | 80%+ (happy paths + error cases) |
| Composable | `useHealingItems.ts` | 80%+ (filtering logic) |

---

## PTU Rule Verification Checklist

These tests explicitly verify PTU book values (Lesson L3: verify formulas against rulebook):

- [ ] Potion heals exactly 20 HP (PTU p.276)
- [ ] Super Potion heals exactly 35 HP (PTU p.276)
- [ ] Hyper Potion heals exactly 70 HP (PTU p.276)
- [ ] Full Restore heals 80 HP + cures all status (PTU p.276)
- [ ] Revive sets to 20 HP from Fainted (PTU p.276)
- [ ] Revival Herb sets to 50% HP from Fainted (PTU p.276)
- [ ] Antidote cures Poison (PTU p.276)
- [ ] Burn Heal cures Burns (PTU p.276)
- [ ] Ice Heal cures Freezing (PTU p.276)
- [ ] Paralyze Heal cures Paralysis (PTU p.276)
- [ ] Full Heal cures all Persistent status (PTU p.276)
- [ ] Item use is Standard Action (PTU p.276)
- [ ] Target forfeits next Standard + Shift (PTU p.276)
- [ ] Self-use is Full-Round Action, no forfeit (PTU p.276)
- [ ] Medic Training exempts target forfeit (PTU p.276)
- [ ] HP healing capped at effective max HP (decree-017)
- [ ] Energy Powder 25 HP (PTU p.276), Energy Root 70 HP (PTU p.276)
- [ ] All item costs match PTU book values

---

## Integration Test Notes

No Playwright e2e tests are defined for this feature. Integration testing will be covered by:
1. Manual GM workflow testing (use item during active encounter)
2. UX exploration sessions (ux-session-006 or later)
3. Unit tests covering the service and API layers
