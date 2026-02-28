import { createServer, createConnection } from 'node:net'
import { existsSync, unlinkSync } from 'node:fs'
import { config } from '../config.mjs'
import { handleNotifyEvent } from './handler.mjs'

let server = null

export function startNotifyServer() {
  const socketPath = config.socketPath

  // Clean up stale socket
  if (existsSync(socketPath)) {
    const testConn = createConnection(socketPath)
    testConn.on('connect', () => {
      testConn.destroy()
      console.error(`Notify socket already in use: ${socketPath}`)
    })
    testConn.on('error', () => {
      // Dead socket, safe to remove
      try { unlinkSync(socketPath) } catch {}
      startListening(socketPath)
    })
  } else {
    startListening(socketPath)
  }
}

function startListening(socketPath) {
  server = createServer(connection => {
    let buffer = ''

    connection.on('data', chunk => {
      buffer += chunk.toString()

      // Process complete lines (newline-delimited JSON)
      const lines = buffer.split('\n')
      buffer = lines.pop() // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const event = JSON.parse(line)
          handleNotifyEvent(event).catch(err => {
            console.error('Failed to handle notify event:', err.message)
          })
        } catch (err) {
          console.error('Invalid JSON from notify client:', err.message)
        }
      }
    })

    connection.on('end', () => {
      // Process any remaining data
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer)
          handleNotifyEvent(event).catch(err => {
            console.error('Failed to handle notify event:', err.message)
          })
        } catch {
          // ignore
        }
      }
    })

    connection.on('error', err => {
      console.error('Notify connection error:', err.message)
    })
  })

  server.on('error', err => {
    console.error('Notify server error:', err.message)
  })

  server.listen(socketPath, () => {
    console.log(`Notify server listening on ${socketPath}`)
  })
}

export function stopNotifyServer() {
  if (server) {
    server.close()
    server = null
  }
  const socketPath = config.socketPath
  if (existsSync(socketPath)) {
    try { unlinkSync(socketPath) } catch {}
  }
  console.log('Notify server stopped.')
}
