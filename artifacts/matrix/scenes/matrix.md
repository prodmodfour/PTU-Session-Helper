---
domain: scenes
type: matrix
total_rules: 42
analyzed_at: 2026-02-28T03:00:00Z
analyzed_by: coverage-analyzer
---

# Coverage Matrix: scenes

## Coverage Score

```
Implemented:             17
Implemented-Unreachable:  0
Partial:                  8
Missing:                  5
Subsystem-Missing:        0
Out of Scope:            12

Total:                   42
Scoreable (Total - OoS): 30

Coverage = (17 + 0.5*8) / 30 * 100 = 70.0%
```

## Matrix Table

| Rule ID | Rule Name | Category | Scope | Actor | Classification | Accessible From | Matching Capabilities | Gap Priority | Notes |
|---------|-----------|----------|-------|-------|----------------|-----------------|----------------------|-------------|-------|
| R001 | Habitat Type Enumeration | enumeration | core | gm | Implemented | gm | C001 (Scene.habitatId links to encounter table), C034 (SceneHabitatPanel) | — | Habitats are encounter tables; scene links to one via habitatId |
| R002 | Habitat Pokemon Assignment | enumeration | core | gm | Implemented | gm | C001 (habitatId), C034 (habitat panel), encounter-tables domain | — | Cross-domain via encounter table linkage |
| R003 | Fun Game Progression | constraint | core | gm | Out of Scope | — | — | — | Qualitative world-building principle. Not automatable at scene level. |
| R004 | Sensible Ecosystems | constraint | core | gm | Out of Scope | — | — | — | Qualitative world-building principle. |
| R005 | Energy Pyramid Population Distribution | constraint | situational | gm | Out of Scope | — | — | — | Qualitative ecology guidance. Handled at encounter-table level via weights. |
| R006 | Niche Competition | interaction | situational | gm | Out of Scope | — | — | — | Qualitative ecology guidance. |
| R007 | Pokemon Hierarchies and Social Organization | enumeration | core | gm | Out of Scope | — | — | — | Qualitative encounter design guidance. |
| R008 | Pokemon Behavior and Intelligence | workflow | situational | gm | Out of Scope | — | — | — | Qualitative roleplay guidance. |
| R009 | Weather Keyword Definition | enumeration | core | gm | Implemented | gm, group | C001 (Scene.weather field), C033 (ScenePropertiesPanel — weather dropdown) | — | Weather stored and editable on scene |
| R010 | Natural Weather vs Game Weather | condition | core | gm | Partial | gm | C001 (weather field), C033 (weather selector) | P3 | **Present:** Weather can be set on scene. **Missing:** No distinction between natural weather (no game effects) and game weather (mechanical effects). All weather is treated equally. |
| R011 | Hail Weather Effects | modifier | core | system | Missing | — | — | P2 | No automatic weather damage/effects application. Weather is display-only. |
| R012 | Rainy Weather Effects | modifier | core | system | Missing | — | — | P2 | No auto fire -5/water +5 damage, no Swift Swim/Rain Dish effects. |
| R013 | Sandstorm Weather Effects | modifier | core | system | Missing | — | — | P2 | No auto weather damage to non-Ground/Rock/Steel types. |
| R014 | Sunny Weather Effects | modifier | core | system | Missing | — | — | P2 | No auto fire +5/water -5, no Chlorophyll/Leaf Guard effects. |
| R015 | Weather-Dependent Ability Interactions | interaction | situational | system | Missing | — | — | P2 | No Forecast type change, no Weather Ball type change. |
| R016 | Basic Terrain Types | enumeration | core | gm | Implemented | gm | C001 (Scene.terrains JSON field — stored but UI deferred), VTT terrain store covers encounter-level terrain | — | Terrain types defined; encounter-level terrain via VTT is active. Scene-level terrain UI deferred per SCENE_FUTURE_FEATURES.md. |
| R017 | Slow Terrain | modifier | core | gm | Partial | gm (VTT) | VTT terrain store (terrain domain), C001 (terrains field — UI deferred) | P2 | **Present:** VTT terrain painter has slow terrain equivalent (water, ice types with cost multiplier). **Missing:** Scene-level terrain UI deferred. Movement cost not labeled as "Slow" per PTU terminology. |
| R018 | Rough Terrain | modifier | core | gm | Partial | gm (VTT) | VTT terrain store (rough type with cost multiplier) | P2 | **Present:** VTT terrain painter has rough terrain type. **Missing:** No -2 accuracy penalty auto-application when targeting through rough terrain. Multi-tag terrain per decree-010. |
| R019 | Blocking Terrain | constraint | core | gm | Implemented | gm (VTT) | VTT terrain store (blocked type), pathfinding respects blocked cells | — | Blocked terrain prevents movement in pathfinding |
| R020 | Naturewalk Terrain Bypass | interaction | situational | system | Partial | gm | VTT pathfinding (usePathfinding), C036 (combatantCapabilities) | P2 | **Present:** Combatant capabilities utility exists. **Missing:** Naturewalk bypass not integrated into pathfinding cost. Pokemon with Naturewalk still pay full terrain cost. |
| R021 | Dark Cave Environment | workflow | situational | gm | Out of Scope | — | — | — | Visibility/darkness system not implemented. Would require fog-of-war extension with light sources. |
| R022 | Environmental Hazard Encounters | workflow | core | gm | Partial | gm | C001 (terrains field), VTT terrain painter | P3 | **Present:** Terrain types model some hazards (lava, ice). **Missing:** No custom hazard rules, no interactive environment mechanics. |
| R023 | Collateral Damage Environment | constraint | situational | gm | Out of Scope | — | — | — | Narrative constraint. No destructible environment system. |
| R024 | Arctic/Ice Environment | interaction | edge-case | gm | Out of Scope | — | — | — | Weight-based ice breaking is too specific for automation. |
| R025 | Scene Frequency Definition | enumeration | core | system | Implemented | gm | Combat domain (move frequency tracking on Pokemon) | — | Scene frequency tracked per move. Cross-domain to combat. |
| R026 | Scene Frequency EOT Restriction | constraint | core | system | Implemented | gm | Combat domain (move execution tracks frequency) | — | EOT restriction on Scene-frequency moves enforced in combat. |
| R027 | Daily Frequency Scene Limit | constraint | core | system | Implemented | gm | Combat domain (daily moves limited to once per scene) | — | Daily moves restricted to 1 use per scene in combat. |
| R028 | Narrative Frequency Optional Rule | interaction | edge-case | gm | Out of Scope | — | — | — | Per-session frequency interpretation is a table-level house rule. |
| R029 | Encounter Creation Baseline | formula | core | gm | Implemented | gm | encounter-tables C030 (calculateEncounterBudget) | — | Cross-domain: budget formula in encounter-tables domain. |
| R030 | Significance Multiplier | modifier | core | gm | Implemented | gm | encounter-tables C034 (SIGNIFICANCE_PRESETS), C046 (SignificancePanel) | — | Cross-domain: significance system in encounter-tables domain. |
| R031 | Quick-Stat Wild Pokemon | workflow | situational | gm | Implemented | gm | pokemon-generator.service (generatePokemonData) | — | Pokemon generator handles stat distribution for wild Pokemon. |
| R032 | Wild Encounter Trigger Scenarios | workflow | core | gm | Implemented | gm | C036 (StartEncounterModal — scene-to-encounter conversion) | — | Scene-to-encounter flow supports wild encounter creation from scene context. |
| R033 | Encounter Tax vs Threat | interaction | situational | gm | Out of Scope | — | — | — | Qualitative design philosophy. |
| R034 | Quick NPC Building | workflow | situational | gm | Implemented | gm | character-lifecycle C080 (Quick Create mode for NPCs) | — | Cross-domain: Quick Create mode in character creation for minimal NPC scaffolding. |
| R035 | Movement Capabilities | enumeration | cross-domain-ref | system | Implemented | gm | VTT domain (movement capability types in grid movement) | — | Cross-domain ref to VTT. Movement capabilities implemented there. |
| R036 | Shiny and Variant Pokemon | interaction | edge-case | gm | Partial | gm | pokemon-lifecycle domain (shiny flag on Pokemon) | P3 | **Present:** Shiny flag stored on Pokemon. **Missing:** No variant type/ability/move customization UI for shiny Pokemon. |
| R037 | Experience Calculation from Encounters | interaction | cross-domain-ref | gm | Implemented | gm | encounter-tables C033 (calculateEncounterXp) | — | Cross-domain ref. XP calculation in encounter-tables domain. |
| R038 | Scene Boundary and Frequency Reset | condition | cross-domain-ref | system | Partial | gm | C001 (scene isActive flag), combat domain (frequency tracking) | P2 | **Present:** Scene active state tracked. **Missing:** No automatic frequency reset when scene ends. Move frequencies must be manually reset or via new-day. |
| R039 | Weather Exclusivity Constraint | constraint | core | gm | Implemented | gm | C001 (single weather field per scene), C033 (single dropdown selector) | — | Single weather field naturally enforces exclusivity |
| R040 | Weather Duration Constraint | constraint | core | system | Partial | gm | C001 (weather field) | P2 | **Present:** Weather stored on scene. **Missing:** No 5-round weather duration tracking. Weather persists until manually changed. |
| R041 | Frozen Status Weather Interaction | interaction | situational | system | Out of Scope | — | — | — | Status-weather interaction is combat domain. Frozen save check modifiers belong there. |
| R042 | Light Source Radii in Dark Environments | condition | edge-case | gm | Out of Scope | — | — | — | No darkness/light system. Would require fog-of-war extension. |

