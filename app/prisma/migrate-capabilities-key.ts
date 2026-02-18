/**
 * One-time migration: rename "other" → "otherCapabilities" key
 * in Pokemon.capabilities JSON for records created before the rename.
 *
 * Usage: cd app && npx tsx prisma/migrate-capabilities-key.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const affected = await prisma.$queryRawUnsafe<Array<{ id: string; species: string; nickname: string | null }>>(
    `SELECT id, species, nickname FROM Pokemon WHERE capabilities LIKE '%"other":%'`
  )

  if (affected.length === 0) {
    console.log('No Pokemon found with old "other" key — nothing to migrate.')
    return
  }

  console.log(`Found ${affected.length} Pokemon with old "other" key:`)
  for (const row of affected) {
    const label = row.nickname ? `${row.nickname} (${row.species})` : row.species
    console.log(`  - ${label} [${row.id}]`)
  }

  const result = await prisma.$executeRawUnsafe(
    `UPDATE Pokemon SET capabilities = REPLACE(capabilities, '"other":', '"otherCapabilities":') WHERE capabilities LIKE '%"other":%'`
  )

  console.log(`Updated ${result} Pokemon record(s).`)

  // Verify no old keys remain
  const remaining = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) as count FROM Pokemon WHERE capabilities LIKE '%"other":%'`
  )
  const remainingCount = Number(remaining[0].count)
  if (remainingCount > 0) {
    console.error(`WARNING: ${remainingCount} records still have old key after migration!`)
    process.exit(1)
  }

  console.log('Migration complete — verified no old keys remain.')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
