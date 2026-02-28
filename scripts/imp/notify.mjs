#!/usr/bin/env node

/**
 * CLI entry point for sending notifications to the Imp daemon.
 * Usage: node scripts/imp/notify.mjs <event_type> [json_data]
 *
 * Always exits 0, even if the daemon is down (non-blocking).
 * This ensures skills never fail because Imp is unavailable.
 */

import { createConnection } from 'node:net'

const socketPath = process.env.IMP_SOCKET_PATH || '/tmp/imp-notify.sock'
const eventType = process.argv[2]
const rawData = process.argv[3]

if (!eventType) {
  console.error('Usage: node scripts/imp/notify.mjs <event_type> [json_data]')
  console.error('Example: node scripts/imp/notify.mjs test \'{"message":"hello"}\'')
  process.exit(0) // still exit 0
}

let data = {}
if (rawData) {
  try {
    data = JSON.parse(rawData)
  } catch {
    data = { message: rawData }
  }
}

const event = JSON.stringify({ type: eventType, data }) + '\n'

const conn = createConnection(socketPath)

conn.on('connect', () => {
  conn.write(event, () => {
    conn.end()
  })
})

conn.on('error', () => {
  // Daemon not running — silently exit
  process.exit(0)
})

conn.on('end', () => {
  process.exit(0)
})

// Safety timeout — don't hang forever
setTimeout(() => process.exit(0), 3000)
