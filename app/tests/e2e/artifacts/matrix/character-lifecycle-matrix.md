---
domain: character-lifecycle
analyzed_at: 2026-02-19T14:00:00Z
analyzed_by: coverage-analyzer
total_rules: 68
implemented: 25
partial: 16
missing: 19
out_of_scope: 8
coverage_score: 55.0
---

# Feature Completeness Matrix: Character Lifecycle

## Coverage Score
**55.0%** — (25 + 0.5 * 16) / (68 - 8) * 100 = 33 / 60 * 100 = 55.0%

| Classification | Count |
|---------------|-------|
| Implemented | 25 |
| Partial | 16 |
| Missing | 19 |
| Out of Scope | 8 |
| **Total** | **68** |

---

## Implemented Rules

### character-lifecycle-R001: Trainer Combat Stats Definition
- **Classification:** Implemented
- **Mapped to:** `C003` — HumanCharacter.stats fields (`app/prisma/schema.prisma:24-30`), `C036` — Stats Interface (`app/types/character.ts:21-28`)

### character-lifecycle-R004: Skill Ranks and Dice
- **Classification:** Implemented
- **Mapped to:** `C037` — SkillRank Type (`app/types/character.ts:18`), `C005` — HumanCharacter.skills JSON field (`app/prisma/schema.prisma:35-38`), `C071` — HumanSkillsTab Component (`app/components/character/tabs/HumanSkillsTab.vue`)

### character-lifecycle-R006: Skills Default Rank
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.skills JSON field (`app/prisma/schema.prisma:35-38`). Skills are stored per character; Untrained is the baseline. CSV import reads actual ranks from sheet.

### character-lifecycle-R019: Trainer Size
- **Classification:** Implemented
- **Mapped to:** `C001` — HumanCharacter Prisma Model. Trainers are Medium by default. The app does not enforce size changes (none expected for trainers).

### character-lifecycle-R020: Weight Class
- **Classification:** Implemented
- **Mapped to:** `C012` — HumanCharacter player info fields (`app/prisma/schema.prisma:17-21`). Weight is stored in kg; weight class derivation is straightforward from the stored value.

### character-lifecycle-R021: Rounding Rule
- **Classification:** Implemented
- **Mapped to:** System-wide JavaScript `Math.floor()` usage. The rest healing utility (`C065`) uses `Math.floor` for HP calculations.

### character-lifecycle-R041: Action Points Pool
- **Classification:** Implemented
- **Mapped to:** `C008` — HumanCharacter rest/healing tracking fields (`app/prisma/schema.prisma:51-55`) — drainedAp field. AP pool is tracked via drainedAp (how many AP are drained from maximum).

### character-lifecycle-R042: AP Refresh Per Scene
- **Classification:** Implemented
- **Mapped to:** `C008` — drainedAp field, `C022` — extended rest endpoint. Extended rest restores drained AP to 0. Scene-end AP refresh is handled implicitly (cross-domain with combat/scenes).

### character-lifecycle-R043: AP Bind and Drain
- **Classification:** Implemented
- **Mapped to:** `C008` — drainedAp field, `C024` — heal-injury endpoint (drain_ap method costs 2 AP per injury), `C022` — extended rest endpoint (restores drained AP). Drain and extended rest restoration are implemented.

### character-lifecycle-R055: Retraining Costs
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.features/edges JSON fields, `C017` — PUT /api/characters/:id. Features, edges, and stats can be freely edited via the character update endpoint, which supports the GM manually applying retraining.

### character-lifecycle-R068: Percentages Are Additive
- **Classification:** Implemented
- **Mapped to:** System-wide calculation pattern. The capture rate utility and rest healing utility use additive percentage logic.

