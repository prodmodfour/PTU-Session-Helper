---
decree_id: decree-044
status: active
domain: combat
topic: bound-condition-removal
title: "Remove phantom 'Bound' condition; only Trapped blocks recall (RAW)"
ruled_at: 2026-03-03T21:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-043
implementation_tickets: [bug-049]
tags: [combat, switching, recall, trapped, bound, grapple, status-conditions, vortex]
---

# decree-044: Remove phantom 'Bound' condition; only Trapped blocks recall (RAW)

## The Ambiguity

The switching system checks for both 'Trapped' and 'Bound' conditions when blocking recall. However 'Bound' is not in the StatusCondition type union (tests use `as any` casts), no code anywhere inflicts 'Bound', and no PTU mechanic produces a condition called "Bound." Both code-review-308 and rules-review-281 independently flagged this.

The question was whether 'Bound' was intended as a house rule condition (e.g., representing Grapple or Wrap/Bind effects blocking recall).

Source: decree-need-043, surfaced by code-review-308 MEDIUM-002 + rules-review-281 HIGH-001.

## Options Considered

### Option A: Remove 'Bound' checks entirely
Dead code — nothing inflicts it, it's not a PTU condition, and Trapped already covers recall-blocking from Vortex moves. Remove all 'Bound' checks and the `as any` test cases.

### Option B: Keep 'Bound' as a house rule for Grapple blocking recall
Treat 'Bound' as representing "Grappled blocks recall too." Would be a house rule since Grapple RAW doesn't block recall, only shifting.

### Option C: Keep for future Wrap/Bind mechanics
Anticipate a future mechanic where Wrap/Bind moves inflict a recall-blocking condition.

## Ruling

**The true master decrees: Remove 'Bound' from the switching system entirely. Only Trapped blocks recall. Grapple does not block recall (RAW).**

PTU research findings:
- **Vortex** keyword (Fire Spin, Whirlpool, Sand Tomb, Infestation, Magma Storm) inflicts **Trapped** + Slowed + tick damage. This already blocks recall via the existing Trapped check.
- **Bind** and **Wrap** are Static moves that enhance **Grapple** maneuvers (+1 accuracy, +2 skill checks, tick damage on Dominance gain). They do not inflict Trapped or any other recall-blocking condition.
- **Grapple** (p.243) is its own state: Vulnerable, cannot Shift, -6 accuracy outside grapple. It does NOT inflict Trapped. Grappled Pokemon CAN be recalled — recall is not a Shift action.
- **No PTU mechanic** produces a condition called "Bound." The 'Bound' checks are dead code with no inflictor.

The Grapple state should be tracked separately if/when Grapple mechanics are implemented, but it does not block recall per RAW.

## Precedent

Recall-blocking is exclusively governed by the **Trapped** condition in PTU. Grapple restricts **shifting** (movement), not **recall** (returning to Poke Ball). These are distinct mechanics and should not be conflated. When implementing new movement-restricting mechanics, check whether they inflict Trapped (blocks recall) or restrict Shift actions (does not block recall).

## Implementation Impact

- Tickets created: bug-049 (remove dead 'Bound' condition checks from switching system)
- Files affected: `app/server/services/switching.service.ts` (2 locations), `app/composables/useSwitching.ts` (1 location), `app/server/api/encounters/[id]/recall.post.ts` (1 location), `app/tests/unit/services/switching.service.test.ts` (remove `as any` test case)
- Skills affected: Switching workflow developer, combat reviewers
