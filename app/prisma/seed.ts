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

interface LearnsetEntry {
  level: number
  move: string
}

interface SpeciesRow {
  name: string
  type1: string
  type2: string | null
  baseHp: number
  baseAttack: number
  baseDefense: number
  baseSpAtk: number
  baseSpDef: number
  baseSpeed: number
  abilities: string[]
  evolutionStage: number
  maxEvolutionStage: number
  overland: number
  swim: number
  sky: number
  burrow: number
  levitate: number
  learnset: LearnsetEntry[]
  skills: Record<string, string>
  capabilities: string[]
}

function parsePokedexContent(content: string): SpeciesRow[] {
  const species: SpeciesRow[] = []
  const seenNames = new Set<string>()

  // Split by page markers to find Pokemon entries
  const pages = content.split(/## Page \d+/)

  for (const page of pages) {
    const lines = page.split('\n')

    // Find Pokemon name - it's usually a line in all caps after the page number
    let pokemonName: string | null = null
    let startLineIdx = 0

    for (let i = 0; i < lines.length && i < 10; i++) {
      const line = lines[i].trim()
      // Pokemon name is usually in ALL CAPS and at least 3 characters
      if (line.length >= 3 && /^[A-Z][A-Z\s\-\(\)'É]+$/.test(line) && !line.match(/^\d+$/)) {
        // Skip common non-Pokemon lines
        if (['Contents', 'TM', 'HM', 'MOVE LIST', 'TUTOR MOVE LIST', 'EGG MOVE LIST'].includes(line)) continue
        pokemonName = line
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .map(word => word.charAt(0) + word.slice(1).toLowerCase())
          .join(' ')
          .replace(/\(f\)/i, '♀')
          .replace(/\(m\)/i, '♂')
        startLineIdx = i
        break
      }
    }

    if (!pokemonName) continue

    // Skip duplicates
    if (seenNames.has(pokemonName.toUpperCase())) continue
    seenNames.add(pokemonName.toUpperCase())

    const pageText = lines.slice(startLineIdx).join('\n')

    // Parse base stats
    const hpMatch = pageText.match(/HP:\s*(\d+)/i)
    const atkMatch = pageText.match(/Attack:\s*(\d+)/i)
    const defMatch = pageText.match(/Defense:\s*(\d+)/i)
    const spAtkMatch = pageText.match(/Special Attack:\s*(\d+)/i)
    const spDefMatch = pageText.match(/Special Defense:\s*(\d+)/i)
    const speedMatch = pageText.match(/Speed:\s*(\d+)/i)

    // Parse types
    const typeMatch = pageText.match(/Type\s*:\s*([A-Za-z]+)(?:\s*\/\s*([A-Za-z]+))?/i)

    // Parse abilities
    const abilities: string[] = []
    const abilityPatterns = [
      /Basic Ability \d:\s*([^\n]+)/gi,
      /Adv Ability \d:\s*([^\n]+)/gi,
      /High Ability:\s*([^\n]+)/gi
    ]
    for (const pattern of abilityPatterns) {
      let match
      while ((match = pattern.exec(pageText)) !== null) {
        const ability = match[1].trim()
        if (ability && ability !== 'None' && !abilities.includes(ability)) {
          abilities.push(ability)
        }
      }
    }

    // Parse evolution stage and max evolution stage from the full evolution block
    let evolutionStage = 1
    let maxEvolutionStage = 1
    const evoSectionMatch = pageText.match(/Evolution:\s*\n((?:\s*\d+\s*-\s*[^\n]+\n?)+)/i)
    if (evoSectionMatch) {
      const evoLines = [...evoSectionMatch[1].matchAll(/(\d+)\s*-\s*([^\n]+)/g)]
      for (const evoLine of evoLines) {
        const stageNum = parseInt(evoLine[1], 10)
        const lineText = evoLine[2].trim()
        if (stageNum > maxEvolutionStage) {
          maxEvolutionStage = stageNum
        }
        // Match current species name with word-boundary check to avoid
        // prefix collisions (e.g. "Kabutops" matching "Kabuto")
        const nameLC = pokemonName.toLowerCase()
        const ltLC = lineText.toLowerCase()
        if (ltLC === nameLC || ltLC.startsWith(nameLC + ' ')) {
          evolutionStage = stageNum
        }
      }
    }
    // Mega forms are beyond normal evolution stages
    if (pokemonName.includes('Mega ')) evolutionStage = 3

    // Parse movement capabilities
    const capText = pageText.match(/Capability List[\s\S]*?(?=Skill List|Move List|$)/i)?.[0] || ''
    const overlandMatch = capText.match(/Overland\s+(\d+)/i)
    const swimMatch = capText.match(/Swim\s+(\d+)/i)
    const skyMatch = capText.match(/Sky\s+(\d+)/i)
    const burrowMatch = capText.match(/Burrow\s+(\d+)/i)
    const levitateMatch = capText.match(/Levitate\s+(\d+)/i)

    // Parse other capabilities (Naturewalk, Underdog, etc.)
    const capabilities: string[] = []
    // Clean and normalize capability text - handle soft hyphens and line breaks
    let capClean = capText.replace(/Capability List/i, '')
    // Fix split words like "Nature­\nwalk" -> "Naturewalk"
    capClean = capClean.replace(/[\u00AD][\s\n]*/g, '')
    capClean = capClean.replace(/\s+/g, ' ').trim()

    // First extract Naturewalk with parentheses
    const naturewalkMatches = capClean.match(/Naturewalk\s*\([^)]+\)/gi) || []
    for (const nw of naturewalkMatches) {
      capabilities.push(nw.trim())
    }
    // Extract other capabilities - words that start with capital letters
    // Skip movement capabilities and common words
    const skipWords = new Set(['overland', 'swim', 'sky', 'burrow', 'levitate', 'jump', 'power', 'naturewalk'])
    const otherCaps = capClean.match(/\b[A-Z][a-z]+(?:\s*\([^)]+\))?/g) || []
    for (const cap of otherCaps) {
      const trimmed = cap.trim()
      const lowerFirst = trimmed.split(/[\s(]/)[0].toLowerCase()
      if (skipWords.has(lowerFirst)) continue
      if (trimmed && !capabilities.includes(trimmed)) {
        capabilities.push(trimmed)
      }
    }

    // Parse skills (e.g., "Athl 3d6+2, Acro 2d6, Combat 2d6")
    const skills: Record<string, string> = {}
    const skillText = pageText.match(/Skill List[\s\S]*?(?=Move List|Level Up|$)/i)?.[0] || ''
    const skillMatches = skillText.matchAll(/(\w+)\s+(\d+d\d+(?:\+\d+)?)/gi)
    for (const match of skillMatches) {
      const skillName = match[1].toLowerCase()
      const skillValue = match[2]
      // Map abbreviations to full names
      const skillMap: Record<string, string> = {
        'athl': 'athletics',
        'acro': 'acrobatics',
        'combat': 'combat',
        'stealth': 'stealth',
        'percep': 'perception',
        'focus': 'focus'
      }
      const fullName = skillMap[skillName] || skillName
      skills[fullName] = skillValue
    }

    // Parse level-up move list
    const learnset: LearnsetEntry[] = []
    // Normalize the text by replacing soft hyphens and various dash characters
    const moveListRaw = pageText.match(/Level Up Move List[\s\S]*?(?=TM\/HM|Tutor Move|Egg Move|$)/i)?.[0] || ''
    const moveListMatch = moveListRaw.replace(/[\u00AD]/g, '-').replace(/\s+/g, ' ')
    // Match patterns like "1 Tackle - Normal" or "13 Sleep Powder - Grass" or "27 Double-Edge - Normal"
    // The move name can contain letters, spaces, hyphens, and apostrophes
    const moveMatches = moveListMatch.matchAll(/(\d+)\s+([A-Za-z][A-Za-z\s\-']+?)\s+-\s+[A-Za-z]+/gi)
    for (const match of moveMatches) {
      const level = parseInt(match[1], 10)
      const moveName = match[2].trim()
      if (level > 0 && moveName && !learnset.some(l => l.level === level && l.move === moveName)) {
        learnset.push({ level, move: moveName })
      }
    }
    // Sort by level
    learnset.sort((a, b) => a.level - b.level)

    // Validate we have the essential data
    if (!hpMatch || !typeMatch) continue

    species.push({
      name: pokemonName,
      type1: typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1).toLowerCase(),
      type2: typeMatch[2] ? typeMatch[2].charAt(0).toUpperCase() + typeMatch[2].slice(1).toLowerCase() : null,
      baseHp: parseInt(hpMatch[1], 10),
      baseAttack: parseInt(atkMatch?.[1] || '5', 10),
      baseDefense: parseInt(defMatch?.[1] || '5', 10),
      baseSpAtk: parseInt(spAtkMatch?.[1] || '5', 10),
      baseSpDef: parseInt(spDefMatch?.[1] || '5', 10),
      baseSpeed: parseInt(speedMatch?.[1] || '5', 10),
      abilities,
      evolutionStage,
      maxEvolutionStage,
      overland: parseInt(overlandMatch?.[1] || '5', 10),
      swim: parseInt(swimMatch?.[1] || '0', 10),
      sky: parseInt(skyMatch?.[1] || '0', 10),
      burrow: parseInt(burrowMatch?.[1] || '0', 10),
      levitate: parseInt(levitateMatch?.[1] || '0', 10),
      learnset,
      skills,
      capabilities
    })
  }

  return species
}

async function seedSpecies() {
  console.log('Seeding species data...')

  const pokedexDir = path.resolve(__dirname, '../../books/markdown/pokedexes')

  if (!fs.existsSync(pokedexDir)) {
    console.error(`Pokedex directory not found at: ${pokedexDir}`)
    return
  }

  // Read all split pokedex files from generation directories
  const genDirs = fs.readdirSync(pokedexDir)
    .filter(d => fs.statSync(path.join(pokedexDir, d)).isDirectory())
    .sort()

  let allContent = ''
  for (const dir of genDirs) {
    const dirPath = path.join(pokedexDir, dir)
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md')).sort()
    for (const file of files) {
      allContent += fs.readFileSync(path.join(dirPath, file), 'utf-8') + '\n'
    }
  }

  const species = parsePokedexContent(allContent)
  console.log(`Parsed ${species.length} unique Pokemon species`)

  // Upsert species (avoids FK constraint issues from encounter table entries)
  let inserted = 0
  for (const s of species) {
    try {
      const data = {
        type1: s.type1,
        type2: s.type2,
        baseHp: s.baseHp,
        baseAttack: s.baseAttack,
        baseDefense: s.baseDefense,
        baseSpAtk: s.baseSpAtk,
        baseSpDef: s.baseSpDef,
        baseSpeed: s.baseSpeed,
        abilities: JSON.stringify(s.abilities),
        eggGroups: '[]',
        evolutionStage: s.evolutionStage,
        maxEvolutionStage: s.maxEvolutionStage,
        overland: s.overland,
        swim: s.swim,
        sky: s.sky,
        burrow: s.burrow,
        levitate: s.levitate,
        teleport: 0,
        learnset: JSON.stringify(s.learnset),
        skills: JSON.stringify(s.skills),
        capabilities: JSON.stringify(s.capabilities)
      }
      await prisma.speciesData.upsert({
        where: { name: s.name },
        update: data,
        create: { name: s.name, ...data }
      })
      inserted++
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted}/${species.length} species...`)
      }
    } catch (error) {
      console.error(`Failed to insert species: ${s.name}`, error)
    }
  }

  const count = await prisma.speciesData.count()
  console.log(`Total species in database: ${count}`)
}

async function main() {
  console.log('Starting database seed...')

  try {
    await seedMoves()
    await seedSpecies()
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
