---
id: ptu-rule-122
title: "Apply minimum 1 HP floor to rest healing calculation"
priority: P3
severity: MEDIUM
category: ptu-rule
source: decree-029
created_at: 2026-02-28
status: open
---

## Summary

Rest healing uses `Math.floor(maxHp / 16)` which produces 0 for Pokemon with maxHp < 16. Per decree-029, rest healing should always provide at least 1 HP.

## Requirements

1. Find the rest healing calculation (likely in `app/utils/restHealing.ts`)
2. Apply `Math.max(1, Math.floor(maxHp / 16))` or equivalent
3. Ensure this applies to all rest types that use the 1/16th formula (30-minute rest)
4. Update any related tests

## PTU Reference

- PTU Core p.252: "heal 1/16th of their Maximum Hit Points"
- decree-029: minimum 1 HP per rest period (house-rule)

## Affected Code

- `app/utils/restHealing.ts`
- `app/server/api/characters/[id]/rest.post.ts`
- Related unit tests
