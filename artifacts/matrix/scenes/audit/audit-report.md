---
domain: scenes
type: audit-report
audited_at: 2026-02-28T04:30:00Z
audited_by: implementation-auditor
matrix_version: 2026-02-28T03:00:00Z
---

# Audit Report: scenes

## Audit Summary

| Classification | Count |
|----------------|-------|
| Correct        | 19    |
| Incorrect      | 0     |
| Approximation  | 3     |
| Ambiguous      | 0     |
| **Total Audited** | **22** |

### Severity Breakdown (Approximation only)

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM   | 1     | R040 (weather duration — scene-level missing, encounter-level present) |
| LOW      | 2     | R017 (slow terrain naming), R020 (Naturewalk utility exists but not integrated into pathfinding cost) |

---

## Tier 1: Core Enumerations

### R009 — Weather Keyword Definition

- **Rule:** PTU weather types: Sunny, Rain, Sandstorm, Hail, Snow, Harsh Sunlight, Heavy Rain, Strong Winds (PTU Core various sections: p.235 conditions, Ch.7 combat effects, Ch.11 running the game)
- **Expected behavior:** Weather keywords stored as enum-like values on scenes
- **Actual behavior:** Scene has a `weather` field (nullable string) with dropdown options: sunny, rain, sandstorm, hail, snow, fog, harsh_sunlight, heavy_rain, strong_winds (`app/components/scene/ScenePropertiesPanel.vue:54-63`). DB field: `Scene.weather` (`app/prisma/schema.prisma:486`).
- **Classification:** Correct
- **Notes:** The "fog" option is not a standard PTU weather but is a reasonable GM tool extension. All standard PTU weathers are included.

### R016 — Basic Terrain Types

- **Rule:** PTU Core p.231: Regular Terrain, Earth Terrain, Underwater Terrain. Additional modifiers: Slow, Rough, Blocking.
- **Expected behavior:** 6+ terrain types available
- **Actual behavior:** VTT terrain store defines types: normal, water, earth, blocking, hazard, elevated (plus legacy: difficult, rough). Flags: rough, slow (per decree-010 multi-tag system). (`app/stores/terrain.ts:23-32, 19`)
- **Classification:** Correct
- **Notes:** PTU's "Regular Terrain" = app's "normal". PTU's "Underwater" = app's "water". PTU's "Earth" = app's "earth". Blocking is direct match. The multi-tag flag system (decree-010) allows cells to be both rough and slow simultaneously, which is more flexible than PTU's original taxonomy.

### R025/R026/R027 — Scene/Daily Frequency

- **Rule:** PTU p.337: Scene-frequency moves limited per scene (Scene=1, Scene x2=2, Scene x3=3). EOT restriction between uses of Scene x2/x3. Daily moves limited once per scene for Daily x2/x3.
- **Expected behavior:** Frequency tracking enforced per move
- **Actual behavior:**
  - `checkMoveFrequency` correctly implements Scene limits, EOT restriction for Scene x2/x3, and Daily per-scene cap (`app/utils/moveFrequency.ts:97-181`)
  - Scene x2/x3: enforces EOT between uses (lines 139-148)
  - Daily x2/x3: enforces 1-use-per-scene cap (lines 165-175)
  - `incrementMoveUsage` tracks round, scene usage, and daily usage (`app/utils/moveFrequency.ts:195-228`)
  - `resetSceneUsage` clears scene counters (`app/utils/moveFrequency.ts:234-246`)
  - `resetDailyUsage` clears daily counters (`app/utils/moveFrequency.ts:253-265`)
- **Classification:** Correct

---

## Tier 2: Core Constraints

### R039 — Weather Exclusivity Constraint

- **Rule:** PTU: Only one weather condition can be active at a time. Setting new weather replaces existing weather.
- **Expected behavior:** Single weather value, not a list
- **Actual behavior:** `Scene.weather` is a single nullable string, not an array (`app/prisma/schema.prisma:486`). The dropdown selector allows only one selection (`app/components/scene/ScenePropertiesPanel.vue:50-64`). On encounters, the weather endpoint overwrites the existing value (`app/server/api/encounters/[id]/weather.post.ts:47-54`).
- **Classification:** Correct

### R019 — Blocking Terrain

