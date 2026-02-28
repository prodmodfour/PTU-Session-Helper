#!/usr/bin/env node

/**
 * One-time guild-scoped slash command registration.
 * Run: node scripts/imp/register-commands.mjs
 */

import { REST, Routes, SlashCommandBuilder } from 'discord.js'
import { config, validateConfig } from './config.mjs'

validateConfig()

const commands = [
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show pipeline state from dev-state.md and test-state.md'),

  new SlashCommandBuilder()
    .setName('slaves')
    .setDescription('Show active slave plan and status'),

  new SlashCommandBuilder()
    .setName('tickets')
    .setDescription('List open tickets')
    .addStringOption(opt =>
      opt.setName('category')
        .setDescription('Filter by category (bug, refactoring, ptu-rule, ux, decree-need)')
        .setRequired(false))
    .addStringOption(opt =>
      opt.setName('priority')
        .setDescription('Filter by priority (P0-P4)')
        .setRequired(false)),

  new SlashCommandBuilder()
    .setName('coverage')
    .setDescription('Show per-domain coverage scores'),

  new SlashCommandBuilder()
    .setName('panes')
    .setDescription('List active tmux slave panes'),

  new SlashCommandBuilder()
    .setName('relay')
    .setDescription('Send a message to a tmux slave pane')
    .addStringOption(opt =>
      opt.setName('target')
        .setDescription('Target pane (e.g. slave-1)')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('message')
        .setDescription('Message to send')
        .setRequired(true)),
]

const rest = new REST({ version: '10' }).setToken(config.token)

try {
  console.log('Registering guild-scoped slash commands...')
  const data = await rest.put(
    Routes.applicationGuildCommands(
      (await rest.get(Routes.user())).id,
      config.guildId
    ),
    { body: commands.map(c => c.toJSON()) }
  )
  console.log(`Registered ${data.length} commands.`)
} catch (error) {
  console.error('Failed to register commands:', error)
  process.exit(1)
}
