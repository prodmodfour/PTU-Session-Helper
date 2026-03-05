---
review_id: code-review-ptu-rule-125
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-125
domain: character-lifecycle
commits_reviewed:
  - 73992ba6
files_reviewed:
  - app/constants/equipment.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Review Scope

Reviewed commit `73992ba6` ("feat: populate grantedCapabilities on capability-granting equipment") which adds `grantedCapabilities` arrays to three head-slot equipment catalog entries:

1. **Dark Vision Goggles** -- `grantedCapabilities: ['Darkvision']`
2. **Gas Mask** -- `grantedCapabilities: ['Gas Mask Immunity']`
3. **Re-Breather** (new entry) -- `grantedCapabilities: ['Gilled']`, cost $4000

Change is scoped to a single file (`app/constants/equipment.ts`) with 9 lines added.

### Decree Check

No active decrees govern the `grantedCapabilities` field naming conventions or equipment capability representation. Decree-048 governs Darkvision/Blindsense vision mechanics but does not constrain how equipment grants those capabilities. No decree violations found.

## Issues

No CRITICAL, HIGH, or MEDIUM issues found.

## Detailed Analysis

### PTU Rule Verification

Cross-referenced all three items against PTU 1.05 `core/09-gear-and-items.md` (p.293):

| Item | PTU Text | Code Value | Match |
|---|---|---|---|
| Dark Vision Goggles | "grant the Darkvision Capability while worn" ($1,000) | `['Darkvision']`, cost 1000 | Yes |
| Gas Mask | "immune to the Moves Rage Powder, Poison Gas, Poisonpowder, Sleep Powder, Smog, Smokescreen, Spore, Stun Spore, and Sweet Scent" ($1,500) | `['Gas Mask Immunity']`, cost 1500 | Yes (see note below) |
| Re-Breather | "as if they had the Gilled Capability for up to an hour" ($4000) | `['Gilled']`, cost 4000 | Yes |

**Gas Mask note:** The Gas Mask does not grant a named PTU capability -- it provides move immunity. `'Gas Mask Immunity'` is a synthetic capability name, which is an acceptable convention since the ticket explicitly called for this approach and the current codebase only displays these as UI tags (via `HumanEquipmentTab.vue`). No mechanical system consumes Gas Mask Immunity for gameplay logic. This is a PTU correctness observation for the Game Logic Reviewer's domain, not a code quality issue.

### Completeness Check -- Other Capability-Granting Equipment

Verified that no other equipment entries in PTU p.293-295 grant named capabilities that are missing from the catalog:

- **Snow Boots** -- already has `grantedCapabilities: ['Naturewalk (Tundra)']` (pre-existing)
- **Jungle Boots** -- already has `grantedCapabilities: ['Naturewalk (Forest)']` (pre-existing)
- **Flippers** -- modifies swim speed numerically (+2/-2), not a named capability grant. Not in catalog. Not in scope.
- **Sunglasses** -- skill check bonus, not a capability. Not in catalog. Not in scope.
- **Running Shoes** -- speed bonus, not a capability. Already in catalog without grantedCapabilities, correctly.

No missing capability-granting items.

### Data Structure Correctness

- The `grantedCapabilities` field is typed as `string[]` on the `EquippedItem` interface (confirmed in `app/types/character.ts` line 131).
- All three entries use the correct type (`string[]`).
- The `getEquipmentGrantedCapabilities()` utility in `app/utils/equipmentBonuses.ts` iterates all slots and collects these values correctly.
- The `HumanEquipmentTab.vue` component renders them as UI tags.
- The `getCombatantNaturewalks()` function in `app/utils/combatantCapabilities.ts` merges equipment-granted capabilities with manual capabilities, so `'Darkvision'` granted by Dark Vision Goggles will appear in the Naturewalk parse path. However, since `'Darkvision'` does not match the Naturewalk regex pattern (`/^Naturewalk\s*\(([^)]+)\)$/i`), it is harmlessly skipped. No bug.

### Re-Breather as New Entry

The Re-Breather was not previously in the equipment catalog and was added as a complete new entry. This is correct -- the item exists in PTU p.293 and belongs in the catalog. The slot (`head`), cost (`4000`), and description all match the source text.

### Commit Granularity

Single commit touching one file for a cohesive change (adding capability data to three catalog entries). Appropriate granularity.

## What Looks Good

1. **Accurate PTU data**: All costs, slots, and capability names match the source rules text exactly.
2. **Correct data structure**: Uses the established `grantedCapabilities: string[]` pattern already proven by Snow Boots and Jungle Boots.
3. **Complete coverage**: All capability-granting head equipment from PTU p.293 is now covered.
4. **Clean integration**: The existing `getEquipmentGrantedCapabilities()` utility and `HumanEquipmentTab.vue` UI automatically pick up the new data with zero additional code changes required.
5. **Re-Breather addition**: Adding a missing catalog entry alongside the capability population is a sensible inclusion -- the item was needed for the `grantedCapabilities` field to exist on it.

## Verdict

**APPROVED** -- The implementation is correct, complete, and well-scoped. All three items match PTU 1.05 rules, the data structure is consistent with existing patterns, and no mechanical regressions are introduced. The change integrates cleanly with the existing equipment utility and UI systems.

## Required Changes

None.
