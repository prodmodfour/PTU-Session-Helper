---
domain: character-lifecycle
type: audit-report
audited_at: 2026-02-28T04:00:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T03:00:00Z
---

# Audit Report: character-lifecycle

## Audit Summary

| Classification | Count |
|----------------|-------|
| Correct        | 29    |
| Incorrect      | 1     |
| Approximation  | 4     |
| Ambiguous      | 0     |
| **Total Audited** | **34** |

### Severity Breakdown (Incorrect + Approximation)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM   | 2     | R041 (Incorrect), R007 (Approximation) |
| LOW      | 3     | R033, R037, R064-R067 (Approximation) |

---

## Tier 1: Core Formulas

### R008 — Trainer HP Formula

- **Rule:** "Trainer Hit Points = Trainer's Level x 2 + (HP x 3) + 10" (PTU Core p.16, p.309)
- **Expected behavior:** HP computed as `level * 2 + hpStat * 3 + 10`
- **Actual behavior:** `form.level * 2 + computedStats.value.hp * 3 + 10` (`app/composables/useCharacterCreation.ts:116`)
- **Classification:** Correct
- **Notes:** Formula matches exactly. Uses computed HP stat (base 10 + allocated points), not raw allocation.

### R009 — Physical Evasion Formula

- **Rule:** "For every 5 points a Pokémon or Trainer has in Defense, they gain +1 Physical Evasion, up to a maximum of +6 at 30 Defense." (PTU Core p.16, p.234)
- **Expected behavior:** `floor(defense / 5)` capped at 6
- **Actual behavior:** `Math.min(6, Math.floor(computedStats.value.defense / 5))` (`app/composables/useCharacterCreation.ts:121`)
- **Classification:** Correct

### R010 — Special Evasion Formula

- **Rule:** "For every 5 points a Pokémon or Trainer has in Special Defense, they gain +1 Special Evasion, up to a maximum of +6 at 30 Special Defense." (PTU Core p.16, p.234)
- **Expected behavior:** `floor(specialDefense / 5)` capped at 6
- **Actual behavior:** `Math.min(6, Math.floor(computedStats.value.specialDefense / 5))` (`app/composables/useCharacterCreation.ts:122`)
- **Classification:** Correct

### R011 — Speed Evasion Formula

- **Rule:** "Additionally for every 5 points a Pokémon or Trainer has in Speed, they gain +1 Speed Evasion, up to a maximum of +6 at 30 Speed." (PTU Core p.16, p.234)
- **Expected behavior:** `floor(speed / 5)` capped at 6
- **Actual behavior:** `Math.min(6, Math.floor(computedStats.value.speed / 5))` (`app/composables/useCharacterCreation.ts:123`)
- **Classification:** Correct

### R012 — Evasion General Formula

- **Rule:** Evasion = floor(stat/5), capped at +6 (PTU Core p.16)
- **Expected behavior:** Floor division with cap
- **Actual behavior:** All three evasions use `Math.min(6, Math.floor(stat / 5))` (`app/composables/useCharacterCreation.ts:120-124`)
- **Classification:** Correct

### R041 — Action Points Pool Formula

- **Rule:** "Trainers have 5 AP plus 1 more for every 5 Trainer Levels. A Level 10 Trainer has 7 AP, for example." (PTU Core p.16, p.221/298)
- **Expected behavior:** `5 + floor(level / 5)`. Level 1=5, Level 5=6, Level 10=7.
- **Actual behavior:** `5 + Math.floor(level / 5)` (`app/utils/restHealing.ts:222`)
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Details:** The formula `5 + floor(level / 5)` gives Level 5 = 6 AP, Level 10 = 7 AP, which matches the PTU example for Level 10. However, Level 1 gives 5 AP (floor(1/5)=0, 5+0=5) which is correct. Level 5 gives 6 AP (floor(5/5)=1, 5+1=6). But PTU says "1 more for every 5 Trainer Levels" — this means at Level 5 you gain the first extra AP, making it 6 AP. This is what the code does. Wait — let me re-check. Level 5: floor(5/5)=1 → 5+1=6. Level 10: floor(10/5)=2 → 5+2=7. PTU example says Level 10 = 7 AP. This matches. However, Level 4: floor(4/5)=0 → 5 AP. Level 5: 6 AP. Level 9: floor(9/5)=1 → 6 AP. Level 15: floor(15/5)=3 → 8 AP. The code says Level 1=5, Level 5=6, Level 10=7, Level 15=8.

  Rechecking: PTU says "5 AP + 1 more for every 5 Trainer Levels." This is ambiguous — does "every 5 levels" mean at levels 5, 10, 15 (floor(level/5)) or at levels 1-5=+1, 6-10=+2 (ceiling)? The PTU example "Level 10 = 7 AP" resolves this as floor(10/5)=2, 5+2=7. The code matches the example.

  **Revised classification:** Correct.

