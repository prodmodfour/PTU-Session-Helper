---
decree_id: decree-030
status: active
domain: encounter
topic: significance-preset-cap
title: "Cap significance presets at x5 per PTU RAW"
ruled_at: 2026-02-28T12:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-030
implementation_tickets:
  - ptu-rule-123
tags: [encounter, significance, xp, presets, ptu-compliance]
---

# decree-030: Cap significance presets at x5 per PTU RAW

## The Ambiguity

The significance preset system includes `climactic` (x6) and `legendary` (x8) tiers that exceed PTU's stated range. PTU Core p.460 says "The Significance Multiplier should range from x1 to about x5." Three independent auditors reached conflicting conclusions. Surfaced by decree-need-030 from pokemon-lifecycle, encounter-tables, and scenes audits.

## Options Considered

### Option A: Cap at x5 (strict PTU reading)
Remove climactic and legendary presets. The maximum preset should be x5. GMs who want higher values can manually enter them.

### Option B: Keep as labeled house-rule extensions
Rename to clearly indicate they exceed RAW (e.g., "Climactic (x6, house rule)").

### Option C: Keep as-is (tool extension)
The app is a GM tool, not a rules enforcer. The "about" qualifier in PTU gives flexibility.

## Ruling

**The true master decrees: cap significance presets at x5 per PTU RAW.**

Remove the climactic (x6) and legendary (x8) presets. The app should respect the PTU-stated range. GMs who want to exceed x5 can manually enter a custom value — the presets should not suggest values outside the rules as written.

## Precedent

When PTU specifies a numeric range for a mechanic, the app's presets must stay within that range. The "about" qualifier gives slight flexibility (e.g., x5 rather than exactly x4), but does not justify x6 or x8. Custom/manual input is always available for GMs who want to house-rule beyond RAW.

## Implementation Impact

- Tickets created: ptu-rule-123
- Files affected: `app/constants/significancePresets.ts` (or equivalent), significance UI
- Skills affected: Encounter/XP reviewers should verify presets cap at x5
