import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

interface MoveRow {
  name: string
  type: string
  category: string
  damageBase: number | null
  frequency: string
  ac: number | null
  range: string
  effect: string
  contestStats: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

function parseMoveCSV(csvPath: string): MoveRow[] {
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n')

  const moves: MoveRow[] = []
  const seenNames = new Set<string>()

  // Skip header row (line 2 in the CSV, index 1)
  // The CSV has an empty row 1, header at row 2
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const fields = parseCSVLine(line)

    // Skip rows that are headers (Type columns indicate header row)
    if (fields[0] === 'Name' || fields[1] === 'Type') continue

    // Skip empty name rows
    const name = fields[0]?.trim()
    if (!name) continue

    // Skip if we've seen this move (avoid duplicates like "[SM]" variants)
    // We'll keep the first version encountered
    const baseName = name.replace(/\s*\[.*?\]\s*$/, '').trim()
    if (seenNames.has(baseName)) continue
    seenNames.add(baseName)

    const type = fields[1]?.trim() || ''
    const category = fields[2]?.trim() || fields[9]?.trim() || '' // Category might be in different columns
    const damageBaseStr = fields[3]?.trim()
    const frequency = fields[4]?.trim() || ''
    const acStr = fields[5]?.trim()
    const range = fields[6]?.trim() || ''
    const effect = fields[7]?.trim() || ''
    const contestStats = fields[8]?.trim() || ''

    // Parse damage base (could be "--" or a number)
    let damageBase: number | null = null
    if (damageBaseStr && damageBaseStr !== '--' && damageBaseStr !== 'See Effect') {
      const parsed = parseInt(damageBaseStr, 10)
      if (!isNaN(parsed)) damageBase = parsed
    }

    // Parse AC (could be "--" or a number)
    let ac: number | null = null
    if (acStr && acStr !== '--') {
      const parsed = parseInt(acStr, 10)
      if (!isNaN(parsed)) ac = parsed
    }

    // Determine damage class from the category column or type column
    let damageClass = 'Status'
    const catLower = category.toLowerCase()
    if (catLower.includes('physical')) damageClass = 'Physical'
    else if (catLower.includes('special')) damageClass = 'Special'
    else if (damageBase !== null) {
      // If has damage base but no clear category, try to infer
      damageClass = 'Physical' // Default for damaging moves
    }

    // Only add moves with valid types
    const validTypes = [
      'Bug', 'Dark', 'Dragon', 'Electric', 'Fairy', 'Fighting', 'Fire',
      'Flying', 'Ghost', 'Grass', 'Ground', 'Ice', 'Normal', 'Poison',
      'Psychic', 'Rock', 'Steel', 'Water', 'Typeless'
    ]

    // The type might be in the 10th column (index 10) for some rows
    const moveType = type || fields[10]?.trim() || ''

    if (!validTypes.includes(moveType) && moveType !== '') {
      // Skip invalid type rows
      continue
    }

    moves.push({
      name: baseName,
      type: moveType || 'Normal',
      category: damageClass,
      damageBase,
      frequency,
      ac,
      range,
      effect,
      contestStats
    })
  }

  return moves
}

async function seedMoves() {
  console.log('Seeding moves...')

  const csvPath = path.resolve(__dirname, '../data/moves.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`)
    return
  }

  const moves = parseMoveCSV(csvPath)
  console.log(`Parsed ${moves.length} unique moves`)

  // Clear existing moves
  await prisma.moveData.deleteMany()

  // Insert moves using upsert (SQLite doesn't support skipDuplicates)
  let inserted = 0
  for (const m of moves) {
    try {
      await prisma.moveData.upsert({
        where: { name: m.name },
        update: {
          type: m.type,
          damageClass: m.category,
          frequency: m.frequency,
          ac: m.ac,
          damageBase: m.damageBase,
          range: m.range,
          effect: m.effect,
          contestType: m.contestStats.split(' - ')[0] || null,
          contestEffect: m.contestStats.split(' - ')[1] || null
        },
        create: {
          name: m.name,
          type: m.type,
          damageClass: m.category,
          frequency: m.frequency,
          ac: m.ac,
          damageBase: m.damageBase,
          range: m.range,
          effect: m.effect,
          contestType: m.contestStats.split(' - ')[0] || null,
          contestEffect: m.contestStats.split(' - ')[1] || null
        }
      })
      inserted++
      if (inserted % 100 === 0) {
        console.log(`Inserted ${inserted}/${moves.length} moves...`)
      }
    } catch (error) {
      console.error(`Failed to insert move: ${m.name}`, error)
    }
  }

  const count = await prisma.moveData.count()
  console.log(`Total moves in database: ${count}`)
}

async function seedTypeEffectiveness() {
  console.log('Type effectiveness is handled in useCombat.ts composable')
  // Type effectiveness chart is already implemented in the useCombat composable
  // No need to store in database
}

async function main() {
  console.log('Starting database seed...')

  try {
    await seedMoves()
    await seedTypeEffectiveness()

    console.log('Seed completed successfully!')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
