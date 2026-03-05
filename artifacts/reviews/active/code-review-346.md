---
review_id: code-review-346
review_type: code
reviewer: senior-reviewer
trigger: ptu-rule-fix
target_report: ptu-rule-135
domain: capture
commits_reviewed:
  - df1c35ff
  - 5d474ab2
files_reviewed:
  - app/server/api/pokemon/index.post.ts
  - app/server/utils/serializers.ts
  - app/server/services/entity-builder.service.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/api/capture/attempt.post.ts
  - app/server/services/intercept.service.ts
  - app/components/pokemon/PokemonStatsTab.vue
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T10:15:00Z
follows_up: code-review-332
---

## Review Scope

Re-review of two fix-cycle commits addressing code-review-332's ISSUE-1 (MEDIUM) and ISSUE-2 (HIGH) for ptu-rule-135 (decree-049 compliance: origin-dependent loyalty defaults).

Commits reviewed:
- `df1c35ff` fix: include 'captured' origin in loyalty default check (decree-049)
- `5d474ab2` fix: apply origin-aware loyalty fallback in serializers (decree-049)

Full file reads performed on all five affected server files plus the client-side PokemonStatsTab.vue component and intercept.service.ts. Grep sweep for all `loyalty.*??` patterns across the codebase to verify no missed fallback sites.

## Issues

No issues found. Both code-review-332 issues are fully resolved.

## Verification of ISSUE-1 (MEDIUM): pokemon/index.post.ts missing 'captured' check

**Status: RESOLVED**

`df1c35ff` changes line 20 from:
```typescript
const loyalty = body.loyalty ?? (origin === 'wild' ? 2 : 3)
```
to:
```typescript
const loyalty = body.loyalty ?? (origin === 'wild' || origin === 'captured' ? 2 : 3)
```

This now matches `entity-builder.service.ts` (line 65) and `pokemon-generator.service.ts` (`getStartingLoyalty()`, lines 198-203). All three creation paths produce loyalty 2 for both `wild` and `captured` origins, per decree-049.

## Verification of ISSUE-2 (HIGH): serializers.ts inconsistent fallbacks

**Status: RESOLVED**

`5d474ab2` updates both serializer functions:
- `serializeLinkedPokemon` line 52: `loyalty: (p as any).loyalty ?? (p.origin === 'wild' || p.origin === 'captured' ? 2 : 3)`
- `serializePokemon` line 244: `loyalty: (pokemon as any).loyalty ?? (pokemon.origin === 'wild' || pokemon.origin === 'captured' ? 2 : 3)`

These now match the entity-builder fallback pattern exactly. The same Pokemon record will produce the same loyalty value regardless of whether it goes through serializers.ts or entity-builder.service.ts.

## Remaining `?? 3` Fallbacks (verified acceptable)

A codebase-wide grep for `loyalty.*??` found two additional sites not in scope:

1. **`PokemonStatsTab.vue` (lines 136, 214):** Client-side display fallbacks. By the time a Pokemon reaches the client, it has been serialized through origin-aware server code. The `?? 3` is a defensive UI fallback for the impossible case where loyalty is undefined after serialization. Acceptable.

2. **`intercept.service.ts` (line 118):** Operates on `Combatant.entity` which is built through entity-builder or pokemon-generator, both of which now set loyalty correctly. The `?? 3` is a defensive fallback that will not trigger in practice. Acceptable.

Neither site introduces a decree-049 violation because both consume already-processed data.

## Schema Note

The Prisma schema defines `loyalty Int @default(3)` (non-nullable). The `??` fallbacks in serializers are technically dead code at the DB layer since Prisma will always return an integer. However, the `(p as any).loyalty` cast suggests a type system gap where the Prisma-generated type may not expose `loyalty` cleanly. The origin-aware fallback is a sound defensive pattern that documents intent. Not blocking.

## What Looks Good

1. **Commit granularity:** Two focused commits, one per issue. Each touches exactly one file. Appropriate scope for a fix cycle.
2. **Decree citation:** Both commits reference decree-049 in commit messages and code comments.
3. **Consistency achieved:** All five code paths that handle loyalty default/fallback now use the same origin-aware mapping: `wild`/`captured` to 2, everything else to 3. This matches decree-049's ruling exactly.
4. **No regressions:** Changes are additive (broadening a condition, replacing a constant with an expression). No existing behavior is altered for non-wild/non-captured origins.

## Decree Compliance

Per decree-049, the full mapping is now consistently implemented:
- `wild` -> Loyalty 2 (Wary) -- all 5 paths
- `captured` -> Loyalty 2 (Wary) -- all 5 paths
- `hatched`, `gifted`, `starter`, `custom`, `manual`, `template`, `import` -> Loyalty 3 (Neutral) -- all 5 paths

No decree violations found.

## Verdict

**APPROVED** -- Both issues from code-review-332 are fully and correctly resolved. No new issues introduced. All loyalty default/fallback code paths are now consistent with decree-049.
