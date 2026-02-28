import { execSync } from 'node:child_process'

/**
 * Send a message to a tmux pane using send-keys.
 * Matches the pattern from launch-slaves.sh:
 *   tmux send-keys -t <target> -l <text>
 *   sleep 0.5
 *   tmux send-keys -t <target> -H 0D
 */
export function sendToPane(target, message) {
  try {
    // Send the text literally
    execSync(`tmux send-keys -t "${target}" -l ${shellEscape(message)}`, {
      timeout: 5000,
    })

    // Send Enter (raw carriage return byte 0x0D)
    execSync(`tmux send-keys -t "${target}" -H 0D`, {
      timeout: 5000,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function shellEscape(str) {
  // Wrap in single quotes, escaping any internal single quotes
  return "'" + str.replace(/'/g, "'\\''") + "'"
}
