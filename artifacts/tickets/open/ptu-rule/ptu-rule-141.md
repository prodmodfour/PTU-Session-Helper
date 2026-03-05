---
ticket_id: ptu-rule-141
title: "Gas Mask grantedCapabilities uses fabricated capability name"
priority: P4
severity: MEDIUM
status: open
domain: character-lifecycle
source: rules-review-ptu-rule-125 MED-01
created_by: game-logic-reviewer
created_at: 2026-03-05
affected_files:
  - app/constants/equipment.ts
---

# ptu-rule-141: Gas Mask grantedCapabilities uses fabricated capability name

## Summary

The Gas Mask entry in `EQUIPMENT_CATALOG` has `grantedCapabilities: ['Gas Mask Immunity']`, but "Gas Mask Immunity" is not a named PTU capability. The `grantedCapabilities` field was designed for real PTU capabilities (Darkvision, Gilled, Naturewalk variants). Using it for a fabricated name is misleading to downstream consumers like `getEquipmentGrantedCapabilities()` and the equipment UI bonuses display.

## PTU Reference

Gas Mask (PTU p.293, `core/09-gear-and-items.md`):
> "Gas Masks are invaluable equipment when trying to breathe in toxic environments or heavy smoke. They not only let you breathe through environmental toxins or smoke, but you become immune to the Moves Rage Powder, Poison Gas, Poisonpowder, Sleep Powder, Smog, Smokescreen, Spore, Stun Spore, and Sweet Scent."

This is a specific move immunity list, not a capability grant. The closest PTU mechanic is the Overcoat Ability ("immune to Moves with the Powder Keyword"), but Gas Mask covers additional non-Powder moves (Smog, Smokescreen, Sweet Scent).

## Suggested Fix

Option A (minimal): Remove `grantedCapabilities` from Gas Mask entirely. The effect is adequately described in the `description` field.

Option B (extensible): Add a new field like `moveImmunities: string[]` to track specific move immunities, and remove "Gas Mask Immunity" from `grantedCapabilities`.

Option C (decree-need): If the team intentionally wants to use `grantedCapabilities` for non-PTU effects, file a decree establishing a naming convention (e.g., prefix fabricated capabilities with "Equipment:").

## Impact

Low immediate impact — the Gas Mask capability is only displayed in UI and has no mechanical enforcement in the combat system currently. However, if future code iterates over `grantedCapabilities` expecting real PTU capability names (e.g., to check Darkvision for fog of war), "Gas Mask Immunity" would be a meaningless entry.
