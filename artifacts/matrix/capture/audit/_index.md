---
domain: capture
type: audit
total_audited: 26
correct: 22
incorrect: 1
approximation: 1
ambiguous: 0
audited_at: 2026-02-28T04:00:00Z
audited_by: implementation-auditor
decrees_checked: [decree-013, decree-014, decree-015]
---

# Implementation Audit: Capture Domain

## Audit Summary

| Classification | Count | CRITICAL | HIGH | MEDIUM | LOW |
|---------------|-------|----------|------|--------|-----|
| Correct | 22 | - | - | - | - |
| Incorrect | 1 | 0 | 1 | 0 | 0 |
| Approximation | 1 | 0 | 0 | 0 | 1 |
| Ambiguous | 0 | - | - | - | - |
| **Total** | **26** | **0** | **1** | **0** | **1** |

**Note:** 26 of the 33 total rules were auditable (20 Implemented + 2 Partial + 3 Implemented-Unreachable, with some duplicates across tiers). The remaining 7 Missing and 1 Out of Scope rules are not auditable (no implementation to verify).

---

## Decrees Applied

| Decree | Topic | Impact |
|--------|-------|--------|
| decree-013 | 1d100 capture system (not errata d20 playtest) | R005 confirmed correct — app uses 1d100 |
| decree-014 | Stuck/Slow bonuses separate from volatile | R015 confirmed correct — Stuck/Slow in OTHER_CONDITIONS |
| decree-015 | Real max HP for percentage calculations | R006-R010 confirmed correct — uses real maxHp |

---

## Action Items

| Rule ID | Name | Classification | Severity | Tier |
|---------|------|---------------|----------|------|
| capture-R018 | Owned Pokemon Cannot Be Captured | Incorrect | HIGH | Tier 2: Core Constraints |
| capture-R033 | Accuracy Check Natural 1 | Approximation | LOW | Tier 3: Edge Cases |

---

## Incorrect Items Detail

### 1. capture-R018 — Owned Pokemon Cannot Be Captured (HIGH)

- **Rule:** PTU capture rules target "wild Pokemon" specifically. Poke Balls should not work on already-owned Pokemon.
- **Code:** `app/server/api/capture/attempt.post.ts:24-33` — Fetches the Pokemon record but does NOT check `pokemon.ownerId` before proceeding.
- **Impact:** An already-owned Pokemon with HP > 0 will proceed through the full capture roll. On success, the existing `ownerId` is overwritten to the new trainer (line 100). This allows "stealing" Pokemon from other trainers via capture, which PTU does not permit.
- **Fix location:** `app/server/api/capture/attempt.post.ts` — After fetching the Pokemon (line 33), add ownership validation: reject capture if `pokemon.ownerId` is non-null.

---

## Approximation Items Detail

### 1. capture-R033 — Accuracy Check Natural 1 Missing Convenience Flag (LOW)

- **Rule:** "a roll of 1 is always a miss" (07-combat.md:746)
- **Code:** `app/composables/useCapture.ts:185-192` — Returns `{ roll, isNat20, total }` but no `isNat1` flag.
- **Impact:** The raw `roll` value IS returned, so nat 1 CAN be detected by checking `roll === 1`. But the function provides `isNat20` as an explicit convenience flag and does not provide `isNat1`, creating an asymmetry. Not mechanically incorrect — the data is available — but the omission could lead to UI oversight if the GM-facing component only checks for explicit flags.
- **Fix suggestion:** Add `isNat1: roll === 1` to the return type for symmetry.

---

## Tier Files

- [Tier 1: Core Formulas](tier-1-core-formulas.md) — 13 items (R001, R005-R016)
- [Tier 2: Core Constraints](tier-2-core-constraints.md) — 3 items (R017, R018, R019)
- [Tier 3: Edge Cases](tier-3-edge-cases.md) — 3 items (R028, R029, R033)
- [Tier 4: Workflow](tier-4-workflow.md) — 2 items (R027, R032)
- [Tier 5: Data Model](tier-5-data-model.md) — 2 items (R002, R003)
- [Tier 6: Implemented-Unreachable](tier-6-implemented-unreachable.md) — 3 items (R004, R027, R032)
- [Verified Correct Items](correct-items.md) — 22 items

---

## Previous Audit Corrections

This audit supersedes the prior audit (2026-02-26). Key corrections:

1. **capture-R005 (Capture Roll Mechanic):** Previously classified as Incorrect/MEDIUM due to alleged sign convention inversion. **Reclassified to Correct.** The prior audit misread line 201 as `roll - trainerLevel - modifiers` when the actual code is `roll - trainerLevel + modifiers`. The code comment at lines 199-200 explicitly explains the convention: PTU ball modifiers are negative (e.g., Great Ball = -10), and adding them correctly reduces the roll. The formula is mathematically correct.

2. **capture-R016 (Legendary Detection):** Previously classified as Incorrect/HIGH due to alleged hard-coding of `isLegendary: false` in API endpoints. **Reclassified to Correct.** The actual code at `rate.post.ts:93` is `const isLegendary = body.isLegendary ?? isLegendarySpecies(species)` and at `attempt.post.ts:56` is `const isLegendary = isLegendarySpecies(pokemon.species)`. Both endpoints use the `isLegendarySpecies()` function from `legendarySpecies.ts`, which checks against a comprehensive Set of 83 legendary/mythical species. The prior audit referenced code that does not exist.

3. **capture-R018 (Owned Pokemon Check):** Previously NOT audited. **Now classified as Incorrect/HIGH.** The attempt endpoint lacks ownership validation — an already-owned Pokemon can be captured, overwriting the existing owner.

4. **capture-R002/R003 (Status Condition Enumeration):** Previously NOT audited. **Now classified as Correct.** Both persistent and volatile condition lists match PTU exactly.

5. **capture-R033 (Nat 1 Auto-Miss):** Previously classified as Correct. **Reclassified to Approximation/LOW.** The function returns the raw roll but lacks an explicit `isNat1` flag parallel to `isNat20`.

6. **capture-R005 Ambiguous item (errata system):** Previously classified as Ambiguous with no decree. **Now resolved.** decree-013 explicitly rules: use the 1d100 system. No ambiguity remains.

---

## Verification Notes

- All source file references verified against worktree at `slave-2-audit-combat-capture`
- PTU rules verified against `books/markdown/core/05-pokemon.md` (p.214: capture rate formula and examples)
- PTU combat rules verified against `books/markdown/core/07-combat.md` (p.246-247: status conditions, p.746: nat 1 auto-miss)
- Three PTU-provided examples (Pikachu, Caterpie, Hydreigon) verified with exact code trace — all produce correct results
- Errata (errata-2.md p.8) proposes alternative d20 capture system — decree-013 confirms app correctly uses 1d100
- Decrees 013, 014, 015 checked and all confirm current implementation is correct