## Actor Accessibility Summary

| Actor | Total Rules | Reachable | Unreachable | Out of Scope |
|-------|------------|-----------|-------------|-------------|
| gm | 28 | 20 | 0 | 8 |
| system | 14 | 10 | 0 | 4 |
| player | 0 | 0 | 0 | 0 |

Note: Scenes are GM-managed. The Group View displays active scenes (read-only) and Player View receives updates via WebSocket. No player-initiated scene rules exist in PTU. The Capability Mapper's MS-1 (no player scene interaction) is working as intended.

## Subsystem Gaps

### SG-1: No Weather Effect Automation
- **Missing subsystem:** Automatic application of weather damage and type/ability effects
- **Affected rules:** R011, R012, R013, R014, R015 (5 rules)
- **Priority:** P2
- **Suggested ticket:** "feat: weather effect automation -- damage ticks, type bonuses, ability interactions" -- auto-apply weather damage per turn, fire/water damage modifiers, ability-weather interactions (Swift Swim, Chlorophyll, etc).

### SG-2: Scene-level Terrain UI Deferred
- **Missing subsystem:** Scene-level terrain/modifier editing (DB fields exist, UI removed)
- **Affected rules:** R017, R018 (partial), R022 (partial)
- **Priority:** P2
- **Suggested ticket:** Already documented in docs/SCENE_FUTURE_FEATURES.md. VTT terrain covers encounter-level needs.

