---
ticket_id: refactoring-053
priority: P3
status: open
category: EXT-UNUSED
source: code-review-100
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

`app/assets/scss/_modal.scss` defines `modal-overlay-enhanced` and `modal-container-enhanced` mixins, but they are never used. Three files (`CharacterModal.vue`, `GMActionModal.vue`, `AddCombatantModal.vue`) still inline the enhanced glass-morphism modal pattern that these mixins were designed to replace.

## Affected Files

- `app/assets/scss/_modal.scss` — unused `modal-overlay-enhanced` and `modal-container-enhanced` mixins
- `app/components/character/CharacterModal.vue` — inlines enhanced modal styles
- `app/components/encounter/GMActionModal.vue` — inlines enhanced modal styles
- `app/components/encounter/AddCombatantModal.vue` — inlines enhanced modal styles

## Suggested Fix

Either:
1. Replace the inline enhanced modal styles in the 3 files with `@include` of the enhanced mixins, OR
2. Remove the unused mixins if they don't accurately match the inline patterns

## Notes

Created during refactoring-032 review. The base modal mixins are well-used (15 files), but the enhanced variants were defined speculatively without migrating their consumers.