### R068 — Percentages Are Additive

- **Rule:** PTU percentages stack additively, not multiplicatively (PTU Core general convention)
- **Expected behavior:** Additive percentage stacking in all formulas
- **Actual behavior:** The codebase uses additive patterns throughout — evasion cap checked after sum, damage modifiers added before application. No multiplicative compounding found.
- **Classification:** Correct

---

## Tier 2: Core Constraints

### R002 — Starting Stat Baseline

- **Rule:** "Starting Trainers begin with 10 HP and 5 points each in the rest of their Combat Stats. You may distribute 10 additional points among your Combat Stats, but no more than 5 points into any single stat." (PTU Core p.15)
- **Expected behavior:** Base HP=10, Base Other=5, 10 points to distribute, max 5 per stat at level 1
- **Actual behavior:**
  - `BASE_HP = 10`, `BASE_OTHER = 5`, `TOTAL_STAT_POINTS = 10`, `MAX_POINTS_PER_STAT = 5` (`app/constants/trainerStats.ts:11-20`)
  - `incrementStat` checks `MAX_POINTS_PER_STAT` cap only at level 1 (`app/composables/useCharacterCreation.ts:129`)
  - `validateStatAllocation` warns on per-stat cap violation at level 1 (`app/utils/characterCreationValidation.ts:51-60`)
- **Classification:** Correct

### R005 — Skill Rank Level Prerequisites

- **Rule:** Novice at level 1, Adept unlocked at level 2, Expert at level 6, Master at level 12 (PTU Core p.19, p.34)
- **Expected behavior:** Skill rank cap gates: L1=Novice, L2=Adept, L6=Expert, L12=Master
- **Actual behavior:**
  - `getMaxSkillRankForLevel`: returns Novice for L1, Adept for L2-5, Expert for L6-11, Master for L12+ (`app/constants/trainerStats.ts:51-56`)
  - `isSkillRankAboveCap` blocks ranks above the cap (`app/constants/trainerStats.ts:58-64`)
  - `addSkillEdge` checks cap before raising rank (`app/composables/useCharacterCreation.ts:330-331`)
- **Classification:** Correct

### R024 — Pathetic Skills Cannot Be Raised At Creation (decree-027)

- **Rule:** PTU pp. 14, 18: Pathetic skills from background cannot be raised during character creation. decree-027 extends this to block Skill Edges from raising Pathetic skills.
- **Expected behavior:** Pathetic-locked skills stay Pathetic during creation; Skill Edges blocked.
- **Actual behavior:**
  - `setSkillRank` blocks non-Pathetic rank for Pathetic-locked skills (`app/composables/useCharacterCreation.ts:183-184`)
  - `addSkillEdge` blocks Pathetic-locked skills (`app/composables/useCharacterCreation.ts:316-317`)
  - `addEdge` rejects edge strings matching "Skill Edge:" pattern (`app/composables/useCharacterCreation.ts:275`)
  - Validation warns on Pathetic edges in existing data (`app/utils/characterCreationValidation.ts:124-138`)
- **Classification:** Correct (per decree-027)

### R032 — Max 4 Class Features

- **Rule:** "Maximum trainer classes a character can have" = 4 (PTU Core p.65)
- **Expected behavior:** Cannot add more than 4 trainer classes
- **Actual behavior:** `addClass` returns early when `form.trainerClasses.length >= MAX_TRAINER_CLASSES` where `MAX_TRAINER_CLASSES = 4` (`app/composables/useCharacterCreation.ts:237`, `app/constants/trainerClasses.ts:40`)
- **Classification:** Correct

### R036/R038/R039 — Per-Level Advancement

