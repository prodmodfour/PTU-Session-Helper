import type { CameraAngle, GridPosition } from '~/types'
import { useIsometricProjection } from '~/composables/useIsometricProjection'

/**
 * Drawable layer types for depth sort ordering.
 * Within the same depth value, items are ordered by layer priority (ascending).
 */
export type DrawableLayer = 'terrain' | 'grid' | 'token' | 'fog'

const LAYER_ORDER: Record<DrawableLayer, number> = {
  terrain: 0,
  grid: 1,
  token: 2,
  fog: 3,
}

/**
 * A drawable item with depth information for painter's algorithm sorting.
 */
export interface Drawable {
  /** World grid X coordinate */
  gridX: number
  /** World grid Y coordinate */
  gridY: number
  /** Elevation (Z-axis) */
  elevation: number
  /** Which rendering layer this belongs to */
  layer: DrawableLayer
  /** Computed depth key for sorting (set by sortDrawables) */
  depth: number
  /** Arbitrary payload for the renderer */
  data: unknown
}

/**
 * Token drawable with additional metadata for multi-cell tokens.
 */
export interface TokenDrawable extends Drawable {
  layer: 'token'
  data: {
    combatantId: string
    size: number
    position: GridPosition
    elevation: number
  }
}

/**
 * Composable for depth-sorting drawables in isometric view.
 *
 * Uses painter's algorithm: lower depth values are drawn first (behind),
 * higher depth values are drawn last (in front).
 *
 * Depth formula: rotatedX + rotatedY + elevation
 * Tie-breaking: terrain < grid < tokens < fog
 *
 * Multi-cell tokens use the back-most cell (lowest rotatedX + rotatedY)
 * to determine depth, ensuring the token is drawn at the correct layer.
 */
export function useDepthSorting() {
  const { rotateCoords } = useIsometricProjection()

  /**
   * Calculate depth key for a single grid cell.
   */
  const getDepth = (
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
   * Calculate depth for a multi-cell token.
   * Uses the back-most cell (minimum rotated sum) so the token
   * is drawn behind objects at the same visual depth.
   */
  const getTokenDepth = (
    position: GridPosition,
    size: number,
    elevation: number,
    angle: CameraAngle,
    gridW: number,
    gridH: number
  ): number => {
    let minDepth = Infinity
    for (let dx = 0; dx < size; dx++) {
      for (let dy = 0; dy < size; dy++) {
        const { rx, ry } = rotateCoords(
          position.x + dx,
          position.y + dy,
          angle,
          gridW,
          gridH
        )
        const cellDepth = rx + ry + elevation
        if (cellDepth < minDepth) {
          minDepth = cellDepth
        }
      }
    }
    return minDepth
  }

  /**
   * Sort an array of drawables by depth for painter's algorithm rendering.
   * Modifies the depth field on each drawable and returns a new sorted array.
   *
   * Sort order:
   * 1. Primary: depth value (ascending — back to front)
   * 2. Secondary: layer order (terrain < grid < tokens < fog)
   */
  const sortDrawables = (
    drawables: Drawable[],
    angle: CameraAngle,
    gridW: number,
    gridH: number
  ): Drawable[] => {
    const sorted = drawables.map(d => {
      const depth = d.layer === 'token' && (d as TokenDrawable).data?.size > 1
        ? getTokenDepth(
            (d as TokenDrawable).data.position,
            (d as TokenDrawable).data.size,
            d.elevation,
            angle,
            gridW,
            gridH
          )
        : getDepth(d.gridX, d.gridY, d.elevation, angle, gridW, gridH)

      return { ...d, depth }
    })

    sorted.sort((a, b) => {
      const depthDiff = a.depth - b.depth
      if (depthDiff !== 0) return depthDiff
      return LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer]
    })

    return sorted
  }

  return {
    getDepth,
    getTokenDepth,
    sortDrawables,
    LAYER_ORDER,
  }
}
