---
review_id: rules-review-153
review_type: rules
reviewer: game-logic-reviewer
trigger: bug-fix
target_report: bug-030
domain: player-view
commits_reviewed:
  - 545a6ed
  - 91670a1
  - 8eadf0e
  - cb66ca0
  - 7d2dd53
  - 8d368b2
mechanics_verified:
  - diagonal-movement
  - grid-coordinate-conversion
  - token-selection
  - movement-validation
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Movement-and-Positioning
reviewed_at: 2026-02-26T06:00:00Z
follows_up: null
---

## Mechanics Verified

### Diagonal Movement (PTU Alternating 1m/2m)

- **Rule:** "Diagonal movement is simple. The first square you move diagonally in a turn counts as 1 meter. The second counts as 2 meters. The third counts as 1 meter again. And so on and so forth." (`core/07-combat.md`, p.232)
- **Implementation:** Touch event handlers (`handleTouchStart`, `handleTouchMove`, `handleTouchEnd` in `useGridInteraction.ts` lines 584-716) only modify viewport state (`panOffset`, `zoom`). They never call `calculateMoveDistance`, `isValidMove`, or `onTokenMove`. The diagonal movement formula in `useGridMovement.ts` and `useRangeParser.ts` is not invoked or bypassed by any touch code path.
- **Status:** CORRECT -- Touch events are viewport-only and cannot alter movement distance calculations.

### Grid Coordinate Conversion (screenToGrid)

- **Rule:** Grid positions must map correctly from screen coordinates so that cell/token selection produces the same result regardless of input device.
- **Implementation:** Touch tap detection (line 694) uses `screenToGrid(changedTouch.clientX, changedTouch.clientY)` -- the exact same function used by mouse click handling (line 167: `screenToGrid(event.clientX, event.clientY)`). The `screenToGrid` function (lines 98-111) applies identical reverse transformations (accounting for container rect, pan offset, and scaled cell size) regardless of whether the coordinates came from a mouse event or touch event. Both `clientX`/`clientY` coordinate systems are identical per W3C spec.
- **Status:** CORRECT -- Touch taps and mouse clicks resolve to the same grid cell for the same screen position.

### Token Selection (Tap vs Click Equivalence)

- **Rule:** Selecting a token or cell should produce the same game-mechanical result regardless of input method (mouse click vs touch tap).
- **Implementation:** Verified both paths produce identical outcomes:
  - **Mouse path (player mode):** `handleMouseUp` (GridCanvas.vue line 317-351) checks click-vs-drag with 5px threshold, computes grid position, emits `playerCellClick` or `playerTokenSelect` via `handleTokenSelectWithPlayerMode`.
  - **Touch path (player mode):** `handleTouchEnd` (useGridInteraction.ts line 690-710) checks tap-vs-pan with 5px threshold (`TOUCH_TAP_THRESHOLD`), computes grid position via `screenToGrid`, finds token via `getTokenAtPosition`, then delegates to `onTouchTap` callback. The callback (GridCanvas.vue lines 244-255) emits the same `playerTokenSelect` (for own tokens) and `playerCellClick` (for empty cells in bounds) events.
  - Both paths use identical bounds checking: `gridPos.x >= 0 && gridPos.x < config.width && gridPos.y >= 0 && gridPos.y < config.height`.
  - Both paths use identical token hit detection: `getTokenAtPosition` checks `position.x` through `position.x + size - 1` on both axes.
- **Status:** CORRECT -- Touch taps produce the same selection events as mouse clicks.

### Movement Validation Isolation

- **Rule:** Movement must always be validated through `isValidMove` (which enforces terrain costs, blocked cells, and PTU diagonal alternation) before executing `onTokenMove`.
- **Implementation:** `onTokenMove` is called exactly once in the composable, at line 223, inside a GM-only block (`if (movingTokenId.value && options.isGm.value)`) within `handleMouseDown`. The touch tap handler never calls `onTokenMove` -- it only calls `handleTokenSelect` (which enters "move mode" selection state) or `onCellClick`. In player mode, the `onTouchTap` callback short-circuits before any move validation by returning `true` (handled), emitting only `playerTokenSelect`/`playerCellClick`. Player mode movement requests go through a separate server-mediated flow, not direct grid movement.
- **Status:** CORRECT -- Touch events cannot execute token movement without going through the full validation pipeline.

## Summary

The touch event implementation (bug-030) is purely a viewport interaction layer. All six commits add input handling code that translates touch gestures into:
1. **Pan offset changes** (single-finger drag modifies `panOffset.value`)
2. **Zoom level changes** (pinch modifies `zoom.value`)
3. **Tap-to-select events** (tap calls same `screenToGrid` + `getTokenAtPosition` pipeline as mouse click)

None of these code paths touch game-mechanical calculations:
- No movement distance computation is invoked or bypassed
- No token position is changed without going through `isValidMove`
- No combat state (HP, conditions, initiative) is affected
- The PTU diagonal movement rule (alternating 1m/2m) remains enforced via `useGridMovement` and `useRangeParser`, which are not called by any touch handler

The `screenToGrid` coordinate conversion function is shared between mouse and touch paths, guaranteeing that the same screen position maps to the same grid cell regardless of input method.

## Rulings

No PTU rule interpretations required. This change is entirely in the input-handling layer and does not implement, modify, or bypass any game mechanic.

## Verdict

**APPROVED** -- Zero PTU mechanics are affected by the touch event implementation. Touch gestures map exclusively to viewport transforms (pan, zoom) and selection events (tap), all of which use the same coordinate conversion and validation pipelines as the existing mouse handlers.

## Required Changes

None.
