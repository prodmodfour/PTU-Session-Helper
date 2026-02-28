import { execSync } from 'node:child_process'

/**
 * Query tmux for active slave panes.
 * Returns array of { name, target, pid }.
 */
export function getActiveSlavePanes() {
  try {
    const output = execSync(
      'tmux list-windows -t slaves -F "#{window_name} #{window_index}"',
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()

    if (!output) return []

    return output.split('\n').map(line => {
      const [name, index] = line.split(' ')
      return {
        name,
        target: `slaves:${name}`,
        index: parseInt(index, 10),
      }
    })
  } catch {
    return []
  }
}

/**
 * Check if a specific slave pane exists.
 */
export function paneExists(paneName) {
  const panes = getActiveSlavePanes()
  return panes.some(p => p.name === paneName || p.target === paneName)
}

/**
 * Resolve a user-provided target to a tmux target string.
 * Accepts: "slave-1", "1", "slaves:slave-1"
 */
export function resolveTarget(input) {
  const trimmed = input.trim()

  // Already fully qualified
  if (trimmed.startsWith('slaves:')) return trimmed

  // Just a number
  if (/^\d+$/.test(trimmed)) return `slaves:slave-${trimmed}`

  // "slave-N" format
  if (/^slave-\d+$/.test(trimmed)) return `slaves:${trimmed}`

  return `slaves:${trimmed}`
}
