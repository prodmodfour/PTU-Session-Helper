---
decree_id: decree-037
status: active
domain: character-lifecycle
topic: skill-ranks-via-edges-only
title: "Skill ranks come from Edge slots only, not automatic per-level grants"
ruled_at: 2026-02-28T23:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-028
implementation_tickets:
  - ptu-rule-127
tags: [character-lifecycle, skill-ranks, level-up, trainer-advancement, edge-slots]
---

# decree-037: Skill ranks come from Edge slots only, not automatic per-level grants

## The Ambiguity

The feature-008 P0 implementation grants `skillRanksGained: 1` per trainer level as an automatic entitlement, separate from Edge slots. However, PTU 1.05 RAW (Core p.19) only lists three per-level gains: +1 Stat Point (every level), +1 Feature (odd levels), +1 Edge (even levels). Skill ranks in RAW are advanced by spending Edge slots on Skill Edges (Basic/Adept/Expert/Master Skills, Core p.52). The design spec chose `skillRanksGained: 1` as a convenience simplification.

Surfaced by rules-review-204 HIGH-01, filed as decree-need-028.

## Options Considered

### Option A: Automatic skill rank per level (house rule)
Keep the current +1 automatic skill rank per level on top of normal Edge slots. Simplifies the flow since most players spend Edges on skills anyway.

**Pros:** Simpler workflow. Reduces decision fatigue.
**Cons:** Deviates from PTU RAW. Gives trainers more total skill ranks than RAW allows (double-counting when P1 adds Edge selection). Overpowers skill progression.

### Option B: Skill ranks via Edge slots only (PTU RAW)
Remove the automatic skill rank step. Skill rank allocation happens as part of Edge selection — the GM/player spends Edge slots on Skill Edges to gain skill ranks.

**Pros:** Matches PTU RAW exactly. Correct skill rank economy. No double-counting risk.
**Cons:** P0 has no skill rank step until P1 Edge selection is implemented.

### Option C: Auto skill rank replaces one Edge slot
Treat the automatic skill rank as consuming one Edge slot. When P1 adds Edge selection, reduce available Edges by 1.

**Pros:** Matches RAW total counts. Keeps P0 convenience.
**Cons:** Complex accounting. Confusing "replaces" semantics.

## Ruling

**The true master decrees: skill ranks come from Edge slots only, not automatic per-level grants.**

PTU 1.05 RAW (Core p.19) defines exactly three per-level gains: Stat Points, Features, and Edges. Skill ranks are gained by spending Edge slots on Skill Edges (Core p.52), making them a deliberate player/GM choice, not an automatic entitlement. The current `skillRanksGained: 1` in `trainerAdvancement.ts` must be removed. The skill rank allocation step in P0's level-up UI must be removed. Skill rank progression will be implemented as part of P1's Edge selection system, where the GM chooses which Edges to take (including Skill Edges).

This aligns with decree-027's precedent that Skill Edges are the canonical mechanism for skill rank progression in PTU.

## Precedent

**Trainer per-level gains are limited to exactly what PTU Core p.19 specifies: Stat Points, Features, and Edges.** No additional automatic grants (skill ranks, HP bonuses, etc.) should be added as house rules unless explicitly decreed. Skill rank progression is a subset of Edge selection, not a parallel system.

## Implementation Impact

- Tickets created: ptu-rule-127 (remove automatic skill rank per level, defer to P1 Edge selection)
- Files affected: `app/utils/trainerAdvancement.ts` (remove `skillRanksGained`), `app/composables/useTrainerLevelUp.ts` (remove skill rank computed properties), `app/components/levelup/LevelUpSkillSection.vue` (remove or disable until P1), design spec `artifacts/designs/design-trainer-level-up-001/spec-p0.md` Section E
- Skills affected: Developer, Game Logic Reviewer, Implementation Auditor
