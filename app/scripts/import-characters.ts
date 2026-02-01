import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

interface ParsedTrainer {
  name: string
  playedBy: string | null
  age: number | null
  gender: string | null
  level: number
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  maxHp: number
  skills: Record<string, { rank: string; modifier: number }>
  features: string[]
  edges: string[]
  background: string | null
  money: number
}

interface ParsedPokemon {
  nickname: string | null
  species: string
  level: number
  nature: { name: string; raisedStat: string | null; loweredStat: string | null }
  gender: string | null
  shiny: boolean
  types: string[]
  stats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  baseStats: {
    hp: number
    attack: number
    defense: number
    specialAttack: number
    specialDefense: number
    speed: number
  }
  maxHp: number
  moves: Array<{
    name: string
    type: string
    category: string
    db: number | null
    frequency: string
    ac: number | null
    range: string
    effect: string
  }>
  abilities: Array<{ name: string; frequency: string; effect: string }>
  capabilities: {
    overland: number
    swim: number
    sky: number
    burrow: number
    levitate: number
    power: number
    jump: { high: number; long: number }
  }
  skills: Record<string, string>
  heldItem: string | null
}

function parseCSV(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    const nextChar = content[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentCell.trim())
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
        if (char === '\r') i++
      } else if (char !== '\r') {
        currentCell += char
      }
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    rows.push(currentRow)
  }

  return rows
}

function getCell(rows: string[][], row: number, col: number): string {
  return rows[row]?.[col]?.trim() || ''
}

function parseNumber(val: string): number {
  const num = parseInt(val.replace(/[^0-9-]/g, ''), 10)
  return isNaN(num) ? 0 : num
}

function detectSheetType(rows: string[][]): 'trainer' | 'pokemon' | 'unknown' {
  const firstCell = getCell(rows, 0, 0).toLowerCase()
  if (firstCell === 'nickname') {
    return 'pokemon'
  }
  if (firstCell === 'name') {
    for (let r = 0; r < Math.min(5, rows.length); r++) {
      for (let c = 0; c < Math.min(10, rows[r]?.length || 0); c++) {
        if (getCell(rows, r, c).toLowerCase() === 'species') {
          return 'pokemon'
        }
      }
    }
    return 'trainer'
  }
  return 'unknown'
}

function parseTrainerSheet(rows: string[][]): ParsedTrainer {
  const name = getCell(rows, 1, 0) || 'Unknown Trainer'
  const playedBy = getCell(rows, 1, 1) || null
  const age = parseNumber(getCell(rows, 1, 2)) || null
  const gender = getCell(rows, 1, 3) || null
  const level = parseNumber(getCell(rows, 1, 6)) || 1
  const maxHp = parseNumber(getCell(rows, 1, 7)) || 10

  const stats = {
    hp: parseNumber(getCell(rows, 3, 6)) || 10,
    attack: parseNumber(getCell(rows, 4, 6)) || 5,
    defense: parseNumber(getCell(rows, 5, 6)) || 5,
    specialAttack: parseNumber(getCell(rows, 6, 6)) || 5,
    specialDefense: parseNumber(getCell(rows, 7, 6)) || 5,
    speed: parseNumber(getCell(rows, 8, 6)) || 5
  }

  const skills: Record<string, { rank: string; modifier: number }> = {}
  const skillRows = [
    { row: 12, name: 'Acrobatics' },
    { row: 13, name: 'Athletics' },
    { row: 14, name: 'Charm' },
    { row: 15, name: 'Combat' },
    { row: 16, name: 'Command' },
    { row: 17, name: 'General Ed' },
    { row: 18, name: 'Medicine Ed' },
    { row: 19, name: 'Occult Ed' },
    { row: 20, name: 'Pokemon Ed' },
    { row: 21, name: 'Technology Ed' },
    { row: 22, name: 'Focus' },
    { row: 23, name: 'Guile' },
    { row: 24, name: 'Intimidate' },
    { row: 25, name: 'Intuition' },
    { row: 26, name: 'Perception' },
    { row: 27, name: 'Stealth' },
    { row: 28, name: 'Survival' }
  ]

  for (const { row, name: skillName } of skillRows) {
    const modifier = parseNumber(getCell(rows, row, 1))
    const rank = getCell(rows, row, 2) || 'Untrained'
    skills[skillName] = { rank, modifier }
  }

  const features: string[] = []
  for (let r = 13; r < 20; r++) {
    const feature = getCell(rows, r, 6)
    if (feature && feature !== '--' && !feature.startsWith('#')) {
      features.push(feature)
    }
  }

  const edges: string[] = []
  for (let r = 13; r < 20; r++) {
    const edge = getCell(rows, r, 7)
    if (edge && edge !== '--') {
      edges.push(edge)
    }
    const edge2 = getCell(rows, r, 8)
    if (edge2 && edge2 !== '--') {
      edges.push(edge2)
    }
  }

  for (let c = 6; c < 12; c++) {
    const edge = getCell(rows, 33, c)
    if (edge && edge !== '--' && !edge.startsWith('#')) {
      edges.push(edge)
    }
  }

  const background = getCell(rows, 38, 7) || null
  const moneyStr = getCell(rows, 1, 9) || '0'
  const money = parseNumber(moneyStr.replace(/[$,]/g, ''))

  return { name, playedBy, age, gender, level, stats, maxHp, skills, features, edges, background, money }
}

