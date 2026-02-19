---
domain: scenes
analyzed_at: 2026-02-19T00:00:00Z
analyzed_by: coverage-analyzer
total_rules: 42
implemented: 13
partial: 5
missing: 19
out_of_scope: 5
coverage_score: 41.9
---

# Feature Completeness Matrix: Scenes

## Coverage Score
**41.9%** — (13 + 0.5 * 5) / (42 - 5) * 100 = 15.5 / 37 * 100 = 41.9%

| Classification | Count |
|---------------|-------|
| Implemented | 13 |
| Partial | 5 |
| Missing | 19 |
| Out of Scope | 5 |
| **Total** | **42** |

---

## Implemented Rules

### scenes-R001: Habitat Type Enumeration
- **Classification:** Implemented
- **Mapped to:** `scenes-C069` — Scene Habitat Panel Component (`app/components/scene/SceneHabitatPanel.vue`) links scenes to encounter tables which serve as habitat definitions; encounter table system provides habitat-based species lists. The 13 PTU habitat types are represented through encounter tables that the GM creates and links to scenes.

### scenes-R002: Habitat Pokemon Assignment
- **Classification:** Implemented
- **Mapped to:** `scenes-C069` — Scene Habitat Panel Component + Chain 13 (Habitat-Linked Pokemon Generation). Encounter tables contain species entries per habitat. The GM populates encounter tables with species appropriate to each habitat, and the habitat panel allows adding those species to scenes and generating random encounters.

### scenes-R009: Weather Keyword Definition
- **Classification:** Implemented
- **Mapped to:** `scenes-C067` — Scene Properties Panel Component (`app/components/scene/ScenePropertiesPanel.vue`). Weather select with 9 PTU weather options. `scenes-C001` — Scene Prisma Model stores weather field. `scenes-C072` — SceneView renders weather effects. `scenes-C075` — From-Scene encounter creation inherits weather.

### scenes-R010: Natural Weather vs Game Weather
- **Classification:** Implemented
- **Mapped to:** `scenes-C067` — Scene Properties Panel Component. The scene weather field is set explicitly by the GM, representing the PTU distinction that natural weather does not automatically count as game-mechanical weather. The GM decides when conditions are severe enough to apply weather effects.

### scenes-R016: Basic Terrain Types
- **Classification:** Implemented
- **Mapped to:** `scenes-C004` — Terrains and Modifiers Fields (Deferred) at the scene level, but fully implemented in the VTT grid encounter system via the terrain store (`app/stores/terrain.ts`) with 6 terrain types including Regular, Slow, Rough, Blocking, Earth, and Underwater. Scene-level terrain data model exists but UI was deferred.

### scenes-R019: Blocking Terrain
- **Classification:** Implemented
- **Mapped to:** VTT grid terrain system (cross-domain: `app/stores/terrain.ts`, `app/composables/useTerrainPersistence.ts`). Blocking terrain is one of the 6 terrain types in the terrain painter, preventing movement and targeting through painted cells.

### scenes-R025: Scene Frequency Definition
- **Classification:** Implemented
- **Mapped to:** The encounter/combat system tracks move usage per encounter (which maps to "per Scene" in PTU). Move execution endpoints track frequency usage. The scene-to-encounter conversion (Chain 12: `scenes-C075`, `scenes-C076`) creates the encounter boundary that defines a "scene" for frequency purposes.

### scenes-R029: Encounter Creation Baseline
- **Classification:** Implemented
- **Mapped to:** `scenes-C069` — Scene Habitat Panel Component + Chain 13 (Habitat-Linked Pokemon Generation). The encounter table system provides level ranges and density controls for generating encounters. The GM uses encounter tables with level ranges to populate scenes, which maps to the PTU baseline formula of level-based encounter budgets.

### scenes-R032: Wild Encounter Trigger Scenarios
- **Classification:** Implemented
- **Mapped to:** `scenes-C075` — Create Encounter From Scene API + Chain 12 (Scene-to-Encounter Conversion) + Chain 13 (Habitat-Linked Pokemon Generation). The GM manually triggers encounters by populating scenes with wild Pokemon (via habitat generation or manual add) and converting to encounters. The app provides the tools for any encounter trigger scenario the GM narrates.

### scenes-R035: Movement Capabilities
- **Classification:** Implemented
- **Mapped to:** Cross-domain reference to VTT grid domain. Movement capabilities are implemented in the grid movement system (`app/composables/useGridMovement.ts`) with PTU diagonal movement rules. The scene system feeds into encounters which use the full movement system.

