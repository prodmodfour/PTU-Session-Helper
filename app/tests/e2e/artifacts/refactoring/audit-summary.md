---
last_audited: 2026-02-16T01:00:00
audited_by: code-health-auditor
scope: "domain: combat"
files_scanned: 69
files_deep_read: 15
total_tickets: 7
overflow_files: 0
---

## Metrics
| Metric | Value |
|--------|-------|
| Total files scanned | 69 |
| Total lines of code | 14,105 |
| Files over 800 lines | 2 |
| Files over 600 lines | 0 (next is 594 — not core combat) |
| Files over 400 lines | 8 (4 in core combat domain) |
| Open tickets (P0) | 1 |
| Open tickets (P1) | 4 |
| Open tickets (P2) | 2 |

## Hotspots
| Rank | File | Lines | Changes (30d) | Categories | Priority |
|------|------|-------|---------------|------------|----------|
| 1 | app/stores/encounter.ts | 945 | 16 | LLM-SIZE, EXT-GOD | P0 |
| 2 | app/components/encounter/MoveTargetModal.vue | 826 | 13 | LLM-SIZE (CSS-heavy, script only 68 lines) | P2* |
| 3 | app/components/encounter/GMActionModal.vue | 796 | 10 | — (CSS-heavy, script only 130 lines) | — |
| 4 | app/server/api/encounters/[id]/combatants.post.ts | 236 | 4 | LLM-TYPES, EXT-LAYER, EXT-DUPLICATE | P1 |
| 5 | app/server/api/encounters/[id]/wild-spawn.post.ts | 182 | 6 | EXT-DUPLICATE, LLM-INCONSISTENT | P1 |
| 6 | app/server/api/encounters/[id]/start.post.ts | 194 | 2 | EXT-LAYER, LLM-TYPES, LLM-INCONSISTENT | P1 |
| 7 | app/composables/useCombat.ts | 473 | 0 | EXT-GOD | P2 |

*MoveTargetModal.vue exceeds the 800-line threshold but 535 of 826 lines are SCSS styling. The `<script setup>` is only 68 lines with all logic properly extracted to `useMoveCalculation`. Not a real LLM-friendliness issue.

## Tickets Written
- `refactoring-001`: encounter.ts God store — 945 lines, 6+ responsibilities (P0)
- `refactoring-002`: Duplicated grid placement logic across combatants.post.ts and wild-spawn.post.ts (P1)
- `refactoring-003`: combatants.post.ts untyped entity transformation with `any` + inline business logic (P1)
- `refactoring-004`: 3 API handlers bypass `buildEncounterResponse()` with inconsistent inline responses (P1)
- `refactoring-005`: Initiative sorting logic (54 lines) inline in start.post.ts with `any` types (P1)
- `refactoring-006`: Magic constants in breather.post.ts + inconsistent UUID generation (P2)
- `refactoring-007`: useCombat.ts kitchen-sink composable — 11 areas, 30+ exports (P2)

## Overflow
<!-- Files that qualified for deep-read but were capped -->
None — all qualifying files fit within the 20-file cap.

## Comparison to Last Audit
- Resolved since last audit: N/A (first audit)
- New issues found: 7 tickets
- Trend: N/A (baseline)

## Clean Files (notable)
The following combat domain files had **no issues** after deep-read:
- `app/server/services/combatant.service.ts` (323 lines) — well-typed, clear interfaces, proper PTU mechanics
- `app/server/services/encounter.service.ts` (182 lines) — clean service abstractions
- `app/server/api/encounters/[id]/move.post.ts` (126 lines) — properly routes through damage pipeline after bug-001 fix
- `app/composables/useMoveCalculation.ts` (445 lines) — well-typed, good extraction from MoveTargetModal
- `app/composables/useEncounterActions.ts` (217 lines) — clean bridge between UI and store
- `app/components/encounter/CombatantCard.vue` (573 lines) — reasonable for complexity, good component design
- `app/components/encounter/AddCombatantModal.vue` (423 lines) — clean, CSS-heavy

## Recommended First Ticket
**Start with refactoring-004** (inline response building). It's the lowest-effort fix (small scope, 1-2 commits) with the highest consistency win — it touches 3 files and establishes the pattern of using `buildEncounterResponse()` everywhere, which prevents future response-shape bugs.

After 004, tackle **refactoring-002** (duplicated grid placement) and **refactoring-005** (inline initiative sorting) since they're both service extraction tasks that follow the same pattern.

**refactoring-001** (God store) is the biggest impact but also the biggest effort — schedule it after the smaller wins build confidence in the refactoring approach.
