---
ticket_id: decree-need-028
type: decree-need
status: open
domain: character-lifecycle
topic: automatic-skill-rank-per-level
title: "Do trainers receive an automatic +1 skill rank per level, or only via Edge slots?"
source: rules-review-204 HIGH-01
priority: P1
severity: HIGH
created_at: 2026-02-28T22:20:00Z
tags: [character-lifecycle, skill-ranks, level-up, trainer-advancement]
---

# decree-need-028: Automatic Skill Rank Per Level vs Edge-Based Skill Advancement

## The Ambiguity

The feature-008 P0 implementation grants `skillRanksGained: 1` per trainer level as an automatic entitlement, separate from Edge slots. However, PTU 1.05 RAW (Core p.19) only lists three per-level gains:

1. Every Level: +1 Stat Point
2. Every odd Level: +1 Feature
3. Every even Level: +1 Edge

Skill ranks in PTU RAW are advanced by **spending Edge slots** on Skill Edges (Basic Skills, Adept Skills, Expert Skills, Master Skills -- Core p.52). The book notes "Most likely, the vast majority of Edges will be to increase Skill Ranks," but this is a player choice, not an automatic grant.

The design spec (spec-p0.md) explicitly chose `skillRanksGained: 1` per level (line 24: "Skill ranks gained this level (always 1 -- feature or general, GM decides)"), suggesting this may be an intentional simplification.

## Why This Matters

When P1 implements Edge selection (including the ability to spend Edge slots on Skill Edges), the current approach risks **double-counting**: the trainer would get both a free skill rank AND an Edge slot that could also be spent on a Skill Edge. This would result in more total skill ranks than PTU RAW allows over a career.

## Options

### Option A: Automatic skill rank per level (current implementation)
The skill rank step stays as a convenience feature. Each level grants +1 free skill rank in addition to the normal Edge/Feature. This is a **house rule** that simplifies the level-up flow and avoids forcing the GM to think about "which Edge to spend on skills" at every level.

**Pros:** Simpler workflow. Most players spend Edges on Skill Edges anyway. Reduces decision fatigue.
**Cons:** Deviates from PTU RAW. Gives trainers more total skill ranks than RAW allows (since they also get Edge slots that could additionally be used for Skill Edges). May overpower skill progression.

### Option B: Skill ranks via Edge slots only (PTU RAW)
Remove the automatic skill rank step from P0. Skill rank allocation happens in P1 as part of Edge selection (the GM picks which Edges to take, including Skill Edges).

**Pros:** Matches PTU RAW exactly. Correct skill rank economy.
**Cons:** P0 would have no skill rank step at all (only stat allocation). Requires P1 to be complete before skill rank allocation is available.

### Option C: Automatic skill rank replaces one Edge slot
Treat the automatic skill rank as consuming one Edge slot (effectively auto-selecting a Skill Edge for the trainer). When P1 adds Edge selection, reduce the available Edge count by 1 to account for the auto-selected skill rank.

**Pros:** Matches RAW total counts. Keeps the P0 convenience.
**Cons:** Complex accounting. "Replaces" semantics may confuse.

## Affected Code

- `app/utils/trainerAdvancement.ts` line 251: `skillRanksGained: 1`
- `app/composables/useTrainerLevelUp.ts` lines 87-95: skill rank total/remaining computed
- `app/components/levelup/LevelUpSkillSection.vue`: entire skill allocation UI
- Design spec: `artifacts/designs/design-trainer-level-up-001/spec-p0.md` Section E

## Requesting Ruling

The human should decide whether trainers receive automatic skill ranks per level (house rule) or whether skill ranks come exclusively from Edge slots (PTU RAW). The ruling affects both P0 (whether to keep or remove the skill rank step) and P1 (how Edge selection interacts with skill ranks).