- **Rule:** Per PTU Core p.19-21: odd levels grant +1 feature, even levels grant +1 edge, every level grants +1 stat point. Bonus Skill Edges at L2, L6, L12.
- **Expected behavior:** Progressive gain tracked correctly
- **Actual behavior:**
  - `getStatPointsForLevel`: `10 + max(0, level - 1)` = 10 at L1, 11 at L2, etc. (`app/constants/trainerStats.ts:34-36`) — Correct: 1 stat point per level after L1.
  - `getExpectedEdgesForLevel`: `4 + floor(level/2)` base + bonus Skill Edges at L2/L6/L12. L1=4, L2=5+1=6, L4=6, L6=7+2=9, etc. (`app/constants/trainerStats.ts:74-85`) — Let me verify: L1: base=4+floor(1/2)=4+0=4, bonus=0, total=4. L2: base=4+floor(2/2)=5, bonus=1, total=6. L6: base=4+floor(6/2)=7, bonus=2, total=9. This matches PTU: 4 starting + 1 at L2 even + 1 bonus skill = 6 at L2.
  - `getExpectedFeaturesForLevel`: `5 + floor(max(0, level-1) / 2)` = L1=5, L3=6, L5=7. (`app/constants/trainerStats.ts:97-99`) — Correct: 4 features + 1 training at L1, +1 at each odd level.
- **Classification:** Correct

### R040 — Max Trainer Level

- **Rule:** PTU levels go up to 50 for trainers
- **Expected behavior:** Level field exists, max 50 enforceable
- **Actual behavior:** Level is stored as an integer in the DB and editable in the form. The `form.level` field is a plain number with no hard cap in the composable, but the DB schema accepts any integer. No explicit max-50 enforcement in code, but the field is settable and the GM controls it.
- **Classification:** Correct
- **Notes:** No hard validation cap at 50, but PTU itself treats this as a practical maximum not a hard constraint. The app stores the level and lets the GM set it to any value, which is appropriate for a GM tool.

### R022 — Starting Edges

- **Rule:** PTU Core p.14: 4 starting edges at level 1
- **Expected behavior:** 4 edges tracked at level 1
- **Actual behavior:** `STARTING_EDGES = 4` (`app/composables/useCharacterCreation.ts:31`), validation checks via `getExpectedEdgesForLevel(1).total` = 4 (`app/utils/characterCreationValidation.ts:195-204`)
- **Classification:** Correct

### R023 — Starting Skill Cap

- **Rule:** PTU Core p.13, 19: Novice is max skill rank at level 1
- **Expected behavior:** Skills capped at Novice during character creation
- **Actual behavior:** `getMaxSkillRankForLevel(1)` returns `'Novice'`, `isSkillRankAboveCap` blocks higher ranks. `addSkillEdge` checks cap. Validation warns on over-cap skills. (`app/constants/trainerStats.ts:51-64`, `app/composables/useCharacterCreation.ts:330`)
- **Classification:** Correct

### R026 — Edges Per Level

- **Rule:** PTU Core p.19-21: 4 base at L1, +1 at each even level, bonus Skill Edges at L2/L6/L12
- **Expected behavior:** Edge count tracks correctly across levels
- **Actual behavior:** `getExpectedEdgesForLevel` computes base + bonus correctly (`app/constants/trainerStats.ts:74-85`). Validation compares actual edge count to expected. (`app/utils/characterCreationValidation.ts:195-204`)
- **Classification:** Correct

---

## Tier 3: Core Enumerations

### R001 — Trainer Combat Stats Definition

- **Rule:** 6 stats: HP, Attack, Defense, Special Attack, Special Defense, Speed (PTU Core p.15, p.234)
- **Expected behavior:** 6 stats stored and accessible
- **Actual behavior:** `StatPoints` interface has hp, attack, defense, specialAttack, specialDefense, speed (`app/composables/useCharacterCreation.ts:37-44`). `computedStats` produces all 6 (`app/composables/useCharacterCreation.ts:105-112`).
- **Classification:** Correct

### R003 — Skill Categories

- **Rule:** Body: 6 skills, Mind: 7 skills, Spirit: 4 skills = 17 total (PTU Core p.33)
- **Expected behavior:** 17 skills in 3 categories
- **Actual behavior:**
  - Body: `['Acrobatics', 'Athletics', 'Combat', 'Intimidate', 'Stealth', 'Survival']` = 6
  - Mind: `['General Ed', 'Medicine Ed', 'Occult Ed', 'Pokemon Ed', 'Technology Ed', 'Guile', 'Perception']` = 7
  - Spirit: `['Charm', 'Command', 'Focus', 'Intuition']` = 4
  - Total: 17 (`app/constants/trainerSkills.ts:4-14`)
- **Classification:** Correct
- **Notes:** PTU spells "Technology Education" — code abbreviates as "Technology Ed" (consistent with other Ed skills). Not an error.

### R004 — Skill Ranks and Dice

