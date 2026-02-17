/**
 * One-time migration: Remove phantom status conditions from the database.
 *
 * PTU 1.05 does not define Encored, Taunted, or Tormented as status conditions.
 * The actual moves inflict existing conditions:
 *   - Taunt → Enraged
 *   - Torment → Suppressed
 *   - Encore → Enraged (most common outcome: 5-6 on 1d6)
 *
 * This script converts any stored phantom conditions to their PTU equivalents.
 *
 * Usage: cd app && npx tsx prisma/migrate-phantom-conditions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CONDITION_MAP: Record<string, string> = {
  'Taunted': 'Enraged',
  'Tormented': 'Suppressed',
  'Encored': 'Enraged'
}

const PHANTOM_CONDITIONS = Object.keys(CONDITION_MAP)

async function migrateTable(table: 'humanCharacter' | 'pokemon') {
  const records = await (prisma[table] as any).findMany({
    select: { id: true, statusConditions: true }
  })

  let updated = 0

  for (const record of records) {
    const conditions: string[] = JSON.parse(record.statusConditions || '[]')
    const hasPhantom = conditions.some(c => PHANTOM_CONDITIONS.includes(c))

    if (!hasPhantom) continue

    const newConditions = conditions.reduce<string[]>((acc, condition) => {
      const replacement = CONDITION_MAP[condition]
      const resolved = replacement ?? condition

      // Avoid duplicates (e.g., already has Enraged + Taunted → don't add Enraged twice)
      if (!acc.includes(resolved)) {
        acc.push(resolved)
      }
      return acc
    }, [])

    await (prisma[table] as any).update({
      where: { id: record.id },
      data: { statusConditions: JSON.stringify(newConditions) }
    })

    console.log(`  ${table} ${record.id}: [${conditions.join(', ')}] → [${newConditions.join(', ')}]`)
    updated++
  }

  return { total: records.length, updated }
}

async function main() {
  console.log('Migrating phantom status conditions (Encored/Taunted/Tormented)...\n')

  const humanResult = await migrateTable('humanCharacter')
  console.log(`\nHumanCharacter: ${humanResult.updated}/${humanResult.total} records updated`)

  const pokemonResult = await migrateTable('pokemon')
  console.log(`Pokemon: ${pokemonResult.updated}/${pokemonResult.total} records updated`)

  const totalUpdated = humanResult.updated + pokemonResult.updated
  if (totalUpdated === 0) {
    console.log('\nNo phantom conditions found in database. Nothing to migrate.')
  } else {
    console.log(`\nDone. ${totalUpdated} records migrated.`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
