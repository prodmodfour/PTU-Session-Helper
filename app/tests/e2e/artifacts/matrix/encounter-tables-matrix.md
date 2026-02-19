---
domain: encounter-tables
analyzed_at: 2026-02-19T00:00:00Z
analyzed_by: coverage-analyzer
total_rules: 27
implemented: 8
partial: 6
missing: 5
out_of_scope: 8
coverage_score: 57.9
---

# Feature Completeness Matrix: Encounter Tables

## Coverage Score
**57.9%** — (8 + 0.5 * 6) / (27 - 8) * 100 = 11 / 19 * 100 = 57.9%

| Classification | Count |
|---------------|-------|
| Implemented | 8 |
| Partial | 6 |
| Missing | 5 |
| Out of Scope | 8 |
| **Total** | **27** |

---

## Implemented Rules

### encounter-tables-R001: Habitat Types Enumeration
- **Classification:** Implemented
- **Mapped to:** `DM-001` — EncounterTable Model (`app/prisma/schema.prisma`); `DM-005` — Type System Constants (`app/types/habitat.ts`); `CP-002` / `CP-006` — Table card components display habitat data
- **Notes:** The app does not hardcode the 14 PTU canonical habitat names as an enumeration, but instead provides free-form named encounter tables that GMs populate per habitat. This is a reasonable operationalization: the GM creates a table named "Forest" and populates it. The habitat concept is fully supported even though it uses table names rather than a fixed enum.

### encounter-tables-R002: Species-to-Habitat Assignment
- **Classification:** Implemented
- **Mapped to:** `DM-002` — EncounterTableEntry Model (`app/prisma/schema.prisma`); `API-006` — Add Entry; `CP-004` / `CP-007` — Species selection UI with search; `CP-009` — SpeciesAutocomplete
- **Notes:** The app maps species to tables (habitats) via EncounterTableEntry with a FK to SpeciesData. The GM manually assigns species to habitat tables, which is exactly how PTU intends habitat lists to work (as a reference, not an automatic system). A single species can be added to multiple tables.

### encounter-tables-R007: Energy Pyramid / Rarity Distribution
- **Classification:** Implemented
- **Mapped to:** `DM-005` — RARITY_WEIGHTS constant (`app/types/habitat.ts`); `DM-002` — weight field on EncounterTableEntry; `CP-001` — EntryRow weight editing; `CP-004` — Rarity preset dropdown; `ST-004` — Resolved Entries Getter; `API-016` — weighted random selection
- **Notes:** The weight system directly implements the energy pyramid concept. Common species get weight 10, rare/legendary get weight 0.1-1. The weighted random selection in the generate endpoint ensures producers are encountered more often than predators, matching PTU's ecological rarity guidance.

### encounter-tables-R010: Habitat Deviation Allowance
- **Classification:** Implemented
- **Mapped to:** `DM-002` — EncounterTableEntry (no species-habitat constraint); `API-006` — Add Entry (any species to any table); `DM-004` — ModificationEntry uses speciesName string (not FK)
- **Notes:** The app imposes no constraint preventing a GM from adding any species to any table, fully supporting habitat deviation. ModificationEntry uses a string name rather than FK specifically to allow referencing species outside the parent table's normal roster.

### encounter-tables-R012: Species Diversity per Encounter
- **Classification:** Implemented
- **Mapped to:** `API-016` — Generate endpoint with count/density-based spawn; `CP-008` — GenerateEncounterModal with selectable results; `DM-005` — DENSITY_RANGES constants
- **Notes:** The generation system spawns multiple Pokemon from a weighted pool of different species, naturally producing 2-3 species diversity. The GM controls spawn count (1-10 manual or density-based) and can select/deselect individual results before committing. The GM can curate the pool to ensure diversity by adjusting species weights.

### encounter-tables-R016: Encounter Creation Workflow
- **Classification:** Implemented
- **Mapped to:** `INT-001` — Encounter Table to Combat Encounter Pipeline; `CO-008` — useEncounterCreation composable; `CP-008` — GenerateEncounterModal (full workflow UI); `API-016` — Generate endpoint; `ST-010` — Generation action
- **Notes:** The app operationalizes the PTU encounter creation workflow into a structured pipeline: select habitat table (context/species) -> optionally select sub-habitat modification -> generate Pokemon (species + levels) -> review/curate results -> output to encounter, scene, or TV. This maps to PTU's workflow steps: determine context, select species from habitat, distribute levels across enemies.