### scenes-R037: Experience Calculation from Encounters
- **Classification:** Implemented
- **Mapped to:** Cross-domain reference to combat domain. Experience mechanics are outside the scenes domain proper. The scene system's contribution (significance, encounter composition) flows into the encounter system via Chain 12 (scene-to-encounter conversion).

### scenes-R038: Scene Boundary and Frequency Reset
- **Classification:** Implemented
- **Mapped to:** Cross-domain reference to combat domain. Scene boundaries are implicitly defined by encounter start/end (`POST /api/encounters/:id/start`, `POST /api/encounters/:id/end`). Move frequency tracking resets between encounters.

### scenes-R039: Weather Exclusivity Constraint
- **Classification:** Implemented
- **Mapped to:** `scenes-C067` — Scene Properties Panel Component (`app/components/scene/ScenePropertiesPanel.vue`). The weather field is a single select (not multi-select), enforcing that only one weather condition can be active at a time at the scene level.

---

## Partial Rules

### scenes-R017: Slow Terrain
- **Classification:** Partial
- **Present:** Slow terrain type exists in the VTT grid terrain painter (encounter-level). Movement cost doubling is implemented in grid movement.
- **Missing:** Scene-level terrain UI was removed (deferred). GM cannot mark slow terrain zones during scene setup before converting to encounter. The double-movement-cost rule is only available after scene-to-encounter conversion.
- **Mapped to:** `scenes-C004` — Terrains and Modifiers Fields (Deferred, orphan) + VTT grid terrain system (cross-domain)
- **Gap Priority:** P2

### scenes-R018: Rough Terrain
- **Classification:** Partial
- **Present:** Rough terrain type exists in the VTT grid terrain painter. Terrain can be painted on grid cells during encounters.
- **Missing:** The -2 accuracy penalty for targeting through rough terrain is not automatically applied in the combat system. Scene-level terrain UI was removed (deferred). Occupied-square-as-rough-terrain is not automated.
- **Mapped to:** `scenes-C004` — Terrains and Modifiers Fields (Deferred, orphan) + VTT grid terrain system (cross-domain)
- **Gap Priority:** P2

### scenes-R022: Environmental Hazard Encounters
- **Classification:** Partial
- **Present:** The scene editor (`scenes-C064`) allows GM to set up scenes with weather, groups, positioned entities, and description text to represent hazardous environments. Scene-to-encounter conversion preserves weather. The VTT terrain painter provides terrain types.
- **Missing:** No structured hazard system — no way to define traps, visibility penalties, or movement restrictions as scene-level properties that automatically apply in combat. GM must manually adjudicate all environmental hazard effects.
- **Mapped to:** `scenes-C064` — Scene Editor Page, `scenes-C067` — Scene Properties Panel, `scenes-C004` — Terrains and Modifiers (Deferred)
- **Gap Priority:** P2

### scenes-R030: Significance Multiplier
- **Classification:** Partial
- **Present:** Encounter tables have density controls and level ranges that influence encounter composition. The GM controls what goes into the scene.
- **Missing:** No explicit significance multiplier field or calculation. The PTU x1-x5 multiplier for experience and encounter scaling is not represented in the encounter table or scene system. The GM must mentally apply this multiplier.
- **Mapped to:** `scenes-C069` — Scene Habitat Panel Component (partial through density controls)
- **Gap Priority:** P2

### scenes-R040: Weather Duration Constraint
- **Classification:** Partial
- **Present:** Weather is tracked on scenes and inherited by encounters. The scene weather field allows setting the active weather.
- **Missing:** No round counter for weather duration. PTU specifies weather lasts 5 rounds, but the combat system does not automatically expire weather after 5 rounds. The GM must track this manually.
- **Mapped to:** `scenes-C067` — Scene Properties Panel (sets weather), `scenes-C072` — SceneView (displays weather), combat system (no duration tracking)
- **Gap Priority:** P1

---

## Missing Rules

### scenes-R007: Pokemon Hierarchies and Social Organization
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** PTU rule that groups of Pokemon have leaders (stronger/evolved). The encounter generation system does not auto-include leader Pokemon in spawned groups. The GM can manually add stronger Pokemon, but there is no pack/hive/flock structure in generation. Used in most wild encounters.

