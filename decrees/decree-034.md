---
decree_id: decree-034
status: active
domain: combat
topic: roar-recall-range-and-whirlwind-push
title: "Roar uses its own 6m recall range; Whirlwind is a push, not a forced switch"
ruled_at: 2026-02-28T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-034
implementation_tickets: []
tags: [combat, switching, roar, whirlwind, forced-switch, recall-range, push]
---

# decree-034: Roar uses its own 6m recall range; Whirlwind is a push, not a forced switch

## The Ambiguity

The switching design assumed forced switches (Roar, Whirlwind) use the normal 8m recall beam range. However, PTU move text reveals Roar has its own recall mechanic, and Whirlwind is not a forced switch at all.

Source: decree-need-034, surfaced by design-pokemon-switching-001/spec-p1.md (Section I).

## Options Considered

### Option A: Use Roar's own 6m range (RAW)
Roar's move text (p.406) specifies its own recall mechanic: targets shift away, and if an owned Pokemon "ends this shift within 6 meters of their Poke Ball, they are immediately recalled." Whirlwind (p.412) is a push move with no recall mechanic.

### Option B: Normal 8m range for all
Ignore Roar's specific text and use the standard 8m recall beam for all forced switches. Treat Whirlwind as a forced switch too.

### Option C: Range bypassed for moves
Move-forced switches bypass range entirely. Roar always forces recall regardless of distance.

## Ruling

**The true master decrees: Roar uses its own built-in 6m recall range per the move text; Whirlwind is a push move, not a forced switch.**

PTU Roar (p.406): targets hit shift away using their highest movement capability, and if an owned Pokemon ends within 6 meters of their Poke Ball, they are immediately recalled. The replacement sent out does not lose their Pokemon turn. This is a distinct mechanic from voluntary switching — Roar has its own 6m range, not the standard 8m recall beam.

PTU Whirlwind (p.412): pushes targets (8 minus weight class) meters, disperses Smokescreen, and destroys hazards. It has NO recall or forced-switch mechanic whatsoever. It is purely a push/displacement move.

## Precedent

Move-based switching mechanics use the move's own text, not the general switching rules. Roar's 6m recall range is specific to Roar and distinct from the 8m Poke Ball recall beam. Whirlwind is not a forced switch — it is a push move. Do not conflate displacement moves with forced-switch moves unless the move text explicitly includes recall mechanics.

## Implementation Impact

- Tickets created: none — corrects the design assumption; the design should be updated to match RAW
- Files affected: future switching workflow in feature-011 (Roar implementation, Whirlwind push handling)
- Skills affected: combat reviewers, switching workflow developer, VTT movement developer
