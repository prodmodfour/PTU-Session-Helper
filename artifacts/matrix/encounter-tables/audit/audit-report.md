---
domain: encounter-tables
type: implementation-audit
audited_at: 2026-02-28T05:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T03:00:00Z
total_items_audited: 14
---

# Implementation Audit: Encounter Tables Domain

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 9 |
| Incorrect | 1 |
| Approximation | 3 |
| Ambiguous | 1 |
| **Total Audited** | **14** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| HIGH | 1 | R008 — Significance presets exceed PTU x5 range |
| MEDIUM | 1 | R006 — Level budget formula is app-invented, not PTU |
| LOW | 2 | R009 — Difficulty thresholds are app-invented; R018 — No moveset scaling |

---

## Tier 1: Core Formulas

### 1. R005 — XP Calculation

**Rule:** PTU Core p.460: "total the Level of the enemy combatants which were defeated. For encounters where Trainers were directly involved in the combat, treat their Level as doubled." Then multiply by significance, divide by player count.

**Expected behavior:** `xp = floor(floor(effectiveLevels * significance) / playerCount)`.

**Actual behavior:** `app/utils/encounterBudget.ts:200-210` (`calculateEncounterXp()`): `effectiveLevels` via `calculateEffectiveEnemyLevels()` (trainers count double). `totalXp = Math.floor(baseXp * significanceMultiplier)`. `xpPerPlayer = Math.floor(totalXp / Math.max(1, playerCount))`. Two floor operations correctly applied.

Also duplicated in `experienceCalculation.ts:258-299` (`calculateEncounterXp()`) with identical formula.

**Classification:** **Correct**

### 2. R006 — Encounter Level Budget Formula

**Rule:** The code comments cite "Core p.473" for `avgPokemonLevel * 2 * playerCount`. However, PTU Core Chapter 11 does NOT contain an explicit "level budget" formula on any page. The PTU text provides qualitative guidance about encounter design (fun progression, sensible ecosystems, quick-statting tips) but no quantitative budget formula.

**Expected behavior:** The level budget should match a PTU rule.

**Actual behavior:** `app/utils/encounterBudget.ts:130-146` (`calculateEncounterBudget()`): `baselinePerPlayer = avgLevel * 2`, `totalBudget = baselinePerPlayer * players`. The p.473 citation appears to be incorrect — there is no such formula in the PTU 1.05 text.

**Classification:** **Approximation**
**Severity:** **MEDIUM**
**Details:** The level budget formula is an app-invented heuristic, not a PTU rule. It provides a reasonable guideline for GMs (spending "2x the average Pokemon level per player" as enemy levels), but it should be documented as an app heuristic rather than cited as PTU Core p.473. The formula itself is sensible for encounter design assistance — it just isn't from the rulebook. The `analyzeEncounterBudget()` function and `BudgetIndicator` component build on this heuristic to provide difficulty assessment, which is a useful GM tool even without a PTU basis.

### 3. R009 — Difficulty Thresholds

**Rule:** The matrix says "verify trivial<0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8."

**Expected behavior:** Difficulty bands should match a PTU rule.

**Actual behavior:** `app/utils/encounterBudget.ts:114-120`:
```
trivial: 0.4,    // < 40% of budget
easy: 0.7,       // 40%-70% of budget
balanced: 1.3,   // 70%-130% of budget
hard: 1.8,       // 130%-180% of budget
// > 180% = deadly
```
`assessDifficulty()` at lines 167-173 uses these thresholds to classify budget ratio.

**Classification:** **Approximation**
**Severity:** **LOW**
**Details:** Like the level budget formula (R006), the difficulty thresholds are app-invented heuristics. PTU does not define quantitative difficulty bands. The thresholds are reasonable GM guidelines — a "balanced" encounter where total enemy levels are 70-130% of the budget feels correct. The "deadly" threshold at >180% provides a useful warning. These are design tool features rather than PTU rule implementations.

---

## Tier 2: Core Enumerations

### 4. R008 — Significance Presets

**Rule:** PTU Core p.460: "The Significance Multiplier should range from x1 to about x5."

**Expected behavior:** 5 tiers within x1-x5 range.

**Actual behavior:** `app/utils/encounterBudget.ts:72-108`: Five tiers:
- insignificant: x1.0 (PTU: x1-x1.5) -- **Correct**
- everyday: x2.0 (PTU: x2-x3) -- **Correct**
- significant: x4.0 (PTU: x4-x5) -- **Correct**
- climactic: x6.0 (PTU: not defined, exceeds range) -- **Incorrect**
- legendary: x8.0 (PTU: not defined, exceeds range) -- **Incorrect**