function parsePokemonSheet(rows: string[][]): ParsedPokemon {
  const nickname = getCell(rows, 0, 1) || null
  const species = getCell(rows, 0, 9) || 'Unknown'
  const level = parseNumber(getCell(rows, 1, 1)) || 1

  const natureName = getCell(rows, 2, 1) || 'Hardy'
  const raisedStat = getCell(rows, 2, 4) || null
  const loweredStat = getCell(rows, 2, 7) || null

  const shinyStr = getCell(rows, 2, 9)
  const shiny = shinyStr?.toLowerCase() === 'shiny'
  const gender = getCell(rows, 1, 9) || null

  const baseStats = {
    hp: parseNumber(getCell(rows, 5, 1)) || 5,
    attack: parseNumber(getCell(rows, 6, 1)) || 5,
    defense: parseNumber(getCell(rows, 7, 1)) || 5,
    specialAttack: parseNumber(getCell(rows, 8, 1)) || 5,
    specialDefense: parseNumber(getCell(rows, 9, 1)) || 5,
    speed: parseNumber(getCell(rows, 10, 1)) || 5
  }

  const stats = {
    hp: parseNumber(getCell(rows, 5, 6)) || baseStats.hp,
    attack: parseNumber(getCell(rows, 6, 6)) || baseStats.attack,
    defense: parseNumber(getCell(rows, 7, 6)) || baseStats.defense,
    specialAttack: parseNumber(getCell(rows, 8, 6)) || baseStats.specialAttack,
    specialDefense: parseNumber(getCell(rows, 9, 6)) || baseStats.specialDefense,
    speed: parseNumber(getCell(rows, 10, 6)) || baseStats.speed
  }

  const maxHp = parseNumber(getCell(rows, 5, 9)) || (level + stats.hp * 3 + 10)

  const type1 = getCell(rows, 32, 0) || 'Normal'
  const type2 = getCell(rows, 32, 1)
  const types = type2 && type2 !== 'None' ? [type1, type2] : [type1]

  const moves: ParsedPokemon['moves'] = []
  for (let r = 19; r < 30; r++) {
    const moveName = getCell(rows, r, 0)
    if (moveName && moveName !== '--' && moveName !== 'Struggle') {
      const moveType = getCell(rows, r, 1) || 'Normal'
      const category = getCell(rows, r, 2) || 'Status'
      const dbStr = getCell(rows, r, 3)
      const db = dbStr === '--' ? null : parseNumber(dbStr)
      const frequency = getCell(rows, r, 7) || 'At-Will'
      const acStr = getCell(rows, r, 8)
      const ac = acStr === '--' ? null : parseNumber(acStr)
      const range = getCell(rows, r, 9) || 'Melee'
      const effect = getCell(rows, r, 11) || ''
      moves.push({ name: moveName, type: moveType, category, db, frequency, ac, range, effect })
    }
  }

  const abilities: ParsedPokemon['abilities'] = []
  for (let r = 41; r < 49; r++) {
    const abilityName = getCell(rows, r, 0)
    if (abilityName && abilityName !== '--') {
      const frequency = getCell(rows, r, 1) || ''
      const effect = getCell(rows, r, 3) || ''
      abilities.push({ name: abilityName, frequency, effect })
    }
  }

  const capabilities = {
    overland: parseNumber(getCell(rows, 32, 13)) || 5,
    swim: parseNumber(getCell(rows, 33, 13)) || 0,
    sky: parseNumber(getCell(rows, 33, 13)) || 0,
    burrow: parseNumber(getCell(rows, 32, 15)) || 0,
    levitate: parseNumber(getCell(rows, 32, 14)) || 0,
    power: parseNumber(getCell(rows, 32, 16)) || 1,
    jump: {
      high: parseNumber(getCell(rows, 33, 15)?.split('/')[0] || '1'),
      long: parseNumber(getCell(rows, 33, 15)?.split('/')[1] || '1')
    }
  }

  const skills: Record<string, string> = {}
  const heldItem = getCell(rows, 11, 2) || null

  return {
    nickname, species, level,
    nature: { name: natureName, raisedStat, loweredStat },
    gender, shiny, types, stats, baseStats, maxHp,
    moves, abilities, capabilities, skills, heldItem
  }
}

