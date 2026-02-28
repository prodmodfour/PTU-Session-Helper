---
decree_id: decree-032
status: active
domain: combat
topic: cursed-tick-standard-action-only
title: "Cursed tick fires only on actual Standard Action use, not when prevented"
ruled_at: 2026-02-28T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-032
implementation_tickets: []
tags: [combat, status-conditions, cursed, volatile, tick-damage, standard-action]
---

# decree-032: Cursed tick fires only on actual Standard Action use, not when prevented

## The Ambiguity

PTU Burn and Poison explicitly state damage fires when a target "takes a Standard Action **or is prevented from taking a Standard Action** by an effect such as Sleep, Flinch, or Paralysis." The Cursed condition (p.247) says only "If a Cursed Target takes a Standard Action, they lose two ticks of Hit Points" — omitting the "or is prevented" clause entirely.

Source: decree-need-032, surfaced by design-status-automation-001/spec-p0.md (decision D1).

## Options Considered

### Option A: Strict reading (text difference is deliberate)
Cursed ONLY ticks when the combatant actually uses a Standard Action. If Frozen, Asleep, Flinched, or Paralysis-skipped, no Cursed tick. The deliberate textual difference between Burn/Poison and Cursed is mechanical, not editorial.

### Option B: Broad reading (editorial omission)
Treat Cursed the same as Burn/Poison — it ticks every turn regardless of whether the target can act. The omission of the "prevented" clause is editorial inconsistency.

## Ruling

**The true master decrees: Cursed tick damage fires only when the combatant actually uses a Standard Action.**

Burn and Poison explicitly include the "or is prevented from taking a Standard Action" clause. Cursed deliberately omits it. This textual difference is mechanical, not editorial — Cursed is a Volatile affliction (weaker persistence) that deals 2 ticks instead of 1, and the tradeoff is that incapacitated targets don't take Cursed damage. Respecting the RAW text difference is the correct approach.

## Precedent

When PTU status conditions have different wording for their tick triggers, respect the exact text. Burn/Poison fire on "takes or is prevented from taking a Standard Action." Cursed fires only on "takes a Standard Action." Do not normalize trigger conditions across different statuses unless the text is identical.

## Implementation Impact

- Tickets created: none — confirms the design-status-automation-001 default interpretation
- Files affected: future status tick automation in feature-010
- Skills affected: combat reviewers, status automation developer
