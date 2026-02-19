---
domain: scenes
audited_at: 2026-02-19T00:00:00Z
audited_by: implementation-auditor
items_audited: 18
correct: 10
incorrect: 3
approximation: 4
ambiguous: 1
---

# Implementation Audit: Scenes

## Summary

| Classification | Count |
|---------------|-------|
| Correct | 10 |
| Incorrect | 3 |
| Approximation | 4 |
| Ambiguous | 1 |
| **Total** | **18** |

### Severity Breakdown (Incorrect + Approximation)
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 5
- LOW: 1

---

## Correct Items

### scenes-R009: Weather Keyword Definition
- **Classification:** Correct
- **Code:** `app/components/scene/ScenePropertiesPanel.vue:53-63` -- weather select element
- **Rule:** "Moves with the Weather keyword affects an area, changing the rules of the battle. Damage can be altered and even the Effects of moves can change depending on the Weather in battle. There can only be one Weather Effect in place at a time; new Weather Effects replace old Weather Effects. Weather Conditions last 5 rounds."
- **Verification:** The weather select in ScenePropertiesPanel.vue provides 9 weather options: Sunny, Rain, Sandstorm, Hail, Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds. PTU defines 4 core weather conditions (Sunny, Rainy, Sandstorm, Hail). The app includes all 4 PTU weather types plus additional visual weather types (Snow, Fog, Harsh Sunlight, Heavy Rain, Strong Winds) that extend beyond PTU 1.05 core but do not conflict with it. The 4 core PTU weather types are correctly present. The SceneView component (`app/pages/group/_components/SceneView.vue:2-6`) renders weather effects visually for all 9 types.

### scenes-R010: Natural Weather vs Game Weather
- **Classification:** Correct
- **Code:** `app/components/scene/ScenePropertiesPanel.vue:48-64` -- weather select with manual GM control
- **Rule:** "Note that despite their names, Weather Conditions are not usually found as natural occurrences. A bright and sunny day does not count as Sunny Weather, nor does rain count as Rainy Weather. However, particularly severe examples of the corresponding weather can count."
- **Verification:** The weather field on scenes is set manually by the GM via a select dropdown. There is no automatic weather assignment based on habitat, season, or location. The GM explicitly decides when weather conditions are severe enough to constitute game-mechanical weather, which correctly implements the PTU distinction that natural weather does not automatically count as game weather.

### scenes-R039: Weather Exclusivity Constraint
- **Classification:** Correct
- **Code:** `app/components/scene/ScenePropertiesPanel.vue:50-64` -- single `<select>` element; `app/prisma/schema.prisma:450` -- `weather String?` (single string field)
- **Rule:** "There can only be one Weather Effect in place at a time; new Weather Effects replace old Weather Effects."
- **Verification:** Weather is stored as a single nullable string field in the Prisma schema (`Scene.weather`). The UI uses a single `<select>` element (not a multi-select or checkbox group). Selecting a new weather value replaces the previous one. This structurally enforces the PTU constraint that only one weather effect can be active at a time.

### scenes-R001: Habitat Type Enumeration
- **Classification:** Correct
- **Code:** `app/prisma/schema.prisma:282-309` -- EncounterTable model; `app/components/scene/SceneHabitatPanel.vue:19-33` -- habitat selector
- **Rule:** "This list is simply a compilation of the information in the Pokédex PDF on which Pokémon live in which habitats." PTU lists 13 habitats: Arctic, Beach, Cave, Desert, Forest, Freshwater, Grasslands, Marsh, Mountain, Ocean, Taiga, Tundra, Urban.
- **Verification:** The app uses encounter tables as the representation of habitats. There is no hardcoded list of the 13 PTU habitat names; instead, the GM creates encounter tables with any name they choose, and links them to scenes via `Scene.habitatId`. The SceneHabitatPanel dropdown lists all encounter tables. While the 13 specific PTU habitat names are not enforced as an enumeration, this is a valid approach -- the GM can create tables named after any PTU habitat and the system is open to custom habitats. The PTU rule itself says "Feel free to deviate from this list" so the open-ended table naming is correct.

### scenes-R002: Habitat Pokemon Assignment
- **Classification:** Correct
- **Code:** `app/server/api/encounter-tables/[id]/entries/index.post.ts` -- add species to table; `app/components/scene/SceneHabitatPanel.vue:57-85` -- entry list display
- **Rule:** "Feel free to deviate from this list, however, if you have other ideas for where Pokémon might make their homes in your setting."
- **Verification:** The encounter table system allows the GM to add any species to any encounter table with custom weights. Species are linked via `EncounterTableEntry` which references `SpeciesData`. The habitat panel shows all entries with sprites, rarity labels (calculated from weight percentages), and level ranges. The GM has full control over which Pokemon appear in which habitat. This correctly implements the open-ended species assignment that PTU describes.