### encounter-tables-R019: Quick-Stat Workflow
- **Classification:** Implemented
- **Mapped to:** `API-016` — Generate endpoint (level-based stat generation); Cross-domain XRef-1 to pokemon-lifecycle for stat generation via `server/services/pokemon-generator.service.ts`
- **Notes:** The app auto-generates Pokemon stats via the pokemon-generator service when adding wild Pokemon to encounters. This is a full automation of the "quick-stat" workflow — the GM picks species and levels, and the app handles stat distribution, move selection, and ability assignment per pokemon-lifecycle rules.

### encounter-tables-R025: Environmental Encounter Modifiers
- **Classification:** Implemented
- **Mapped to:** VTT terrain system (terrain store, `useTerrainPersistence` composable, terrain painter components); Encounter grid config; Fog of war system
- **Notes:** The app's VTT grid supports terrain types with movement costs, fog of war (3-state: hidden/revealed/explored), and grid-level configuration. While these don't map 1:1 to every PTU environmental modifier example (dark caves, icy terrain), the terrain and fog systems provide a foundation for representing environmental effects in encounters.

---

## Partial Rules

### encounter-tables-R003: Fun Game Progression Principle
- **Classification:** Partial
- **Present:** The app provides level ranges per table (DM-001 `levelMin`/`levelMax`), per entry (DM-002 `levelMin`/`levelMax`), and per sub-habitat modification (DM-003 `levelMin`/`levelMax`). The GM can create separate tables for "early route" vs "late route" areas with appropriate level ranges. Sub-habitat modifications can override level ranges for specific areas.
- **Missing:** No tools to visualize progression across multiple tables (e.g., "show me how difficulty ramps from Route 1 to Route 8"). No recommended level ranges based on player party level. No encounter budget calculator to help GMs balance progression.
- **Mapped to:** `DM-001` — EncounterTable levelMin/levelMax; `DM-002` — EncounterTableEntry levelMin/levelMax; `DM-003` — TableModification levelMin/levelMax; `API-002` / `API-004` — table CRUD with level ranges
- **Gap Priority:** P2

### encounter-tables-R006: Encounter Level Budget Formula
- **Classification:** Partial
- **Present:** The app's generation system (API-016) produces Pokemon at levels within a table's level range. The GM can set level ranges on tables and entries to control the level distribution of generated encounters.
- **Missing:** No explicit XP-budget calculator. The PTU formula is `avg_pokemon_level x 2 x num_trainers = total level budget`, but the app has no way to input party level, calculate a budget, then auto-distribute levels across generated enemies to match. The GM must manually reason about whether their table's level ranges produce an appropriately budgeted encounter.
- **Mapped to:** `DM-001` — table-level levelRange; `API-016` — random level within range; `CP-008` — level range override in generate modal
- **Gap Priority:** P2

### encounter-tables-R008: Significance Multiplier
- **Classification:** Partial
- **Present:** The app supports the concept of encounter significance through its encounter-to-combat pipeline, where encounters have properties and the GM controls all aspects of creation.
- **Missing:** No significance multiplier field or XP reward calculator. The app does not track or compute XP at all. The significance scale (x1 to x5) has no corresponding data field. Since the app focuses on encounter generation and combat execution rather than campaign progression/XP tracking, there is no place to apply the multiplier.
- **Mapped to:** No direct capability — the concept is addressed through GM discretion in table design
- **Gap Priority:** P3

### encounter-tables-R009: Difficulty Adjustment Modifier
- **Classification:** Partial
- **Present:** The GM can adjust difficulty by changing table/entry level ranges, spawn counts, and species composition. The density multiplier on sub-habitats (DM-003 `densityMultiplier`) adjusts how many enemies spawn, which is one dimension of difficulty.
- **Missing:** No formal difficulty rating or adjustment system. No way to tag an encounter's intended difficulty or have the system suggest adjustments. The +/- x0.5 to x1.5 difficulty modifier from PTU has no corresponding field — it's folded into the significance multiplier which is also absent.
- **Mapped to:** `DM-003` — densityMultiplier on modifications; `API-016` — density-based spawn counts; `CP-008` — spawn count controls
- **Gap Priority:** P3

