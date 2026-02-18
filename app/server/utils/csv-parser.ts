/**
 * CSV Parser Utility
 * Reusable CSV parsing functions extracted from import-csv.post.ts.
 */

/**
 * Parse RFC 4180-compliant CSV content into a 2D string array.
 * Handles quoted fields, escaped quotes, and mixed line endings.
 */
export function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"'
        i++ // Skip next quote
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim())
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
        if (char === '\r') i++ // Skip \n in \r\n
      } else if (char !== '\r') {
        currentCell += char
      }
    }
  }

  // Handle last cell/row
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }

  return rows
}

/**
 * Safely retrieve a trimmed cell value from parsed CSV rows.
 */
export function getCell(rows: string[][], row: number, col: number): string {
  return rows[row]?.[col]?.trim() || ''
}

/**
 * Parse a string into an integer, stripping non-numeric characters.
 * Returns 0 if the value cannot be parsed.
 */
export function parseNumber(val: string): number {
  const num = parseInt(val.replace(/[^0-9-]/g, ''), 10)
  return isNaN(num) ? 0 : num
}