### scenes-R032: Wild Encounter Trigger Scenarios
- **Classification:** Correct
- **Code:** `app/server/api/encounters/from-scene.post.ts:1-153` -- scene-to-encounter conversion; `app/components/scene/StartEncounterModal.vue` -- encounter start modal
- **Rule:** "There's an ongoing fight between Pokémon on the road... Pokémon are protecting something valuable... Pokémon are agitated by an external source."
- **Verification:** The scene-to-encounter conversion flow supports any trigger scenario. The GM sets up a scene with Pokemon and characters (either manually or via habitat generation), then converts it to an encounter via the StartEncounterModal. Scene Pokemon become wild enemy combatants with full DB records created via `generateAndCreatePokemon()`. Scene characters become player combatants. Weather is inherited. The system provides the mechanical tools for any encounter trigger the GM narrates -- it does not need to enumerate specific trigger types since those are narrative decisions.

### scenes-R035: Movement Capabilities (Cross-Domain Reference)
- **Classification:** Correct
- **Code:** `app/types/spatial.ts:34-41` -- MovementSpeeds interface; `app/composables/useGridMovement.ts:24-32` -- calculateMoveDistance with PTU diagonals
- **Rule:** "The most basic Movement Capability is the Overland Capability, which measures how fast a Trainer or Pokémon can walk or run on a surface."
- **Verification:** This is a cross-domain reference to the VTT grid domain. The types define `MovementSpeeds` with `overland`, `swim`, `sky`, `burrow`, `levitate`, and `teleport` fields. The grid movement composable implements PTU diagonal movement rules (alternating 1m/2m cost). The scene system feeds into encounters which use this movement system. The cross-domain integration is correctly established.

### scenes-R037: Experience Calculation from Encounters (Cross-Domain Reference)
- **Classification:** Correct
- **Code:** `app/types/encounter.ts:131` -- defeatedEnemies tracking; `app/server/api/encounters/from-scene.post.ts:143` -- defeatedEnemies initialized
- **Rule:** "First, consider the levels of the enemies. Find the combined levels of all enemies in the encounter..."
- **Verification:** This is a cross-domain reference to the combat domain. The encounter model tracks `defeatedEnemies` (species + level) which provides the data needed for experience calculation. The scene system's contribution is creating encounters with properly-leveled wild Pokemon via scene-to-encounter conversion. The actual experience formula implementation belongs to the combat domain. The cross-domain linkage is correct.

### scenes-R038: Scene Boundary and Frequency Reset (Cross-Domain Reference)
- **Classification:** Correct
- **Code:** `app/types/character.ts:64-65` -- Move.usedThisScene and Move.usedToday fields; `app/server/api/encounters/[id]/start.post.ts` -- encounter start; `app/server/api/encounters/[id]/end.post.ts` -- encounter end
- **Rule:** "Scene X: This Frequency means this Move can be performed X times per Scene."
- **Verification:** This is a cross-domain reference. Scene boundaries are implicitly defined by encounter start/end. Move objects have `usedThisScene` and `usedToday` fields for tracking frequency usage within a scene and daily. Extended rest resets `usedToday` for all moves and `usedThisScene` for daily moves. Pokemon Center resets both. The encounter start/end endpoints define the operational boundaries. While there is no explicit "next scene" mechanism that resets `usedThisScene` between encounters, the type definitions and reset mechanisms establish the tracking framework correctly for the cross-domain reference.

### scenes-R022: Environmental Hazard Encounters (Partial -- present portion)
- **Classification:** Correct
- **Code:** `app/pages/gm/scenes/[id].vue` -- Scene Editor Page; `app/components/scene/ScenePropertiesPanel.vue` -- weather/description; `app/stores/terrain.ts:17-24` -- TERRAIN_COSTS with hazard type
- **Rule:** "Consider the environment the encounter takes place in. A couple of simple rules for a hazardous environment such as traps, poor visibility, or restricted movement can turn what is ordinarily a mundane and easy encounter into a real trial for the players."
- **Verification:** The present portion -- scene setup tools for weather, description, terrain types -- is correctly implemented. The scene editor allows the GM to configure weather, write description text about hazards, and the terrain store includes a `hazard` terrain type with normal movement cost but intended for damage-on-entry. The terrain painter can mark cells as hazard during encounters. These tools provide the basic building blocks for environmental hazard encounters, even though automated hazard effects are missing (which is the "missing" portion already noted in the matrix).

