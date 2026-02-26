---
decree_id: decree-021
status: active
domain: combat
topic: league-battle-trainer-phases
title: "Implement true two-phase trainer system for League Battles"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-021
implementation_tickets:
  - ptu-rule-107
tags: [combat, league-battle, trainer-phases, initiative]
---

# decree-021: Implement true two-phase trainer system for League Battles

## The Ambiguity

Should League Battle mode implement the two-phase trainer system (declare low-to-high speed, then resolve high-to-low), or use a simplified single-pass approach? The type infrastructure exists but the feature is unimplemented. Surfaced by decree-need-021.

## Options Considered

### Option A: Combined phase (current)
One pass through trainers in low-to-high speed order. Simple but doesn't allow faster trainers to react to slower trainers' declarations. Feature type exists but is unused.

### Option B: True two-phase implementation
First pass: all trainers declare actions in low-to-high speed order (no execution). Second pass: resolve actions in high-to-low speed order. Faithful to PTU p.227. Leverages existing `trainer_resolution` type.

### Option C: GM-mediated
Single pass with GM manually reordering resolution. Simpler code, puts burden on GM.

## Ruling

**The true master decrees: implement the true two-phase trainer system for League Battles.**

In League Battle mode, trainer turns follow a two-phase cycle per PTU p.227:
1. **Declaration phase** (`trainer_declaration`): Trainers declare actions in order from lowest to highest speed. Actions are recorded but NOT executed.
2. **Resolution phase** (`trainer_resolution`): Declared actions resolve in order from highest to lowest speed. Faster trainers can see what slower trainers declared and react accordingly.

This allows the strategic depth PTU intends — faster trainers get information advantage by seeing declarations before their own actions resolve. The existing `trainer_resolution` type in `combat.ts` should be activated and connected.

## Precedent

When PTU specifies a distinct mechanical flow for a battle mode, implement it faithfully. League Battles are a specific, named mode with explicit rules — they should not be approximated by the generic combat flow.

## Implementation Impact

- Tickets created: ptu-rule-107
- Files affected: `app/types/combat.ts`, `app/server/api/encounters/[id]/start.post.ts`, `app/server/api/encounters/[id]/next-turn.post.ts`, encounter UI components
- Skills affected: Combat reviewers must verify two-phase flow in League Battle mode. Related: decree-006 (dynamic initiative reordering)