### encounter-tables-R017: Level Distribution Across Enemies
- **Classification:** Partial
- **Present:** Each entry in a table can have its own level range override (DM-002 `levelMin`/`levelMax`), allowing the GM to set up "leader is L40, minions are L20" distributions. The generate endpoint (API-016) picks a random level from each selected entry's range.
- **Missing:** No level budget system to distribute a total across enemies (e.g., "I have 120 levels, split them"). Each Pokemon's level is drawn independently from its entry's range rather than from a shared budget. No UI to visualize or adjust the aggregate level total of a generated group.
- **Mapped to:** `DM-002` — per-entry levelMin/levelMax; `API-016` — per-Pokemon random level within entry range; `CP-008` — generated results with individual levels
- **Gap Priority:** P2

### encounter-tables-R022: Swarm Multiplier Scale
- **Classification:** Partial
- **Present:** The app's density system (DM-005 DENSITY_RANGES) provides spawn count ranges: sparse (2-4), moderate (4-8), dense (8-12), abundant (12-16). The density multiplier on sub-habitats can scale counts further.
- **Missing:** The PTU swarm mechanic is fundamentally different from density-based generation. A swarm treats 12-60+ Pokemon as a single entity with multiple HP bars and swarm points, not as individual combatants. The app generates individual Pokemon, not swarm entities. The swarm multiplier scale (1-5 based on swarm size) has no equivalent.
- **Mapped to:** `DM-005` — DENSITY_RANGES constants; `DM-003` — densityMultiplier
- **Gap Priority:** P3

---

## Missing Rules

### encounter-tables-R005: Experience Calculation from Encounter
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** The app has no XP calculation system. The PTU formula (sum enemy levels, trainers count 2x, multiply by significance, divide by players) is not implemented anywhere. The app focuses on encounter creation and combat execution, not campaign progression. A workaround exists: the GM can calculate XP manually using the PTU rulebook formula.

### encounter-tables-R020: Action Economy Warning
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** The app has no advisory system that warns the GM when an encounter has too many or too few combatants relative to the party size. The generated encounter count is either manual or density-based without reference to party composition. Low priority because this is qualitative GM guidance rather than a mechanical rule — experienced GMs will know to moderate enemy count.

### encounter-tables-R023: Swarm HP and Actions
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** The swarm entity type (single stat block with multiple HP bars, no injuries, swarm multiplier decreasing as HP bars are lost) is not implemented. The app treats all combatants as individual entities. This is an edge-case encounter type per PTU.

### encounter-tables-R024: Swarm Action Economy
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Swarm-specific turn mechanics (swarm points, initiative subtraction for extra actions, move cost by frequency tier, accuracy/damage modifiers vs swarms) are not implemented. Depends on R023 (swarm entity type) which is also missing. Edge-case mechanic.

### encounter-tables-R027: Giant Pokemon Encounter Modifier
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** No system for creating giant Pokemon variants with boosted stats and modified move/ability lists. The GM can approximate this by manually editing a Pokemon's stats after generation, but there is no structured "make this Pokemon giant" workflow. Edge-case encounter design tool.

---

## Out of Scope

### encounter-tables-R004: Sensible Ecosystems Principle
- **Classification:** Out of Scope
- **Justification:** This is qualitative world-building guidance for GMs ("don't put water types in a desert"). The app is a session helper tool, not a world-builder. It provides the data structures for GMs to organize species into habitats (tables) but intentionally does not enforce ecological plausibility — doing so would restrict creative freedom, which contradicts R010 (Habitat Deviation Allowance). The app correctly treats this as a GM responsibility.

### encounter-tables-R011: Pseudo-Legendary Placement Constraint
- **Classification:** Out of Scope
- **Justification:** This is campaign design guidance ("save Dratini for hard-to-reach places"). The app provides the tools to place any species in any table at any weight, letting the GM decide where pseudo-legendaries appear. Enforcing this constraint would require the app to classify species as pseudo-legendary and validate table placement, which is beyond the scope of a session helper tool.

### encounter-tables-R013: Niche Competition and Adaptation
- **Classification:** Out of Scope
- **Justification:** This is ecological design guidance about how competing species in the same habitat should be differentiated. The app is not a habitat ecology simulator — it provides weighted spawn tables. The GM applies niche competition reasoning when deciding which species to add to a table and at what weights. The sub-habitat modification system (DM-003/DM-004) can model adaptation by overriding species presence in sub-regions.

