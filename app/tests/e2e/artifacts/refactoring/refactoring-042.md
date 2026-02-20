---
ticket_id: refactoring-042
priority: P2
status: open
category: EXT-DUPLICATE
created_at: 2026-02-20
created_by: senior-reviewer
source_review: code-review-073
---

## Summary

MoveTargetModal.vue is 869 lines (exceeds 800-line limit). The bloat is entirely in SCSS — 552 lines of styles vs 87 lines of script logic. The script section is lean thanks to good composable extraction, but the styles need to be moved to a partial or scoped stylesheet.

## Affected Files

- `app/components/encounter/MoveTargetModal.vue` — 869 lines total, 552 lines SCSS

## Suggested Refactoring

1. Extract the SCSS block into a dedicated partial (e.g., `app/assets/scss/components/_move-target-modal.scss`) or split the component into sub-components with co-located styles
2. Keep only component-specific overrides in the SFC `<style>` block
3. Verify no style regressions after extraction

## Acceptance Criteria

- MoveTargetModal.vue under 800 lines
- No visual regressions in the move targeting modal
- SCSS organization follows project patterns