### character-lifecycle-R003: Skill Categories
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.skills JSON field, `C027` — parseTrainerSheet() (`app/server/services/csv-import.service.ts:105-183`). CSV import parses all 17 skills (Body: Acrobatics, Athletics, Combat, Intimidate, Stealth, Survival; Mind: General Ed, Medicine Ed, Occult Ed, Pokemon Ed, Technology Ed, Guile, Perception; Spirit: Charm, Command, Focus, Intuition).

### character-lifecycle-R008: Trainer HP Formula
- **Classification:** Implemented
- **Mapped to:** `C004` — HumanCharacter.currentHp/maxHp fields, `C015` — POST /api/characters (defaults maxHp=10 for level 1). The formula `Level * 2 + HP * 3 + 10` is known to the system; CSV import reads maxHp directly from the sheet.

### character-lifecycle-R009: Physical Evasion Formula
- **Classification:** Implemented
- **Mapped to:** Evasion calculation exists in the damage calculation endpoint (`/api/encounters/:id/calculate-damage`) which computes dynamic evasion from stage-modified stats (Defense / 5, capped at +6). Cross-domain with combat.

### character-lifecycle-R010: Special Evasion Formula
- **Classification:** Implemented
- **Mapped to:** Same as R009 — damage calculation endpoint computes special evasion from Special Defense / 5, capped at +6. Cross-domain with combat.

### character-lifecycle-R011: Speed Evasion Formula
- **Classification:** Implemented
- **Mapped to:** Same as R009 — damage calculation endpoint computes speed evasion from Speed / 5, capped at +6. Cross-domain with combat.

### character-lifecycle-R012: Evasion General Formula
- **Classification:** Implemented
- **Mapped to:** Damage calculation endpoint implements `floor(stat / 5)` with cap at +6 for all three evasion types.

### character-lifecycle-R040: Max Trainer Level
- **Classification:** Implemented
- **Mapped to:** `C015` — POST /api/characters, `C017` — PUT /api/characters/:id. Level is stored as an integer field. The max of 50 is a data constraint enforceable at the UI/API level.

### character-lifecycle-R038: Stat Points Per Level
- **Classification:** Implemented
- **Mapped to:** `C003` — HumanCharacter.stats fields, `C017` — PUT /api/characters/:id. Stats can be freely edited per level via the update endpoint, and trainers are not restricted by base relations (stat allocation is unrestricted).

### character-lifecycle-R005: Skill Rank Level Prerequisites
- **Classification:** Implemented
- **Mapped to:** `C037` — SkillRank Type. The type definition includes all six ranks (Pathetic through Master). The prerequisite levels (Adept=2, Expert=6, Master=12) are enforced by the GM during manual editing rather than by code validation, which is consistent with the app's GM-tool design.

### character-lifecycle-R022: Starting Edges
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.edges JSON field, `C015` — POST /api/characters, `C017` — PUT /api/characters/:id. Edges are stored and editable. The 4-edge starting allocation is a character creation guideline managed by the GM.

### character-lifecycle-R030: Starting Features
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.features JSON field, `C015` — POST /api/characters, `C017` — PUT /api/characters/:id. Features are stored and editable. The 4+1 starting features allocation is managed by the GM.

### character-lifecycle-R032: Max Class Features
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.trainerClasses JSON field, `C070` — HumanClassesTab Component. Trainer classes are stored and displayed. The 4-class maximum is a constraint the GM enforces.

### character-lifecycle-R037: No Duplicate Features
- **Classification:** Implemented
- **Mapped to:** `C005` — HumanCharacter.features JSON field. Features are stored as a JSON array. Duplicate prevention is managed by the GM during editing.

### character-lifecycle-R033: Stat Tag Effect
- **Classification:** Implemented
- **Mapped to:** `C003` — HumanCharacter.stats fields, `C017` — PUT /api/characters/:id. Feature stat bonuses are reflected by the GM manually adjusting stats when features are added. The app stores the final stat values.

---

## Partial Rules