### encounter-tables-R014: Social Hierarchy in Encounters
- **Classification:** Out of Scope
- **Justification:** This is encounter design guidance ("packs have leaders, hives have queens"). The app generates individual Pokemon from weighted pools, and the GM can curate results to include a leader. Per-entry level range overrides allow a "leader" species to be generated at a higher level. However, explicitly modeling pack hierarchy (alpha/subordinate relationships) is beyond the app's scope as a session helper.

### encounter-tables-R015: Special Habitat Requirements
- **Classification:** Out of Scope
- **Justification:** This is world-building guidance about species-specific environmental needs (Electric-types near industrial areas, Ghost-types in abandoned buildings). The app provides free-form table names and descriptions where GMs can note these requirements, but does not enforce or validate them. This is GM knowledge applied during table creation, not a mechanical rule the app needs to implement.

### encounter-tables-R018: Significance-Scaling Movesets
- **Classification:** Out of Scope
- **Justification:** This is encounter design guidance about giving more important enemies better moves (Egg/TM/Tutor moves, strategic ability choices). The pokemon-generator service handles move and ability assignment per pokemon-lifecycle rules, but the encounter-tables domain has no concept of "significance" that would drive different moveset quality. The GM can manually edit Pokemon sheets after generation to add TM/Tutor moves for important encounters.

### encounter-tables-R021: Tax vs Threat Encounter Design
- **Classification:** Out of Scope
- **Justification:** This is high-level encounter philosophy about whether encounters should drain resources (Tax) or risk defeat (Threat). This is qualitative GM decision-making guidance, not a mechanical rule. The app supports both encounter types through its combat system but does not need to categorize or label encounters as Tax vs Threat.

### encounter-tables-R026: Type Shift and Variant Pokemon
- **Classification:** Out of Scope
- **Justification:** Type shifts and variant Pokemon are character-sheet-level modifications (changing a Pokemon's type, move effects, ability lists). The app's Pokemon sheet editor allows editing types, moves, and abilities, which enables creating variants. However, the encounter-tables domain is about species selection and generation, not type customization. Type shift tooling belongs in the pokemon-lifecycle domain.

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

1. `encounter-tables-R001` — Implemented — core/enumeration — Verify habitat types are supported through table naming and that the system works for representing canonical PTU habitats
2. `encounter-tables-R002` — Implemented — core/enumeration — Verify species-to-table assignment works via EncounterTableEntry FK to SpeciesData, including multi-habitat support
3. `encounter-tables-R007` — Implemented — core/modifier — Verify RARITY_WEIGHTS values match intended distribution and weighted random selection algorithm is correct
4. `encounter-tables-R012` — Implemented — core/constraint — Verify generation produces species diversity (multiple species from pool, not all same species)
5. `encounter-tables-R016` — Implemented — core/workflow — Verify full encounter creation pipeline: table selection -> generation -> output to encounter/scene/TV
6. `encounter-tables-R019` — Implemented — situational/workflow — Verify quick-stat automation via pokemon-generator integration produces valid stat blocks
7. `encounter-tables-R010` — Implemented — situational/modifier — Verify no artificial constraints prevent species from being added to any table
8. `encounter-tables-R025` — Implemented — situational/interaction — Verify VTT terrain and fog systems provide environmental modifier foundation
9. `encounter-tables-R003` — Partial (present: level ranges) — core/constraint — Verify level range fields on tables, entries, and modifications work correctly and cascade properly
10. `encounter-tables-R006` — Partial (present: level ranges) — core/formula — Verify generation respects level ranges and random level selection is within bounds
11. `encounter-tables-R017` — Partial (present: per-entry level ranges) — core/workflow — Verify per-entry level range overrides work correctly in generation
12. `encounter-tables-R008` — Partial (present: GM discretion) — core/enumeration — Verify encounter output workflow allows GM to contextualize significance
13. `encounter-tables-R009` — Partial (present: density multiplier) — situational/modifier — Verify densityMultiplier correctly scales spawn count in generation
14. `encounter-tables-R022` — Partial (present: density ranges) — edge-case/formula — Verify DENSITY_RANGES constants and density-based spawn count calculation
