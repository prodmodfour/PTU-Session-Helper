---
domain: encounter-tables
audited_at: 2026-02-19T00:00:00Z
audited_by: implementation-auditor
items_audited: 14
correct: 9
incorrect: 2
approximation: 3
ambiguous: 0
---

# Implementation Audit: Encounter Tables

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 9 |
| Incorrect | 2 |
| Approximation | 3 |
| Ambiguous | 0 |
| **Total** | **14** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 3
- LOW: 1

---

## Correct Items

### encounter-tables-R001: Habitat Types Enumeration
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:287-309` -- EncounterTable model; `app/types/habitat.ts:61-73` -- EncounterTable interface
- **Rule:** "This list is simply a compilation of the information in the Pokedex PDF on which Pokemon live in which habitats. If you're stumped on what species to populate a route or section of your world with, this makes for a handy reference. Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting."
- **Verification:** The PTU habitat list (Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Rainforest, Taiga, Tundra, Urban) is a reference list for GMs, not a mechanical enum. The app provides free-form named encounter tables where the GM creates tables like "Forest" or "Cave" and populates them with species. This is the correct operationalization -- the rulebook explicitly says the list is a reference that GMs can deviate from. Hardcoding a fixed enum would actually contradict R010 (habitat deviation allowance). The EncounterTable model has `name` (String) which the GM can set to any habitat name.

### encounter-tables-R002: Species-to-Habitat Assignment
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:312-331` -- EncounterTableEntry model; `app/server/api/encounter-tables/[id]/entries/index.post.ts:1-96` -- Add Entry endpoint
- **Rule:** "There are some places that a particular Species of Pokemon will not thrive. For obvious reason, you'll only find fish-like Pokemon in the water or rocky Pokemon near rocky places. The Habitat entry explains what kind of terrain to look for if you intend to hunt for a particular Species of Pokemon."
- **Verification:** The EncounterTableEntry model creates a FK relationship between a species (`speciesId` -> `SpeciesData`) and a table (habitat). The `@@unique([tableId, speciesId])` constraint ensures one entry per species per table. The Add Entry endpoint (API-006) validates both table and species exist before creating the association. A species can appear in multiple tables (no cross-table uniqueness constraint), matching PTU's multi-habitat species support. This correctly models the species-to-habitat assignment as a GM-managed reference.

### encounter-tables-R010: Habitat Deviation Allowance
- **Classification:** Correct
- **Code:** `app/server/api/encounter-tables/[id]/entries/index.post.ts:63-74` -- entry creation; `app/prisma/schema.prisma:359-379` -- ModificationEntry model
- **Rule:** "Feel free to deviate from this list, however, if you have other ideas for where Pokemon might make their homes in your setting. For example, you might have a mountain-dwelling version of Spinark and Ariados."
- **Verification:** The Add Entry endpoint imposes no constraints on which species can be added to which table -- any valid speciesId can be added to any table. The ModificationEntry model uses `speciesName` (String) instead of a FK to SpeciesData, specifically enabling references to species not in the parent table's roster. Both design choices fully support the PTU principle that habitat assignments are guidelines, not hard constraints. The GM has complete freedom to place any species in any habitat.

### encounter-tables-R016: Encounter Creation Workflow
- **Classification:** Correct
- **Code:** `app/composables/useEncounterCreation.ts:1-69` -- workflow composable; `app/server/api/encounter-tables/[id]/generate.post.ts:1-188` -- generation endpoint; `app/server/api/encounters/[id]/wild-spawn.post.ts:1-96` -- wild spawn endpoint
- **Rule:** "The first step to crafting a combat encounter is figuring out why the players will be fighting."
- **Verification:** The app implements a complete encounter creation pipeline: (1) GM selects a habitat table (context/species pool), (2) optionally applies a sub-habitat modification, (3) generates Pokemon via weighted random selection with level ranges, (4) GM reviews/curates generated results in GenerateEncounterModal with checkboxes, (5) outputs to encounter (createWildEncounter -> encounter store -> wild-spawn API -> pokemon-generator), scene (addToScene), or TV display (serveWildSpawn). The pipeline maps correctly to PTU's workflow: determine context -> select species from habitat -> distribute levels. The GM retains full control at each step.

