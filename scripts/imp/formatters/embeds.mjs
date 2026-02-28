import { EmbedBuilder } from 'discord.js'

const COLORS = {
  success: 0x2ecc71,
  error: 0xe74c3c,
  warning: 0xf39c12,
  info: 0x3498db,
  pipeline: 0x9b59b6,
  coverage: 0x1abc9c,
  ticket: 0xe67e22,
}

export function planCreatedEmbed(plan) {
  const slaveLines = (plan.slaves || []).map((s, i) =>
    `**Slave ${i + 1}** — ${s.task_type}: ${s.description || s.target}`
  ).join('\n')

  return new EmbedBuilder()
    .setTitle('New Slave Plan Created')
    .setDescription(`**Plan:** \`${plan.plan_id}\`\n**Slaves:** ${plan.total_slaves}`)
    .addFields({ name: 'Assignments', value: slaveLines || 'None' })
    .setColor(COLORS.pipeline)
    .setTimestamp()
}

export function slaveTransitionEmbed(slaveId, oldStatus, newStatus, data) {
  const color = newStatus === 'completed' ? COLORS.success
    : newStatus === 'failed' ? COLORS.error
    : COLORS.info

  const embed = new EmbedBuilder()
    .setTitle(`Slave ${slaveId}: ${oldStatus} → ${newStatus}`)
    .setColor(color)
    .setTimestamp()

  if (data.description) {
    embed.setDescription(data.description)
  }
  if (data.task_type) {
    embed.addFields({ name: 'Task', value: data.task_type, inline: true })
  }
  if (data.target) {
    embed.addFields({ name: 'Target', value: data.target, inline: true })
  }
  if (data.error) {
    embed.addFields({ name: 'Error', value: `\`\`\`\n${data.error.slice(0, 1000)}\n\`\`\`` })
  }
  if (data.commits && data.commits.length > 0) {
    const commitList = data.commits.slice(0, 10).map(c => `\`${c}\``).join('\n')
    embed.addFields({ name: `Commits (${data.commits.length})`, value: commitList })
  }
  if (data.review_verdict) {
    embed.addFields({ name: 'Review', value: data.review_verdict, inline: true })
  }

  return embed
}

export function statusEmbed(devState, testState) {
  const embed = new EmbedBuilder()
    .setTitle('Pipeline Status')
    .setColor(COLORS.pipeline)
    .setTimestamp()

  if (devState) {
    embed.addFields({ name: 'Dev State', value: codeBlock(devState.slice(0, 1000)) })
  }
  if (testState) {
    embed.addFields({ name: 'Test State', value: codeBlock(testState.slice(0, 1000)) })
  }

  return embed
}

export function slavesEmbed(plan, statuses) {
  if (!plan) {
    return new EmbedBuilder()
      .setTitle('Slave Status')
      .setDescription('No active slave plan.')
      .setColor(COLORS.info)
      .setTimestamp()
  }

  const lines = statuses.map(s => {
    const icon = s.status === 'completed' ? '✅'
      : s.status === 'failed' ? '❌'
      : s.status === 'running' ? '⚡'
      : '⏳'
    return `${icon} **Slave ${s.slave_id}** — ${s.status} | ${s.task_type || '?'}: ${s.description || s.target || '?'}`
  })

  return new EmbedBuilder()
    .setTitle(`Slave Plan: \`${plan.plan_id}\``)
    .setDescription(lines.join('\n') || 'No slaves found.')
    .setColor(COLORS.pipeline)
    .setTimestamp()
}

export function ticketsEmbed(tickets, category, page, totalPages) {
  const lines = tickets.map(t =>
    `\`${t.id}\` **${t.priority || '?'}** — ${t.title || t.id}`
  )

  return new EmbedBuilder()
    .setTitle(`Open Tickets${category ? ` — ${category}` : ''}`)
    .setDescription(lines.join('\n') || 'No tickets found.')
    .setFooter({ text: `Page ${page}/${totalPages}` })
    .setColor(COLORS.ticket)
    .setTimestamp()
}

export function coverageEmbed(domains) {
  const lines = domains.map(d => {
    const pct = parseFloat(d.Coverage) || 0
    const filled = Math.round(pct / 5)
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled)
    return `**${d.Domain}** \`${bar}\` ${d.Coverage || '—'}`
  })

  return new EmbedBuilder()
    .setTitle('Domain Coverage')
    .setDescription(lines.join('\n') || 'No coverage data.')
    .setColor(COLORS.coverage)
    .setTimestamp()
}

export function panesEmbed(panes) {
  if (panes.length === 0) {
    return new EmbedBuilder()
      .setTitle('tmux Panes')
      .setDescription('No active slave panes found.')
      .setColor(COLORS.info)
      .setTimestamp()
  }

  const lines = panes.map(p => `\`${p.target}\` — ${p.title || 'untitled'}`)

  return new EmbedBuilder()
    .setTitle('Active tmux Panes')
    .setDescription(lines.join('\n'))
    .setColor(COLORS.info)
    .setTimestamp()
}

export function notifyEmbed(eventType, data) {
  const color = eventType.includes('fail') || eventType.includes('error')
    ? COLORS.error
    : eventType.includes('complete') || eventType.includes('success')
    ? COLORS.success
    : COLORS.info

  const embed = new EmbedBuilder()
    .setTitle(eventType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    .setColor(color)
    .setTimestamp()

  if (data.message) {
    embed.setDescription(data.message)
  }
  if (data.details) {
    embed.addFields({ name: 'Details', value: codeBlock(
      typeof data.details === 'string' ? data.details : JSON.stringify(data.details, null, 2)
    ).slice(0, 1024) })
  }

  return embed
}

export function relayConfirmEmbed(target, message) {
  return new EmbedBuilder()
    .setTitle('Relay Sent')
    .setDescription(`Message sent to \`${target}\``)
    .addFields({ name: 'Message', value: codeBlock(message.slice(0, 1000)) })
    .setColor(COLORS.success)
    .setTimestamp()
}

export function mergeProposalEmbed(plan, mergeSet) {
  const lines = mergeSet.map(s =>
    `**Slave ${s.slave_id}** — ${s.branch || '?'} (${s.commits?.length || 0} commits)`
  )

  return new EmbedBuilder()
    .setTitle('Merge Proposal')
    .setDescription(`**Plan:** \`${plan.plan_id}\`\nReady to merge ${mergeSet.length} branches.`)
    .addFields({ name: 'Branches', value: lines.join('\n') || 'None' })
    .setColor(COLORS.warning)
    .setTimestamp()
}

export function errorEmbed(title, error) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(codeBlock(String(error).slice(0, 2000)))
    .setColor(COLORS.error)
    .setTimestamp()
}

function codeBlock(text) {
  return `\`\`\`\n${text}\n\`\`\``
}
