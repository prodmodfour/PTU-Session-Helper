---
decree_id: decree-054
status: active
domain: combat
topic: temp-hp-hp-loss-absorption
title: "Split hpLoss into recoil (absorbs temp HP) and self-cost (bypasses temp HP)"
ruled_at: 2026-03-06T12:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-053
implementation_tickets: [bug-069]
tags: [combat, temp-hp, hp-loss, belly-drum, life-orb, recoil]
---

# decree-054: Split hpLoss into recoil (absorbs temp HP) and self-cost (bypasses temp HP)

## The Ambiguity

PTU p.247 says Temporary HP is "always lost first from damage or any other effects," but PTU p.236 defines "loses Hit Points" effects as distinct from damage. The current implementation treats all hpLoss effects identically (bypassing temp HP), but some hpLoss effects (Life Orb recoil) feel "incoming" while others (Belly Drum) feel like a deliberate self-cost.

Source: decree-need-053, code-review-352 MED-001.

## Options Considered

### Option A: Bypass temp HP for all hpLoss (current)
"Loses Hit Points" always means real HP. Temp HP only shields against damage. Simple but ignores p.247's "any other effects" language.

### Option B: Absorb temp HP for all hpLoss
PTU p.247's "any other effects" encompasses all HP loss. All hpLoss goes through temp HP. Simple but lets Belly Drum's intended cost be negated by temp HP buffs.

### Option C: Type-dependent (chosen)
Split hpLoss into sub-types: "recoil" (Life Orb, incoming effects) absorbs temp HP; "self-cost" (Belly Drum, deliberate sacrifice) bypasses temp HP. setHp (Pain Split, Endeavor) always bypasses temp HP. More nuanced but preserves the intent of each effect.

## Ruling

**The true master decrees: hpLoss effects must be split into two sub-types — "recoil" (absorbs temp HP) and "self-cost" (bypasses temp HP). setHp always bypasses temp HP.**

The distinction hinges on intent: recoil effects like Life Orb are incidental costs of attacking — the Pokemon didn't choose to take damage, so temp HP should shield them per p.247's "any other effects" language. Self-cost effects like Belly Drum are deliberate sacrifices — the Pokemon pays a price in real HP for a powerful buff, and temp HP shouldn't negate that cost.

This aligns with decree-004's principle that temp HP buffing strategies should be mechanically rewarded (temp HP shields Life Orb users from recoil) while preserving the meaningful trade-off of self-cost abilities.

Summary of temp HP absorption by type:
- `damage`: absorbs temp HP (unchanged)
- `hpLoss` recoil (Life Orb): absorbs temp HP (NEW)
- `hpLoss` self-cost (Belly Drum): bypasses temp HP (unchanged behavior)
- `setHp` (Pain Split, Endeavor): bypasses temp HP (unchanged)

## Precedent

HP reduction effects are classified by intent, not just mechanics. "Incoming" HP loss (recoil, environmental) absorbs temp HP per p.247. "Deliberate sacrifice" HP loss bypasses temp HP because the cost is the point. The `HpReductionType` union must be expanded to capture this distinction.

## Implementation Impact

- Tickets created: bug-069 (split HpReductionType to distinguish recoil from self-cost)
- Files affected: `app/server/services/combatant.service.ts` (type definition, calculateDamage logic), callers that pass `hpLoss`
- Skills affected: all combat reviewers (cite this decree for temp HP + HP loss interactions)
