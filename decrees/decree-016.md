---
decree_id: decree-016
status: active
domain: rest
topic: extended-rest-bound-ap
title: "Extended rest clears only Drained AP, not Bound AP"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-016
implementation_tickets:
  - ptu-rule-105
tags: [rest, extended-rest, bound-ap, drained-ap]
---

# decree-016: Extended rest clears only Drained AP, not Bound AP

## The Ambiguity

Should an extended rest clear Bound AP in addition to Drained AP? The rules explicitly mention restoring Drained AP but are silent on Bound AP. Surfaced by decree-need-016.

## Options Considered

### Option A: Clear both (current)
Assumes binding effects always end during extended rest. Simpler for the GM.

### Option B: Only clear Drained AP (strict reading)
Bound AP persists until the binding feature is explicitly unbound. GM must manually manage bound AP. Faithful to rules as written.

### Option C: Clear Drained, GM choice on Bound
Show bound AP status and let GM decide during extended rest.

## Ruling

**The true master decrees: extended rest clears only Drained AP, not Bound AP.**

PTU p.252 explicitly states extended rest restores "Drained AP." Bound AP is a separate mechanic tied to specific feature/ability effects and remains off-limits until the binding effect ends (per AP rules). Extended rest does not end binding effects. The GM must manually clear bound AP when the binding feature is removed or deactivated.

## Precedent

When PTU enumerates specific effects of a rest type, only those effects apply. Silence on a mechanic means it is unaffected. Rest types do not grant implicit benefits beyond what is listed.

## Implementation Impact

- Tickets created: ptu-rule-105
- Files affected: `app/server/api/characters/[id]/extended-rest.post.ts` (stop clearing bound AP)
- Skills affected: Rest/healing reviewers must verify bound AP is preserved through extended rest
