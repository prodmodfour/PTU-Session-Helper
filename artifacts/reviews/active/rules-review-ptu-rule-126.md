---
review_id: rules-review-ptu-rule-126
review_type: rules
reviewer: game-logic-reviewer
trigger: ptu-rule-126 resolution review
target_report: ptu-rule-126
domain: combat
commits_reviewed:
  - 8e145b7d
mechanics_verified:
  - Snow Boots conditional Overland speed penalty
  - Naturewalk (Tundra) capability grant
  - Equipment bonus aggregation for conditional speed penalties
  - Zod validation for conditionalSpeedPenalty field
verdict: PASS
issues_found: 0
ptu_refs:
  - "core/09-gear-and-items.md p.293 (Snow Boots)"
  - "core/04-trainer-classes.md p.276 (Naturewalk capability)"
reviewed_at: 2026-03-05T12:00:00Z
---

# Rules Review: ptu-rule-126 (Snow Boots conditional Overland speed penalty)

## Scope

Primary commit reviewed: `8e145b7d` (feat: add Snow Boots conditional Overland speed penalty).

This review verifies that the Snow Boots speed penalty implementation correctly reflects PTU 1.05 rules for the Snow Boots equipment item.

## PTU Rule Verification

### 1. Snow Boots Text (PTU p.293)

**Rulebook exact text** (core/09-gear-and-items.md lines 1700-1702):
> Snow Boots grant you the Naturewalk (Tundra) capability, but lower your Overland Speed by -1 while on ice or deep snow.

**Implementation** (app/constants/equipment.ts lines 94-101):
```typescript
'Snow Boots': {
    name: 'Snow Boots',
    slot: 'feet',
    grantedCapabilities: ['Naturewalk (Tundra)'],
    conditionalSpeedPenalty: { amount: -1, condition: 'On ice or deep snow' },
    cost: 1500,
    description: 'Naturewalk (Tundra), -1 Overland on ice/deep snow.',
}
```

**Verdict: CORRECT.** The penalty amount (-1), the condition ("On ice or deep snow"), the Naturewalk (Tundra) capability grant, and the $1,500 cost all match the rulebook exactly.

### 2. Errata Check

Searched `books/markdown/errata-2.md` for "Snow Boots" -- no errata found. The core text stands as written.

### 3. Decree Check

Scanned all 49 active decrees (`decrees/decree-001.md` through `decrees/decree-049.md`). No decrees address Snow Boots, equipment speed penalties, or Naturewalk (Tundra) specifically. decree-006 (initiative speed CS) and decree-011 (terrain boundary movement averaging) are tangentially related but do not constrain this implementation.

### 4. Naturewalk (Tundra) Capability

**Rulebook** (core/04-trainer-classes.md line 2800): "Naturewalk: Immunity to Slowed or Stuck in its appropriate Terrains."

The Naturewalk (Tundra) capability is correctly stored in `grantedCapabilities` and flows through the existing `getEquipmentGrantedCapabilities()` utility into `getCombatantNaturewalks()` in `app/utils/combatantCapabilities.ts` (line 238). This integration was established in a prior commit (73992ba6) and is not new to this review, but confirms the Snow Boots capability grant is correctly wired.

### 5. Conditional Speed Penalty Mechanism

The implementation adds a `conditionalSpeedPenalty` field to the `EquippedItem` type (app/types/character.ts lines 125-129) and a `conditionalSpeedPenalties` array to `EquipmentCombatBonuses` (app/utils/equipmentBonuses.ts line 44). The `computeEquipmentBonuses()` function collects these penalties (lines 87-89) analogously to how `conditionalDR` is collected.

**Design decision: GM-reference only (not auto-enforced).** The penalty data is stored and displayed in the equipment UI but is NOT automatically subtracted from Overland speed during movement. The ticket resolution log explicitly documents this limitation: the terrain system lacks ice/deep-snow granularity within Tundra terrain to determine when the penalty applies.

**PTU assessment:** This is an acceptable implementation approach. The Snow Boots penalty is inherently conditional on terrain state that the system cannot currently detect. Storing the penalty data and displaying it for GM reference is the correct interim solution. Auto-enforcing an always-on -1 Overland penalty would be WRONG -- the penalty only applies "while on ice or deep snow," not at all times. The implementation correctly avoids this over-application.

### 6. Interaction with Other Speed Modifiers

Reviewed the speed modifier landscape:
- **Heavy Armor** uses `speedDefaultCS: -1` (combat stage modifier on Speed stat) -- a fundamentally different mechanism from Overland speed reduction.
- **Running Shoes** describe "+1 Overland Speed" in their description but have no mechanical enforcement (not in scope for this ticket, and Running Shoes are not part of ptu-rule-126).
- **getOverlandSpeed()** in `app/utils/combatantCapabilities.ts` (line 92) derives trainer Overland from skills (Athletics + Acrobatics). The Snow Boots penalty, when eventually auto-enforced, would need to be applied after this derivation. The current GM-reference approach avoids any incorrect interaction.

No conflicts detected between `conditionalSpeedPenalty` and existing speed modifiers.

### 7. Zod Validation

The `conditionalSpeedPenalty` Zod schema (app/server/api/characters/[id]/equipment.put.ts lines 34-37):
```typescript
conditionalSpeedPenalty: z.object({
    amount: z.number().int().min(-10).max(0),
    condition: z.string().min(1)
}).optional()
```

**Verdict: CORRECT.** The amount is constrained to negative integers (min -10, max 0), which correctly models speed penalties. The condition is a non-empty string. The field is optional, which is correct since most equipment does not have conditional speed penalties.

### 8. UI Display

Both `HumanEquipmentTab.vue` and `EquipmentCatalogBrowser.vue` display the conditional speed penalty alongside conditional DR entries, using the same `bonus-tag--conditional` styling pattern. The display format `{{ csp.amount }} Overland ({{ csp.condition }})` renders as "-1 Overland (On ice or deep snow)" which is clear and accurate.

### 9. Living Weapon Service Default

The `getEffectiveEquipmentBonuses()` function in `living-weapon.service.ts` (line 408) correctly includes `conditionalSpeedPenalties: []` in the non-human combatant default return value. This prevents type errors when consuming the EquipmentCombatBonuses interface.

### 10. Test Mocks Updated

Both `useMoveCalculation.test.ts` and `living-weapon.service.test.ts` mock objects now include the `conditionalSpeedPenalties: []` field, maintaining mock shape consistency with the updated `EquipmentCombatBonuses` interface.

## Issues Found

None. The implementation correctly represents the PTU Snow Boots rules.

## Observations (Informational -- Not Issues)

1. **Running Shoes +1 Overland and Flippers -2 Overland are also not mechanically enforced.** Running Shoes' catalog entry (equipment.ts line 88-93) describes the +1 Overland bonus but does not model it mechanically. Flippers are not in the catalog at all. These are pre-existing gaps outside the scope of ptu-rule-126.

2. **No unit test for conditionalSpeedPenalty aggregation in computeEquipmentBonuses.** The existing `equipmentBonuses.test.ts` tests `getEquipmentGrantedCapabilities` but does not test `computeEquipmentBonuses` including the new `conditionalSpeedPenalties` aggregation. This is a testing gap, not a rules issue.

## Final Verdict

**PASS.** The Snow Boots conditional Overland speed penalty implementation correctly matches PTU 1.05 p.293. The penalty amount (-1), condition ("On ice or deep snow"), Naturewalk (Tundra) capability grant, and cost ($1,500) are all accurate. The GM-reference approach (store and display, but do not auto-enforce) is the correct design given the terrain system's current limitations. No PTU rule violations detected.
