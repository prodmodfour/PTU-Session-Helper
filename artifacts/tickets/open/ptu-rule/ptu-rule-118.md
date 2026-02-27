---
id: ptu-rule-118
title: "Block Skill Edges from raising Pathetic skills during character creation"
priority: P3
severity: HIGH
status: open
domain: character-lifecycle
source: decree-027
created_at: 2026-02-27
---

# ptu-rule-118: Block Skill Edges from raising Pathetic skills during character creation

## Problem

Per decree-027, Skill Edges cannot raise Pathetic-locked skills during character creation. The current `addSkillEdge` function in `useCharacterCreation.ts` allows Pathetic→Untrained progression, which violates the ruling.

## PTU Reference

- PTU p.14: "These Pathetic Skills cannot be raised above Pathetic during character creation."
- PTU p.18: "You also may not use Edges to Rank Up any of the Skills you lowered to Pathetic Rank."

## Required Changes

1. **`app/composables/useCharacterCreation.ts`** — `addSkillEdge` function: Add a guard that blocks progression when the skill is in `form.patheticSkills` and returns an appropriate error message.
2. **`app/utils/characterCreationValidation.ts`** — Add/update validation warning if any Skill Edge references a Pathetic-locked skill (defensive check for UI edge cases).
3. **Update comment on line 67** — Remove the "except via Skill Edges (PTU p. 41)" clause from the `patheticSkills` field comment, since Skill Edges are now also blocked.

## Acceptance Criteria

- `addSkillEdge('SomePatheticSkill')` returns an error string and does NOT modify the skill rank
- Validation warns if any existing Skill Edge entry references a Pathetic-locked skill
- Comment on `patheticSkills` field accurately reflects the new ruling
