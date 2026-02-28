---
decree_id: decree-029
status: active
domain: rest
topic: rest-healing-minimum
title: "Rest healing has a minimum of 1 HP"
ruled_at: 2026-02-28T12:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-028
implementation_tickets:
  - ptu-rule-122
tags: [rest, healing, minimum-healing, hp-recovery]
---

# decree-029: Rest healing has a minimum of 1 HP

## The Ambiguity

PTU p.252 says Pokemon "heal 1/16th of their Maximum Hit Points" during rest. The code uses `Math.floor(maxHp / 16)`, which produces 0 for any Pokemon with maxHp < 16 (e.g., Shedinja at level 1 with maxHp 14). Should there be a minimum healing amount? Surfaced by decree-need-028 from healing audit.

## Options Considered

### Option A: No minimum (strict reading)
PTU says floor, so `floor(15/16) = 0`. A low-HP Pokemon simply doesn't benefit from rest healing. The GM can use Pokemon Center healing instead.

### Option B: Minimum 1 HP
Rest should always heal at least 1 HP. Most tabletop groups would house-rule this. Ensures rest is never completely useless for any Pokemon.

## Ruling

**The true master decrees: rest healing has a minimum of 1 HP per rest period.**

Resting should always provide some healing benefit. A minimum of 1 HP ensures that rest is never completely useless, even for Pokemon with very low max HP. This matches common tabletop practice and prevents an unintuitive edge case where rest does literally nothing.

## Precedent

When a PTU healing formula can produce 0 through rounding, apply a minimum of 1 HP. Healing actions should always provide at least token benefit. This is a house-rule extension applied for usability.

## Implementation Impact

- Tickets created: ptu-rule-122
- Files affected: `app/utils/restHealing.ts`, rest-related API endpoints
- Skills affected: Rest/healing reviewers should verify minimum 1 HP floor is applied
