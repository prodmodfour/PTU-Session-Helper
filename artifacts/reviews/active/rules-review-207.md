---
review_id: rules-review-207
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: feature-006
domain: pokemon-lifecycle
commits_reviewed:
  - d6fe48a
  - e8247d0
  - 8b82360
  - 663454a
  - c2d050f
  - 9e3f125
mechanics_verified:
  - stat-recalculation-on-evolution
  - base-relations-validation
  - evolution-eligibility-check
  - encounter-active-guard
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/05-pokemon.md#Evolution (p.202)
  - core/05-pokemon.md#Base Relations Rule (p.198)
reviewed_at: 2026-03-01T00:20:00Z
follows_up: rules-review-202
---

## Review Scope

Re-review of feature-006 P0 fix cycle (6 commits). The previous rules review (rules-review-202) APPROVED the original implementation with 2 informational MEDIUMs. This review verifies that the 6 fix commits do not introduce any PTU rules regressions.

Decrees checked: decree-035 (nature-adjusted base stats for Base Relations ordering), decree-036 (stone evolutions learn new-form moves at or below current level).

## Fix Cycle Mechanics Impact Assessment

### C1 Fix: spriteUrl reset to null (d6fe48a)

**Mechanics impact:** NONE. The `spriteUrl` field is a client-rendering concern, not a game mechanics value. The fix adds `spriteUrl: null` to the Prisma update in `performEvolution()`. No stat values, HP formula, type assignments, nature application, or Base Relations logic were modified. All 6 stat fields (base + calculated) and both HP fields (max + current) remain unchanged from the original implementation.

### H1 Fix: pokemon-evolved event wiring (e8247d0)

**Mechanics impact:** NONE. This fix adds event propagation from `XpDistributionResults` through `XpDistributionModal` to the parent page. It is purely a UI event-plumbing change. The actual evolution execution path (`performEvolution` in `evolution.service.ts`) is not modified. The encounter data refresh (`encounterStore.fetchEncounter`) reads existing data but does not alter game state.

### H2 Fix: branching evolution selection UI (8b82360)

**Mechanics impact:** NONE (verified carefully). The fix adds an intermediate selection modal when multiple evolution paths are available. The critical path -- the data that flows into `EvolutionConfirmModal` and ultimately to the `evolve` endpoint -- is unchanged:
- `targetSpecies` comes from the selected `EvolutionOptionData.toSpecies` (previously hardcoded as `available[0].toSpecies`)
- `targetRawBaseStats` comes from `EvolutionOptionData.targetBaseStats` (previously `available[0].targetBaseStats`)
- `requiredItem` and `itemMustBeHeld` come from the selected option (previously from `available[0]`)

The `evolution-check` endpoint response format is unchanged. The `EvolutionConfirmModal` props interface is unchanged. The `evolve` endpoint request body is unchanged. The GM now chooses which evolution path, but the mechanics applied to that choice are identical.

**Eligibility check correctness preserved:** The `checkEvolutionEligibility` function in `evolutionCheck.ts` is not modified. The branching selection only presents evolutions from the `available` array (which already passed level and held-item checks). The GM cannot select an ineligible evolution through this UI.

### H3 Fix: encounter-active guard (663454a)

**Mechanics impact:** ADDITIVE GUARD ONLY. The guard prevents evolution when the Pokemon is in an active encounter. This is a safety mechanism, not a game mechanic. PTU does not define evolution mid-combat (evolution occurs between encounters per p.202: "After the Pokemon has gained enough Exp to Evolve"). The guard prevents data inconsistency (DB record updated but combatant snapshot in encounter JSON becomes stale) and is consistent with the existing `bulk-action.post.ts` precedent.

No existing mechanics code paths are modified by this guard. The `performEvolution` function is called only after the guard passes.

### M1 Fix: app-surface.md update (c2d050f)

**Mechanics impact:** NONE. Documentation only.

### M2 Fix: PokemonLevelUpPanel text (9e3f125)

**Mechanics impact:** NONE. UI text change only -- from "Check the Pokedex entry for possible evolution at this level." to "Use the Evolve button in the header to check evolution eligibility." No game logic altered.

## Decree Compliance

- **decree-035 (nature-adjusted base stats for Base Relations):** STILL COMPLIANT. The `validateBaseRelations` function is not modified by any fix cycle commit. The delegation chain (`evolutionCheck.ts` wrapper -> `baseRelations.ts` core function) still uses nature-adjusted base stats for ordering. The `EvolutionConfirmModal` still computes nature-adjusted base stats via `applyNatureToBaseStats(targetRawBaseStats, natureName)` before passing to validation. Per decree-035, this is correct.

- **decree-036 (stone evolutions learn new-form moves at or below current level):** NOT APPLICABLE. Move learning remains deferred to P1. The fix cycle does not introduce any move-learning logic.

## Mechanics Verified (No Change from rules-review-202)

All mechanics verified in the original review remain correct:

1. **Stat recalculation formula:** `level + 10` stat points total, `level + (hpStat * 3) + 10` HP formula -- UNCHANGED.
2. **Nature application:** Raw species base stats -> `applyNatureToBaseStats()` -> nature-adjusted base -- UNCHANGED.
3. **Base Relations validation:** Pairwise comparison using nature-adjusted base stats with strict `>` (not `>=`) for equal-stats flexibility -- UNCHANGED.
4. **HP proportional preservation:** `hpRatio * newMaxHp` with `Math.max(1, ...)` floor -- UNCHANGED.
5. **Evolution eligibility check:** Level and held-item validation, stone triggers available without inventory check -- UNCHANGED.
6. **Level-up integration:** `getEvolutionLevels()` feeding `calculateLevelUps()` with `canEvolve` flag -- UNCHANGED.

## Previous MEDIUM Issues Status

- **MEDIUM-001 (extractStatPoints rounding):** Still present, still low-impact. The function is still only used informationally. Not affected by fix cycle.
- **MEDIUM-002 (branching evolution auto-selection):** RESOLVED by H2 fix. The GM now gets a selection UI for branching evolutions. No longer applicable.

## Verdict

**APPROVED**

The fix cycle makes no changes to any PTU game mechanics. All 6 commits are either client-side UI/event plumbing (H1, H2, M2), server-side data-field management (C1), additive safety guards (H3), or documentation (M1). The core evolution mechanics -- stat recalculation, nature application, Base Relations validation, HP formula, eligibility checks -- are untouched and remain correct per rules-review-202.

No decree violations. No new mechanics issues introduced. MEDIUM-002 from the previous review is now resolved.