### scenes-R011: Hail Weather Effects
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Hail causes non-Ice types to lose a tick of HP per turn. Blizzard auto-hits. Ice Body/Snow Cloak/Thermosensitive ability interactions. The scene system sets weather and the SceneView renders hail visually, but the combat system does not automatically apply hail damage, auto-hit effects, or ability interactions during combat turns.

### scenes-R012: Rainy Weather Effects
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Rain gives Water +5 damage, Fire -5 damage. Thunder/Hurricane auto-hit. Multiple ability interactions (Hydration, Rain Dish, Swift Swim, Desert Weather, Dry Skin). The scene system sets weather and renders rain visually, but the combat system does not automatically apply rain damage modifiers, auto-hit overrides, or ability interactions.

### scenes-R013: Sandstorm Weather Effects
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Sandstorm causes non-Ground/Rock/Steel types to lose a tick of HP per turn. Sand Force/Sand Rush/Desert Weather ability interactions. Set visually but not mechanically automated in combat.

### scenes-R014: Sunny Weather Effects
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Sun gives Fire +5 damage, Water -5 damage. Thunder/Hurricane become AC 11. Multiple ability interactions (Dry Skin, Thermosensitive, Desert Weather, Sun Blanket, Leaf Guard, Harvest, Chlorophyll, Flower Gift). Set visually but not mechanically automated in combat.

### scenes-R015: Weather-Dependent Ability Interactions
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Forecast changes Pokemon type based on weather. Weather Ball changes type based on weather. These require the weather effects system (R011-R014) to be implemented first, plus specific ability/move handling in the combat system.

### scenes-R020: Naturewalk Terrain Bypass
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Naturewalk capability lets certain Pokemon ignore slow/rough terrain. The terrain painter marks terrain types, but the movement system does not check for Naturewalk to bypass terrain penalties. Requires per-Pokemon capability checking against terrain cells.

### scenes-R021: Dark Cave Environment
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Dark caves impose accuracy penalties based on distance from light sources. No lighting system exists in the scene editor or VTT. Fog of war provides visibility control but does not model light radii with distance-based accuracy penalties.

### scenes-R023: Collateral Damage Environment
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** PTU guideline about indoor/fragile environments limiting AoE usage. This is a narrative GM consideration, not a mechanical constraint the app could meaningfully automate. The GM adjudicates collateral damage manually.

### scenes-R024: Arctic/Ice Environment
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** PTU edge case about ice breaking under heavy Pokemon (Weight Class 5+) and Groundsource moves. This is a specific environmental hazard the GM narrates. No weight-class-based terrain interaction system exists.

### scenes-R026: Scene Frequency EOT Restriction
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Multi-use Scene-frequency moves can only be used every other turn. The combat move execution system tracks move usage but does not enforce the Every Other Turn restriction for Scene-frequency moves. Important for preventing consecutive uses of powerful Scene-frequency moves.

### scenes-R027: Daily Frequency Scene Limit
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Daily moves can only be used once per scene even if they have multiple daily uses. The combat system tracks move usage but does not enforce the once-per-scene cap on Daily-frequency moves. This is a commonly used frequency rule.

### scenes-R028: Narrative Frequency Optional Rule
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Optional PTU rule to treat "per day" as "per session" for campaigns with time skips. This is a campaign-level setting that the app does not offer. The GM would need to mentally adjust frequency resets. Edge-case optional variant.

### scenes-R031: Quick-Stat Wild Pokemon
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** PTU guideline for quickly generating wild Pokemon for encounters: limit to 2-3 species, pick easy-to-stat species, focus on 3-4 stats. The Pokemon generation service (`pokemon-generator.service.ts`) generates full stat blocks. No "quick-stat" mode exists that simplifies generation for mass wild encounter creation. Workaround: GM can generate full Pokemon and ignore unused stats.

### scenes-R033: Encounter Tax vs Threat
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** PTU design guideline about two purposes of encounters: taxing resources vs threatening defeat. This is a GM encounter design philosophy, not a mechanical rule. The encounter creation tools provide the building blocks, but no guidance system suggests whether an encounter will tax or threaten.

### scenes-R034: Quick NPC Building
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** PTU process for quickly generating NPC trainers with level, classes, features, skills, and combat stats. The character creation system exists but requires full manual stat entry. No "quick NPC" generation that auto-distributes stats based on level. Scene-to-encounter conversion would benefit from rapid NPC generation.