- **Rule:** 6 ranks: Pathetic (1d6), Untrained (2d6), Novice (3d6), Adept (4d6), Expert (5d6), Master (6d6) (PTU Core p.33)
- **Expected behavior:** 6 ranks with correct dice counts
- **Actual behavior:** `SKILL_RANKS` array: Pathetic=1d6, Untrained=2d6, Novice=3d6, Adept=4d6, Expert=5d6, Master=6d6 (`app/constants/trainerSkills.ts:19-26`)
- **Classification:** Correct

### R025 — Skill Edge Definitions

- **Rule:** PTU Core p.41: Basic Skills (Untrained→Novice), Adept Skills (L2, Novice→Adept), Expert Skills (L6, Adept→Expert), Master Skills (L12, Expert→Master)
- **Expected behavior:** Skill Edges raise rank by one step with level prerequisites
- **Actual behavior:** `addSkillEdge` progresses through `['Pathetic', 'Untrained', 'Novice', 'Adept', 'Expert', 'Master']`, checks level cap via `isSkillRankAboveCap`, blocks at Master. (`app/composables/useCharacterCreation.ts:314-339`)
- **Classification:** Correct

---

## Tier 4: Workflows

### R051 — Character Creation Workflow

- **Rule:** PTU Core Ch.2: Step-by-step creation process (Concept → Background → Skills/Stats → Classes/Features → Edges → Derived Stats → Description)
- **Expected behavior:** Multi-section creation UI with progress tracking
- **Actual behavior:** `useCharacterCreation` composable provides: form state, background application, stat allocation, skill management, class/feature/edge management, section completion tracking, validation warnings, and API payload building. `sectionCompletion` computed tracks progress across 6 sections. (`app/composables/useCharacterCreation.ts:53-492`)
- **Classification:** Correct
- **Notes:** Sections can be filled in any order (R052 interleaving supported).

### R052 — Steps 3 and 4 Interleaving

- **Rule:** PTU Core p.12-14: Steps 3 (Skills) and 4 (Classes/Features) can be done in any order
- **Expected behavior:** No forced ordering between sections
- **Actual behavior:** All form sections are independently reactive. No section depends on another for input. (`app/composables/useCharacterCreation.ts`)
- **Classification:** Correct

### R007 — Background Skill Modification

- **Rule:** PTU Core p.14: Background sets 1 Adept, 1 Novice, 3 Pathetic. 11 sample backgrounds provided.
- **Expected behavior:** Preset backgrounds + custom mode
- **Actual behavior:**
  - 11 preset backgrounds in `SAMPLE_BACKGROUNDS` (`app/constants/trainerBackgrounds.ts:16-94`)
  - `applyBackground` sets Adept, Novice, and 3 Pathetic skills (`app/composables/useCharacterCreation.ts:146-158`)
  - `enableCustomBackground` allows manual skill setting (`app/composables/useCharacterCreation.ts:169-175`)
  - Validation checks 1 Adept, 1 Novice, 3 Pathetic (`app/utils/characterCreationValidation.ts:86-122`)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Details:** The PTU book lists 11 sample backgrounds. The code has exactly 11. However, several PTU backgrounds allow the player to choose among multiple skills (e.g., "Hermit" says "Adept in an Education Skill" — player picks which). The code hardcodes one default choice per background (Hermit defaults to Occult Ed). This is an approximation — the intent is correct and custom mode covers the gap, but preset behavior differs slightly from the PTU text which gives the player a choice within the preset.

### R030/R031 — Starting Features and Training Feature

- **Rule:** PTU Core p.13-14: 4 class features + 1 free Training Feature = 5 total at L1
- **Expected behavior:** 4+1 feature slots tracked
- **Actual behavior:** `form.features` (class features) + `form.trainingFeature` (separate slot). `allFeatures` computed combines them. `expectedFeatures` = `getExpectedFeaturesForLevel(level) - 1` for class features. (`app/composables/useCharacterCreation.ts:248-265, 342-344`)
- **Classification:** Correct

### R043 — AP Bind and Drain

- **Rule:** PTU Core p.221: Bound AP is off-limits until effect ends. Drained AP unavailable until Extended Rest. AP refreshes at scene start (but drained stays unavailable).
- **Expected behavior:** Bind/drain tracked, cleared by rest/new-day
- **Actual behavior:**
  - `calculateAvailableAp(maxAp, boundAp, drainedAp)` = `max(0, maxAp - boundAp - drainedAp)` (`app/utils/restHealing.ts:232-234`)
  - Extended rest endpoint clears drainedAp (`app/server/api/characters/[id]/extended-rest.post.ts`)
  - New-day endpoint resets AP fully (`app/server/api/game/new-day.post.ts`)
- **Classification:** Correct

---

## Tier 5: Partial Items (Verify Present Portion)

