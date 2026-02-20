---
ticket_id: ptu-rule-056
priority: P3
status: p1-complete
design_spec: designs/design-char-creation-001.md
domain: character-lifecycle
matrix_source:
  rule_id: character-lifecycle-R051
  audit_file: matrix/character-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Manual character creation form only covers stats and name. Missing fields: edges, features, skills, classes, age, background, personality, goals. Requires CSV import for full character setup.

## Expected Behavior

Character creation should allow setting all PTU character fields including class selection, skill allocation, feature/edge selection, and biographical details.

## Actual Behavior

The manual creation form is a minimal stub. Full character data can only be entered via CSV import or post-creation PUT endpoint editing.

## Resolution Log

### P1 Follow-up Fixes (2026-02-20, code-review-121)

**H1 — Skill Edge removal now reverts skill rank** (`f29b845`)
- `removeEdge()` in `useCharacterCreation.ts` detects "Skill Edge: X" pattern, decrements the skill rank by one step before removing the edge string. Prevents orphaned rank data.

**H2 — Skill background validation clarified for Skill Edges** (`c95a237`)
- `validateSkillBackground()` accepts optional `edges` parameter. When Skill Edges are present, warning messages append "including Skill Edge modifications" and severity is downgraded to `info`. Eliminates false-positive confusion.

**M1 — Dead `skillEdgeError` code removed** (`f8d7854`)
- Removed unused `skillEdgeError` ref, template error div, and associated SCSS from `EdgeSelectionSection.vue`.

**M4 — Validation uses shared stat constants** (`68e33d7`)
- `validateStatAllocation()` now imports `TOTAL_STAT_POINTS` and `MAX_POINTS_PER_STAT` from `trainerStats.ts` instead of hardcoding `10` and `5`.