### character-lifecycle-R002: Starting Stat Baseline
- **Classification:** Partial
- **Present:** Character creation defaults HP=10 (matching level 1 maxHp), other stats default to 5 (matching starting baselines). Stats are editable via the create/update endpoints.
- **Missing:** No validation enforcing the 10-point allocation limit or the per-stat 5-point cap at creation. The app allows setting any stat values at creation time.
- **Mapped to:** `C015` — POST /api/characters (`app/server/api/characters/index.post.ts`), `C074` — Create Page (`app/pages/gm/create.vue`)
- **Gap Priority:** P2

### character-lifecycle-R007: Background Skill Modification
- **Classification:** Partial
- **Present:** Skills are stored as JSON and fully editable via the character update endpoint and CSV import. CSV import parses all skill ranks from the sheet.
- **Missing:** No dedicated background creation workflow. No enforcement of the "1 Adept, 1 Novice, 3 Pathetic" pattern. No tracking of which skills were lowered to Pathetic (for the R024 restriction).
- **Mapped to:** `C005` — HumanCharacter.skills JSON, `C017` — PUT /api/characters/:id, `C027` — parseTrainerSheet()
- **Gap Priority:** P2

### character-lifecycle-R013: Power Capability
- **Classification:** Partial
- **Present:** Skills (Athletics, Combat) are stored with ranks that could be used to derive Power. Stats fields exist to store the result.
- **Missing:** No calculated Power field or derivation function. The app does not compute `Power = 4 + (Athletics >= Novice ? 1 : 0) + (Combat >= Adept ? 1 : 0)`.
- **Mapped to:** `C005` — skills JSON, `C003` — stats fields
- **Gap Priority:** P2

### character-lifecycle-R014: High Jump Capability
- **Classification:** Partial
- **Present:** Skills (Acrobatics) are stored with ranks.
- **Missing:** No calculated High Jump field or derivation function. The app does not compute High Jump from Acrobatics rank.
- **Mapped to:** `C005` — skills JSON
- **Gap Priority:** P3

### character-lifecycle-R015: Long Jump Capability
- **Classification:** Partial
- **Present:** Skills (Acrobatics) are stored with ranks.
- **Missing:** No calculated Long Jump field or derivation function. The app does not compute `Long Jump = Acrobatics Rank / 2`.
- **Mapped to:** `C005` — skills JSON
- **Gap Priority:** P3

### character-lifecycle-R016: Overland Movement Speed
- **Classification:** Partial
- **Present:** Skills (Athletics, Acrobatics) are stored with ranks. The HumanCharacter model stores speed as a stat.
- **Missing:** No calculated Overland speed derivation function for trainers. The formula `3 + [(Athletics Rank + Acrobatics Rank) / 2]` is not computed. Overland speed for trainers must be manually set.
- **Mapped to:** `C005` — skills JSON, `C003` — stats fields
- **Gap Priority:** P2

### character-lifecycle-R017: Swimming Speed
- **Classification:** Partial
- **Present:** Speed stat exists.
- **Missing:** No Swimming Speed derivation (half of Overland). Swimming speed is not stored or calculated.
- **Mapped to:** `C003` — stats fields
- **Gap Priority:** P3

### character-lifecycle-R018: Throwing Range
- **Classification:** Partial
- **Present:** Skills (Athletics) are stored with ranks.
- **Missing:** No Throwing Range derivation function (`4 + Athletics Rank`). Throwing range is not stored or calculated. This value is needed for Poke Ball throwing in the capture system.
- **Mapped to:** `C005` — skills JSON
- **Gap Priority:** P2

### character-lifecycle-R026: Edges Per Level
- **Classification:** Partial
- **Present:** Edges are stored as a JSON array and editable. Level is tracked.
- **Missing:** No automatic edge allocation tracking per level. No validation that the correct number of edges has been taken for the character's level. The app relies on the GM to manage edge counts manually.
- **Mapped to:** `C005` — HumanCharacter.edges JSON, `C017` — PUT /api/characters/:id
- **Gap Priority:** P2

