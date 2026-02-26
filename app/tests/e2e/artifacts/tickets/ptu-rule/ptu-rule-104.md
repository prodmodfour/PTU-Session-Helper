---
ticket_id: ptu-rule-104
ticket_type: ptu-rule
priority: P1
status: open
domain: combat
topic: type-immunity-enforcement
source: decree-012
affected_files:
  - app/server/api/encounters/[id]/status.post.ts
  - app/composables/useTypeChart.ts
created_at: 2026-02-26T18:00:00
---

## Summary

Enforce type-based status condition immunities server-side with a GM override flag.

## PTU Rule

Electric immune to Paralysis, Fire immune to Burn, Ghost immune to Stuck/Trapped, Ice immune to Frozen, Poison/Steel immune to Poison (p.239).

## Current Behavior

Type-immunity mapping exists client-side in `useTypeChart.ts` (lines 12-20), but `status.post.ts` performs no type-immunity check. Server accepts any status on any type.

## Required Behavior

1. Server checks target's types against type-immunity mapping before applying status
2. If immune, reject with informative error (e.g., "Fire-type Pokemon are immune to Burn")
3. Accept `override: true` parameter to force the status through (for edge cases)
4. Client UI should show warning when attempting immune status, with confirmation prompt that sends override flag

## Notes

- Type-immunity map may need to be shared between client and server (extract to shared utility)
- Related: decree-012 establishes the "enforce by default, override for edge cases" pattern
