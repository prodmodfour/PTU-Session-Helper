---
ticket_id: feature-002
title: "3D Isometric Rotatable Grid for VTT"
category: FEATURE
priority: P2
status: in-progress
domain: vtt-grid
design_spec: design-isometric-grid-001
---

# Feature: 3D Isometric Rotatable Grid for VTT

## Description

Replace the current 2D flat Canvas grid with a 3D isometric grid supporting Z-axis elevation and camera rotation. Uses pure Canvas 2D with isometric projection math (no external libraries). The isometric math layer sits between the existing game logic (stores, pathfinding) and the canvas drawing code.

## Phases

- **P0: Rendering Engine + Basic Grid** (implemented)
- **P1: Token Interaction + Movement** (pending)
- **P2: Feature Parity (Fog, Terrain, Measurement)** (pending)

## P0 Acceptance Criteria

- [x] Isometric grid renders with diamond-shaped cells
- [x] Grid dimensions match encounter's gridWidth x gridHeight
- [x] Camera rotates 90 degrees with Q/E keys or buttons
- [x] Background map renders on ground plane
- [x] Zoom and pan work in isometric mode
- [x] Feature flag toggle between 2D and isometric in grid settings
- [ ] Performance: 60fps on a 40x30 grid with no tokens (needs live testing)

## Resolution Log

| Date | Action | Details |
|------|--------|---------|
| 2026-02-23 | P0 implemented | 11 commits on slave/2-dev-feature-002-p0-20260223-083000 |

### P0 Commits

| Commit | Description |
|--------|-------------|
| 57fbe6c | feat: add CameraAngle type and isometric fields to GridConfig |
| f0f096d | feat: add isometric grid columns to Prisma schema and server endpoints |
| d11af9c | feat: add useIsometricProjection composable with projection math |
| 98fb80e | feat: add isometricCamera Pinia store for shared camera state |
| 2bf4501 | feat: add useIsometricCamera composable for camera control |
| 64232d7 | feat: add useIsometricRendering composable for grid render loop |
| 1ceb1f4 | feat: add CameraControls component for isometric rotation |
| f3fb768 | feat: add IsometricCanvas component with camera controls and pan/zoom |
| 5398162 | feat: wire isometric feature flag in VTTContainer and GridSettingsPanel |
| aa5b15e | fix: correct diamond tile geometry and rendering performance |
| abb8dd4 | fix: reuse projection composable instance in IsometricCanvas |

### P0 Files Changed

**New files (6):**
- `app/composables/useIsometricProjection.ts` (206 lines)
- `app/composables/useIsometricCamera.ts` (148 lines)
- `app/composables/useIsometricRendering.ts` (256 lines)
- `app/stores/isometricCamera.ts` (64 lines)
- `app/components/vtt/IsometricCanvas.vue` (298 lines)
- `app/components/vtt/CameraControls.vue` (105 lines)

**Modified files (6):**
- `app/types/spatial.ts` (+8 lines)
- `app/prisma/schema.prisma` (+10 lines)
- `app/server/services/encounter.service.ts` (+5 lines)
- `app/server/api/encounters/[id]/grid-config.put.ts` (+6 lines)
- `app/components/vtt/VTTContainer.vue` (+39 lines)
- `app/components/vtt/GridSettingsPanel.vue` (+45 lines)
