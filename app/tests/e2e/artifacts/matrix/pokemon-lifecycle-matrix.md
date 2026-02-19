---
domain: pokemon-lifecycle
analyzed_at: 2026-02-19T14:00:00Z
analyzed_by: coverage-analyzer
total_rules: 68
implemented: 29
partial: 15
missing: 15
out_of_scope: 9
coverage_score: 61.9
---

# Feature Completeness Matrix: Pokemon Lifecycle

## Coverage Score
**61.9%** — (29 + 0.5 * 15) / (68 - 9) * 100 = 36.5 / 59 * 100 = 61.9%

| Classification | Count |
|---------------|-------|
| Implemented | 29 |
| Partial | 15 |
| Missing | 15 |
| Out of Scope | 9 |
| **Total** | **68** |

---

## Implemented Rules

### pokemon-lifecycle-R001: Pokemon Party Limit
- **Classification:** Implemented
- **Mapped to:** `C005` — Pokemon.ownerId Ownership Relation (`app/prisma/schema.prisma:Pokemon.ownerId`) + `C057` — getPokemonByOwner getter (`app/stores/library.ts:getPokemonByOwner`). Pokemon ownership is tracked and queryable. The link/unlink system (Chain 8) manages party membership. The 6-limit is trackable through the ownership relation. Auditor should verify whether the link endpoint rejects a 7th Pokemon.

### pokemon-lifecycle-R002: Pokemon Maximum Level
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model (`app/prisma/schema.prisma:Pokemon.level`). Level stored as integer. Auditor should verify whether level 100 cap is enforced at the API layer.

### pokemon-lifecycle-R003: Base Stats Definition
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData Prisma Model (`app/prisma/schema.prisma:SpeciesData`). Base stats (hp, attack, defense, spAttack, spDefense, speed) seeded from pokedex files. `C028` — generatePokemonData looks up SpeciesData for base stats during creation.

### pokemon-lifecycle-R004: Pokemon Types
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData Prisma Model (`app/prisma/schema.prisma:SpeciesData.type1/type2`). All 18 types stored in species data and propagated to Pokemon on creation via `C028`.

### pokemon-lifecycle-R005: Nature System
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model (`app/prisma/schema.prisma:Pokemon.nature`). Nature stored as JSON with raised/lowered stat info. `C028` generatePokemonData and `C086` creation page both support nature selection.

### pokemon-lifecycle-R007: Neutral Natures
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model. Nature is stored as JSON; neutral natures (where raised == lowered stat) are representable and selectable during creation.

### pokemon-lifecycle-R008: Nature Flavor Preferences
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model. Nature is stored including raised/lowered stat. Flavor preferences (Salty/Spicy/Sour/Dry/Bitter/Sweet) are a direct 1:1 mapping from nature stats — a reference concept the GM uses narratively. No special app feature needed beyond storing the nature.

### pokemon-lifecycle-R009: Stat Points Allocation Total
- **Classification:** Implemented
- **Mapped to:** `C032` — distributeStatPoints (`app/server/services/pokemon-generator.service.ts:distributeStatPoints`). Distributes (level - 1) stat points weighted by base stats. Auditor should verify whether the total is `level + 10` as per PTU rules, since the capability description says `level - 1` points.

### pokemon-lifecycle-R011: Pokemon HP Formula
- **Classification:** Implemented
- **Mapped to:** `C028` — generatePokemonData (`app/server/services/pokemon-generator.service.ts:generatePokemonData`). Uses `level + baseHp*3 + 10`. Also applied by `C010` (Create Pokemon API) when maxHp not provided.

### pokemon-lifecycle-R012: Evasion Calculation
- **Classification:** Implemented
- **Mapped to:** Cross-domain reference. Per app-surface.md, `POST /api/encounters/:id/calculate-damage` computes dynamic evasion from stage-modified stats. Evasion calculation exists in the combat domain.

### pokemon-lifecycle-R013: Abilities - Initial Assignment
- **Classification:** Implemented
- **Mapped to:** `C034` — pickRandomAbility (`app/server/services/pokemon-generator.service.ts:pickRandomAbility`). Picks one random Basic Ability, respecting `numBasicAbilities` to limit selection pool.

### pokemon-lifecycle-R016: No Ability Maximum
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model (`app/prisma/schema.prisma:Pokemon.abilities`). Abilities stored as JSON array with no fixed-length constraint.

