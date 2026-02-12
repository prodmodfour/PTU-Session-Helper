/**
 * Backfill script: Set origin field for existing Pokemon and flip all isInLibrary to true.
 *
 * Run with: npx tsx prisma/backfill-origin.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfill() {
  console.log('Starting origin backfill...')

  // 1. Set origin = 'wild' for Pokemon where isInLibrary = false
  const hiddenResult = await prisma.pokemon.updateMany({
    where: { isInLibrary: false },
    data: { origin: 'wild' }
  })
  console.log(`Set ${hiddenResult.count} hidden Pokemon to origin: 'wild'`)

  // 2. Set origin = 'wild' for remaining Pokemon whose notes contain "Wild Pokemon"
  const wildNotesResult = await prisma.pokemon.updateMany({
    where: {
      origin: 'manual', // only touch ones not already set
      notes: { contains: 'Wild Pokemon' }
    },
    data: { origin: 'wild' }
  })
  console.log(`Set ${wildNotesResult.count} Pokemon with wild notes to origin: 'wild'`)

  // 3. Set isInLibrary = true for ALL Pokemon (repurpose as archive flag)
  const libraryResult = await prisma.pokemon.updateMany({
    where: { isInLibrary: false },
    data: { isInLibrary: true }
  })
  console.log(`Set ${libraryResult.count} Pokemon to isInLibrary: true`)

  // Summary
  const total = await prisma.pokemon.count()
  const byOrigin = await prisma.pokemon.groupBy({
    by: ['origin'],
    _count: true
  })
  console.log(`\nTotal Pokemon: ${total}`)
  console.log('By origin:', byOrigin.map(g => `${g.origin}: ${g._count}`).join(', '))

  console.log('\nBackfill complete.')
}

backfill()
  .catch((e) => {
    console.error('Backfill failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
