---
ticket_id: ptu-rule-037
type: ptu-rule
priority: P3
status: open
source_ecosystem: dev
target_ecosystem: dev
created_by: senior-reviewer
created_at: 2026-02-18T16:15:00
domain: pokemon-generation
severity: LOW
affected_files:
  - app/prisma/seed.ts
---

## Summary

The seed parser's name-detection regex in `parsePokedexContent()` matches "HP:" as a valid Pokemon name. While practically unreachable today (Pokemon names always appear on lines 2-4 of each page, before stat lines), this is a latent false-positive risk. If a pokedex file ever had a missing or malformed name line, "HP:" on line ~7 would be parsed as a species named "Hp:".

## Details

The regex at seed.ts:254:
```
/^[A-Z][A-Z0-9\-\(\).:'É\u2019]+(?:\s+[A-Za-z0-9,%\s\-\(\).:'É\u2019]+)?$/
```

Matches "HP:" because: `[A-Z]` → "H", `[A-Z0-9\-\(\).:'É\u2019]+` → "P:" (colon is in the character class). The existing skip list (`Contents`, `TM`, `HM`, `MOVE LIST`, `TUTOR MOVE LIST`, `EGG MOVE LIST`) does not include stat-header lines.

**Note:** This is pre-existing — the old ALL CAPS regex also matched "HP:". The ptu-rule-033 fix did not introduce this.

## Impact

LOW — currently unreachable because all 994 pokedex files have Pokemon names before stat lines in the 10-line scan window. Risk is latent only.

## Suggested Fix

Add stat-header patterns to the skip list at seed.ts:256:
```javascript
if (['Contents', 'TM', 'HM', 'MOVE LIST', 'TUTOR MOVE LIST', 'EGG MOVE LIST', 'HP:', 'HP'].includes(line)) continue
```

Or tighten the first regex group to exclude colon: `[A-Z][A-Z0-9\-\(\).'É\u2019]+` (remove `:` from the first character class). However, this would break `TYPE: NULL` which needs the colon. The skip list approach is safer.

## Source

Discovered during code-review-041 (review of ptu-rule-033 fix).