---

## Incorrect Items

### scenes-R016: Basic Terrain Types
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/types/spatial.ts:44-50` -- TerrainType definition; `app/stores/terrain.ts:17-24` -- TERRAIN_COSTS
- **Rule:** "Regular Terrain: Regular Terrain is dirt, short grass, cement, smooth rock, indoor building etc. Earth Terrain: Earth Terrain is underground terrain that has no existing tunnel that you are trying to Shift through. You may only Shift through Earth Terrain if you have a Burrow Capability. Underwater: Underwater Terrain is any water that a Pokémon or Trainer can be submerged in. You may not move through Underwater Terrain during battle if you do not have a Swim Capability."
- **Expected:** PTU defines 3 basic terrain types: Regular, Earth, and Underwater. Earth terrain requires Burrow capability. Underwater terrain requires Swim capability. Plus 3 special terrain modifiers: Slow, Rough, and Blocking.
- **Actual:** The app defines 6 terrain types: `normal`, `difficult`, `blocking`, `water`, `hazard`, `elevated`. The mapping does not match PTU terminology:
  - `normal` maps to PTU's Regular -- correct
  - `difficult` maps to PTU's Slow -- renamed but functionally equivalent (cost 2x)
  - `blocking` maps to PTU's Blocking -- correct
  - `water` partially maps to PTU's Underwater -- has cost 2 with swim check, but PTU says Underwater is fully impassable without Swim (should be Infinity without Swim, which the code does handle via the `canSwim` check)
  - `hazard` has no PTU equivalent in the basic terrain list -- this is an app extension
  - `elevated` has no PTU equivalent in the basic terrain list -- this is an app extension
  - PTU's "Earth" terrain (requires Burrow) is completely missing
  - PTU's "Rough" terrain (-2 accuracy through it) is missing as a distinct type
- **Evidence:** `app/types/spatial.ts:44-50` defines `TerrainType` as `'normal' | 'difficult' | 'blocking' | 'water' | 'hazard' | 'elevated'`. The PTU rulebook (`core/07-combat.md`) defines Regular, Earth, Underwater as basic types, plus Slow, Rough, Blocking as modifiers. The app merges and renames these, drops Earth and Rough, and adds Hazard and Elevated.

### scenes-R019: Blocking Terrain
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/stores/terrain.ts:20,78-84` -- blocking terrain cost and passability; `app/composables/useGridMovement.ts:74-92` -- isValidMove
- **Rule:** "Blocking Terrain: Straightforwardly, this is Terrain that cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Expected:** Blocking terrain prevents both movement through AND targeting through. Attacks cannot be aimed through blocking terrain cells.
- **Actual:** Blocking terrain correctly prevents movement: `TERRAIN_COSTS.blocking = Infinity` and `isPassable` returns false for blocking terrain (`app/stores/terrain.ts:81`). However, the targeting restriction (attacks cannot pass through blocking cells) is NOT implemented. The `useRangeParser.ts` composable calculates affected areas and line-of-sight for attack ranges, but it does not check for blocking terrain in the attack path. The `validateMovement` function checks terrain for movement but there is no corresponding `validateTargeting` that checks if line-of-sight passes through blocking cells.
- **Evidence:** `app/stores/terrain.ts:20` sets `blocking: Infinity` for movement cost, and line 81 returns `false` for `isPassable` on blocking terrain. But there is no line-of-sight check for attacks that verifies no blocking terrain exists between attacker and target. The PTU rule explicitly says "cannot be... Targeted through."

### scenes-R017: Slow Terrain (Partial -- present portion)
- **Classification:** Incorrect
- **Severity:** MEDIUM
- **Code:** `app/stores/terrain.ts:19` -- difficult terrain cost; `app/composables/useGridMovement.ts:74-92` -- isValidMove function
- **Rule:** "When Shifting through Slow Terrain, Trainers and their Pokémon treat every square meter as two square meters instead."
- **Expected:** Movement through slow/difficult terrain cells costs 2x. The grid movement system should multiply each cell's movement cost by 2 when traversing slow terrain.
- **Actual:** The terrain store correctly defines `difficult: 2` as the movement cost multiplier (`app/stores/terrain.ts:19`). The `useRangeParser.ts` composable correctly integrates terrain costs in its `getMovementRangeCells` function (line 373: `const moveCost = baseCost * terrainMultiplier`). However, the `useGridMovement.ts` composable's `isValidMove` function (lines 74-92) does NOT use terrain costs at all -- it uses `calculateMoveDistance` which is pure point-to-point distance without terrain consideration. The `getTerrainCostAt` function is defined (line 67-69) but never called during movement validation. Since `GridCanvas.vue` (line 138) uses `useGridMovement` for token movement, actual token drag-and-drop movement does NOT enforce terrain costs.
- **Evidence:** `app/composables/useGridMovement.ts:82` -- `const distance = calculateMoveDistance(fromPos, toPos)` calculates raw distance ignoring terrain. The `getTerrainCostAt` at line 67 queries the terrain store but is only exported, never used in `isValidMove`. Meanwhile, `app/composables/useRangeParser.ts:373` correctly multiplies `baseCost * terrainMultiplier` but this is in a separate composable that is not wired into the token movement path via `GridCanvas.vue`.