- **Rule:** PTU Core p.231: "Blocking Terrain [...] cannot be Shifted or Targeted through, such as walls and other large obstructions."
- **Expected behavior:** Blocked cells impassable in pathfinding and targeting
- **Actual behavior:**
  - `TERRAIN_COSTS.blocking = Infinity` (`app/stores/terrain.ts:27`)
  - `getMovementCost` returns `Infinity` for blocking terrain (`app/stores/terrain.ts:154`)
  - `isPassable` returns `false` for blocking terrain (`app/stores/terrain.ts:170`)
  - Pathfinding skips cells with `!isFinite(terrainMultiplier)` (`app/composables/usePathfinding.ts:95-97`)
  - A* pathfinding also skips infinite-cost cells (`app/composables/usePathfinding.ts:359`)
- **Classification:** Correct

---

## Tier 3: Core Workflows

### R032 — Wild Encounter Trigger Scenarios

- **Rule:** PTU Ch.11: Scenes can transition to encounters. Scene-to-encounter conversion creates combat from scene entities.
- **Expected behavior:** StartEncounterModal converts scene context to encounter
- **Actual behavior:** `StartEncounterModal` reads scene Pokemon (as enemies) and characters (as players), displays budget analysis, offers battle type selection (Full Contact / Trainer League), significance tier selection, and creates encounter via API. (`app/components/scene/StartEncounterModal.vue:1-80`)
- **Classification:** Correct

### R031 — Quick-Stat Wild Pokemon

- **Rule:** PTU Core p.102-103: Wild Pokemon get `Level + 10` stat points distributed following Base Relations Rule.
- **Expected behavior:** Stat distribution follows PTU formula with Base Relations
- **Actual behavior:**
  - `distributeStatPoints` distributes `level + 10` points (`app/server/services/pokemon-generator.service.ts:370`)
  - Points weighted by base stats (higher base stats attract more points) (`app/server/services/pokemon-generator.service.ts:371-381`)
  - `enforceBaseRelations` ensures stat ordering matches base stat ordering (`app/server/services/pokemon-generator.service.ts:386, 412-449`)
  - Final stats = base + distributed points (`app/server/services/pokemon-generator.service.ts:388-395`)
- **Classification:** Correct

### R034 — Quick NPC Building

- **Rule:** PTU Ch.11: GMs should be able to quickly create NPCs for encounters
- **Expected behavior:** Quick Create mode for NPCs
- **Actual behavior:** `useCharacterCreation` has `CreateMode = 'quick' | 'full'` (`app/composables/useCharacterCreation.ts:35`). The composable supports both full multi-section creation and quick creation (name + minimal fields).
- **Classification:** Correct

---

## Tier 4: Cross-Domain References

### R029 — Encounter Creation Baseline (Budget Formula)

- **Rule:** PTU Core p.473: "Multiply the average Pokemon Level of PCs by 2 = level budget per player. Multiply by number of trainers = total level budget."
- **Expected behavior:** Budget = avgPokemonLevel * 2 * playerCount
- **Actual behavior:** `calculateEncounterBudget` computes `baselinePerPlayer = avgLevel * 2`, `totalBudget = baselinePerPlayer * players` (`app/utils/encounterBudget.ts:130-146`)
- **Classification:** Correct

### R030 — Significance Multiplier

- **Rule:** PTU Core p.460: Significance tiers scale XP (x1 to x5+)
- **Expected behavior:** Significance presets with multiplier ranges
- **Actual behavior:** `SIGNIFICANCE_PRESETS` defines 5 tiers: insignificant (x1-1.5), everyday (x2-3), significant (x4-4.99), climactic (x5-6.99), legendary (x7-10) (`app/utils/encounterBudget.ts:72-108`)
- **Classification:** Correct
- **Notes:** The app extends beyond PTU's base x1-x5 range by adding climactic (x5-7) and legendary (x7-10) tiers for high-stakes encounters. This is a valid GM tool extension, not an incorrectness.

### R037 — Experience Calculation from Encounters

- **Rule:** PTU Core p.460: Total enemy levels (trainers count double) * significance / player count
- **Expected behavior:** XP = effectiveLevels * multiplier / playerCount
- **Actual behavior:**
  - `calculateEffectiveEnemyLevels`: trainers get `level * 2`, Pokemon get `level * 1` (`app/utils/encounterBudget.ts:152-162`)
  - `calculateEncounterXp`: `totalXp = floor(effectiveLevels * significanceMultiplier)`, `xpPerPlayer = floor(totalXp / playerCount)` (`app/utils/encounterBudget.ts:200-210`)
