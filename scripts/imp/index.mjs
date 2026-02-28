#!/usr/bin/env node

import { config, validateConfig } from './config.mjs'
import { client } from './client.mjs'
import { registerCommands } from './commands/index.mjs'
import { startWatchers, stopWatchers } from './watchers/index.mjs'
import { startNotifyServer, stopNotifyServer } from './notify/server.mjs'
import { registerRelay } from './relay/index.mjs'

validateConfig()

client.once('ready', () => {
  console.log(`Imp online as ${client.user.tag}`)
  registerCommands(client)
  registerRelay(client)
  startWatchers()
  startNotifyServer()
})

client.on('error', error => {
  console.error('Discord client error:', error)
})

function shutdown() {
  console.log('Imp shutting down...')
  stopWatchers()
  stopNotifyServer()
  client.destroy()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('uncaughtException', error => {
  console.error('Uncaught exception:', error)
  shutdown()
})
process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error)
})

client.login(config.token)
