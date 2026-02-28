import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { resolveTarget } from '../relay/session-tracker.mjs'
import { sendToPane } from '../relay/sender.mjs'
import { readJsonSafe } from '../formatters/parsers.mjs'
import { resolve } from 'node:path'
import { config } from '../config.mjs'

export async function handleButtonInteraction(interaction) {
  const customId = interaction.customId

  // Merge approve/deny buttons
  if (customId.startsWith('merge_approve_')) {
    await handleMergeApprove(interaction, customId.replace('merge_approve_', ''))
    return
  }
  if (customId.startsWith('merge_deny_')) {
    await handleMergeDeny(interaction, customId.replace('merge_deny_', ''))
    return
  }

  // View logs button
  if (customId.startsWith('view_logs_')) {
    await handleViewLogs(interaction, customId.replace('view_logs_', ''))
    return
  }
}

async function handleMergeApprove(interaction, planId) {
  // Find the collector's tmux pane and send "go"
  // The collector waits in "slaves:slave-1" (first pane) or a dedicated collector pane
  const target = resolveTarget('slave-1')
  const result = sendToPane(target, 'go')

  const embed = new EmbedBuilder()
    .setTitle('Merge Approved')
    .setDescription(`Plan \`${planId}\` merge approved by ${interaction.user.tag}`)
    .setColor(0x2ecc71)
    .setTimestamp()

  // Disable buttons after click
  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('merge_approve_done')
      .setLabel('Approved')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('merge_deny_done')
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  )

  await interaction.update({ embeds: [embed], components: [disabledRow] })

  if (!result.success) {
    await interaction.followUp({
      content: `Warning: Could not send "go" to tmux — ${result.error}`,
      ephemeral: true,
    })
  }
}

async function handleMergeDeny(interaction, planId) {
  const embed = new EmbedBuilder()
    .setTitle('Merge Denied')
    .setDescription(`Plan \`${planId}\` merge denied by ${interaction.user.tag}`)
    .setColor(0xe74c3c)
    .setTimestamp()

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('merge_approve_done')
      .setLabel('Approve')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('merge_deny_done')
      .setLabel('Denied')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
  )

  await interaction.update({ embeds: [embed], components: [disabledRow] })
}

async function handleViewLogs(interaction, slaveId) {
  const statusPath = resolve(config.projectRoot, `.worktrees/slave-status/slave-${slaveId}.json`)
  const data = readJsonSafe(statusPath)

  if (!data) {
    await interaction.reply({
      content: `No status file found for slave-${slaveId}.`,
      ephemeral: true,
    })
    return
  }

  const json = JSON.stringify(data, null, 2)
  const truncated = json.length > 4000 ? json.slice(0, 3997) + '...' : json

  const embed = new EmbedBuilder()
    .setTitle(`Slave ${slaveId} Status`)
    .setDescription(`\`\`\`json\n${truncated}\n\`\`\``)
    .setColor(data.status === 'completed' ? 0x2ecc71 : 0xe74c3c)
    .setTimestamp()

  await interaction.reply({ embeds: [embed], ephemeral: true })
}
