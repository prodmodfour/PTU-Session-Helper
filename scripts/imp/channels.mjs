import { config } from './config.mjs'
import { client } from './client.mjs'

const EVENT_CHANNEL_MAP = {
  // Pipeline lifecycle
  plan_created: 'pipeline',
  plan_deleted: 'pipeline',
  slaves_launched: 'pipeline',
  slave_started: 'pipeline',
  slave_completed: 'pipeline',
  slave_failed: 'pipeline',
  collection_started: 'pipeline',
  collection_complete: 'pipeline',
  merge_result: 'pipeline',
  state_updated: 'pipeline',

  // Errors
  build_failure: 'errors',
  test_failure: 'errors',
  merge_conflict: 'errors',
  smoke_failure: 'errors',

  // Coverage
  matrix_complete: 'coverage',
  coverage_update: 'coverage',
  audit_summary: 'coverage',

  // Tickets
  ticket_created: 'tickets',
  decree_need: 'tickets',

  // Relay
  relay_sent: 'relay',
  relay_received: 'relay',

  // Fallback
  test: 'pipeline',
  info: 'pipeline',
}

export function getChannelForEvent(eventType) {
  const channelKey = EVENT_CHANNEL_MAP[eventType] || 'pipeline'
  return config.channels[channelKey]
}

export async function sendToChannel(channelId, content) {
  const channel = await client.channels.fetch(channelId)
  if (!channel) {
    console.error(`Channel not found: ${channelId}`)
    return null
  }
  if (typeof content === 'string') {
    return channel.send(content)
  }
  return channel.send(content)
}

export async function sendEvent(eventType, content) {
  const channelId = getChannelForEvent(eventType)
  return sendToChannel(channelId, content)
}
