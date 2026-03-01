---
decree_id: decree-039
status: active
domain: combat
topic: roar-blocked-by-trapped
title: "Roar's forced recall does not override the Trapped condition"
ruled_at: 2026-03-01T12:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-038
implementation_tickets: [ptu-rule-129]
tags: [combat, switching, roar, trapped, forced-switch, status-conditions]
---

# decree-039: Roar's forced recall does not override the Trapped condition

## The Ambiguity

PTU 1.05 p.247 states: "A Pokemon or Trainer that is Trapped cannot be recalled." The current implementation (feature-011 P1) allows Roar to force-switch a Trapped Pokemon, following video game precedent where Roar/Whirlwind break trapping effects. No explicit exception for Roar exists in the PTU text.

Source: decree-need-038, surfaced by rules-review-217 MEDIUM-001.

## Options Considered

### Option A: Roar overrides Trapped (video game precedent)
Forced switches bypass the Trapped condition entirely. Matches mainline Pokemon video game behavior where Roar/Whirlwind break trapping effects. However, no PTU text supports this.

### Option B: Roar blocked by Trapped (strict PTU RAW)
Trapped prevents all recall including Roar's forced recall mechanic. The shift away still occurs (it's movement, not recall), but the Pokemon is not recalled to its Poke Ball. PTU explicitly marks moves that bypass Trapped (U-Turn, Baton Pass, Volt Switch, Parting Shot, Round Trip) — Roar is not among them.

### Option C: Roar has its own check (hybrid)
Roar must pass an additional check to break through Trapped. No PTU basis for this mechanic.

## Ruling

**The true master decrees: Roar's forced recall does NOT override the Trapped condition. A Trapped Pokemon hit by Roar still shifts away but is not recalled.**

PTU is deliberate about which moves bypass Trapped. The text explicitly states:
- U-Turn: "Using U-Turn lets a Trapped user be recalled." (p.4011)
- Baton Pass: "Baton Pass may be used to switch even if the user is Trapped." (p.7549)
- Volt Switch: "Using Volt Switch lets a Trapped user be recalled." (p.4849)
- Parting Shot: "Using Parting Shot lets a Trapped user be recalled." (p.4249)
- Round Trip (trainer feature): "This effect lets Pokemon with the Trapped condition switch out." (p.1763)

Roar's text (p.8855) says nothing about Trapped. If PTU intended Roar to bypass Trapped, it would say so explicitly — as it does for every other move that bypasses Trapped. The shift movement still happens (Trapped restricts recall, not movement), but the recall check at 6m fails because the Pokemon cannot be recalled.

Dragon Tail and Circle Throw are pure Push moves with no recall mechanic (per decree-034 precedent), so Trapped is irrelevant to them.

## Precedent

When PTU wants a move to bypass the Trapped condition, the move text explicitly says so. Absence of such text means Trapped applies normally. This "explicit exception" pattern is the standard for interpreting Trapped interactions with any move or ability. If a future move's text does not explicitly mention bypassing Trapped, Trapped blocks its recall effect.

## Implementation Impact

- Tickets created: ptu-rule-129 (fix Roar to respect Trapped condition — shift still happens, recall blocked)
- Files affected: `app/composables/useSwitching.ts` (forced switch validation), `app/server/api/encounter/switch.post.ts` (server-side validation)
- Skills affected: combat reviewers, switching workflow developer