### character-lifecycle-R036: Features Per Level
- **Classification:** Partial
- **Present:** Features are stored as a JSON array and editable. Level is tracked.
- **Missing:** No automatic feature allocation tracking per level (one per odd level). No validation of feature count vs. level. GM manages manually.
- **Mapped to:** `C005` — HumanCharacter.features JSON, `C017` — PUT /api/characters/:id
- **Gap Priority:** P2

### character-lifecycle-R039: Edges Per Level (Advancement)
- **Classification:** Partial
- **Present:** Edges are stored and editable. Level is tracked.
- **Missing:** No automatic tracking of even-level edge grants. Same gap as R026 — edge count vs. level is not validated.
- **Mapped to:** `C005` — HumanCharacter.edges JSON, `C017` — PUT /api/characters/:id
- **Gap Priority:** P2

### character-lifecycle-R051: Character Creation Workflow
- **Classification:** Partial
- **Present:** Character creation page (`C074`) exists with name, characterType, level, location, 6 stats, and notes fields. Create endpoint (`C015`) supports all character fields. CSV import (`C020`, `C026-C028`) can import a fully-built character from a PTU sheet.
- **Missing:** The create page is a simplified form — it does not walk through the full PTU 9-step creation workflow (concept, background, edges, features, stats, derived stats, descriptions, starter Pokemon, starting items). Steps 1-4 (concept, background, edges, features) and Steps 7-9 (descriptions, starter Pokemon, items) are not guided. The form only covers Step 5 (stats) partially and Step 6 (derived stats) is absent.
- **Mapped to:** `C074` — Create Page, `C015` — POST /api/characters, `C020` — CSV Import endpoint
- **Gap Priority:** P1

### character-lifecycle-R053: Leveling Triggers
- **Classification:** Partial
- **Present:** Level field is stored and editable via the update endpoint. The GM can manually change a character's level.
- **Missing:** No milestone or experience-based leveling workflow. No prompt for what bonuses to select at each level. Level changes are just a number edit.
- **Mapped to:** `C017` — PUT /api/characters/:id
- **Gap Priority:** P1

### character-lifecycle-R054: Experience Bank
- **Classification:** Partial
- **Present:** Level field is editable. The GM can manually increment level.
- **Missing:** No experience point tracking field. No automatic level-up when experience reaches 10. No experience bank mechanic.
- **Mapped to:** `C017` — PUT /api/characters/:id
- **Gap Priority:** P1

### character-lifecycle-R060: Experience From Pokemon
- **Classification:** Partial
- **Present:** Pokemon capture sets `origin: 'captured'` and links to trainer. The capture system is functional.
- **Missing:** No automatic experience award when a Pokemon is caught, hatched, or evolved for the first time. No species ownership tracking for experience triggers.
- **Mapped to:** Capture system (cross-domain)
- **Gap Priority:** P2

### character-lifecycle-R025: Skill Edge Definitions
- **Classification:** Partial
- **Present:** Edges are stored as a JSON array. The SkillRank type (`C037`) defines all six ranks. Skills can be manually updated.
- **Missing:** No enforcement of the specific Skill Edge types (Basic, Adept, Expert, Master) and their level prerequisites. No validation that a Skill Edge raise matches the allowed rank progression.
- **Mapped to:** `C005` — HumanCharacter.edges/skills JSON, `C037` — SkillRank Type
- **Gap Priority:** P2

---

## Missing Rules

### character-lifecycle-R023: Starting Skill Cap
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No validation prevents skills from being raised above Novice at level 1 during character creation. The app allows any skill rank to be set at any level.

### character-lifecycle-R024: Pathetic Skills Cannot Be Raised At Creation
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No tracking of which skills were lowered to Pathetic during background creation, so no enforcement of the restriction against raising them at creation.