## Gap Priorities Summary

| Priority | Count | Rules |
|----------|-------|-------|
| P2 | 8 | R011, R012, R013, R014, R015, R017, R018, R020, R038, R040 |
| P3 | 3 | R010, R022, R036 |

## Auditor Queue

### Tier 1: Core Enumerations
1. **R009** — Weather keyword definition (C001 weather field, C033 dropdown) — verify weather values
2. **R016** — Basic terrain types (VTT terrain store) — verify 6 terrain types
3. **R025/R026/R027** — Scene/Daily frequency (combat domain) — verify frequency tracking and limits

### Tier 2: Core Constraints
4. **R039** — Weather exclusivity (C001 single weather field) — verify single value
5. **R019** — Blocking terrain (VTT pathfinding) — verify movement blocked

### Tier 3: Core Workflows
6. **R032** — Wild encounter trigger (C036 StartEncounterModal) — verify scene-to-encounter conversion
7. **R031** — Quick-stat (pokemon-generator.service) — verify stat distribution
8. **R034** — Quick NPC building (character-lifecycle C080 Quick Create) — verify NPC scaffolding

### Tier 4: Cross-Domain References
9. **R029** — Encounter budget (encounter-tables C030) — verify formula
10. **R030** — Significance multiplier (encounter-tables C034) — verify tiers
11. **R037** — XP calculation (encounter-tables C033) — verify formula
12. **R035** — Movement capabilities (VTT domain) — verify types

### Tier 5: Partial Items
13. **R010** — Natural vs game weather distinction
14. **R017/R018** — Slow/rough terrain in VTT — verify cost multipliers
15. **R020** — Naturewalk bypass — verify capability utility exists
16. **R038** — Scene boundary frequency reset — verify scene active state
17. **R040** — Weather duration — verify persistence behavior
