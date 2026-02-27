---
decree_id: decree-027
status: active
domain: character-lifecycle
topic: pathetic-skill-edge-block
title: "Block Skill Edges from raising Pathetic skills during character creation"
ruled_at: 2026-02-27T21:30:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-027
implementation_tickets: [ptu-rule-118]
tags: [pathetic, skill-edge, character-creation, basic-skills]
---

# decree-027: Block Skill Edges from raising Pathetic skills during character creation

## The Ambiguity

PTU RAW contradicts itself on whether Skill Edges can raise Pathetic-locked skills during character creation. Surfaced by rules-review-179 HIGH-01, filed as decree-need-027.

## Options Considered

### Option A: Allow Skill Edges to raise Pathetic skills (current implementation)
Treats p.41's Basic Skills Edge description ("Pathetic to Untrained") as an intentional exception to the general prohibition. More permissive, player-friendly. Aligns with the specific Edge text.

**Pros:** Specific rule (Edge description) overrides general rule. Player flexibility.
**Cons:** Contradicts two separate explicit prohibitions (pp.14, 18). The Edge description may simply be documenting post-creation progression.

### Option B: Block Skill Edges from raising Pathetic skills during creation
Treats pp.14/18's explicit, repeated prohibition as the controlling rule. p.41's mention of Pathetic is read as describing the general skill progression mechanic (which applies post-creation when the Pathetic lock lifts via leveling), not as an exception during creation.

**Pros:** Honors the explicit, repeated language of the character creation rules. Two separate sections agree on the restriction. Pathetic choices are meaningful and permanent at creation.
**Cons:** p.41 text is slightly misleading if Pathetic progression doesn't apply at creation.

## Ruling

**The true master decrees: Skill Edges cannot raise Pathetic-locked skills during character creation.**

Pages 14 and 18 both explicitly state that Pathetic skills "cannot be raised" during character creation, with p.18 specifically calling out Edges by name: "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank." This repeated, specific prohibition controls. Page 41's Basic Skills Edge description lists Pathetic-to-Untrained as part of the general rank progression mechanic, which applies during leveling (post-creation) when the Pathetic lock is no longer in effect.

## Precedent

**Pathetic skills chosen during character creation are permanent at creation time.** No mechanism — including Skill Edges — can raise them during the creation process. The Pathetic→Untrained progression via Basic Skills Edge becomes available only after character creation (during leveling). When PTU RAW contradicts itself, explicit prohibitions in the character creation chapter (Chapter 2) take precedence over general mechanic descriptions in Chapter 3.

## Implementation Impact

- Tickets created: ptu-rule-118 (block addSkillEdge from raising Pathetic skills)
- Files affected: `app/composables/useCharacterCreation.ts` (addSkillEdge function), `app/utils/characterCreationValidation.ts` (validation)
- Skills affected: Developer, Game Logic Reviewer, Implementation Auditor