### encounter-tables-R019: Quick-Stat Workflow
- **Classification:** Correct
- **Code:** `app/server/api/encounters/[id]/wild-spawn.post.ts:52-57` -- calls generateAndCreatePokemon; `app/server/services/pokemon-generator.service.ts:82` -- generatePokemonData; `app/server/services/pokemon-generator.service.ts:243` -- generateAndCreatePokemon
- **Rule:** "Pick 3-4 Stats to focus on per Pokemon. [...] simply evenly divide Stat Points for the Pokemon among their highest 3 or 4 stats"
- **Verification:** The wild-spawn endpoint calls `generateAndCreatePokemon()` from the pokemon-generator service for each Pokemon. This service handles stat distribution, move selection, ability assignment, HP calculation, and evasion calculation per pokemon-lifecycle rules. The stat distribution logic uses the species' base stats to determine focus stats, matching PTU's guidance to focus on the highest 3-4 stats. This is a fully automated quick-stat workflow -- the GM provides species name and level, and the service produces a complete stat block ready for combat. Cross-domain to pokemon-lifecycle for the actual stat generation correctness.

### encounter-tables-R003: Fun Game Progression Principle (Partial)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:294-295` -- EncounterTable levelMin/levelMax; `app/prisma/schema.prisma:323-324` -- EncounterTableEntry levelMin/levelMax; `app/prisma/schema.prisma:344-345` -- TableModification levelMin/levelMax
- **Rule:** "The first principle is Fun Game Progression -- making sure it's enjoyable to journey through your world and the progression of Pokemon encountered from early in the campaign to later on is satisfying to the players."
- **Verification:** The present portion (level ranges) works correctly. Level ranges are supported at three levels: table-default (levelMin/levelMax with defaults 1/10), per-entry override (nullable levelMin/levelMax), and per-modification override (nullable levelMin/levelMax). The generate endpoint correctly cascades: entry-specific range > table default range > level override from request body. This gives the GM complete control over progression through level range configuration.

### encounter-tables-R006: Encounter Level Budget Formula (Partial)
- **Classification:** Correct
- **Code:** `app/server/api/encounter-tables/[id]/generate.post.ts:130-153` -- level range handling and random level selection
- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokemon Level of your PCs by 2 [...] and use that as a projected baseline Experience drop per player for the encounter."
- **Verification:** The present portion (level ranges applied during generation) works correctly. The generate endpoint determines level range per-Pokemon: `entryLevelMin = selected.levelMin ?? levelMin` and `entryLevelMax = selected.levelMax ?? levelMax`, where `levelMin`/`levelMax` come from the request body override or the table defaults. Random level selection uses `Math.floor(Math.random() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin`, which is a correct uniform random integer in [min, max]. The missing XP-budget calculator is noted in the matrix but does not affect correctness of the implemented level range system.