- **Classification:** Correct

### R035 — Movement Capabilities (Cross-Domain Ref to VTT)

- **Rule:** PTU Core p.231: Movement capabilities (Overland, Swim, Burrow, Sky, etc.)
- **Expected behavior:** Movement capability types implemented in VTT domain
- **Actual behavior:** `combatantCapabilities.ts` provides: `getOverlandSpeed`, `getSwimSpeed`, `getBurrowSpeed`, `getSkySpeed`, `getSpeedForTerrain`, `calculateAveragedSpeed` (`app/utils/combatantCapabilities.ts:62-171`)
- **Classification:** Correct

---

## Tier 5: Partial Items

### R010 — Natural vs Game Weather Distinction

- **Rule:** PTU distinguishes between natural weather (ambient, no game effects) and game weather (mechanical effects — damage, type bonuses, ability interactions)
- **Expected behavior:** Matrix marks this Partial — no distinction between the two.
- **Actual behavior:** The Scene model stores `weather` as a single string. On encounters, `weatherSource` distinguishes between 'move', 'ability', and 'manual' — but this tracks origin, not natural-vs-game distinction. The encounter weather has duration tracking (`weatherDuration`), and manual weather has no auto-expiration (duration=0). This partially captures the distinction: move/ability weather = game weather (auto-expires in 5 rounds), manual weather = could be natural or game (persists until changed). However, there's no explicit "this weather has no mechanical effects" flag.
- **Classification:** Correct (for the present portion)
- **Notes:** The encounter-level weather source tracking is a reasonable approximation. The GM controls whether weather has mechanical effects via manual application. The missing piece is scene-level weather having no game effect flag, which is correctly noted in the matrix as Partial.

### R017/R018 — Slow/Rough Terrain in VTT

- **Rule:** PTU Core p.231: Slow Terrain doubles movement cost. Rough Terrain gives -2 accuracy penalty when targeting through it.
- **Expected behavior:** Matrix marks Partial — VTT has terrain types but labeling and accuracy penalty differ.
- **Actual behavior:**
  - **Slow terrain:** The `slow` flag on cells doubles movement cost via `getMovementCost`: `flags.slow ? baseCost * 2 : baseCost` (`app/stores/terrain.ts:162`). This correctly implements the PTU rule "treat every square meter as two square meters."
  - **Rough terrain:** The `rough` flag exists and `isRoughAt` queries it (`app/stores/terrain.ts:178-180`). However, no automatic -2 accuracy penalty is applied when targeting through rough cells. Per decree-025, endpoint cells should be excluded from the penalty check, but the penalty itself is not implemented.
  - Per decree-010: cells can be both rough and slow simultaneously.
- **Classification:** Approximation (for rough terrain accuracy penalty)
- **Severity:** LOW
- **Details:** Slow terrain movement cost is correct. Rough terrain flag exists for display/query, but the -2 accuracy penalty is not automated. The GM must apply it manually.

### R020 — Naturewalk Terrain Bypass

- **Rule:** PTU p.322: "Pokémon with Naturewalk treat all listed terrains as Basic Terrain" — no movement cost modifier, no accuracy penalty.
- **Expected behavior:** Matrix marks Partial — capability utility exists but not integrated into pathfinding.
- **Actual behavior:**
  - `getCombatantNaturewalks` extracts Naturewalk terrain names from both direct fields and otherCapabilities strings (`app/utils/combatantCapabilities.ts:195-258`)
  - `naturewalkBypassesTerrain` checks if a combatant's Naturewalk applies to a base terrain type (`app/utils/combatantCapabilities.ts:275-291`)
  - `findNaturewalkImmuneStatuses` checks for Slowed/Stuck immunity on matching terrain (`app/utils/combatantCapabilities.ts:321-347`)
  - However, `getMovementCost` in the terrain store does NOT call `naturewalkBypassesTerrain` — pathfinding still charges full terrain cost for Pokemon with Naturewalk.
