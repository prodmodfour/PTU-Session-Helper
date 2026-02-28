---
id: ptu-rule-123
title: "Remove significance presets above x5 (climactic x6, legendary x8)"
priority: P3
severity: MEDIUM
category: ptu-rule
source: decree-030
created_at: 2026-02-28
status: open
---

## Summary

The significance preset system includes `climactic` (x6) and `legendary` (x8) tiers that exceed PTU Core p.460's stated range of "x1 to about x5." Per decree-030, remove these presets and cap at x5.

## Requirements

1. Find the significance presets definition (likely in `app/constants/significancePresets.ts` or similar)
2. Remove `climactic` (x6) and `legendary` (x8) entries
3. Ensure the UI still allows manual/custom numeric input for GMs who want to go beyond x5
4. Verify XP calculations work correctly with the remaining presets
5. Update any related tests

## PTU Reference

- PTU Core p.460: "The Significance Multiplier should range from x1 to about x5"
- decree-030: cap presets at x5

## Affected Code

- `app/constants/significancePresets.ts` (or equivalent)
- Encounter table significance UI components
- XP calculation if it references presets
