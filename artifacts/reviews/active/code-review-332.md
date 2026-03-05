---
review_id: code-review-332
review_type: code-review
reviewer: senior-reviewer
trigger: ptu-rule-135
target_report: ptu-rule-135
domain: capture
commits_reviewed:
  - 81b9cef3
  - 280d5a65
  - 1cce5e80
files_reviewed:
  - app/server/api/capture/attempt.post.ts
  - app/server/api/pokemon/index.post.ts
  - app/server/services/entity-builder.service.ts
  - app/server/services/pokemon-generator.service.ts
  - app/server/utils/serializers.ts
  - app/server/services/intercept.service.ts
verdict: CHANGES_REQUIRED
issues_found: 2
reviewed_at: 2026-03-05
---

# Code Review: ptu-rule-135 (Origin-Dependent Loyalty Defaults)

## Summary

Three commits implement decree-049: wild captures default to Loyalty 2 (Wary) instead of the universal default of 3 (Neutral). The implementation correctly touches the three creation/fallback paths identified in the ticket. The `pokemon-generator.service.ts` already had correct `getStartingLoyalty()` logic (no changes needed -- verified). The `serializers.ts` `?? 3` fallbacks were intentionally left unchanged per ticket guidance.

Overall the approach is sound and decree-049 is correctly cited in all code comments. Two issues require fixes before approval.

## Issues

### ISSUE-1: `pokemon/index.post.ts` does not check `origin === 'captured'` (MEDIUM)

**File:** `app/server/api/pokemon/index.post.ts`, line 20
**Commit:** 280d5a65

The manual creation endpoint only checks `origin === 'wild'` for the loyalty-2 default:

```typescript
const loyalty = body.loyalty ?? (origin === 'wild' ? 2 : 3)
```

But `entity-builder.service.ts` (line 65) and `pokemon-generator.service.ts` (`getStartingLoyalty()`, line 198-203) both also map `'captured'` to loyalty 2. If a GM manually creates a Pokemon with `origin: 'captured'` via this endpoint (e.g., importing a previously captured Pokemon), it would incorrectly default to loyalty 3 instead of 2.

Per decree-049's precedent: "implement origin-dependent behavior rather than collapsing to a single universal default." The `captured` origin should be treated identically to `wild` here, consistent with the other two code paths.

**Fix:** Change line 20 to:
```typescript
const loyalty = body.loyalty ?? (origin === 'wild' || origin === 'captured' ? 2 : 3)
```

### ISSUE-2: `serializers.ts` `?? 3` fallbacks are inconsistent with entity-builder (HIGH)

**File:** `app/server/utils/serializers.ts`, lines 51 and 242
**Ticket decision:** Left unchanged ("they handle null/undefined for legacy records where origin is unknown")

The ticket's rationale for leaving these as `?? 3` was that they handle legacy records where origin is unknown. However, `entity-builder.service.ts` line 65 was updated to use origin-aware fallback logic for the exact same scenario (null loyalty from DB). These are parallel code paths that transform Prisma records into response objects -- `serializeLinkedPokemon` (line 16) and `serializePokemon` (line 196) in serializers.ts serve the same purpose as `buildPokemonEntityFromRecord` in entity-builder.service.ts.

This creates an observable inconsistency: the same Pokemon record with `loyalty: null, origin: 'wild'` will serialize as loyalty 3 through serializers.ts but as loyalty 2 through entity-builder.service.ts, depending on which code path serves the response. The intercept service (line 118) also has `pokemon.loyalty ?? 3` but receives its data through entity-builder, so it would get the correct value. However, any API response going through serializers.ts (e.g., GET /api/pokemon/:id, POST /api/pokemon) will show loyalty 3 for a wild Pokemon with null DB loyalty, contradicting the entity-builder path.

**Fix:** Apply the same origin-aware fallback in both serializer functions:
```typescript
// serializeLinkedPokemon (line 51):
loyalty: (p as any).loyalty ?? (p.origin === 'wild' || p.origin === 'captured' ? 2 : 3),

// serializePokemon (line 242):
loyalty: (pokemon as any).loyalty ?? (pokemon.origin === 'wild' || pokemon.origin === 'captured' ? 2 : 3),
```

## Verified Correct

1. **attempt.post.ts** (81b9cef3): Correctly sets `loyalty: 2` on capture. The `origin: 'captured'` is set in the same update, so the DB row will have both fields correct. Per decree-049, wild captures default to Loyalty 2.

2. **Friend Ball logic** (attempt.post.ts lines 211-219): Correctly uses `const currentLoyalty = 2` as the base for the +1 calculation. This is sound because the Friend Ball effect runs immediately after the capture update that set loyalty to 2. The hardcoded `2` avoids a re-read from DB, which is a pragmatic optimization. Result: Friend Ball wild capture ends at loyalty 3, matching the ticket note.

3. **entity-builder.service.ts** (1cce5e80): Origin-aware fallback correctly maps `wild` and `captured` to 2, others to 3. The `(record as any).loyalty` cast is pre-existing (not introduced by this change) -- the `as any` suggests loyalty may not be in the Prisma type yet, which is a separate concern.

4. **pokemon-generator.service.ts**: Already had correct `getStartingLoyalty()` function -- no changes needed. Both `createPokemonRecord` (line 259) and `buildPokemonCombatant` (line 336) use it. Wild spawn paths (`wild-spawn.post.ts`, `from-scene.post.ts`) route through `generateAndCreatePokemon`, so they get correct loyalty automatically.

5. **Commit granularity**: Three focused commits, each touching one file. Appropriate scope.

6. **Decree compliance**: All three commits cite decree-049 in code comments. The mapping (wild/captured -> 2, others -> 3) matches the decree specification.

## Verdict

**CHANGES_REQUIRED** -- Two inconsistencies need fixing before this can be approved. ISSUE-1 is a straightforward oversight in one branch condition. ISSUE-2 is a consistency gap between parallel serialization paths that would produce different loyalty values for the same DB record depending on which code path serves it.