### R016/R017/R018 — Movement/Swimming/Throwing (manual storage)

- **Rule:** PTU Core p.16: Overland = 3 + [(Athletics + Acrobatics)/2], Swimming = half Overland, Throwing Range = 4 + Athletics Rank
- **Expected behavior:** Matrix says manual storage present, auto-calculation missing.
- **Actual behavior:** The Prisma schema stores raw stat values on HumanCharacter. No `overland`, `swim`, or `throwingRange` auto-calculated fields exist on the trainer model. Capabilities are stored but not auto-derived from skill ranks. Confirmed: storage is present, auto-calculation is absent.
- **Classification:** Correct (for the "present" portion — manual storage works)

### R033 — Stat Tag Feature Storage

- **Rule:** PTU Core p.47: Features with [+Stat] tags grant stat bonuses
- **Expected behavior:** Features stored as strings; no auto stat bonus from tags
- **Actual behavior:** `form.features` stores feature names as plain strings (`app/composables/useCharacterCreation.ts:79`). No tag parsing or auto stat application exists.
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** Feature storage is correct. The missing auto-stat-bonus is a known gap (matrix marks it Partial). This is a reasonable simplification since the GM can manually apply stat adjustments.

### R037 — No Duplicate Features

- **Rule:** PTU Core p.47: Features cannot be taken more than once unless they have the [Ranked] tag
- **Expected behavior:** Duplicate detection for non-Ranked features
- **Actual behavior:** `addFeature` appends without checking for duplicates (`app/composables/useCharacterCreation.ts:256`). No duplicate validation in `validateEdgesAndFeatures`. The matrix correctly notes this as Partial (stored, no detection).
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** The GM is expected to know the rules. The tool allows duplicates, which is technically an approximation since the PTU rule forbids them for non-Ranked features.

### R053 — Level Field Editability

- **Rule:** PTU Core: Level advances through XP or GM fiat
- **Expected behavior:** Level editable on character
- **Actual behavior:** `form.level` is a reactive number, freely editable (`app/composables/useCharacterCreation.ts:58`). Level changes recalculate stat budget, edge count, and feature count.
- **Classification:** Correct (for the "present" portion)

### R063 — AP Decrement

- **Rule:** PTU Core p.221: Trainers can spend AP for +1 to skill rolls
- **Expected behavior:** AP can be decremented
- **Actual behavior:** AP fields (actionPoints, drainedAp) exist on HumanCharacter model in Prisma. Can be decremented via the PUT endpoint. No explicit "spend AP for +1" button, but the raw AP value is editable.
- **Classification:** Correct (for the "present" portion)

### R064/R065/R066/R067 — Edge String Storage (Skill Stunt, Enhancement, Categoric Inclination, Virtuoso)

- **Rule:** PTU Core pp. 42-43: Various Skill Edges with specific mechanical effects
- **Expected behavior:** Edge names stored; no auto-application of mechanical effects
- **Actual behavior:** Edges stored as string array in `form.edges` (`app/composables/useCharacterCreation.ts:83`). No structured data (no auto +2 bonus for Enhancement, no +1 category bonus for Categoric Inclination, no Rank 8 calculation for Virtuoso).
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** All four edges can be added as text strings. The GM applies their mechanical effects manually. This is consistent with the app's design philosophy where edges are tracked but not automated.

---

## Revision: R041 Reclassification

After re-analysis, R041 (Action Points Pool) is **Correct**. The formula `5 + floor(level / 5)` matches the PTU text "5 AP plus 1 more for every 5 Trainer Levels" and the explicit example "A Level 10 Trainer has 7 AP" (5 + floor(10/5) = 5 + 2 = 7).

---

## Corrected Summary

| Classification | Count |
|----------------|-------|
| Correct        | 30    |
| Incorrect      | 0     |
| Approximation  | 4     |
| Ambiguous      | 0     |
| **Total Audited** | **34** |

### Severity Breakdown (Approximation only)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM   | 1     | R007 (Background preset hardcoded choices) |
| LOW      | 3     | R033 (stat tag storage), R037 (no duplicate detection), R064-R067 (edge string only) |

---

## Escalation Notes

No Ambiguous items. All active decrees checked:
- decree-022: Verified — branching class specialization suffix used correctly in `addClass` and `BRANCHING_CLASS_SPECIALIZATIONS`
- decree-026: Verified — Martial Artist removed from branching classes (not in `BRANCHING_CLASS_SPECIALIZATIONS`)
- decree-027: Verified — Pathetic skills blocked from Skill Edges during creation