async function importFile(filePath: string) {
  console.log(`\nProcessing: ${filePath}`)

  const content = fs.readFileSync(filePath, 'utf-8')
  const rows = parseCSV(content)
  const sheetType = detectSheetType(rows)

  console.log(`  Detected type: ${sheetType}`)

  if (sheetType === 'unknown') {
    console.log('  ERROR: Could not determine sheet type')
    return
  }

  if (sheetType === 'trainer') {
    const trainer = parseTrainerSheet(rows)
    console.log(`  Trainer: ${trainer.name} (Level ${trainer.level})`)
    console.log(`  Played by: ${trainer.playedBy || 'N/A'}`)

    const skillsJson: Record<string, string> = {}
    for (const [skillName, data] of Object.entries(trainer.skills)) {
      skillsJson[skillName] = data.rank
    }

    const character = await prisma.humanCharacter.create({
      data: {
        name: trainer.name,
        characterType: 'player',
        playedBy: trainer.playedBy,
        age: trainer.age,
        gender: trainer.gender,
        level: trainer.level,
        hp: trainer.stats.hp,
        attack: trainer.stats.attack,
        defense: trainer.stats.defense,
        specialAttack: trainer.stats.specialAttack,
        specialDefense: trainer.stats.specialDefense,
        speed: trainer.stats.speed,
        currentHp: trainer.maxHp,
        maxHp: trainer.maxHp,
        skills: JSON.stringify(skillsJson),
        features: JSON.stringify(trainer.features),
        edges: JSON.stringify(trainer.edges),
        background: trainer.background,
        money: trainer.money
      }
    })

    console.log(`  Created character: ${character.id}`)
  } else {
    const pokemon = parsePokemonSheet(rows)
    console.log(`  Pokemon: ${pokemon.nickname || pokemon.species} (Level ${pokemon.level})`)
    console.log(`  Species: ${pokemon.species}`)
    console.log(`  Moves: ${pokemon.moves.map(m => m.name).join(', ')}`)

    // Look up species data
    let type1 = pokemon.types[0] || 'Normal'
    let type2: string | null = pokemon.types[1] || null

    const speciesData = await prisma.speciesData.findUnique({
      where: { name: pokemon.species }
    })

    if (speciesData) {
      type1 = speciesData.type1
      type2 = speciesData.type2
      console.log(`  Found species data: ${type1}/${type2 || 'None'}`)
    }

    const created = await prisma.pokemon.create({
      data: {
        species: pokemon.species,
        nickname: pokemon.nickname,
        level: pokemon.level,
        experience: 0,
        nature: JSON.stringify(pokemon.nature),
        type1,
        type2,
        baseHp: pokemon.baseStats.hp,
        baseAttack: pokemon.baseStats.attack,
        baseDefense: pokemon.baseStats.defense,
        baseSpAtk: pokemon.baseStats.specialAttack,
        baseSpDef: pokemon.baseStats.specialDefense,
        baseSpeed: pokemon.baseStats.speed,
        currentHp: pokemon.maxHp,
        maxHp: pokemon.maxHp,
        currentAttack: pokemon.stats.attack,
        currentDefense: pokemon.stats.defense,
        currentSpAtk: pokemon.stats.specialAttack,
        currentSpDef: pokemon.stats.specialDefense,
        currentSpeed: pokemon.stats.speed,
        stageModifiers: JSON.stringify({
          attack: 0, defense: 0, specialAttack: 0,
          specialDefense: 0, speed: 0, accuracy: 0, evasion: 0
        }),
        abilities: JSON.stringify(pokemon.abilities),
        moves: JSON.stringify(pokemon.moves),
        heldItem: pokemon.heldItem,
        capabilities: JSON.stringify(pokemon.capabilities),
        skills: JSON.stringify(pokemon.skills),
        statusConditions: JSON.stringify([]),
        gender: pokemon.gender || 'Unknown',
        isInLibrary: true,
        notes: 'Imported from PTU sheet'
      }
    })

    console.log(`  Created pokemon: ${created.id}`)
  }
}

async function main() {
  const importDir = path.join(__dirname, '..', '..', 'to_import')

  if (!fs.existsSync(importDir)) {
    console.error('to_import directory not found')
    process.exit(1)
  }

  const files = fs.readdirSync(importDir)
    .filter(f => f.endsWith('.csv') && !f.includes('Zone.Identifier'))

  console.log(`Found ${files.length} CSV files to import`)

  for (const file of files) {
    try {
      await importFile(path.join(importDir, file))
    } catch (error) {
      console.error(`  ERROR importing ${file}:`, error)
    }
  }

  console.log('\nDone!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
