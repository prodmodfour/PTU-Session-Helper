import { config } from '../config.mjs'
import { resolveTarget } from './session-tracker.mjs'
import { sendToPane } from './sender.mjs'
import { relayConfirmEmbed, errorEmbed } from '../formatters/embeds.mjs'

export function registerRelay(client) {
  // Handle /relay slash command
  client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return
    if (interaction.commandName !== 'relay') return

    // Admin role gate
    if (config.adminRoleId) {
      const member = interaction.member
      if (!member?.roles?.cache?.has(config.adminRoleId)) {
        await interaction.reply({
          content: 'You need the admin role to use relay.',
          ephemeral: true,
        })
        return
      }
    }

    const targetInput = interaction.options.getString('target')
    const message = interaction.options.getString('message')

    const target = resolveTarget(targetInput)
    const result = sendToPane(target, message)

    if (result.success) {
      await interaction.reply({ embeds: [relayConfirmEmbed(target, message)] })
    } else {
      await interaction.reply({
        embeds: [errorEmbed('Relay Failed', result.error)],
        ephemeral: true,
      })
    }
  })

  // Handle @slave-N messages in #relay channel
  client.on('messageCreate', async msg => {
    if (msg.author.bot) return
    if (msg.channelId !== config.channels.relay) return

    // Parse "@slave-N <message>" format
    const match = msg.content.match(/^@(slave-\d+)\s+(.+)$/s)
    if (!match) return

    // Admin role gate
    if (config.adminRoleId) {
      const member = msg.member
      if (!member?.roles?.cache?.has(config.adminRoleId)) {
        await msg.reply('You need the admin role to use relay.')
        return
      }
    }

    const target = resolveTarget(match[1])
    const message = match[2].trim()

    const result = sendToPane(target, message)

    if (result.success) {
      await msg.reply({ embeds: [relayConfirmEmbed(target, message)] })
    } else {
      await msg.reply({ embeds: [errorEmbed('Relay Failed', result.error)] })
    }
  })
}
