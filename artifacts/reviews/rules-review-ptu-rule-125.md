---
review_id: rules-review-ptu-rule-125
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: ptu-rule-125
domain: character-lifecycle
commits_reviewed:
  - 73992ba6
mechanics_verified:
  - equipment-granted-capabilities
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/09-gear-and-items.md#Page-293
  - core/10-indices-and-reference.md#Capabilities
  - errata-2.md
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Equipment Granted Capabilities

#### Dark Vision Goggles — Darkvision
- **Rule:** "These Goggles simply grant the Darkvision Capability while worn." (`core/09-gear-and-items.md` p.293)
- **Capability definition:** "A Pokemon with the Darkvision Capability never has their vision hampered by a loss of light. They can even see in total darkness and are never Blind" (`core/10-indices-and-reference.md` p.303)
- **Implementation:** `grantedCapabilities: ['Darkvision']` in `app/constants/equipment.ts` line 48
- **Status:** CORRECT — The capability name "Darkvision" exactly matches PTU RAW.

#### Re-Breather — Gilled
- **Rule:** "This small partial face mask allows Trainers and Pokemon to breathe underwater as if they had the Gilled Capability for up to an hour." (`core/09-gear-and-items.md` p.293)
- **Capability definition:** "A Gilled Pokemon can breathe underwater. It never needs to come up for air and can remain underwater for as long as it wants to." (`core/10-indices-and-reference.md` p.303)
- **Implementation:** `grantedCapabilities: ['Gilled']` in `app/constants/equipment.ts` line 62. New catalog entry with correct slot (`head`), cost ($4000), and description.
- **Status:** CORRECT — The capability name "Gilled" exactly matches PTU RAW. Note: the Re-Breather has a 1-hour duration limit per PTU, which is noted in the description string but not mechanically enforced. This is acceptable — duration tracking is outside the scope of static capability grants.

#### Gas Mask — "Gas Mask Immunity" (fabricated)
- **Rule:** "Gas Masks are invaluable equipment when trying to breathe in toxic environments or heavy smoke. They not only let you breathe through environmental toxins or smoke, but you become immune to the Moves Rage Powder, Poison Gas, Poisonpowder, Sleep Powder, Smog, Smokescreen, Spore, Stun Spore, and Sweet Scent." (`core/09-gear-and-items.md` p.293)
- **Implementation:** `grantedCapabilities: ['Gas Mask Immunity']` in `app/constants/equipment.ts` line 55
- **Status:** NEEDS REVIEW — "Gas Mask Immunity" is NOT a named PTU capability. The Gas Mask's effect is a specific immunity to 9 enumerated moves, not a grant of any capability. The closest PTU mechanic is the Overcoat Ability ("immune to Moves with the Powder Keyword") but the Gas Mask's immunity list is broader (includes non-Powder moves like Smog, Smokescreen, Sweet Scent). Using `grantedCapabilities` for a fabricated capability name is misleading — consumers of `getEquipmentGrantedCapabilities()` would display "Gas Mask Immunity" as if it were a real PTU capability. This is a MEDIUM severity data integrity issue. See ticket ptu-rule-141.

### Completeness Audit — Missing Capability-Granting Equipment

Exhaustive review of all Trainer equipment on PTU pages 293-295:

| Equipment | PTU Effect | Grants Named Capability? | In Catalog? |
|-----------|-----------|--------------------------|-------------|
| Light Armor | 5 DR | No | Yes |
| Heavy Armor | 10 DR, -1 Speed CS | No | Yes |
| Fancy Clothes | Contest stat dice | No | No (not in catalog — out of scope) |
| Stealth Clothes | +4 Stealth | No | Yes |
| Dark Vision Goggles | Darkvision Capability | **Yes — Darkvision** | Yes, with grantedCapabilities |
| Gas Mask | Immunity to 9 moves | No (see above) | Yes, with fabricated capability |
| Helmet | 15 DR vs crits | No | Yes |
| Re-Breather | Gilled Capability (1hr) | **Yes — Gilled** | Yes, with grantedCapabilities |
| Sunglasses | +1 Charm/Guile/Intimidate | No | No (not in catalog) |
| Snow Boots | Naturewalk (Tundra) | **Yes — Naturewalk (Tundra)** | Yes (pre-existing) |
| Running Shoes | +2 Athletics, +1 Overland | No | Yes |
| Flippers | +2 Swim, -2 Overland | No | No (not in catalog) |
| Jungle Boots | Naturewalk (Forest) | **Yes — Naturewalk (Forest)** | Yes (pre-existing) |
| Weapons (various) | Moves, Reach | Reach is a capability but weapon-specific | Weapons not in catalog |
| Focus | +5 stat bonus | No | Yes |

**Finding:** All equipment items that grant named PTU capabilities (Darkvision, Gilled, Naturewalk variants) are correctly represented. No capability-granting items are missing.

Flippers, Sunglasses, and Fancy Clothes are absent from the catalog entirely, but this is a separate catalog completeness issue unrelated to `grantedCapabilities`. Flippers grant a swim speed modifier, not a named capability.

## Summary

The commit correctly populates `grantedCapabilities` on the two items that grant named PTU capabilities (Dark Vision Goggles → Darkvision, Re-Breather → Gilled). The Re-Breather is correctly added as a new catalog entry with accurate slot, cost, and description per PTU p.293.

One medium-severity issue: the Gas Mask entry uses a fabricated capability name "Gas Mask Immunity" in the `grantedCapabilities` field. The Gas Mask does not grant any named PTU capability — it provides specific move immunities. This should either be removed from `grantedCapabilities` and tracked through a different mechanism (e.g., a `moveImmunities` field), or the team should make a conscious decision to use `grantedCapabilities` for non-PTU effects with a clear naming convention. Ticket filed.

## Rulings

1. **Darkvision capability name:** CORRECT per PTU RAW (`core/10-indices-and-reference.md`).
2. **Gilled capability name:** CORRECT per PTU RAW (`core/10-indices-and-reference.md`).
3. **Gas Mask Immunity:** FABRICATED — not a PTU capability. The Gas Mask grants specific move immunities, not a capability. Medium severity.
4. **Completeness:** No missing capability-granting equipment. All items that use the phrasing "grant the X Capability" in PTU RAW are covered.
5. **Errata check:** No errata corrections affect equipment capabilities (`errata-2.md` modifies shields and armor DR only, per playtest supplement p.4).

## Verdict

**APPROVED** — The primary goal of populating `grantedCapabilities` on capability-granting equipment is correctly achieved for all items that genuinely grant named PTU capabilities. The Gas Mask issue is a pre-existing design question (the ticket suggested "Gas Mask Immunity" in its own spec) and does not block approval, but a ticket is filed for resolution.

## Required Changes

None blocking. One medium-severity ticket filed:

- **ptu-rule-141**: Gas Mask `grantedCapabilities` contains fabricated capability name "Gas Mask Immunity" — should use a different mechanism or be removed.
