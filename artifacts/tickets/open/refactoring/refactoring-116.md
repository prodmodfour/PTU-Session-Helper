---
ticket_id: refactoring-116
category: EXT-GOD
priority: P4
severity: LOW
status: open
source: code-review-257 MEDIUM-03
created_by: slave-collector (plan-20260301-184039)
created_at: 2026-03-01
---

# refactoring-116: XpDistributionModal.vue exceeds 800-line file limit (1016 lines)

## Summary

`app/components/encounter/XpDistributionModal.vue` is 1016 lines, exceeding the project's 800-line maximum by 216 lines. The file was at 873 lines after feature-009 P1, then the P1 fix cycle (code-review-257 fixes: trainer XP results display, fresh data fetching, partial failure handling, and associated styling) added ~143 lines. The `<style>` block is the largest contributor.

## Affected Files

- `app/components/encounter/XpDistributionModal.vue` (1016 lines)

## Suggested Fix

One or both of:
1. Extract the `<style>` block into a dedicated SCSS partial (`assets/scss/components/_xp-distribution-modal.scss`)
2. Extract a sub-component for the Pokemon XP distribution section (the original P0 functionality) to reduce template/script complexity

## Impact

Pre-existing code health issue. Does not affect functionality. Reduces maintainability and makes future changes to XP distribution harder to review.
