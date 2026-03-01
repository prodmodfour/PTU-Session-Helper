---
ticket_id: refactoring-109
category: CODE-HYGIENE
priority: P4
severity: LOW
domain: pokemon-lifecycle
source: code-review-243 M1
created_by: slave-collector (plan-20260301-130000)
created_at: 2026-03-01
---

# Tighten MoveDetail interface types in MoveLearningPanel

## Summary

The `MoveDetail` interface in `MoveLearningPanel.vue` uses `string` for fields that have specific union types in the `Move` interface (`PokemonType`, `'Physical' | 'Special' | 'Status'`, `MoveFrequency`). The `as Move` cast silently widens these types.

## Affected Files

- `app/components/pokemon/MoveLearningPanel.vue` (lines 133-143)

## Suggested Fix

Import `PokemonType` and `MoveFrequency` types and use them in `MoveDetail`:
- `type: PokemonType`
- `damageClass: 'Physical' | 'Special' | 'Status'`
- `frequency: MoveFrequency`
- `id: string` (non-optional, server always returns it)

This eliminates the need for the `as Move` cast entirely.

## Impact

Low — runtime behavior is correct since data comes from MoveData table. This is a type safety improvement to prevent future regressions if someone adds exhaustive checks or switch statements on these fields.