---

## Approximation Items

### scenes-R025: Scene Frequency Definition
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/types/character.ts:52,64` -- Move.frequency and Move.usedThisScene fields; `app/types/encounter.ts:124-125` -- sceneNumber field
- **Rule:** "Scene X: This Frequency means this Move can be performed X times per Scene. Moves that simply have the Scene Frequency without a number can be performed once a Scene. Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
- **Expected:** The system tracks move usage per scene (usedThisScene), supports the "Scene X" notation for multi-use scene moves, and enforces the Every Other Turn restriction for multi-use scene moves.
- **Actual:** The `Move` type has `usedThisScene: number` and `frequency: MoveFrequency` fields. The `Encounter` type has a `sceneNumber` field. The data model supports tracking. However, the `sceneNumber` is hardcoded to 1 in all encounter creation/response endpoints (`app/server/api/encounters/from-scene.post.ts:142`, `app/server/api/encounters/index.post.ts:60`, etc.) and there is no `next-scene` endpoint implementation (the store references it at `app/stores/encounterCombat.ts:147` but the API endpoint does not exist). There is no enforcement of the EOT restriction for multi-use Scene moves. The tracking fields exist but enforcement logic is missing.
- **What's Missing:** (1) No increment/reset of usedThisScene during move execution. (2) No validation that Scene-frequency moves have not exceeded their per-scene limit. (3) No enforcement of the Every Other Turn restriction for Scene X>1 moves. (4) The `sceneNumber` field is never incremented.

### scenes-R029: Encounter Creation Baseline
- **Classification:** Approximation
- **Severity:** LOW
- **Code:** `app/server/api/encounter-tables/[id]/generate.post.ts:101-117` -- density-based count; `app/types/habitat.ts:17-21` -- DENSITY_RANGES
- **Rule:** "One good guideline here for an everyday encounter is to multiply the average Pokémon Level of your PCs by 2... and use that as a projected baseline Experience drop per player for the encounter... simply multiply the Experience drop by your number of Trainers. This is the number of Levels you have to work with to build your encounter."
- **Expected:** The PTU encounter creation formula: (average Pokemon Level * 2) * number of trainers = total levels budget. The GM distributes this budget across wild Pokemon to create the encounter.
- **Actual:** The app uses a density-based system (sparse: 2-4, moderate: 4-8, dense: 8-12, abundant: 12-16) with random count within range, combined with level ranges from the encounter table. The generation picks random species weighted by entry weights and assigns random levels within the table's range. This does not implement the PTU level-budget formula. Instead, it provides a complementary tool: the GM controls density and level ranges, and the system generates Pokemon within those bounds. The GM must mentally calculate the PTU budget and set density/levels accordingly.
- **What's Missing:** No budget-based encounter creation mode. No calculation of total enemy level budget based on party level and significance. The app's density system is a practical tool that serves a similar purpose but does not follow the PTU formula.

### scenes-R040: Weather Duration Constraint (Partial -- present portion)
- **Classification:** Approximation
- **Severity:** HIGH
- **Code:** `app/components/scene/ScenePropertiesPanel.vue:48-64` -- weather select; `app/server/api/encounters/from-scene.post.ts:47` -- weather inheritance; `app/pages/group/_components/SceneView.vue:4` -- weather display
- **Rule:** "Weather Conditions last 5 rounds."
- **Expected:** When weather is set (whether at scene level or during combat via a Weather-keyword move), it should automatically expire after 5 rounds.
- **Actual:** Weather is set on the scene as a persistent field and inherited by encounters. The combat system has no round counter for weather. Weather persists indefinitely until manually changed by the GM. There is no mechanism to automatically clear weather after 5 rounds in the encounter combat system.
- **What's Missing:** Weather round counter tracking on the encounter model. Automatic weather expiration logic in the turn-advance/next-round endpoint. This is the most impactful missing weather mechanic because it affects every encounter where weather is active -- the GM must manually remember to remove weather after 5 rounds.

### scenes-R030: Significance Multiplier (Partial -- present portion)
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Code:** `app/types/habitat.ts:15-21` -- DensityTier and DENSITY_RANGES; `app/server/api/encounter-tables/[id]/generate.post.ts:69,109-116` -- density multiplier
- **Rule:** "The Significance Multiplier should range from x1 to about x5, and there's many things to consider when picking this value. First, consider narrative significance... Insignificant encounters should trend towards the bottom of the spectrum at x1 to x1.5. 'Average' everyday encounters should be about x2 or x3."
- **Expected:** A significance multiplier (x1 to x5) that scales both the encounter difficulty and the experience reward. This is a distinct concept from spawn density.
- **Actual:** The app has a density system (sparse/moderate/dense/abundant) and table modification density multipliers (float, e.g., 0.5 or 2.0). These control how many Pokemon spawn in an encounter. There is no explicit "significance" field or x1-x5 multiplier. The density multiplier is conceptually adjacent but serves a different purpose: PTU significance scales the level budget and experience reward, while the app's density scales spawn count.
- **What's Missing:** No significance multiplier field on encounters or scenes. No experience scaling based on significance. The density system approximates part of what significance does (more Pokemon = harder encounter) but does not capture the experience-reward aspect.

---

## Ambiguous Items

### scenes-R018: Rough Terrain (Partial -- present portion)
- **Classification:** Ambiguous
- **Code:** `app/types/spatial.ts:44-50` -- TerrainType definition (no 'rough' type); `app/stores/terrain.ts:17-24` -- TERRAIN_COSTS
- **Rule:** "Most Rough Terrain is also Slow Terrain, but not always. When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls. Spaces occupied by other Trainers or Pokémon are considered Rough Terrain. Certain types of Rough Terrain may be ignored by certain Pokémon, based on their capabilities."
- **Interpretation A:** Rough terrain is a distinct terrain type that combines the slow effect with an accuracy penalty. The app should have both `difficult` (slow-only) and `rough` (slow + accuracy penalty) as separate terrain types. The current `difficult` type only implements the slow portion and is therefore an incomplete representation.
- **Interpretation B:** Rough terrain's -2 accuracy penalty is a combat-system concern (applied during attack resolution) rather than a terrain-painting concern. The terrain painter correctly provides the slow-terrain effect via `difficult`, and the accuracy penalty should be implemented as a separate combat system check that examines the terrain between attacker and target. The terrain painter is correct for what it does; the accuracy penalty is a separate missing feature.
- **Code follows:** Neither interpretation fully -- the app has `difficult` terrain (slow effect only) but no `rough` type and no accuracy penalty logic. The `difficult` type implements the movement cost aspect of rough terrain but not the targeting aspect.
- **Action:** Escalate to Game Logic Reviewer to determine: (1) Should `rough` be a separate terrain type in the painter, or should `difficult` cover both slow and rough? (2) How should the accuracy penalty interact with the existing terrain system?

---

## Additional Observations

1. **Weather type naming inconsistency:** The scene weather field uses `rain` while PTU uses "Rainy". The code uses lowercase with underscores (`harsh_sunlight`, `heavy_rain`, `strong_winds`) for multi-word weather types. This is a cosmetic naming choice that does not affect correctness, but consumers of the weather field (future combat weather effects) should be aware of the mapping.

2. **Extra weather types beyond PTU 1.05:** The app includes `snow`, `fog`, `harsh_sunlight`, `heavy_rain`, and `strong_winds` as weather options. These are from later Pokemon games (Gen 6+) and are not part of PTU 1.05's core 4 weather types (Sunny, Rainy, Hail, Sandstorm). This is an intentional extension, not an error, but future weather effect automation should distinguish between PTU-mechanical weather types (which have defined combat effects) and visual-only weather types (which are scene atmosphere).

3. **useGridMovement vs useRangeParser terrain integration gap:** The `useRangeParser.ts` composable correctly integrates terrain costs into movement range calculations and A* pathfinding. However, `useGridMovement.ts` (which is what `GridCanvas.vue` actually uses for token movement validation) does NOT use terrain costs. This means there are two parallel movement validation systems with different terrain awareness levels. Token drag-and-drop uses the terrain-unaware system.

4. **sceneNumber hardcoded to 1:** The `sceneNumber` field on encounter responses is always 1. The `encounterCombat.ts` store has a `nextScene` action that calls `POST /api/encounters/:id/next-scene`, but this endpoint does not exist. This suggests scene advancement within an encounter was designed but never implemented.
