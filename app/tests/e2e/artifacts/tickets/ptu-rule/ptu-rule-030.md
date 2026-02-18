---
ticket_id: ptu-rule-030
type: ptu-rule
priority: P2
status: resolved
source_ecosystem: dev
target_ecosystem: dev
created_by: game-logic-reviewer
created_at: 2026-02-18T22:30:00
domain: pokemon-generation
severity: MEDIUM
affected_files:
  - app/server/services/csv-import.service.ts
---

## Summary

CSV import swim/sky capability fields both read from the same spreadsheet cell `getCell(rows, 33, 13)`, producing identical values for both capabilities. This is a copy-paste error — one of these should reference a different cell.

## Details

In `csv-import.service.ts:250-261`, the capabilities parser has:
```javascript
swim: parseNumber(getCell(rows, 33, 13)) || 0,
sky: parseNumber(getCell(rows, 33, 13)) || 0,   // same cell as swim
```

All other capabilities reference unique cells. The pattern suggests `sky` should be at a different cell (likely `(33, 14)` or `(32, 16)` depending on the PTU character sheet layout).

## Impact

All Pokemon imported via CSV get the same value for swim and sky. For flying Pokemon (e.g., Charizard with Sky 8, Swim 5), the sky value would incorrectly match swim. For land-only Pokemon with no swim/sky, both default to 0 which happens to be correct by coincidence.

## Suggested Fix

Determine the correct cell reference for `sky` from the PTU character sheet CSV template, then update the cell reference. Likely:
```javascript
sky: parseNumber(getCell(rows, 33, 14)) || 0,
```

## Source

Found during rules-review-032 (review of refactoring-036/037). Pre-existing since commit `0f2277b`.

## Fix Log

- **Commit:** 3d7413b
- **File:** `app/server/services/csv-import.service.ts`
- **Resolution:** Fixed as part of bug-002. The correct PTU sheet layout has capabilities across rows 32-34 (Overland/Levitate/Power, Sky/Burrow/Weight, Swim/Jump/Size). swim now reads (34,13) instead of (33,13). Also corrected burrow, levitate, power, and jump cell references. See bug-002 fix log for full details.