### encounter-tables-R017: Level Distribution Across Enemies (Partial)
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:323-324` -- per-entry levelMin/levelMax; `app/server/api/encounter-tables/[id]/generate.post.ts:150-153` -- per-Pokemon level selection
- **Rule:** "For normal encounters, don't sink all of the Levels you have to work with into one or two Pokemon with extremely high Levels!"
- **Verification:** The present portion (per-entry level range overrides) works correctly. Each EncounterTableEntry can have its own levelMin/levelMax. During generation, each selected Pokemon gets its level from its own entry's range (`selected.levelMin ?? levelMin`). This allows the GM to set up a "leader is L40, minions are L20" distribution by configuring different level ranges on different entries. The missing level-budget system is noted in the matrix but the per-entry override mechanism itself is correct.

### encounter-tables-R008: Significance Multiplier (Partial)
- **Classification:** Correct
- **Code:** `app/composables/useEncounterCreation.ts:13-37` -- createWildEncounter; `app/server/api/encounter-tables/[id]/generate.post.ts:164-180` -- generation meta output
- **Rule:** "The Significance Multiplier should range from x1 to about x5"
- **Verification:** The present portion (encounter output workflow) works correctly. The generation pipeline outputs Pokemon to encounters, scenes, or TV display, and the GM retains full control over curation before committing. The encounter creation workflow creates the encounter, adds Pokemon, and serves it -- the GM decides the encounter's significance through their own judgment and table design choices. The missing significance multiplier field and XP calculator do not affect the correctness of the encounter output pathway. The app correctly delegates significance decisions to GM discretion, which is consistent with PTU's approach (significance is a GM judgment call, not a formula).

---

## Incorrect Items

### encounter-tables-R007: Energy Pyramid / Rarity Distribution
- **Classification:** Incorrect
- **Severity:** HIGH
- **Code:** `app/prisma/schema.prisma:320` -- `weight Int @default(10)`; `app/types/habitat.ts:6-12` -- RARITY_WEIGHTS constant; `app/server/api/encounter-tables/[id]/entries/[entryId].put.ts:17` -- weight validation
- **Rule:** "producers, that is, plant-life (or photosynthetic grass Pokemon perhaps!) are the most populous denizens of an environment, and the higher up you go on the food chain, the rarer a species becomes."
- **Expected:** The weight system should support fractional weights to enable the full rarity scale. The `RARITY_WEIGHTS` constant defines `legendary: 0.1`, meaning legendary-tier species should have a weight of 0.1. The update endpoint validates `weight >= 0.1`. Both imply fractional weights are intended and valid.
- **Actual:** The Prisma model defines `weight` as `Int` (integer) on EncounterTableEntry (line 320) and `weight` as `Int?` on ModificationEntry (line 368). SQLite will store `0.1` as `0` when the column is typed as Int. This means legendary-rarity species (weight 0.1) get truncated to weight 0, which makes them impossible to generate -- they would never be selected by the weighted random algorithm since their effective weight is zero. The API update endpoint (line 17) validates `weight >= 0.1` but this validation is meaningless because Prisma truncates the value before storage.
- **Evidence:** The RARITY_WEIGHTS constant defines 5 tiers: common=10, uncommon=5, rare=3, very-rare=1, legendary=0.1. The weighted random selection algorithm in generate.post.ts (line 121) sums weights and selects proportionally. If legendary weight is stored as 0, that species is unreachable. This breaks the energy pyramid's lowest tier entirely. Additionally, the EncounterTableModal component (CP-007) uses `Rare=2` while habitat.ts uses `Rare=3` -- a secondary inconsistency, but the Int truncation is the primary bug.

### encounter-tables-R022: Swarm Multiplier Scale (Partial -- density ranges)
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/server/api/encounter-tables/[id]/generate.post.ts:105-113` -- spawn count calculation with hard cap
- **Rule:** "Swarm Multiplier / Size of Swarm: 1 / Less than a dozen Pokemon; 2 / 15-25 Pokemon; 3 / 25-40 Pokemon; 4 / 40-60 Pokemon; 5 / 60+ Pokemon"
- **Expected:** The DENSITY_RANGES constants define `dense: {8, 12}` and `abundant: {12, 16}`. The density system should support generating up to 16 Pokemon when the density tier is `abundant`, since that is what the constant defines.
- **Actual:** The generate endpoint hard-caps `scaledMax` to 10: `const scaledMax = Math.min(10, Math.round(densityRange.max * densityMultiplier))` (line 113). For `dense` tier, the range 8-12 is truncated to 8-10. For `abundant` tier, the range 12-16 is truncated to 10-10 (always generates exactly 10). This means: (a) the `abundant` tier always produces 10, identical to `dense` with a 1.25x multiplier, making the tier distinction meaningless; (b) density multipliers >1.0 on `dense` or `abundant` tiers have no effect on the max; (c) the DENSITY_RANGES constants define ranges up to 16 that can never be reached.
- **Evidence:** Manual count override is also clamped to [1, 10] at line 105. The app's own constants (DENSITY_RANGES) promise a different range than the generation algorithm delivers.

---

## Approximation Items