**Classification:** **Incorrect**
**Severity:** **HIGH**
**Details:** The first three tiers correctly correspond to PTU's stated ranges. The "climactic" (x6) and "legendary" (x8) tiers exceed PTU's stated "x1 to about x5" maximum. While the "about" qualifier gives slight flexibility, x6 and x8 are clearly outside the intended range. These extended presets could inflate XP rewards by 20-60% beyond what PTU intended for the most significant encounters. The code supports custom multipliers, so GMs can always use x1-x5, but the labeled presets misleadingly suggest these are standard PTU values.

### 5. R007 — Weighted Entries (Probability from Weights)

**Rule:** PTU encounter design uses weight-based rarity distribution. Higher weight = more common (herbivore pattern), lower weight = rarer (predator pattern).

**Expected behavior:** Species selection probability proportional to weight / total weight.

**Actual behavior:** `app/server/services/encounter-generation.service.ts:51-125`: `generateEncounterPokemon()` uses weighted random selection. For each spawn: draws a random number in [0, effectiveTotalWeight), walks entries and subtracts effective weight, selects when cumulative exceeds random value. Standard weighted random algorithm.

Diversity enforcement: `effectiveWeight = entry.weight * 0.5^timesSelected`. Per-species cap of `ceil(count/2)`. This reduces probability of repeatedly selecting the same species.

**Classification:** **Correct**

---

## Tier 3: Core Workflows

### 6. R016 — Encounter Creation Workflow

**Rule:** PTU Core Chapter 11: Build habitat table -> populate with species -> set level ranges -> generate encounter.

**Expected behavior:** Full workflow from table creation through generation.

**Actual behavior:**
1. **Table creation:** Prisma `EncounterTable` model with name, description, levelMin, levelMax, density.
2. **Species population:** `EncounterTableEntry` with speciesId (foreign key to SpeciesData), weight, optional per-entry level overrides.
3. **Sub-habitat modifications:** `TableModification` with `ModificationEntry` entries (add/remove/override species and weights).
4. **Generation:** `app/server/api/encounter-tables/[id]/generate.post.ts`:
   - Builds entry pool from parent table entries
   - Applies modification if specified (adds/removes/overrides species)
   - Resolves level range (table default or request override, per-entry overrides cascade)
   - Calls `generateEncounterPokemon()` with diversity enforcement
5. **Budget analysis:** `analyzeEncounterBudget()` provides difficulty assessment.

**Classification:** **Correct**

### 7. R012 — Species Diversity in Generation

**Rule:** PTU Core p.464 (quick-statting tips): "you don't want an encounter made entirely of one species either."

**Expected behavior:** Generation algorithm enforces diversity.

**Actual behavior:** `encounter-generation.service.ts:62-63`: `maxPerSpecies = Math.ceil(count / 2)`. Each selection halves the species' effective weight (`0.5^timesSelected`). When a species hits the cap, its effective weight becomes 0. Single-species pools skip diversity logic.

Example: For 6 spawns, no species can appear more than 3 times. After first selection, weight is halved; after second, quartered. This strongly encourages diversity.

**Classification:** **Correct**

### 8. R019 — Quick-Stat Workflow (Generation with Stats)

**Rule:** PTU Core p.464: Quick-stat tips for wild Pokemon encounters.

**Expected behavior:** Generated Pokemon have full stat blocks.

**Actual behavior:** `generate.post.ts` returns species names and levels. The actual Pokemon creation (with full stat distribution) is handled by `pokemon-generator.service.ts:generatePokemonData()` when Pokemon are spawned into an encounter (via wild-spawn or from-scene endpoints). This separation is intentional — the table generates species+level, the pokemon-generator handles stat distribution.

**Classification:** **Correct**

---

## Tier 4: Constraints

### 9. R003 — Level Ranges (Table-level and Entry-level Overrides)

**Rule:** Encounter tables should support level ranges per table with optional per-entry overrides.

**Expected behavior:** Table has default levelMin/levelMax. Individual entries can override with their own range.

**Actual behavior:**
- Table model: `levelMin Int @default(1)`, `levelMax Int @default(10)`.
- Entry model: `levelMin Int?`, `levelMax Int?` (nullable = optional override).
- Generation: `encounter-generation.service.ts:111-113`: `const entryLevelMin = selected.levelMin ?? levelMin; const entryLevelMax = selected.levelMax ?? levelMax`. Entry override cascades correctly with table default fallback.
- Request-level override also supported via `body.levelRange` in generate.post.ts (lines 21, 111-112).

**Classification:** **Correct**

### 10. R010 — Habitat Deviation Allowance

**Rule:** PTU Core Chapter 11: GMs may place any species in any habitat for narrative reasons.

**Expected behavior:** Modifications allow freeform species addition.

**Actual behavior:** `ModificationEntry` model has `speciesName String` (not a foreign key). Line 390-391 in schema: "Species name (not foreign key - allows adding species not in parent)". This allows adding any species by name to a modification, even if that species isn't in the parent table or even in the SpeciesData database.

