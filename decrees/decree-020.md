---
decree_id: decree-020
status: active
domain: rest
topic: pokemon-center-injury-time
title: "Pokemon Center healing time uses pre-healing injury count"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-020
implementation_tickets: []
tags: [rest, pokemon-center, injuries, healing-time]
---

# decree-020: Pokemon Center healing time uses pre-healing injury count

## The Ambiguity

Should Pokemon Center healing time be calculated from the pre-healing injury count (at arrival) or post-healing injury count (after treatment)? PTU says "for each Injury on the Trainer or Pokemon" without specifying when the count is evaluated. Surfaced by decree-need-020.

## Options Considered

### Option A: Pre-healing count (current)
The injuries cause the delay — the healing process takes longer because it must treat all injuries present at arrival. Narratively sensible: a Pokemon with 4 injuries requires more treatment time than one with 1.

### Option B: Post-healing count
Only remaining injuries after treatment determine recovery time. Faster recovery.

## Ruling

**The true master decrees: Pokemon Center healing time uses the pre-healing injury count.**

"For each Injury ON the Trainer or Pokemon" refers to the injuries present when the Pokemon arrives at the Pokemon Center. The healing process takes longer because it must address each injury — the time reflects the work being done, not the result. A Pokemon arriving with 4 injuries takes base 1h + 4*30min = 3h regardless of how many injuries are healed.

## Precedent

Time-based calculations for healing use the state at the start of the healing process, not the result. The duration reflects the effort required to treat the conditions present.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none (`restHealing.ts:calculatePokemonCenterTime()` already uses pre-healing count)
- Skills affected: Rest/healing reviewers should verify time calculation uses arrival state
