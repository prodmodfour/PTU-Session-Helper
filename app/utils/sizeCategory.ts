/**
 * PTU Size Category definitions.
 *
 * Size categories determine a combatant's grid footprint:
 * - Small/Medium: 1x1 (1 cell)
 * - Large: 2x2 (4 cells)
 * - Huge: 3x3 (9 cells)
 * - Gigantic: 4x4 (16 cells)
 *
 * Ref: PTU Core Chapter 7, p.231 (vtt-grid-R003)
 */

export type SizeCategory = 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gigantic'

/** Map from PTU size category to grid footprint (cells per side). */
export const SIZE_FOOTPRINT_MAP: Record<SizeCategory, number> = {
  Small: 1,
  Medium: 1,
  Large: 2,
  Huge: 3,
  Gigantic: 4,
}

/**
 * Convert a PTU size category string to token footprint size.
 * Returns 1 for unknown/undefined sizes.
 */
export function sizeToFootprint(size: string | undefined | null): number {
  if (!size) return 1
  return SIZE_FOOTPRINT_MAP[size as SizeCategory] ?? 1
}

/**
 * Get all cells occupied by a token at the given position with the given size.
 * Position is the top-left (min x, min y) cell.
 */
export function getFootprintCells(
  x: number,
  y: number,
  size: number
): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = []
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: x + dx, y: y + dy })
    }
  }
  return cells
}

/**
 * Check if all cells of a footprint are within grid bounds.
 */
export function isFootprintInBounds(
  x: number,
  y: number,
  size: number,
  gridWidth: number,
  gridHeight: number
): boolean {
  return x >= 0 && y >= 0 &&
         x + size <= gridWidth &&
         y + size <= gridHeight
}