`generate.post.ts:84-96`: Modification entries can add species with custom weights, override existing weights, or remove species. Freeform `speciesName` means any species can be introduced.

**Classification:** **Correct**

### 11. R020 — Action Economy Warning (Deadly Threshold)

**Rule:** Too many enemies overwhelm player action economy.

**Expected behavior:** Warning when encounter is likely too difficult.

**Actual behavior:** `encounterBudget.ts:167-173`: `assessDifficulty()` returns 'deadly' when budget ratio > 1.8. The `BudgetIndicator` component displays this assessment. While the thresholds are app-invented (see item #3), the warning mechanism works correctly — when total enemy levels exceed 180% of the calculated budget, a "deadly" warning is shown.

**Classification:** **Correct** (mechanism works; thresholds are app-invented, covered in item #3)

---

## Tier 5: Partial Items

### 12. R011 — Pseudo-Legendary Placement

**Rule:** Pseudo-legendary Pokemon (Dragonite, Tyranitar, etc.) should generally not appear in early-game tables.

**Expected behavior:** Warning or flag when powerful species are placed in low-level tables.

**Actual behavior:** No explicit pseudo-legendary detection. The weight system allows GMs to assign low weights to rare/powerful species, but there's no automated warning when a pseudo-legendary is added to a low-level table.

**Classification:** **Correct** (present portion — weight system provides control)
**Note:** The matrix classified this as Partial. The GM has full control via weights. No automated warning exists, but this is a UX enhancement rather than a rules violation.

### 13. R017 — Level Distribution (Per-Entry Level Ranges)

**Rule:** Different species in an encounter should appear at appropriate level ranges.

**Expected behavior:** Per-entry level range overrides.

**Actual behavior:** `EncounterTableEntry` has `levelMin Int?` and `levelMax Int?`. Generation respects these per-entry overrides (see item #9). Level is uniformly random within the range: `Math.floor(randomFn() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin`.

**Classification:** **Correct** (present portion — per-entry ranges work; no auto-distribution across budget)

### 14. R018 — Significance-Scaling Movesets

**Rule:** Higher-significance encounters should have more complex movesets.

**Expected behavior:** Generated Pokemon moveset complexity scales with significance.

**Actual behavior:** Significance tiers are stored and selectable, but the pokemon-generator service uses the same moveset selection logic regardless of significance. `selectMovesFromLearnset()` always takes the 6 most recent moves from the learnset at the Pokemon's level. There's no parameter for "simple vs complex moveset."

**Classification:** **Approximation**
**Severity:** **LOW**
**Details:** This is a qualitative PTU GM guidance rather than a hard rule. The PTU quick-statting section (p.464) recommends simpler movesets for quick encounters, but this is a GM decision about which moves to use, not a systematic mechanic. The app generates Pokemon with their natural learnset moves, which is correct — the GM can manually swap moves for simpler or more complex sets as needed. No practical impact since GMs can edit movesets after generation.

---

## Ambiguous Items

### A1. R006 — Level Budget Formula Citation

**The Ambiguity:** The code cites "Core p.473" for the level budget formula, but this formula does not appear in the PTU 1.05 text. Is there a supplementary PTU source, or is this an app invention?

**Code behavior:** `avgPokemonLevel * 2 * playerCount` as the encounter level budget.

**Interpretation A:** This is a community-derived heuristic based on PTU encounter design philosophy (the "balanced" encounter should challenge a party proportional to their strength).
**Interpretation B:** This comes from a PTU supplement, playtest document, or errata not included in the core 1.05 text.

**Recommendation:** If there is no supplementary source, update the code comment to describe this as an app heuristic rather than citing a specific PTU page. The formula itself is reasonable and useful.

---

## Verified Decree Compliance

No decrees directly target the encounter-tables domain.

---

## Escalation Notes

1. **HIGH: Significance presets exceed PTU range (R008)** — "Climactic" (x6) and "Legendary" (x8) exceed PTU's x1-x5 stated range. Same finding as in pokemon-lifecycle audit (shared constant). Options: (a) cap at x5, (b) label extended presets with a "house-rule" indicator, (c) accept as intentional extension with documentation.

2. **MEDIUM: Level budget formula citation (R006)** — Code cites "Core p.473" but no such formula exists in PTU 1.05. Should be documented as an app heuristic or the citation corrected if from a supplementary source.

3. **LOW: Difficulty thresholds (R009)** — App-invented thresholds (trivial <0.4, easy 0.4-0.7, balanced 0.7-1.3, hard 1.3-1.8, deadly >1.8). Reasonable heuristic, but should be documented as app-specific rather than PTU-derived.

4. **LOW: No moveset complexity scaling (R018)** — Qualitative PTU guidance, not a hard rule. The GM can manually adjust movesets after generation.