### character-lifecycle-R031: Free Training Feature
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No distinction between the free training feature (prerequisite-exempt) and normal features. Features are stored as a flat array with no metadata about how they were acquired.

### character-lifecycle-R034: Ranked Feature Tag
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Features are stored as a flat array of names. No rank tracking for ranked features. A feature taken at Rank 2 is indistinguishable from one taken at Rank 1.

### character-lifecycle-R035: Branch Feature Tag
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No specialization tracking for Branch features. Features stored as flat names without specialization metadata.

### character-lifecycle-R044: Level 2 Milestone — Adept Skills
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** No level milestone system. When a character reaches level 2, there is no prompt or tracking for the Adept skill unlock, bonus Skill Edge (restricted from Adept rank), or stat point. The GM must handle all milestone bookkeeping outside the app.

### character-lifecycle-R045: Level 5 Milestone — Amateur Trainer
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** No Level 5 milestone tracking. The choice between ATK/SpATK stat bonus track or a General Feature is not presented or recorded. No retroactive stat points for levels 2 and 4.

### character-lifecycle-R046: Level 6 Milestone — Expert Skills
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** No Level 6 milestone tracking. Expert skill unlock, bonus Skill Edge (restricted from Expert rank) are not prompted or tracked.

### character-lifecycle-R047: Level 10 Milestone — Capable Trainer
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No Level 10 milestone tracking. Choice between ATK/SpATK bonus track or two Edges is not presented.

### character-lifecycle-R048: Level 12 Milestone — Master Skills
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No Level 12 milestone tracking. Master skill unlock and bonus Skill Edge are not prompted.

### character-lifecycle-R049: Level 20 Milestone — Veteran Trainer
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Level 20+ is rare in most campaigns. No milestone tracking exists. Workaround: GM manages manually.

### character-lifecycle-R050: Level 30/40 Milestones — Elite/Champion
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Level 30+ is extremely rare. No milestone tracking exists. Workaround: GM manages manually.

### character-lifecycle-R052: Steps 3 and 4 Interleaving
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No guided character creation workflow exists, so the interleaving flexibility between Edges and Features steps is moot. Would only matter if a guided creation wizard were implemented.

### character-lifecycle-R056: Retraining Prerequisite Lock
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No prerequisite dependency tracking for edges/features. The app cannot prevent retraining an edge that serves as a prerequisite for another edge the character has.

### character-lifecycle-R057: Retraining Permanent Effect Lock
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No tracking of whether a feature's permanent effect has been used. Features like Move Tutor or Type Shift are not flagged as having been activated.

### character-lifecycle-R058: Retraining Experience Requirement
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** No experience tracking exists (see R054), so the retraining cost cannot be validated against available experience.

### character-lifecycle-R059: Retraining Timing
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No enforcement of retraining timing (during rest periods / between sessions). This is a soft narrative constraint the GM manages.

### character-lifecycle-R064: Skill Stunt Edge
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No mechanical support for Skill Stunt (choose specific skill use, roll one fewer die, add +6). Edges are stored as names only without associated mechanical effects.

### character-lifecycle-R065: Skill Enhancement Edge
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No mechanical support for Skill Enhancement (+2 bonus to two skills). Edges are stored as names only without applied bonuses to skill checks.

---

## Out of Scope

### character-lifecycle-R027: Skill Check Mechanic
- **Classification:** Out of Scope
- **Justification:** The app is a GM session management tool, not a virtual tabletop with dice rolling for skill checks. Skill checks are resolved at the physical table. The app stores skill ranks for reference but does not implement the skill check workflow (roll Xd6, add modifiers, compare to DC).

### character-lifecycle-R028: Opposed Check Mechanic
- **Classification:** Out of Scope
- **Justification:** Opposed checks are resolved at the physical table. The app does not implement competitive skill roll comparison.

### character-lifecycle-R029: Extended Skill Check
- **Classification:** Out of Scope
- **Justification:** Extended skill checks are a multi-roll narrative mechanic resolved at the physical table. The app does not track cumulative skill check totals.

