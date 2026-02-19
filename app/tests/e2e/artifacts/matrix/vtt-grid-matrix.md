---
domain: vtt-grid
analyzed_at: 2026-02-19T00:00:00Z
analyzed_by: coverage-analyzer
total_rules: 42
implemented: 10
partial: 5
missing: 27
out_of_scope: 0
coverage_score: 29.8
---

# Feature Completeness Matrix: VTT Grid

## Coverage Score
**29.8%** — (10 + 0.5 * 5) / (42 - 0) * 100

| Classification | Count |
|---------------|-------|
| Implemented | 10 |
| Partial | 5 |
| Missing | 27 |
| Out of Scope | 0 |
| **Total** | **42** |

---

## Implemented Rules

### vtt-grid-R001: Square Grid System
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C001` — Encounter Grid Enabled Flag (`prisma/schema.prisma:Encounter.gridEnabled`), `vtt-grid-C002` — Encounter Grid Dimensions (`prisma/schema.prisma:Encounter.gridWidth,gridHeight,gridCellSize`), `vtt-grid-C087` — Grid Canvas Component (`components/vtt/GridCanvas.vue`)

### vtt-grid-R002: Grid Scale (1 Meter Per Square)
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C002` — Encounter Grid Dimensions (`prisma/schema.prisma:Encounter.gridWidth,gridHeight,gridCellSize`), `vtt-grid-C041` — Terrain Cost Constants (`stores/terrain.ts:TERRAIN_COSTS`), `vtt-grid-C051` — PTU Diagonal Move Distance (`composables/useGridMovement.ts:calculateMoveDistance`), `vtt-grid-C045` — Measurement Distance Getter (`stores/measurement.ts:distance`)

### vtt-grid-R003: Size Category Footprints
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C012` — Size-to-Token Mapping (`server/services/grid-placement.service.ts:sizeToTokenSize`) — Small/Medium=1x1, Large=2x2, Huge=3x3, Gigantic=4x4

### vtt-grid-R004: Movement Via Shift Actions
- **Classification:** Implemented
- **Mapped to:** Chain 1 (Token Movement click-to-move), `vtt-grid-C055` — Validate Move (`composables/useGridMovement.ts:isValidMove`), `vtt-grid-C052` — Get Movement Speed (`composables/useGridMovement.ts:getSpeed`), `vtt-grid-C015` — Update Combatant Position Store (`stores/encounterGrid.ts:updateCombatantPosition`)

### vtt-grid-R005: Diagonal Movement Cost (Alternating 1m/2m)
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C051` — PTU Diagonal Move Distance (`composables/useGridMovement.ts:calculateMoveDistance`), `vtt-grid-C085` — Calculate Move Cost (`composables/useRangeParser.ts:calculateMoveCost`), `vtt-grid-C082` — Dijkstra Movement Range (`composables/useRangeParser.ts:getMovementRangeCells`)

### vtt-grid-R006: Adjacency Definition
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C045` — Measurement Distance Getter (`stores/measurement.ts:distance`) — Chebyshev distance for diagonal adjacency, `vtt-grid-C079` — Parse PTU Range String (`composables/useRangeParser.ts:parseRange`) — handles "Cardinally Adjacent" as distinct from standard adjacency

### vtt-grid-R007: No Split Movement
- **Classification:** Implemented
- **Mapped to:** Chain 1 (Token Movement click-to-move) — the click-to-move interaction model enforces atomic movement from origin to destination with no mid-move action interruption

### vtt-grid-R014: Slow Terrain
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C041` — Terrain Cost Constants (`stores/terrain.ts:TERRAIN_COSTS`) — difficult=2 (double movement cost), `vtt-grid-C040` — Terrain Cell Getters (`stores/terrain.ts:getMovementCost`), Chain 2 (Movement Range Display)