### pokemon-lifecycle-R017: Move Slot Limit
- **Classification:** Implemented
- **Mapped to:** `C033` — selectMovesFromLearnset (`app/server/services/pokemon-generator.service.ts:selectMovesFromLearnset`). Selects up to 6 moves from learnset at generation time.

### pokemon-lifecycle-R018: Natural Move Sources
- **Classification:** Implemented
- **Mapped to:** `C033` — selectMovesFromLearnset + `C002` — SpeciesData (`app/prisma/schema.prisma:SpeciesData.learnset`). Learnset stores level-up moves; `selectMovesFromLearnset` selects the most recent natural moves at or below the Pokemon's level.

### pokemon-lifecycle-R022: Tutor Points - Initial
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model (`app/prisma/schema.prisma:Pokemon.tutorPoints`). Tutor points stored as integer field, settable during creation.

### pokemon-lifecycle-R024: Tutor Points - Permanent Spend
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon model (tutorPoints field) + `C012` — Update Pokemon API. GM decrements TP via sheet editing when spent. Permanence inherent in manual tracking.

### pokemon-lifecycle-R030: Optional Evolution Refusal
- **Classification:** Implemented
- **Mapped to:** `C012` — Update Pokemon API + `C085` — Pokemon Sheet Page. Evolution is handled manually by GM editing — refusal is the default (GM simply does not change species).

### pokemon-lifecycle-R035: Vitamins - Base Stat Increase
- **Classification:** Implemented
- **Mapped to:** `C012` — Update Pokemon API (`app/server/api/pokemon/[id].put.ts`). Base stats editable via PUT endpoint, allowing manual vitamin application.

### pokemon-lifecycle-R036: Vitamins - Maximum Per Pokemon
- **Classification:** Implemented
- **Mapped to:** `C012` — Update Pokemon API. GM tracks vitamin count manually via sheet editing. Auditor should verify whether any automated enforcement exists.

### pokemon-lifecycle-R038: Pokemon Creation Workflow
- **Classification:** Implemented
- **Mapped to:** Four complete capability chains:
  - Chain 1: Manual (`C086` page → `C049` store → `C010` API → `C035` nickname → `C001` DB)
  - Chain 2: CSV import (`C025` → `C036`/`C037`/`C038` → `C029` → `C035` → `C001`)
  - Chain 3: Wild spawn (`C027` → `C030` → `C028`/`C032`/`C033`/`C034` → `C029` → `C031` → `C001`)
  - Chain 4: Template (`C092` → `C030` → `C028` → `C029` → `C031` → `C001`)

### pokemon-lifecycle-R048: Loyalty System - Ranks
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model. The 7-rank system (0-6) is trackable through the Pokemon data model fields (notes or dedicated field).

### pokemon-lifecycle-R049: Loyalty - Command Checks
- **Classification:** Implemented
- **Mapped to:** `C063` — rollSkill (`app/composables/usePokemonSheetRolls.ts:rollSkill`). Skill check rolling supports any DC-based check. GM manages command checks using the dice roller.

### pokemon-lifecycle-R050: Loyalty - Starting Values
- **Classification:** Implemented
- **Mapped to:** `C010` — Create Pokemon API + `C012` — Update Pokemon API. Starting values (2 for caught, 3 for hatched) are GM knowledge applied during creation.

### pokemon-lifecycle-R053: Disposition System
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model. Disposition trackable via notes field or sheet editing. The 6 dispositions are a narrative concept the GM manages.

### pokemon-lifecycle-R060: Experience Chart
- **Classification:** Implemented
- **Mapped to:** `C001` — Pokemon Prisma Model (`app/prisma/schema.prisma:Pokemon.experience`). Experience stored and level tracked. The experience-to-level mapping is available for reference.

### pokemon-lifecycle-R061: Size Classes
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData (`app/prisma/schema.prisma:SpeciesData.size`) + `C031` — buildPokemonCombatant. Size stored in species data, propagated to Pokemon, and mapped to VTT token size (Small/Medium = 1x1, Large = 2x2, Huge = 3x3, Gigantic = 4x4).

### pokemon-lifecycle-R062: Weight Classes
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData (`app/prisma/schema.prisma:SpeciesData.weightClass`). Weight class (1-6) stored in species data and propagated via `C028`.