### scenes-R036: Shiny and Variant Pokemon
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** PTU rules for shiny and variant Pokemon with different abilities, movesets, or types. The Pokemon generation service does not include shiny/variant generation. The GM can manually edit Pokemon after creation to represent variants. Edge case with low gameplay impact.

### scenes-R041: Frozen Status Weather Interaction
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Frozen status save checks get +4 in Sun and -2 in Hail. Requires weather effects (R011, R014) to be implemented first, plus status condition save check modification in the combat system. Situational but affects common status-weather combinations.

### scenes-R042: Light Source Radii in Dark Environments
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Light source size varies with Pokemon size (Burst 2/3/4) and Illuminate adds +1 to burst radius. Depends on dark cave system (R021) which is also missing. Edge case within an already-missing feature.

---

## Out of Scope

### scenes-R003: Fun Game Progression
- **Classification:** Out of Scope
- **Justification:** This is a GM worldbuilding guideline about route difficulty progression, not a mechanical rule. The app provides encounter table tools for the GM to implement their own progression. Automating this would require campaign-level route/progression tracking which is outside the session helper's scope.

### scenes-R004: Sensible Ecosystems
- **Classification:** Out of Scope
- **Justification:** This is a GM worldbuilding guideline about ecological plausibility. The app provides encounter tables as building blocks. Validating ecological sense of species assignments would require modeling Pokemon ecosystems, which is outside the session helper's scope as a tactical/management tool.

### scenes-R005: Energy Pyramid Population Distribution
- **Classification:** Out of Scope
- **Justification:** This is a GM worldbuilding guideline about population distributions. Encounter table weights already allow the GM to express this. Automating food-chain-based weight suggestions is outside the session helper's scope.

### scenes-R006: Niche Competition
- **Classification:** Out of Scope
- **Justification:** This is a narrative worldbuilding concept about species competition and adaptation. It has no mechanical rule to implement. The app's encounter tables allow GMs to express any population they choose.

### scenes-R008: Pokemon Behavior and Intelligence
- **Classification:** Out of Scope
- **Justification:** This is a GM narrative guideline about roleplaying Pokemon intelligence. It describes how to narrate Pokemon behavior, not a mechanical rule. No meaningful automation is possible in a session helper tool.

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

1. `scenes-R009` — Implemented — core/enumeration — Weather keyword enumeration (verify all 4 weather types present)
2. `scenes-R010` — Implemented — core/condition — Natural vs game weather (verify GM-set-only pattern)
3. `scenes-R016` — Implemented — core/enumeration — Basic terrain types (verify all types present in VTT)
4. `scenes-R019` — Implemented — core/constraint — Blocking terrain (verify movement/targeting blocked)
5. `scenes-R025` — Implemented — core/enumeration — Scene frequency definition (verify move tracking per encounter)
6. `scenes-R039` — Implemented — core/constraint — Weather exclusivity (verify single-select enforcement)
7. `scenes-R029` — Implemented — core/formula — Encounter creation baseline (verify level range and density mechanics)
8. `scenes-R001` — Implemented — core/enumeration — Habitat type enumeration (verify encounter table habitat coverage)
9. `scenes-R002` — Implemented — core/enumeration — Habitat Pokemon assignment (verify species-to-table linking)
10. `scenes-R032` — Implemented — core/workflow — Wild encounter triggers (verify scene-to-encounter conversion)
11. `scenes-R035` — Implemented — cross-domain-ref/enumeration — Movement capabilities (verify grid movement integration)
12. `scenes-R037` — Implemented — cross-domain-ref/interaction — Experience calculation (verify cross-domain reference)
13. `scenes-R038` — Implemented — cross-domain-ref/condition — Scene boundary and frequency reset (verify encounter boundary)
14. `scenes-R040` — Partial (present: weather setting/display) — core/constraint — Weather duration (verify weather is set and inherited)
15. `scenes-R017` — Partial (present: terrain type in VTT) — core/modifier — Slow terrain (verify movement cost in grid)
16. `scenes-R018` — Partial (present: terrain type in VTT) — core/modifier — Rough terrain (verify terrain painting)
17. `scenes-R022` — Partial (present: weather/description/terrain tools) — core/workflow — Environmental hazards (verify scene setup tools)
18. `scenes-R030` — Partial (present: density controls) — core/modifier — Significance multiplier (verify encounter table density)