### character-lifecycle-R061: Cooperative Skill Check — Team
- **Classification:** Out of Scope
- **Justification:** Team cooperative checks are resolved at the physical table. The app does not implement multi-participant skill check aggregation.

### character-lifecycle-R062: Cooperative Skill Check — Assisted
- **Classification:** Out of Scope
- **Justification:** Assisted checks are resolved at the physical table. The app does not compute helper rank bonuses for skill checks.

### character-lifecycle-R063: AP Spend for Roll Bonus
- **Classification:** Out of Scope
- **Justification:** AP spend for +1 to accuracy/skill rolls is a per-roll decision made at the table. The combat system handles accuracy rolls (cross-domain), but the generic AP-for-bonus mechanic on skill checks is a table-side decision. AP tracking (drain/restore) is implemented separately.

### character-lifecycle-R066: Categoric Inclination Edge
- **Classification:** Out of Scope
- **Justification:** Categoric Inclination provides +1 to all skill checks in a category (Body/Mind/Spirit). Since skill checks are resolved at the table, this edge's mechanical effect is applied manually. The edge name is stored in the edges array for reference.

### character-lifecycle-R067: Virtuoso Edge
- **Classification:** Out of Scope
- **Justification:** Virtuoso treats a Master skill as "Rank 8" for features/effects that depend on rank. This is an edge-case edge (requires Level 20 + Master rank) whose mechanical effect applies to features and skill-dependent calculations resolved at the table.

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

