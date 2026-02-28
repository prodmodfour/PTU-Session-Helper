import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '../..')

function parseEnvFile(filePath) {
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
  } catch {
    return {}
  }
  const vars = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

const envPath = resolve(PROJECT_ROOT, '.env')
const envVars = parseEnvFile(envPath)

function getVar(key) {
  return process.env[key] || envVars[key] || ''
}

const REQUIRED = [
  'IMP_DISCORD_TOKEN',
  'IMP_GUILD_ID',
  'IMP_CHANNEL_PIPELINE',
  'IMP_CHANNEL_ERRORS',
  'IMP_CHANNEL_COVERAGE',
  'IMP_CHANNEL_TICKETS',
  'IMP_CHANNEL_RELAY',
]

export const config = {
  token: getVar('IMP_DISCORD_TOKEN'),
  guildId: getVar('IMP_GUILD_ID'),
  channels: {
    pipeline: getVar('IMP_CHANNEL_PIPELINE'),
    errors: getVar('IMP_CHANNEL_ERRORS'),
    coverage: getVar('IMP_CHANNEL_COVERAGE'),
    tickets: getVar('IMP_CHANNEL_TICKETS'),
    relay: getVar('IMP_CHANNEL_RELAY'),
  },
  adminRoleId: getVar('IMP_ADMIN_ROLE_ID'),
  socketPath: getVar('IMP_SOCKET_PATH') || '/tmp/imp-notify.sock',
  projectRoot: PROJECT_ROOT,
}

export function validateConfig() {
  const missing = REQUIRED.filter(key => !getVar(key))
  if (missing.length > 0) {
    console.error('Missing required environment variables:')
    for (const key of missing) {
      console.error(`  - ${key}`)
    }
    console.error('\nCopy .env.example to .env and fill in the values.')
    process.exit(1)
  }
}
