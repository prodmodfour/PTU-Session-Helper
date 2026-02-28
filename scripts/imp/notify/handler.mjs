import { sendEvent } from '../channels.mjs'
import { notifyEmbed, errorEmbed, mergeProposalEmbed } from '../formatters/embeds.mjs'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

/**
 * Handle an incoming notify event from the CLI.
 * Event shape: { type: string, data: object }
 */
export async function handleNotifyEvent(event) {
  const { type, data = {} } = event

  if (!type) {
    console.error('Notify event missing type field')
    return
  }

  console.log(`Notify event: ${type}`)

  switch (type) {
    case 'merge_proposal': {
      const embed = mergeProposalEmbed(data.plan || {}, data.merge_set || [])
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`merge_approve_${data.plan?.plan_id || 'unknown'}`)
          .setLabel('Approve')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`merge_deny_${data.plan?.plan_id || 'unknown'}`)
          .setLabel('Deny')
          .setStyle(ButtonStyle.Danger),
      )
      await sendEvent('collection_started', { embeds: [embed], components: [row] })
      break
    }

    case 'build_failure':
    case 'test_failure':
    case 'smoke_failure':
    case 'merge_conflict': {
      const embed = errorEmbed(
        type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        data.message || data.error || 'Unknown error'
      )
      await sendEvent(type, { embeds: [embed] })
      break
    }

    default: {
      const embed = notifyEmbed(type, data)
      await sendEvent(type, { embeds: [embed] })
    }
  }
}
