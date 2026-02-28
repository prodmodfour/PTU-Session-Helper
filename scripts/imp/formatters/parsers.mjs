import { readFileSync } from 'node:fs'

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return { frontmatter: {}, body: content }

  const raw = match[1]
  const frontmatter = {}
  let currentKey = null

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue

    // Top-level key: value
    const kvMatch = line.match(/^(\w[\w_-]*)\s*:\s*(.*)$/)
    if (kvMatch) {
      currentKey = kvMatch[1]
      const value = parseYamlValue(kvMatch[2].trim())
      frontmatter[currentKey] = value
      continue
    }

    // Array item under current key
    const arrMatch = line.match(/^\s+-\s+(.*)$/)
    if (arrMatch && currentKey) {
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = []
      }
      frontmatter[currentKey].push(parseYamlValue(arrMatch[1].trim()))
      continue
    }

    // Nested key: value
    const nestedMatch = line.match(/^\s+(\w[\w_-]*)\s*:\s*(.*)$/)
    if (nestedMatch && currentKey) {
      if (typeof frontmatter[currentKey] !== 'object' || Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = {}
      }
      frontmatter[currentKey][nestedMatch[1]] = parseYamlValue(nestedMatch[2].trim())
    }
  }

  const body = content.slice(match[0].length).trim()
  return { frontmatter, body }
}

function parseYamlValue(str) {
  if (!str || str === 'null' || str === '~') return null
  if (str === 'true') return true
  if (str === 'false') return false
  if (/^-?\d+$/.test(str)) return parseInt(str, 10)
  if (/^-?\d+\.\d+$/.test(str)) return parseFloat(str)
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1)
  }
  if (str.startsWith('[') && str.endsWith(']')) {
    return str.slice(1, -1).split(',').map(s => parseYamlValue(s.trim()))
  }
  return str
}

export function parseMarkdownTable(content) {
  const lines = content.split('\n')
  const rows = []
  let headers = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    if (trimmed.match(/^\|[\s-:|]+\|$/)) continue // separator row

    const cells = trimmed
      .split('|')
      .slice(1, -1) // remove leading/trailing empty from split
      .map(c => c.trim())

    if (!headers) {
      headers = cells
    } else {
      const row = {}
      cells.forEach((cell, i) => {
        if (headers[i]) row[headers[i]] = cell
      })
      rows.push(row)
    }
  }

  return { headers: headers || [], rows }
}

export function readJsonSafe(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

export function readFileSafe(filePath) {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

export function extractSection(content, heading) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^##?#?\\s+${escapedHeading}\\s*$`, 'm')
  const match = content.match(regex)
  if (!match) return null

  const start = match.index + match[0].length
  const rest = content.slice(start)
  const nextHeading = rest.match(/^##?#?\s+/m)
  const end = nextHeading ? nextHeading.index : rest.length
  return rest.slice(0, end).trim()
}