### pokemon-lifecycle-R063: Species Capabilities
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData (`app/prisma/schema.prisma:SpeciesData.capabilities`) + `C028` generatePokemonData (propagates) + `C081` PokemonCapabilitiesTab (displays).

### pokemon-lifecycle-R065: Pokemon Skills
- **Classification:** Implemented
- **Mapped to:** `C002` — SpeciesData (`app/prisma/schema.prisma:SpeciesData.skills`). Skills (Athletics, Acrobatics, Combat, Stealth, Perception, Focus) stored and propagated. `C063` rollSkill supports dice rolling for checks.

---

## Partial Rules

### pokemon-lifecycle-R006: Nature Stat Adjustments
- **Classification:** Partial
- **Present:** Nature stored on Pokemon with raised/lowered stat info. Creation page and generation service both support nature selection and storage.
- **Missing:** No automated application of nature stat adjustments (+/-2 to stats, +/-1 to HP) during generation or creation. `generatePokemonData` distributes stat points weighted by base stats but does not modify base stats by nature before distribution.
- **Mapped to:** `C028` — generatePokemonData, `C001` — Pokemon model
- **Gap Priority:** P1

### pokemon-lifecycle-R010: Base Relations Rule
- **Classification:** Partial
- **Present:** Stat points distributed weighted by base stats (`C032`), which tends to naturally follow the base relations ordering.
- **Missing:** No explicit enforcement of the Base Relations Rule constraint. The weighted random distribution is an approximation that can violate the ordering requirement. No validation check on final stats.
- **Mapped to:** `C032` — distributeStatPoints (`app/server/services/pokemon-generator.service.ts:distributeStatPoints`)
- **Gap Priority:** P1