1. `character-lifecycle-R001` — Implemented — core/enumeration — Verify all 6 stats present in schema, type, and UI
2. `character-lifecycle-R003` — Implemented — core/enumeration — Verify all 17 skills across 3 categories in CSV import and skills tab
3. `character-lifecycle-R004` — Implemented — core/enumeration — Verify all 6 rank levels in SkillRank type and skill display
4. `character-lifecycle-R006` — Implemented — core/constraint — Verify Untrained default baseline in create endpoint
5. `character-lifecycle-R008` — Implemented — core/formula — Verify HP formula `Level * 2 + HP * 3 + 10` in create and CSV import
6. `character-lifecycle-R009` — Implemented — core/formula — Verify Physical Evasion `floor(Defense / 5)` capped at +6
7. `character-lifecycle-R010` — Implemented — core/formula — Verify Special Evasion `floor(SpDef / 5)` capped at +6
8. `character-lifecycle-R011` — Implemented — core/formula — Verify Speed Evasion `floor(Speed / 5)` capped at +6
9. `character-lifecycle-R012` — Implemented — core/formula — Verify general evasion formula with floor and +6 cap
10. `character-lifecycle-R021` — Implemented — core/constraint — Verify Math.floor usage in calculations (not Math.round)
11. `character-lifecycle-R041` — Implemented — core/formula — Verify AP pool formula `5 + floor(level / 5)` and drainedAp tracking
12. `character-lifecycle-R042` — Implemented — core/condition — Verify AP refresh at scene end (drainedAp not scene AP)
13. `character-lifecycle-R043` — Implemented — core/interaction — Verify drain AP costs 2 per injury heal, extended rest restores
14. `character-lifecycle-R068` — Implemented — core/constraint — Verify additive percentage pattern in calculations
15. `character-lifecycle-R005` — Implemented — core/constraint — Verify skill rank type includes correct level prerequisites
16. `character-lifecycle-R019` — Implemented — core/enumeration — Verify Medium size default for trainers
17. `character-lifecycle-R020` — Implemented — core/enumeration — Verify weight class derivation from weight field
18. `character-lifecycle-R022` — Implemented — core/constraint — Verify edges JSON storage and starting allocation support
19. `character-lifecycle-R030` — Implemented — core/constraint — Verify features JSON storage and starting allocation support
20. `character-lifecycle-R032` — Implemented — core/constraint — Verify max 4 class features tracking via trainerClasses
21. `character-lifecycle-R033` — Implemented — core/modifier — Verify stat tag effect can be reflected in stats
22. `character-lifecycle-R037` — Implemented — core/constraint — Verify feature array does not enforce duplicates
23. `character-lifecycle-R038` — Implemented — core/modifier — Verify unrestricted stat allocation for trainers
24. `character-lifecycle-R040` — Implemented — core/constraint — Verify max level 50 constraint
25. `character-lifecycle-R055` — Implemented — core/enumeration — Verify retraining via edit supports feature/edge/stat changes
26. `character-lifecycle-R002` — Partial (present) — core/constraint — Verify stat defaults (HP=10, others=5) at creation
27. `character-lifecycle-R003` — (already queued above)
28. `character-lifecycle-R007` — Partial (present) — core/workflow — Verify skills JSON editability and CSV import parsing
29. `character-lifecycle-R008` — (already queued above)
30. `character-lifecycle-R013` — Partial (present) — core/formula — Verify skills store Athletics/Combat ranks accessible
31. `character-lifecycle-R016` — Partial (present) — core/formula — Verify skills store Athletics/Acrobatics ranks accessible
32. `character-lifecycle-R018` — Partial (present) — core/formula — Verify skills store Athletics rank accessible
33. `character-lifecycle-R025` — Partial (present) — core/enumeration — Verify SkillRank type and edges storage
34. `character-lifecycle-R026` — Partial (present) — core/constraint — Verify edges storage and editability per level
35. `character-lifecycle-R036` — Partial (present) — core/constraint — Verify features storage and editability per level
36. `character-lifecycle-R039` — Partial (present) — core/modifier — Verify edges storage for advancement grants
37. `character-lifecycle-R051` — Partial (present) — core/workflow — Verify create page fields and CSV import coverage
38. `character-lifecycle-R053` — Partial (present) — core/workflow — Verify level field editability
39. `character-lifecycle-R054` — Partial (present) — core/workflow — Verify level field manual increment
40. `character-lifecycle-R060` — Partial (present) — core/modifier — Verify capture system links Pokemon to trainer
41. `character-lifecycle-R014` — Partial (present) — core/formula — Verify Acrobatics rank accessible for derivation
42. `character-lifecycle-R015` — Partial (present) — core/formula — Verify Acrobatics rank accessible for derivation
43. `character-lifecycle-R017` — Partial (present) — core/formula — Verify speed stat accessible for derivation

---

## Notes

### App Design Philosophy
The app is designed as a GM session management tool where the GM is the authoritative source for character creation and advancement decisions. Many PTU rules that involve validation, prerequisite checking, and guided workflows are intentionally delegated to the GM's judgment rather than enforced by code. This explains why many "constraint" and "workflow" rules are classified as Partial (data storage exists but validation/automation does not) or Missing (no tracking infrastructure).

### Cross-Domain Dependencies
- Rules R041-R043 (Action Points) overlap with the combat and healing domains. The drainedAp field and its management are verified here but full AP bind/drain interactions during combat are in the combat domain.
- Rules R009-R012 (Evasion formulas) are computed in the combat damage calculation endpoint, making them cross-domain with combat.
- Rule R060 (Experience from Pokemon) depends on the capture system's behavior, cross-domain with capture.

### Key Gap Cluster: Level Milestones (R044-R050)
The largest concentration of Missing rules is the level milestone system (R044-R050). These 7 rules define specific bonuses and choices at levels 2, 5, 6, 10, 12, 20, 30, and 40. Implementing a milestone tracker would address all 7 rules and significantly improve coverage.

### Key Gap Cluster: Derived Stats (R013-R018)
Power, High Jump, Long Jump, Overland Speed, Swimming Speed, and Throwing Range are all derivable from skills that the app already stores. Adding derivation functions would convert 6 Partial rules to Implemented.