### encounter-tables-R012: Species Diversity per Encounter
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/server/api/encounter-tables/[id]/generate.post.ts:137-162` -- weighted random selection loop
- **Rule:** "Stick to 2 or 3 different species. You want to clone a few Pokemon to populate your encounter, but you don't want an encounter made entirely of one species either."
- **Expected:** The generation system should produce 2-3 different species per encounter, with some duplicates per species (packs). The PTU rule explicitly advises against encounters of entirely one species.
- **Actual:** The generation algorithm draws each Pokemon independently from the weighted pool via independent random selections. There is no deduplication logic, no species-count constraint, and no mechanism to enforce 2-3 species diversity. With independent draws from a weighted pool, the probability of all Pokemon being the same species increases significantly when one species dominates the weight pool. For example, a pool with one species at weight 10 and another at weight 1 will generate the dominant species ~91% of the time, frequently producing encounters of only one species.
- **What's Missing:** No diversity enforcement mechanism. The algorithm relies entirely on the GM having a well-balanced weight pool, which is a reasonable approximation but not guaranteed. A species-diversity check (e.g., ensuring at least 2 distinct species when generating 4+ Pokemon) would match the PTU guidance more closely. The GM can mitigate this by using the checkbox selection UI to curate results, but the generation itself does not enforce diversity.

### encounter-tables-R025: Environmental Encounter Modifiers
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/stores/terrain.ts:1-24` -- TerrainState and TERRAIN_COSTS; `app/stores/fogOfWar.ts` (referenced in capability map)
- **Rule:** "Consider the environment the encounter takes place in. A couple of simple rules for a hazardous environment such as traps, poor visibility, or restricted movement can turn what is ordinarily a mundane and easy encounter into a real trial for the players."
- **Expected:** Environmental modifiers that affect encounters: dark caves with visibility penalties (-2 per unilluminated meter to accuracy/perception), arctic terrain with weight-class ice-breaking and slow terrain, hazard factories with interactive machinery elements.
- **Actual:** The VTT terrain system provides 6 terrain types (normal, difficult, blocking, water, hazard, elevated) with movement cost multipliers. The fog of war system provides 3-state visibility (hidden/revealed/explored). These provide a general foundation for environmental encounters but do not implement PTU's specific environmental modifier examples: no per-meter accuracy penalty for darkness, no weight-class checks for ice, no interactive environment elements.
- **What's Missing:** The terrain and fog systems are generic tactical grid tools rather than PTU-specific environmental modifier implementations. They approximate the concept (restricted movement, visibility control) but lack the specific mechanical effects described in the rulebook. This is a reasonable simplification for a session helper tool -- the specific penalties can be tracked by the GM mentally.

### encounter-tables-R009: Difficulty Adjustment Modifier (Partial -- density multiplier)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/server/api/encounter-tables/[id]/generate.post.ts:69-80` -- densityMultiplier from modification; lines 112-116 -- density scaling; `app/server/api/encounter-tables/[id]/modifications/index.post.ts:34-37` -- density multiplier validation/clamping
- **Rule:** "Lower or raise the significance a little, by x0.5 to x1.5, based on the difficulty of the challenge."
- **Expected:** The PTU difficulty adjustment modifies the significance multiplier, which in turn affects XP rewards. The difficulty modifier is a narrative/XP concept (x0.5 to x1.5 applied to the significance multiplier), not a spawn count concept.
- **Actual:** The app's `densityMultiplier` on TableModification scales spawn count, not significance or XP. A densityMultiplier of 2.0 doubles the number of spawned Pokemon; it does not adjust a significance rating. The PTU difficulty modifier affects reward calculation (XP = base * significance * difficulty), not generation count. The app provides a density-scaling tool that addresses one dimension of difficulty (number of enemies) but conflates it with the PTU concept of difficulty adjustment to significance.
- **What's Missing:** The difficulty adjustment in PTU modifies XP rewards via the significance multiplier. The app has no significance or XP system, so the density multiplier is the closest approximation -- more enemies does make encounters harder, which is one interpretation of "difficulty." However, this is a dimensional mismatch: PTU adjusts reward difficulty, while the app adjusts encounter composition.

---

## Ambiguous Items

None.

---

## Additional Observations

### OBS-001: Weight Type Mismatch Propagates to ModificationEntry
The `Int?` type on `ModificationEntry.weight` (line 368 in schema.prisma) has the same truncation problem as EncounterTableEntry.weight. If a modification entry is intended to add a legendary-tier species with weight 0.1, it would be stored as 0 (or null, since the column is nullable). The generate endpoint's modification application logic (generate.post.ts line 86-98) would then use weight 0 for such entries, making them unreachable.

### OBS-002: Rarity Weight Inconsistency Between Components
The EncounterTableModal component (CP-007) uses different rarity weights than the canonical RARITY_WEIGHTS constant: `Rare=2` vs `Rare=3` in habitat.ts, and it omits the `Legendary` tier entirely. This means species added via the Habitats page get different weights than those added via the Encounter Tables page for the same rarity label.

### OBS-003: No Level Range Cross-Validation
Neither the table creation API nor the entry creation API validates that `levelMin <= levelMax`. The generate endpoint (line 153) computes `Math.floor(Math.random() * (entryLevelMax - entryLevelMin + 1)) + entryLevelMin`. If `levelMin > levelMax` (e.g., min=50, max=10), this produces negative range calculations and the generated level could be less than 1 or produce unpredictable results.