- **Classification:** Approximation
- **Severity:** LOW
- **Details:** The utility infrastructure is well-built and correct. The gap is integration: the pathfinding cost function doesn't reduce terrain cost for Naturewalk combatants. The status immunity check IS integrated into the status application endpoint. This is a half-integration.

### R038 — Scene Boundary and Frequency Reset

- **Rule:** PTU: Scene-frequency moves reset when a scene ends. Move frequencies should reset at scene boundaries.
- **Expected behavior:** Automatic frequency reset on scene end.
- **Actual behavior:**
  - Scene has `isActive` flag (`app/prisma/schema.prisma:494`)
  - `restoreSceneAp` is called on scene deactivation — restores AP for characters (`app/server/api/scenes/[id]/deactivate.post.ts:32`)
  - `resetSceneUsage` exists and correctly clears scene counters (`app/utils/moveFrequency.ts:234-246`)
  - However, scene deactivation does NOT call `resetSceneUsage` on combatant moves. Frequency resets happen via `new-day` endpoints or when a new encounter is created, not at scene boundaries.
- **Classification:** Correct (for the present portion — isActive tracking + AP restore work)
- **Notes:** The matrix correctly notes this as Partial. Scene deactivation restores AP but does not reset move frequencies. The resetSceneUsage function exists but is not wired to scene end.

### R040 — Weather Duration Constraint

- **Rule:** PTU: Weather from moves lasts 5 rounds. Weather should expire after duration.
- **Expected behavior:** Weather with round-based duration tracking.
- **Actual behavior:**
  - **Encounter-level (implemented):** `weatherDuration` and `weatherSource` fields on Encounter model (`app/prisma/schema.prisma:180-181`). `decrementWeather` in next-turn endpoint reduces duration by 1 per round, clears weather at 0 (`app/server/api/encounters/[id]/next-turn.post.ts:261-274`). Move/ability weather defaults to 5 rounds (`app/server/api/encounters/[id]/weather.post.ts:14,42`). Manual weather persists indefinitely.
  - **Scene-level (missing):** Scene model has no `weatherDuration` field. Scene weather persists until manually changed. No round tracking at scene level.
- **Classification:** Approximation
- **Severity:** MEDIUM
- **Details:** The encounter-level weather duration system is well-implemented and follows PTU rules precisely (5-round default for move/ability weather, manual indefinite). However, the scenes domain has no duration tracking — the matrix classifies this scene rule as Partial, and the encounter-level implementation belongs to the combat domain. Within the scenes domain specifically, weather duration is not tracked.

---

## Additional Implemented Items (Verified Correct)

### R001 — Habitat Type Enumeration
- Scene links to encounter table via `habitatId` field (`app/prisma/schema.prisma:491`). `SceneHabitatPanel` component provides UI.
- **Classification:** Correct

### R002 — Habitat Pokemon Assignment
- Cross-domain via encounter table linkage. Scene's habitatId references an encounter table with weighted Pokemon entries.
- **Classification:** Correct

### R001 (Scene model) — Scene Data Model
- Scene model stores: name, description, locationName, locationImage, pokemon (JSON), characters (JSON), groups (JSON), weather, terrains (JSON), modifiers (JSON), habitatId, isActive. All fields present and functional.
- **Classification:** Correct

---

## Corrected Summary

| Classification | Count |
|----------------|-------|
| Correct        | 19    |
| Incorrect      | 0     |
| Approximation  | 3     |
| Ambiguous      | 0     |
| **Total Audited** | **22** |

### Severity Breakdown

| Severity | Count | Items |
|----------|-------|-------|
| MEDIUM   | 1     | R040 (scene-level weather duration not tracked) |
| LOW      | 2     | R017/R018 (rough terrain -2 accuracy not automated), R020 (Naturewalk not in pathfinding cost) |

---

## Escalation Notes

No Ambiguous items. All active decrees checked:
- decree-003: Verified — enemy-occupied squares as rough terrain is acknowledged in `naturewalkBypassesTerrain` commentary (Naturewalk does NOT bypass enemy-occupied rough)
- decree-008: Verified — water terrain cost is 1 in `TERRAIN_COSTS` (swim speed selection handles the constraint)
- decree-010: Verified — multi-tag terrain system with rough and slow flags on cells
- decree-025: Verified — endpoint cell exclusion from rough terrain accuracy penalty check is noted in comments, though the penalty itself is not yet implemented
