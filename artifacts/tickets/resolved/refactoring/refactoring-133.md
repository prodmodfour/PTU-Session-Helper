---
id: refactoring-133
title: "Validate `source` parameter in vision toggle API endpoint"
category: EXT-VALIDATE
priority: P4
severity: LOW
status: open
domain: encounter-tables
source: code-review-331 MED-1
created_by: slave-collector (plan-1772668105)
created_at: 2026-03-05
affected_files:
  - app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts
---

## Summary

The `source` parameter in the vision toggle API endpoint (`vision.post.ts`) is destructured with a default of `'manual'` but is not validated against the `VisionCapabilitySource` type (`'manual' | 'species' | 'equipment'`). A caller could pass an arbitrary string that would be stored in the combatant's vision state.

## Suggested Fix

Add a validation check before processing:
```typescript
const validSources = ['manual', 'species', 'equipment']
if (!validSources.includes(source)) {
  throw createError({ statusCode: 400, message: `Invalid vision source: ${source}` })
}
```

## Impact

Low. Only the GM client currently calls this endpoint with `'manual'`, but validation prevents inconsistent data when P1 adds `'species'` auto-detection.