### pokemon-lifecycle-R014: Abilities - Level 20
- **Classification:** Partial
- **Present:** Abilities stored as editable JSON array. SpeciesData distinguishes basic vs advanced abilities via `numBasicAbilities`. GM can manually add abilities.
- **Missing:** No automated prompt or workflow at level 20 to add a second ability. No UI suggestion system for Basic/Advanced abilities.
- **Mapped to:** `C001` — Pokemon model, `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R015: Abilities - Level 40
- **Classification:** Partial
- **Present:** Same as R014 — abilities array editable, GM can manually add third ability.
- **Missing:** No automated prompt at level 40. No suggestion from any ability list.
- **Mapped to:** `C001` — Pokemon model, `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R023: Tutor Points - Level Progression
- **Classification:** Partial
- **Present:** Tutor points stored as integer, editable via sheet. GM can manually increment.
- **Missing:** No automated calculation of total tutor points by level (1 + floor(level/5)). Generation service does not set tutor points based on level.
- **Mapped to:** `C001` — Pokemon model, `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R026: Level Up Workflow
- **Classification:** Partial
- **Present:** All constituent data editable — stats, moves, abilities, level, experience. Sheet page supports full editing.
- **Missing:** No unified "Level Up" wizard guiding GM through ordered steps: +1 stat point (with Base Relations), check new moves, check evolution, check ability at 20/40. Each step performed manually.
- **Mapped to:** `C085` — Pokemon Sheet Page, `C012` — Update Pokemon API
- **Gap Priority:** P1

### pokemon-lifecycle-R027: Level Up Stat Point
- **Classification:** Partial
- **Present:** Stats are editable via sheet. GM can manually add stat points.
- **Missing:** No automated +1 stat point on level-up. No validation against Base Relations Rule.
- **Mapped to:** `C012` — Update Pokemon API, `C085` — Pokemon Sheet Page
- **Gap Priority:** P1

### pokemon-lifecycle-R028: Level Up Move Check
- **Classification:** Partial
- **Present:** Moves stored and editable. Learnset available in SpeciesData. Move selection works at creation time.
- **Missing:** No automated level-up move notification. No "available moves at this level" suggestion during level-up.
- **Mapped to:** `C002` — SpeciesData, `C033` — selectMovesFromLearnset (creation-only), `C012` — Update Pokemon API
- **Gap Priority:** P1

### pokemon-lifecycle-R029: Evolution Check on Level Up
- **Classification:** Partial
- **Present:** Species editable. SpeciesData stores evolution stage info. GM can manually change species.
- **Missing:** No automated evolution check. No notification when a Pokemon reaches evolution level. No evolution workflow (stat recalc, ability remap, new moves).
- **Mapped to:** `C002` — SpeciesData, `C012` — Update Pokemon API
- **Gap Priority:** P1

### pokemon-lifecycle-R031: Evolution - Stat Recalculation
- **Classification:** Partial
- **Present:** Base stats and calculated stats editable. GM can manually re-stat after evolution.
- **Missing:** No automated stat recalculation: take new base stats, reapply nature, reapply vitamins, redistribute stat points with Base Relations Rule. All manual.
- **Mapped to:** `C012` — Update Pokemon API
- **Gap Priority:** P1

### pokemon-lifecycle-R032: Evolution - Ability Remapping
- **Classification:** Partial
- **Present:** Abilities editable as JSON array. GM can manually update.
- **Missing:** No automated ability remapping matching old ability slots to new species' ability list positions.
- **Mapped to:** `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R033: Evolution - Immediate Move Learning
- **Classification:** Partial
- **Present:** Moves editable. Learnset data available in SpeciesData.
- **Missing:** No automated check for moves the evolved form learns below its minimum evolution level. GM must manually cross-reference.
- **Mapped to:** `C002` — SpeciesData, `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R034: Evolution - Skills and Capabilities Update
- **Classification:** Partial
- **Present:** Skills and capabilities stored and editable. SpeciesData contains evolved form's data.
- **Missing:** No automated update of skills/capabilities on evolution.
- **Mapped to:** `C002` — SpeciesData, `C012` — Update Pokemon API
- **Gap Priority:** P2

### pokemon-lifecycle-R037: Heart Booster
- **Classification:** Partial
- **Present:** Tutor points stored and editable. GM can manually add 2 TP.
- **Missing:** No dedicated Heart Booster item/action. No "one per Pokemon" constraint enforcement. No item tracking system.
- **Mapped to:** `C001` — Pokemon model, `C012` — Update Pokemon API
- **Gap Priority:** P3

### pokemon-lifecycle-R058: Pokemon Experience Calculation
- **Classification:** Partial
- **Present:** Experience stored on Pokemon model. GM can manually update experience via sheet.
- **Missing:** No automated experience calculation from encounter results (total enemy levels, significance multiplier, player division). No XP distribution UI after combat.
- **Mapped to:** `C001` — Pokemon model, `C012` — Update Pokemon API
- **Gap Priority:** P1

---

## Missing Rules

### pokemon-lifecycle-R019: TM/Tutor Move Limit
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No validation limiting a Pokemon to 3 non-natural TM/Tutor moves. Moves stored as flat JSON array without source classification (natural vs TM vs tutor). Auto-generated Pokemon use only natural moves (`C033`), but manual editing has no enforcement.

### pokemon-lifecycle-R020: TM-to-Natural Reclassification
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No move source tracking (TM vs natural vs tutor) on individual moves. Cannot reclassify a TM-learned move as natural at the appropriate level. Requires move source metadata that does not exist in the data model.

### pokemon-lifecycle-R021: Tutor Move Level Restrictions
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No level-based restrictions on tutor moves (under 20: At-Will/EOT DB<=7; 20-29: Scene DB<=9; 30+: unrestricted). Move editing has no validation for these constraints.

### pokemon-lifecycle-R025: Tutor Points - Trade Refund
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No mechanism tracking which Features used TP on which Pokemon. No refund workflow when Pokemon is traded. The unlink API (`C015`) sets ownerId to null without TP refund logic.

### pokemon-lifecycle-R039: Breeding - Species Determination
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No breeding system. No 1d20 roll for species determination from parent pair. All creation pathways are non-breeding (manual, wild, template, CSV import, capture).

### pokemon-lifecycle-R040: Breeding - Inheritance Move List
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No inheritance move system. No cross-referencing parent moves against child egg move list.

### pokemon-lifecycle-R041: Breeding - Inheritance Move Schedule
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No inheritance move learning at levels 20/30/40+. No inheritance move list tracking per Pokemon.

### pokemon-lifecycle-R042: Inheritance Move Level Restrictions
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Depends on R041 (missing). Errata frequency/DB restrictions on inheritance moves cannot be enforced without the inheritance system.

### pokemon-lifecycle-R043: Breeding - Trait Determination
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No breeding trait determination workflow. No Breeder Education rank-based control.

### pokemon-lifecycle-R044: Breeding - Nature Choice Threshold
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Depends on R043 (missing). No Education rank check for nature choice during breeding.

### pokemon-lifecycle-R045: Breeding - Ability Choice Threshold
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Depends on R043 (missing). No Education rank check for ability choice during breeding.

### pokemon-lifecycle-R046: Breeding - Gender Choice Threshold
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Depends on R043 (missing). No Education rank check for gender choice during breeding.

### pokemon-lifecycle-R047: Breeding - Shiny Determination
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No 1d100 shiny roll for hatched Pokemon. Shiny is a manual boolean field.

### pokemon-lifecycle-R055: Training Session
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No training session workflow. No way to track Feature application, Poke Edge teaching, or Ace Trainer triggers within a structured session. GM can manually update fields but no dedicated training UI.

### pokemon-lifecycle-R057: Experience Training Limit
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No tracking of daily experience training count per trainer. No Command Rank-based daily limit enforcement. Depends on R055 (also missing).

---

## Out of Scope

### pokemon-lifecycle-R051: Loyalty - Intercept at Rank 3
- **Classification:** Out of Scope
- **Justification:** Cross-domain combat reference (`scope: cross-domain-ref`). Intercept is a combat action mechanic handled by the combat domain, not a pokemon-lifecycle rule.

### pokemon-lifecycle-R052: Loyalty - Intercept at Rank 6
- **Classification:** Out of Scope
- **Justification:** Cross-domain combat reference (`scope: cross-domain-ref`). Same as R051 — expanded intercept at Loyalty 6 is a combat mechanic.

### pokemon-lifecycle-R054: Disposition - Charm Check DCs
- **Classification:** Out of Scope
- **Justification:** Charm check DCs are social/encounter reference data the GM looks up from the rulebook. Not a computation the session helper needs to automate — the GM rolls and compares manually.

### pokemon-lifecycle-R056: Experience Training Formula
- **Classification:** Out of Scope
- **Justification:** Experience training is a between-session activity with simple mental math (half level + Command Rank bonus). The session helper focuses on in-session gameplay. The formula is trivial to compute mentally.

### pokemon-lifecycle-R059: Experience Distribution Rules
- **Classification:** Out of Scope
- **Justification:** Experience distribution is a GM discretionary decision (how to split XP among Pokemon). The app stores experience per Pokemon for manual updates. The "fainted Pokemon get XP" rule is GM knowledge, not an enforcement point.

### pokemon-lifecycle-R064: Move-Granted Capabilities
- **Classification:** Out of Scope
- **Justification:** Tracking move-granted capability additions/removals requires deep cross-system integration beyond current scope. Capabilities are stored and editable — GM can manually manage move-granted capabilities.

### pokemon-lifecycle-R066: Mega Evolution - Trigger
- **Classification:** Out of Scope
- **Justification:** Edge-case mechanic requiring held item (Mega Stone) and trainer accessory (Mega Ring) tracking, plus scene-duration timing. No item management system exists. Rare mechanic handled narratively.

### pokemon-lifecycle-R067: Mega Evolution - Stat and Ability Changes
- **Classification:** Out of Scope
- **Justification:** Depends on R066 (out of scope). Temporary stat/ability transformation that reverses at scene end requires a transformation system that does not exist and is not warranted for this edge-case.

### pokemon-lifecycle-R068: Mega Evolution - Constraints
- **Classification:** Out of Scope
- **Justification:** Depends on R066 (out of scope). One-per-scene and Mega Stone removal constraints are part of the Mega Evolution subsystem.

---

## Classification Index

| Rule | Name | Classification | Priority |
|------|------|---------------|----------|
| R001 | Pokemon Party Limit | Implemented | — |
| R002 | Pokemon Maximum Level | Implemented | — |
| R003 | Base Stats Definition | Implemented | — |
| R004 | Pokemon Types | Implemented | — |
| R005 | Nature System | Implemented | — |
| R006 | Nature Stat Adjustments | Partial | P1 |
| R007 | Neutral Natures | Implemented | — |
| R008 | Nature Flavor Preferences | Implemented | — |
| R009 | Stat Points Allocation Total | Implemented | — |
| R010 | Base Relations Rule | Partial | P1 |
| R011 | Pokemon HP Formula | Implemented | — |
| R012 | Evasion Calculation | Implemented | — |
| R013 | Abilities - Initial Assignment | Implemented | — |
| R014 | Abilities - Level 20 | Partial | P2 |
| R015 | Abilities - Level 40 | Partial | P2 |
| R016 | No Ability Maximum | Implemented | — |
| R017 | Move Slot Limit | Implemented | — |
| R018 | Natural Move Sources | Implemented | — |
| R019 | TM/Tutor Move Limit | Missing | P2 |
| R020 | TM-to-Natural Reclassification | Missing | P3 |
| R021 | Tutor Move Level Restrictions | Missing | P2 |
| R022 | Tutor Points - Initial | Implemented | — |
| R023 | Tutor Points - Level Progression | Partial | P2 |
| R024 | Tutor Points - Permanent Spend | Implemented | — |
| R025 | Tutor Points - Trade Refund | Missing | P3 |
| R026 | Level Up Workflow | Partial | P1 |
| R027 | Level Up Stat Point | Partial | P1 |
| R028 | Level Up Move Check | Partial | P1 |
| R029 | Evolution Check on Level Up | Partial | P1 |
| R030 | Optional Evolution Refusal | Implemented | — |
| R031 | Evolution - Stat Recalculation | Partial | P1 |
| R032 | Evolution - Ability Remapping | Partial | P2 |
| R033 | Evolution - Immediate Move Learning | Partial | P2 |
| R034 | Evolution - Skills and Capabilities Update | Partial | P2 |
| R035 | Vitamins - Base Stat Increase | Implemented | — |
| R036 | Vitamins - Maximum Per Pokemon | Implemented | — |
| R037 | Heart Booster | Partial | P3 |
| R038 | Pokemon Creation Workflow | Implemented | — |
| R039 | Breeding - Species Determination | Missing | P2 |
| R040 | Breeding - Inheritance Move List | Missing | P2 |
| R041 | Breeding - Inheritance Move Schedule | Missing | P2 |
| R042 | Inheritance Move Level Restrictions | Missing | P3 |
| R043 | Breeding - Trait Determination | Missing | P2 |
| R044 | Breeding - Nature Choice Threshold | Missing | P3 |
| R045 | Breeding - Ability Choice Threshold | Missing | P3 |
| R046 | Breeding - Gender Choice Threshold | Missing | P3 |
| R047 | Breeding - Shiny Determination | Missing | P3 |
| R048 | Loyalty System - Ranks | Implemented | — |
| R049 | Loyalty - Command Checks | Implemented | — |
| R050 | Loyalty - Starting Values | Implemented | — |
| R051 | Loyalty - Intercept at Rank 3 | Out of Scope | — |
| R052 | Loyalty - Intercept at Rank 6 | Out of Scope | — |
| R053 | Disposition System | Implemented | — |
| R054 | Disposition - Charm Check DCs | Out of Scope | — |
| R055 | Training Session | Missing | P2 |
| R056 | Experience Training Formula | Out of Scope | — |
| R057 | Experience Training Limit | Missing | P2 |
| R058 | Pokemon Experience Calculation | Partial | P1 |
| R059 | Experience Distribution Rules | Out of Scope | — |
| R060 | Experience Chart | Implemented | — |
| R061 | Size Classes | Implemented | — |
| R062 | Weight Classes | Implemented | — |
| R063 | Species Capabilities | Implemented | — |
| R064 | Move-Granted Capabilities | Out of Scope | — |
| R065 | Pokemon Skills | Implemented | — |
| R066 | Mega Evolution - Trigger | Out of Scope | — |
| R067 | Mega Evolution - Stat and Ability Changes | Out of Scope | — |
| R068 | Mega Evolution - Constraints | Out of Scope | — |

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to verify correctness. Core scope first, formulas/conditions before workflows, foundation rules before derived.

1. `pokemon-lifecycle-R003` — Implemented — core/enumeration — Base stats definition (foundation)
2. `pokemon-lifecycle-R004` — Implemented — core/enumeration — Pokemon types (foundation)
3. `pokemon-lifecycle-R005` — Implemented — core/enumeration — Nature system (foundation)
4. `pokemon-lifecycle-R009` — Implemented — core/formula — Stat points allocation total (foundation)
5. `pokemon-lifecycle-R011` — Implemented — core/formula — Pokemon HP formula (foundation)
6. `pokemon-lifecycle-R022` — Implemented — core/formula — Tutor points initial (foundation)
7. `pokemon-lifecycle-R060` — Implemented — core/formula — Experience chart (foundation)
8. `pokemon-lifecycle-R002` — Implemented — core/constraint — Maximum level 100 (foundation)
9. `pokemon-lifecycle-R001` — Implemented — core/constraint — Party limit 6 (foundation)
10. `pokemon-lifecycle-R017` — Implemented — core/constraint — Move slot limit 6 (foundation)
11. `pokemon-lifecycle-R061` — Implemented — core/enumeration — Size classes (foundation)
12. `pokemon-lifecycle-R062` — Implemented — core/enumeration — Weight classes (foundation)
13. `pokemon-lifecycle-R007` — Implemented — core/condition — Neutral natures (derived from R005)
14. `pokemon-lifecycle-R013` — Implemented — core/workflow — Initial ability assignment (derived from R003)
15. `pokemon-lifecycle-R018` — Implemented — core/enumeration — Natural move sources (derived from R017)
16. `pokemon-lifecycle-R012` — Implemented — cross-domain-ref/formula — Evasion calculation (derived from R009)
17. `pokemon-lifecycle-R024` — Implemented — core/constraint — Tutor points permanent spend (derived from R022)
18. `pokemon-lifecycle-R016` — Implemented — situational/constraint — No ability maximum (derived from R013)
19. `pokemon-lifecycle-R048` — Implemented — core/enumeration — Loyalty ranks (foundation)
20. `pokemon-lifecycle-R049` — Implemented — core/formula — Loyalty command checks (derived from R048)
21. `pokemon-lifecycle-R050` — Implemented — core/condition — Loyalty starting values (derived from R048)
22. `pokemon-lifecycle-R063` — Implemented — core/enumeration — Species capabilities (derived from R003)
23. `pokemon-lifecycle-R065` — Implemented — core/enumeration — Pokemon skills (derived from R003)
24. `pokemon-lifecycle-R035` — Implemented — core/modifier — Vitamin base stat increase (derived from R003)
25. `pokemon-lifecycle-R036` — Implemented — core/constraint — Vitamin max per Pokemon (derived from R035)
26. `pokemon-lifecycle-R030` — Implemented — core/condition — Optional evolution refusal (derived from R029)
27. `pokemon-lifecycle-R038` — Implemented — core/workflow — Pokemon creation workflow (composite)
28. `pokemon-lifecycle-R053` — Implemented — situational/enumeration — Disposition system
29. `pokemon-lifecycle-R008` — Implemented — situational/enumeration — Nature flavor preferences (derived from R005)
30. `pokemon-lifecycle-R006` — Partial (present: nature stored) — core/formula — Nature stat adjustments
31. `pokemon-lifecycle-R010` — Partial (present: weighted distribution) — core/constraint — Base Relations Rule
32. `pokemon-lifecycle-R026` — Partial (present: all fields editable) — core/workflow — Level up workflow
33. `pokemon-lifecycle-R027` — Partial (present: stats editable) — core/formula — Level up stat point
34. `pokemon-lifecycle-R028` — Partial (present: learnset exists) — core/workflow — Level up move check
35. `pokemon-lifecycle-R029` — Partial (present: species editable) — core/workflow — Evolution check
36. `pokemon-lifecycle-R031` — Partial (present: stats editable) — core/workflow — Evolution stat recalculation
37. `pokemon-lifecycle-R058` — Partial (present: experience stored) — core/formula — Experience calculation
38. `pokemon-lifecycle-R014` — Partial (present: abilities editable) — core/workflow — Abilities level 20
39. `pokemon-lifecycle-R015` — Partial (present: abilities editable) — core/workflow — Abilities level 40
40. `pokemon-lifecycle-R023` — Partial (present: TP editable) — core/formula — Tutor points level progression
41. `pokemon-lifecycle-R032` — Partial (present: abilities editable) — core/workflow — Evolution ability remapping
42. `pokemon-lifecycle-R033` — Partial (present: moves editable) — core/workflow — Evolution immediate moves
43. `pokemon-lifecycle-R034` — Partial (present: skills/caps editable) — core/workflow — Evolution skills/capabilities
44. `pokemon-lifecycle-R037` — Partial (present: TP editable) — situational/modifier — Heart booster