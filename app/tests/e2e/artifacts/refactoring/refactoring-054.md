---
ticket_id: refactoring-054
priority: P3
status: open
category: EXT-SMELL
source: code-review-103
created_at: 2026-02-20
created_by: orchestrator
---

## Summary

encounters.vue uses `modal-container-base` mixin but overrides 6 of its properties. Evaluate whether to stop using the mixin and inline only the needed properties.

## Affected Files

- `app/pages/gm/encounters.vue` — uses mixin then overrides overflow, display, flex-direction, __close, __body overflow-y, and footer gap

## Suggested Fix

Remove the `@include modal-container-base` and inline only the ~7 property groups that encounters.vue actually uses from the mixin.
