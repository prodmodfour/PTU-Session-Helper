---
ticket_id: refactoring-052
priority: P3
status: open
category: BEHAVIOR-CHANGE
source: code-review-100
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

During refactoring-032 (SCSS partial extraction), `encounters.vue` had its modal overflow model changed from `overflow: auto` (block-level) to `overflow: hidden` + flex column layout. While low-risk, this is a behavioral change introduced during a purely cosmetic refactoring.

## Affected Files

- `app/pages/gm/encounters.vue` — modal overflow/layout model

## Suggested Fix

Review whether the new flex-column + overflow-hidden model produces identical scrolling behavior as the original `overflow: auto`. If not, restore the original overflow model while keeping the mixin for other styles.

## Notes

Low priority — the encounters page modals are small and unlikely to overflow in practice. But behavioral changes should not be mixed into refactoring commits.