### vtt-grid-R016: Blocking Terrain
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C041` — Terrain Cost Constants (`stores/terrain.ts:TERRAIN_COSTS`) — blocking=Infinity, `vtt-grid-C040` — Terrain Cell Getters (`stores/terrain.ts:isPassable`)

### vtt-grid-R021: Melee Range (Adjacency)
- **Classification:** Implemented
- **Mapped to:** `vtt-grid-C079` — Parse PTU Range String (`composables/useRangeParser.ts:parseRange`) — parses "Melee" as range type, `vtt-grid-C080` — Check Range (`composables/useRangeParser.ts:isInRange`) — validates Chebyshev distance=1 for melee

---

## Partial Rules

### vtt-grid-R012: Basic Terrain Types
- **Classification:** Partial
- **Present:** 4 of the PTU core terrain types are represented: Regular (as "normal"), Slow (as "difficult"), Blocking, and Underwater (as "water"). Terrain painting, persistence, rendering, and movement cost integration are all functional (Chains 6, 7).
- **Missing:** Earth terrain type (underground terrain requiring Burrow capability) is not in the app's terrain type enum. The app adds "hazard" and "elevated" types which are useful but not from PTU core terrain rules.
- **Mapped to:** `vtt-grid-C032` — Terrain Paint Mode (`stores/terrain.ts:setPaintMode`), `vtt-grid-C041` — Terrain Cost Constants (`stores/terrain.ts:TERRAIN_COSTS`)
- **Gap Priority:** P2

### vtt-grid-R013: Movement Capability Types
- **Classification:** Partial
- **Present:** The type system defines all 6 PTU movement capabilities (overland, swim, sky, burrow, levitate, teleport) in `MovementSpeeds` within `vtt-grid-C098`.
- **Missing:** The movement validation system (`vtt-grid-C052` getSpeed) only uses a single speed value from a callback rather than selecting from the appropriate movement capability based on terrain context. A combatant on water should use Swim speed, in air should use Sky speed, etc.
- **Mapped to:** `vtt-grid-C098` — VTT Spatial Types (`types/spatial.ts:MovementSpeeds`), `vtt-grid-C052` — Get Movement Speed (`composables/useGridMovement.ts:getSpeed`)
- **Gap Priority:** P1

### vtt-grid-R022: Stuck Condition (No Movement)
- **Classification:** Partial
- **Present:** Stuck status can be tracked on combatants via the encounter status system (combat domain).
- **Missing:** The VTT grid movement validation (`vtt-grid-C055` isValidMove) does not check for Stuck status. A Stuck combatant can still be moved on the grid.
- **Mapped to:** `vtt-grid-C055` — Validate Move (`composables/useGridMovement.ts:isValidMove`)
- **Gap Priority:** P1

### vtt-grid-R028: Sprint Maneuver
- **Classification:** Partial
- **Present:** Sprint exists as a combat maneuver in the encounter system. The maneuver can be executed during combat.
- **Missing:** The +50% movement speed bonus from Sprint is not applied to the VTT movement range display (`vtt-grid-C068`) or movement validation (`vtt-grid-C055`). After executing Sprint, the token's movement range on the grid should increase by 50%.
- **Mapped to:** `vtt-grid-C052` — Get Movement Speed (`composables/useGridMovement.ts:getSpeed`), `vtt-grid-C068` — Movement Range Rendering (`composables/useGridRendering.ts:drawMovementRange`)
- **Gap Priority:** P1

### vtt-grid-R029: Push Maneuver
- **Classification:** Partial
- **Present:** Push exists as a combat maneuver in the encounter system with accuracy checks.
- **Missing:** Forced movement on the VTT grid is not implemented. When Push succeeds, the target token should be moved 1 meter away, and the pusher should optionally advance into the vacated space. The grid has no forced-movement API.
- **Mapped to:** `vtt-grid-C004` — Update Combatant Position (`server/api/encounters/[id]/position.post.ts`), `vtt-grid-C015` — Update Combatant Position Store (`stores/encounterGrid.ts:updateCombatantPosition`)
- **Gap Priority:** P1

---

## Missing Rules

### vtt-grid-R008: Mixed Movement Capabilities
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Averaging two movement capabilities when traversing different terrain types in one turn is a situational rule. The app uses a single speed value. Workaround: GM can manually set a token's effective speed.

### vtt-grid-R009: Jump Capability Movement
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Jump consumes distance from the main capability or can be used as a standalone shift. No jump mechanic exists. Workaround: GM manually moves token.

### vtt-grid-R010: Custom Size Shapes
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Custom shapes (e.g., 8x2 for serpentine Pokemon) are explicitly described as optional in the rulebook. Square footprints via R003 cover the standard case.

### vtt-grid-R011: Small Pokemon Space Sharing
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Small Pokemon sharing a space with one Medium/Small combatant. The collision detection system blocks all overlap. Workaround: GM can position tokens adjacent instead.

### vtt-grid-R015: Rough Terrain
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Rough Terrain imposes -2 accuracy penalty and enemy-occupied squares count as Rough. This is a core combat modifier with no equivalent in the app. The "difficult" terrain type only handles the movement cost aspect of Slow terrain, not the accuracy penalty of Rough.

### vtt-grid-R017: Naturewalk Capability
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Naturewalk lets certain Pokemon ignore specific terrain penalties. Requires per-Pokemon capability data and terrain-type matching. Workaround: GM mentally ignores terrain cost.

### vtt-grid-R018: Flanking
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Flanking is a core combat mechanic granting -2 evasion when surrounded by foes. Requires spatial analysis of token positions relative to each other. No flanking detection or evasion modifier exists.

### vtt-grid-R019: Flanking — Large Combatant Multi-Square Counting
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Extension of flanking for multi-cell tokens counting occupied adjacent squares. Depends on R018 being implemented first.

### vtt-grid-R020: Flanking Self-Flank Prevention
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Constraint that a single combatant cannot flank alone. Depends on R018 being implemented first.

### vtt-grid-R023: Ghost Type Stuck/Trapped Immunity
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Ghost types cannot be Stuck or Trapped. Requires type-based status immunity checking in the movement system. Depends on R022 being fully implemented first.

### vtt-grid-R024: Slowed Condition (Half Movement)
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Slowed halves all movement (minimum 1). The VTT movement system does not read status conditions to modify speed. This is a commonly applied condition in combat.

### vtt-grid-R025: Tripped Condition (Stand Up Cost)
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** A tripped combatant must spend a Shift Action standing up before taking further actions. No stand-up mechanic exists on the VTT grid. Trip is a common maneuver.

### vtt-grid-R026: Speed Combat Stages Affect Movement
- **Classification:** Missing
- **Gap Priority:** P0
- **Notes:** Speed CS directly modifies movement speeds (+/- half CS value). This is a fundamental PTU mechanic that applies every time combat stages change. The VTT movement range display and validation should reflect current Speed CS. The combat system tracks stages but the VTT does not consume them for movement.

### vtt-grid-R027: Speed CS Movement Floor
- **Classification:** Missing
- **Gap Priority:** P0
- **Notes:** Negative Speed CS cannot reduce movement below 2. Paired with R026 — once Speed CS affects movement, this floor must be enforced. Core constraint preventing immobilization via stage reduction.

### vtt-grid-R030: Disengage Maneuver
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Disengage allows 1 meter shift without provoking AoO. Depends on AoO system (R031) existing. Without AoO, Disengage has no distinct meaning from normal movement.

### vtt-grid-R031: Attack of Opportunity (Movement Trigger)
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** AoO triggers when an adjacent foe shifts away. This is a core combat mechanic that creates tactical depth on the grid. No AoO detection or prompting exists.

### vtt-grid-R032: Throwing Range
- **Classification:** Missing
- **Gap Priority:** P1
- **Notes:** Throwing Range = 4 + Athletics rank in meters. Used for Poke Ball throws and item usage. The capture system exists but does not enforce grid distance for throws.

### vtt-grid-R033: Recall Beam Range
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** 8-meter recall beam range limits when trainers can switch/recall Pokemon. The encounter system allows switching without range validation.

### vtt-grid-R034: Reach Capability
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Reach extends melee range (Small/Medium to 2m, Large+ to 3m). The range parser handles melee as adjacency but does not check for Reach capability on the attacker.

### vtt-grid-R035: Blindness Movement Penalty
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Blinded combatants must make Acrobatics checks on Rough/Slow terrain or become Tripped. Edge case interaction between status and terrain. Rare in practice.

### vtt-grid-R036: Total Blindness Movement
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Totally blinded combatants have special directional movement rules with trip risk on all non-regular terrain. Very rare edge case.

### vtt-grid-R037: Teleporter Movement Constraints
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Teleporter has unique constraints: one per round, line of sight required, must end touching surface, cannot benefit from Sprint. The type exists in MovementSpeeds but no constraints are enforced.

### vtt-grid-R038: Levitate Maximum Height
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Max levitate height = half of Levitate capability. The VTT is 2D with no height tracking. This rule is only relevant if vertical combat is needed.

### vtt-grid-R039: Phasing Capability
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Phasing ignores Slow terrain penalties and allows intangibility as a Standard Action. Requires per-Pokemon capability checking during movement. Workaround: GM mentally ignores terrain.

### vtt-grid-R040: Falling Damage By Distance and Weight
- **Classification:** Missing
- **Gap Priority:** P3
- **Notes:** Falling damage formula based on distance and weight class. The VTT is 2D with no height tracking. Would only apply if vertical terrain/elevation is added.

### vtt-grid-R041: Intercept Melee (Movement-Based)
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Complex interrupt mechanic requiring movement range calculation, Acrobatics/Athletics check, and forced movement. Requires interrupt system and spatial validation.

### vtt-grid-R042: Intercept Ranged (Movement-Based)
- **Classification:** Missing
- **Gap Priority:** P2
- **Notes:** Ranged intercept requires identifying a square between attacker and target within movement range. Requires line-of-attack geometry and movement validation.

---

## Out of Scope

(No rules classified as Out of Scope.)

---

## Auditor Queue

Ordered list of items for the Implementation Auditor to check:

### Implemented Items (verify correctness)

1. `vtt-grid-R001` — Implemented — core/constraint — Square Grid System
2. `vtt-grid-R002` — Implemented — core/constraint — Grid Scale (1 Meter Per Square)
3. `vtt-grid-R005` — Implemented — core/formula — Diagonal Movement Cost (Alternating 1m/2m)
4. `vtt-grid-R006` — Implemented — core/condition — Adjacency Definition
5. `vtt-grid-R003` — Implemented — core/enumeration — Size Category Footprints
6. `vtt-grid-R004` — Implemented — core/workflow — Movement Via Shift Actions
7. `vtt-grid-R007` — Implemented — core/constraint — No Split Movement
8. `vtt-grid-R021` — Implemented — core/condition — Melee Range (Adjacency)
9. `vtt-grid-R014` — Implemented — core/modifier — Slow Terrain
10. `vtt-grid-R016` — Implemented — core/constraint — Blocking Terrain

### Partial Items (verify present portion)

11. `vtt-grid-R012` — Partial (present: normal/difficult/blocking/water terrain types) — core/enumeration — Basic Terrain Types
12. `vtt-grid-R013` — Partial (present: MovementSpeeds type definitions) — core/enumeration — Movement Capability Types
13. `vtt-grid-R022` — Partial (present: Stuck status tracking in combat) — core/condition — Stuck Condition
14. `vtt-grid-R028` — Partial (present: Sprint maneuver execution) — core/modifier — Sprint Maneuver
15. `vtt-grid-R029` — Partial (present: Push maneuver execution) — core/interaction — Push Maneuver
