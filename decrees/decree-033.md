---
decree_id: decree-033
status: active
domain: combat
topic: fainted-switch-on-turn-only
title: "Fainted Pokemon switch happens on trainer's next turn, not as immediate reaction"
ruled_at: 2026-02-28T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-033
implementation_tickets: []
tags: [combat, switching, fainted, initiative, turn-order, shift-action]
---

# decree-033: Fainted Pokemon switch happens on trainer's next turn, not as immediate reaction

## The Ambiguity

PTU says "Trainers may Switch out Fainted Pokemon as a Shift Action" (p.229) but does not specify WHEN this Shift Action can be taken — immediately upon fainting (as a reaction interrupting initiative) or only on the trainer's next turn.

Source: decree-need-033, surfaced by design-pokemon-switching-001/spec-p1.md (Section H).

## Options Considered

### Option A: On-turn-only
The fainted switch happens on the trainer's next turn in initiative order. The fainted Pokemon remains on the field until then. If the Pokemon faints on its own trainer's turn, the switch can happen immediately (it's already their turn).

### Option B: Immediate reaction
The trainer switches the fainted Pokemon immediately when it faints, regardless of initiative order. This is a "free reaction" that interrupts normal turn flow.

### Option C: End-of-round cleanup
All fainted switches happen at the end of the round after all combatants have acted.

## Ruling

**The true master decrees: fainted Pokemon switching happens on the trainer's next available turn in initiative order, not as an immediate reaction.**

The PTU example (p.232) demonstrates both cases: Trainer A switches immediately because the faint happened on their turn, while Trainer B "simply must wait until the next round" because the faint happened outside their turn. Fainted Pokemon remain on the field until the trainer's initiative count arrives. The recall is a Shift Action, the replacement send-out is a Free Action, and the replacement can act that turn if its initiative count hasn't passed.

## Precedent

Fainted Pokemon switching follows normal initiative order. No "interrupt" or "reaction" switching exists in PTU. A trainer can only perform the fainted switch on their own turn (Trainer turn or Pokemon turn). If a Pokemon faints on its own turn, the trainer can switch immediately since it's already that initiative slot.

## Implementation Impact

- Tickets created: none — confirms the design-pokemon-switching-001 P1 default interpretation
- Files affected: future switching workflow in feature-011
- Skills affected: combat reviewers, switching workflow developer
