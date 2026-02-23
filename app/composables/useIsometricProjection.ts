import type { CameraAngle } from '~/types'

/**
 * Pure math composable for isometric projection.
 * Converts between world grid coordinates (x, y, z) and screen pixel positions.
 * All functions are stateless — camera angle and grid dimensions are passed as params.
 *
 * Tile ratio is 2:1 (width:height). A diamond tile with cellSize=40 is 80px wide, 40px tall.
 * The half-widths used in projection are: tileHalfW = cellSize, tileHalfH = cellSize / 2.
 */
export function useIsometricProjection() {

  /**
   * Rotate grid coordinates based on camera angle.
   * Angle 0 = default (north-up), 1 = 90deg CW, 2 = 180deg, 3 = 270deg CW.
   */
  const rotateCoords = (
    x: number,
    y: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number
  ): { rx: number; ry: number } => {
    switch (angle) {
      case 0: return { rx: x, ry: y }
      case 1: return { rx: gridH - 1 - y, ry: x }
      case 2: return { rx: gridW - 1 - x, ry: gridH - 1 - y }
      case 3: return { rx: y, ry: gridW - 1 - x }
    }
  }

  /**
   * Reverse the rotation applied by rotateCoords.
   * Given rotated coordinates, recover the original (x, y).
   */
  const unrotateCoords = (
    rx: number,
    ry: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number
  ): { x: number; y: number } => {
    switch (angle) {
      case 0: return { x: rx, y: ry }
      case 1: return { x: ry, y: gridH - 1 - rx }
      case 2: return { x: gridW - 1 - rx, y: gridH - 1 - ry }
      case 3: return { x: gridW - 1 - ry, y: rx }
    }
  }

  /**
   * Project world grid coordinates to screen pixel coordinates.
   * Returns the center-top of the isometric diamond for the cell.
   *
   * @param gridX - World grid X coordinate
   * @param gridY - World grid Y coordinate
   * @param elevation - Z-axis elevation (0 = ground)
   * @param angle - Camera rotation angle (0-3)
   * @param gridW - Grid width in cells
   * @param gridH - Grid height in cells
   * @param cellSize - Size of a cell in pixels
   */
  const worldToScreen = (
    gridX: number,
    gridY: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ): { px: number; py: number } => {
    const tileHalfW = cellSize
    const tileHalfH = cellSize / 2
    const elevationHeight = cellSize / 2

    const { rx, ry } = rotateCoords(gridX, gridY, angle, gridW, gridH)
    return {
      px: (rx - ry) * tileHalfW,
      py: (rx + ry) * tileHalfH - elevation * elevationHeight
    }
  }

  /**
   * Inverse projection: screen pixel coordinates to world grid coordinates.
   * Assumes the target is at the given elevation level.
   *
   * @param px - Screen X in world-space (before camera pan/zoom)
   * @param py - Screen Y in world-space (before camera pan/zoom)
   * @param angle - Camera rotation angle (0-3)
   * @param gridW - Grid width in cells
   * @param gridH - Grid height in cells
   * @param cellSize - Size of a cell in pixels
   * @param elevation - Assumed elevation of the target plane (default 0)
   */
  const screenToWorld = (
    px: number,
    py: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number,
    elevation: number = 0
  ): { x: number; y: number } => {
    const tileHalfW = cellSize
    const tileHalfH = cellSize / 2
    const elevationHeight = cellSize / 2

    const adjustedPy = py + elevation * elevationHeight
    const rx = (px / tileHalfW + adjustedPy / tileHalfH) / 2
    const ry = (adjustedPy / tileHalfH - px / tileHalfW) / 2

    return unrotateCoords(Math.floor(rx), Math.floor(ry), angle, gridW, gridH)
  }

  /**
   * Compute a depth sort key for painter's algorithm rendering.
   * Higher depth = drawn later (in front). Objects at the same depth
   * are ordered: terrain < grid lines < tokens < fog.
   *
   * Uses rotated coordinates so depth is always relative to the camera.
   */
  const getDepthKey = (
    gridX: number,
    gridY: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number
  ): number => {
    const { rx, ry } = rotateCoords(gridX, gridY, angle, gridW, gridH)
    return rx + ry + elevation
  }

  /**
   * Get the four corner points of an isometric diamond tile in screen space.
   * Returns points in order: top, right, bottom, left (clockwise from top).
   *
   * The diamond for cell (x, y) has its corners at the grid intersection
   * points of the four adjacent cells:
   *   Top:    worldToScreen(x, y)
   *   Right:  worldToScreen(x+1, y)
   *   Bottom: worldToScreen(x+1, y+1)
   *   Left:   worldToScreen(x, y+1)
   */
  const getTileDiamondPoints = (
    gridX: number,
    gridY: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number,
    cellSize: number
  ): { top: { x: number; y: number }; right: { x: number; y: number }; bottom: { x: number; y: number }; left: { x: number; y: number } } => {
    const top = worldToScreen(gridX, gridY, elevation, angle, gridW, gridH, cellSize)
    const right = worldToScreen(gridX + 1, gridY, elevation, angle, gridW, gridH, cellSize)
    const bottom = worldToScreen(gridX + 1, gridY + 1, elevation, angle, gridW, gridH, cellSize)
    const left = worldToScreen(gridX, gridY + 1, elevation, angle, gridW, gridH, cellSize)

    return {
      top: { x: top.px, y: top.py },
      right: { x: right.px, y: right.py },
      bottom: { x: bottom.px, y: bottom.py },
      left: { x: left.px, y: left.py }
    }
  }

  /**
   * Calculate the canvas offset needed to center the isometric grid.
   * The isometric grid extends in both negative and positive X directions,
   * so we need an offset to keep everything visible.
   */
  const getGridOriginOffset = (
    gridW: number,
    gridH: number,
    cellSize: number,
    angle: CameraAngle
  ): { ox: number; oy: number } => {
    // Calculate bounding box of the isometric grid
    // Check all four corners of the grid to find min/max screen positions
    const corners = [
      worldToScreen(0, 0, 0, angle, gridW, gridH, cellSize),
      worldToScreen(gridW - 1, 0, 0, angle, gridW, gridH, cellSize),
      worldToScreen(0, gridH - 1, 0, angle, gridW, gridH, cellSize),
      worldToScreen(gridW - 1, gridH - 1, 0, angle, gridW, gridH, cellSize)
    ]

    const minPx = Math.min(...corners.map(c => c.px))

    // Offset so the leftmost point starts at x=cellSize (padding)
    const ox = -minPx + cellSize
    // Add some top padding
    const oy = cellSize

    return { ox, oy }
  }

  return {
    rotateCoords,
    unrotateCoords,
    worldToScreen,
    screenToWorld,
    getDepthKey,
    getTileDiamondPoints,
    getGridOriginOffset
  }
}
