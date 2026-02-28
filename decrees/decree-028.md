---
decree_id: decree-028
status: active
domain: rest
topic: bound-ap-new-day
title: "Bound AP persists across New Day"
ruled_at: 2026-02-28T12:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-029
implementation_tickets: []
tags: [rest, new-day, bound-ap, ap-management]
---

# decree-028: Bound AP persists across New Day

## The Ambiguity

Should bound AP reset when the GM triggers New Day? Decree-016 says bound AP persists until the binding effect ends. Decree-019 says New Day is a pure counter reset. The tension: is boundAp a daily counter that expires overnight, or a persistent effect that only the GM explicitly clears? Surfaced by decree-need-029, flagged during bug-038 implementation.

## Options Considered

### Option A: Persist across days (current implementation)
Bound AP stays until GM manually clears it. Strict reading of decree-016 and decree-019. Current behavior after bug-038 fix.

### Option B: Reset on New Day
Bound AP resets to 0 on New Day. Practical convenience — binding effects rarely survive overnight narratively. Would partially revert bug-038 fix.

### Option C: GM prompt on New Day
Show bound AP in the New Day flow and let GM choose to clear or keep each character's bound AP. Most flexible but adds UI complexity.

## Ruling

**The true master decrees: bound AP persists across New Day.**

This is the strict reading consistent with both decree-016 (bound AP persists until the binding effect ends) and decree-019 (New Day is a pure counter reset, not an implicit "end all effects" trigger). The GM must manually clear bound AP when the binding effect narratively ends. This maintains the modular design where each mechanic is explicitly invoked.

## Precedent

Bound AP is not a daily counter — it is a persistent effect tied to specific game mechanics. New Day does not implicitly end binding effects, just as it does not implicitly grant extended rest. The GM retains explicit control over when binding effects end.

## Implementation Impact

- Tickets created: none — confirms current behavior (bug-038 fix is correct)
- Files affected: none
- Skills affected: Rest/healing reviewers should verify New Day preserves boundAp
