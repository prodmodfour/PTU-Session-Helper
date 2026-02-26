---
decree_id: decree-012
status: active
domain: combat
topic: type-immunity-enforcement
title: "Enforce type-based status immunities server-side with GM override flag"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-012
implementation_tickets:
  - ptu-rule-104
tags: [combat, status-conditions, type-immunity, server-enforcement]
---

# decree-012: Enforce type-based status immunities server-side with GM override flag

## The Ambiguity

Should the server enforce type-based status condition immunities (Fire immune to Burn, Electric immune to Paralysis, etc.), or leave enforcement to client/GM discretion? Surfaced by decree-need-012.

## Options Considered

### Option A: Server enforcement
Block invalid type+status combinations at the API level. Clean and rule-faithful but inflexible for edge cases (ability-based type changes, special scenarios).

### Option B: Client warning only
Show a warning in the UI, let the GM override. Server stays permissive. Covers edge cases but no safety net.

### Option C: Server enforcement with override flag
Block by default but accept an `override: true` parameter for edge cases. Best of both worlds, slightly more complex.

### Option D: No enforcement (current)
Trust the GM entirely. No warnings, no blocks.

## Ruling

**The true master decrees: enforce type-based status immunities server-side with a GM override flag.**

The server endpoint `status.post.ts` must check the target's types against the type-immunity mapping before applying a status condition. If the target is immune (e.g., Fire-type receiving Burn), the request is rejected with an informative error. However, an `override: true` parameter allows the GM to force the status condition through, covering edge cases like ability-based type changes, homebrew rules, or other special scenarios. The client UI should also display a warning when attempting to apply an immune status, with a confirmation prompt that sends the override flag.

## Precedent

Server-side enforcement of PTU rules is the default, but with a GM override escape hatch for edge cases. This pattern (enforce by default, allow explicit override) should be applied to other server-side rule checks going forward.

## Implementation Impact

- Tickets created: ptu-rule-104
- Files affected: `app/server/api/encounters/[id]/status.post.ts`, `app/composables/useTypeChart.ts` (or shared type-immunity map), client UI for status application
- Skills affected: Combat reviewers must verify type-immunity checks include override path
