---
decree_id: decree-017
status: active
domain: rest
topic: pokemon-center-full-health
title: "Pokemon Center heals to effective max HP, respecting injury cap"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-017
implementation_tickets: []
tags: [rest, pokemon-center, injuries, effective-max-hp]
---

# decree-017: Pokemon Center heals to effective max HP, respecting injury cap

## The Ambiguity

Does Pokemon Center "full health" mean real max HP or injury-reduced effective max HP? PTU p.252 says Pokemon Centers heal "back to full health," but p.250 says injury rules cap ALL healing at effective max. Surfaced by decree-need-017.

## Options Considered

### Option A: Effective max HP (current)
Respects injury cap as a universal rule. If 2 injuries remain after healing 3, HP caps at effective max. Pokemon Centers can't bypass the fundamental injury mechanic.

### Option B: Real max HP
Pokemon Center machinery overrides the injury cap for HP. Injuries remain as mechanical penalties but HP is fully restored.

## Ruling

**The true master decrees: Pokemon Center heals to effective max HP, respecting the injury cap.**

The injury cap on healing (p.250) is a universal rule that applies to ALL healing sources. Pokemon Centers heal injuries first (up to the daily limit), then heal HP to the effective max of remaining injuries. "Full health" means "as healthy as possible given current injuries," not "bypass injury mechanics." This is consistent with the injury system's fundamental design as a persistent penalty.

## Precedent

The injury HP cap (p.250) is universal and cannot be bypassed by any healing source. "Full health" in PTU means maximum possible HP given current injury state. This applies to Pokemon Centers, items, abilities, and any future healing mechanics.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none
- Skills affected: Rest/healing reviewers should verify all healing respects the injury cap
