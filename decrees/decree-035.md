---
decree_id: decree-035
status: active
domain: pokemon-lifecycle
topic: base-relations-nature-adjusted
title: "Use nature-adjusted base stats for Base Relations ordering"
ruled_at: 2026-02-28T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-035
implementation_tickets: []
tags: [pokemon-lifecycle, evolution, base-relations, nature, stat-ordering, stat-redistribution]
---

# decree-035: Use nature-adjusted base stats for Base Relations ordering

## The Ambiguity

PTU p.198 defines the Base Relations Rule using stat ordering. The evolution text (p.203) says to "take the new form's Base Stats, apply the Pokemon's Nature again... You must of course, still follow the Base Relations Rule." The question: does the ordering use raw species base stats or nature-adjusted base stats?

Source: decree-need-035, surfaced by design-pokemon-evolution-001/spec-p0.md (section 3.1.3).

## Options Considered

### Option A: Nature-adjusted base stats
The ordering constraint uses nature-modified base stats. A +Atk/-Def nature changes which stats must be higher/lower, giving more flexibility during stat redistribution. This matches the PTU text qualifier "with a neutral nature" (implying non-neutral natures change the ordering) and the evolution sequence (Nature applied before redistribution).

### Option B: Raw species base stats
Use unmodified species base stats for the ordering. Natures affect final stat values but the ordering requirement is always based on raw base stats. Simpler but stricter.

## Ruling

**The true master decrees: Base Relations ordering uses nature-adjusted base stats.**

PTU p.198 explicitly qualifies its example "with a neutral nature, Charmander has Speed > Special Attack > Attack..." — the phrase "with a neutral nature" implies the ordering changes with non-neutral natures. The evolution text (p.203) sequences the operations as: (1) take new base stats, (2) apply Nature, (3) reapply Vitamins, (4) redistribute stat points following Base Relations. Since Nature is applied at step 2 before redistribution at step 4, the Base Relations ordering at step 4 uses the nature-adjusted values from step 2.

Example: Charmander with +Atk/-Def nature has a different stat ordering than neutral Charmander, allowing different valid stat distributions.

## Precedent

Base Relations ordering always uses nature-adjusted base stats, not raw species base stats. When implementing `validateBaseRelations()`, apply the Pokemon's nature to the new form's base stats first, then derive the required ordering from those adjusted values. This applies both during evolution and during normal level-up stat point allocation.

## Implementation Impact

- Tickets created: none — confirms the design-pokemon-evolution-001 default interpretation
- Files affected: `validateBaseRelations()` in feature-006 evolution system
- Skills affected: pokemon-lifecycle reviewers, evolution developer
