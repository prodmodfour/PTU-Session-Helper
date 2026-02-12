import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..')
const POKEDEX_DIR = join(ROOT, 'books/markdown/pokedexes')
const GEN_LOOKUP_PATH = join(__dirname, 'data/pokemon-gen-lookup.json')

// Source files → target generation directories
const SOURCES = [
  {
    file: 'Pokedex_Playtest105Plus.md',
    genDir: null, // determined per-entry via gen lookup
    howToReadPages: { start: 6, end: 11 }, // pages 6-11 are "How to Read" guide
    firstEntryPage: 12,
  },
  {
    file: 'AlolaDex.md',
    genDir: 'gen7',
    howToReadPages: null,
    firstEntryPage: 4,
  },
  {
    file: 'GalarDex + Armor_Crown.md',
    genDir: 'gen8',
    howToReadPages: null,
    firstEntryPage: 3,
  },
  {
    file: 'HisuiDex.md',
    genDir: 'hisui',
    howToReadPages: null,
    firstEntryPage: 4,
  },
]

function loadGenLookup() {
  const data = JSON.parse(readFileSync(GEN_LOOKUP_PATH, 'utf-8'))
  return data
}

function extractPokemonName(pageContent) {
  const lines = pageContent.split('\n')
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim()
    if (line.length < 3) continue
    if (/^\d+$/.test(line)) continue
    if (['Contents', 'TABLE OF CONTENTS'].some(s => line.startsWith(s))) continue
    // Pokemon names start with uppercase letter, at least 3 chars
    if (/^[A-Z]/.test(line) && line.length >= 3) {
      return line.replace(/\s+/g, ' ').replace(/\t+/g, ' ').trim()
    }
  }
  return null
}

function normalizeToBaseName(rawName) {
  // Title-case the name for lookup: "BULBASAUR" → "Bulbasaur"
  // Handle mixed-case formes: "TORNADUS Incarnate Forme" → base is "Tornadus"

  const parts = rawName.split(/\s+/)
  let baseParts = []
  let formeParts = []
  let inForme = false

  for (const part of parts) {
    // If part starts with lowercase or is a known forme keyword, it's a forme suffix
    if (inForme || (/^[a-z]/.test(part) && part !== '(F)' && part !== '(M)')) {
      inForme = true
      formeParts.push(part)
    } else {
      baseParts.push(part)
    }
  }

  // Special cases where the full name IS the base species
  const fullTitleCase = baseParts.map(titleCaseWord).join(' ')

  // For ALOLAN/GALARIAN/HISUIAN prefixed names, base = the species after the prefix
  if (baseParts[0] === 'ALOLAN' || baseParts[0] === 'GALARIAN') {
    return baseParts.slice(1).map(titleCaseWord).join(' ')
  }

  return fullTitleCase
}

function titleCaseWord(word) {
  if (word === 'MR.') return 'Mr.'
  if (word === 'JR.') return 'Jr.'
  if (word === '(F)') return '(F)'
  if (word === '(M)') return '(M)'
  if (word === 'FLABÉBÉ') return 'Flabebe'
  if (word === 'PORYGON2') return 'Porygon2'
  // Handle both straight and curly apostrophes in FARFETCH'D
  if (/^FARFETCH[\u2019']D$/i.test(word)) return "Farfetch'd"
  if (word === 'HO-OH') return 'Ho-Oh'
  if (word === 'PORYGON-Z') return 'Porygon-z'
  if (word === 'JANGMO-O') return 'Jangmo-o'
  if (word === 'HAKAMO-O') return 'Hakamo-o'
  if (word === 'KOMMO-O') return 'Kommo-o'
  if (word === 'TYPE:') return 'Type:'
  if (word === 'NULL') return 'Null'
  // Handle both straight and curly apostrophes in SIRFETCH'D
  if (/^SIRFETCH[\u2019']D$/i.test(word)) return "Sirfetch'd"
  return word.charAt(0) + word.slice(1).toLowerCase()
}

function nameToFilename(rawName) {
  let name = rawName
    .replace(/\s+/g, ' ')
    .trim()

  // Normalize to lowercase for filename
  name = name.toLowerCase()

  // Strip forme/form/cloak suffixes (but keep meaningful identifiers)
  name = name.replace(/\s+forme?\s*$/, '')
  name = name.replace(/\s+cloak\s*$/, '')

  // Replace spaces and special chars
  name = name
    .replace(/['''\u2019]/g, '')      // remove apostrophes: farfetch'd → farfetchd
    .replace(/[éè]/g, 'e')    // normalize accents: flabébé → flabebe
    .replace(/\./g, '')        // remove periods: mr. mime → mr mime, mime jr. → mime jr
    .replace(/:/g, '')         // remove colons: type: null → type null
    .replace(/\(f\)/g, 'f')   // nidoran (f) → nidoran f
    .replace(/\(m\)/g, 'm')   // nidoran (m) → nidoran m
    .replace(/\s+/g, '-')     // spaces to hyphens
    .replace(/-+/g, '-')      // collapse multiple hyphens
    .replace(/[^a-z0-9-]/g, '') // remove any remaining special chars

  return name + '.md'
}

function getGenDir(baseName, genLookup) {
  // Direct lookup
  if (genLookup[baseName] !== undefined) {
    return `gen${genLookup[baseName]}`
  }

  // Try without trailing forme parts that might still be attached
  const firstWord = baseName.split(' ')[0]
  if (genLookup[firstWord] !== undefined) {
    return `gen${genLookup[firstWord]}`
  }

  return null
}

function splitPokedex() {
  const genLookup = loadGenLookup()

  const stats = {
    totalEntries: 0,
    totalFiles: 0,
    totalSkipped: 0,
    orphans: [],
    bySource: {},
  }

  // Process each source file
  for (const source of SOURCES) {
    const filePath = join(POKEDEX_DIR, source.file)
    if (!existsSync(filePath)) {
      console.error(`Source file not found: ${filePath}`)
      process.exit(1)
    }

    const content = readFileSync(filePath, 'utf-8')
    const totalLines = content.split('\n').length
    console.log(`\nProcessing ${source.file} (${totalLines} lines)...`)

    // Split by ## Page markers, keeping the delimiter
    const pageRegex = /^(## Page (\d+))/gm
    const pages = []
    let lastIndex = 0
    let match

    // Collect all page positions
    const pagePositions = []
    while ((match = pageRegex.exec(content)) !== null) {
      pagePositions.push({
        marker: match[1],
        pageNum: parseInt(match[2]),
        startIdx: match.index,
      })
    }

    // Build page sections
    for (let i = 0; i < pagePositions.length; i++) {
      const start = pagePositions[i].startIdx
      const end = i + 1 < pagePositions.length ? pagePositions[i + 1].startIdx : content.length
      pages.push({
        pageNum: pagePositions[i].pageNum,
        content: content.slice(start, end),
      })
    }

    // Also capture pre-page content (before first ## Page)
    const firstPageStart = pagePositions.length > 0 ? pagePositions[0].startIdx : content.length
    const preamble = content.slice(0, firstPageStart)

    console.log(`  Found ${pages.length} pages`)

    const sourceStats = {
      entries: 0,
      skipped: [],
      howToReadLines: 0,
      entryLines: 0,
      preambleLines: preamble.split('\n').length,
    }

    // Handle "How to Read" pages
    if (source.howToReadPages) {
      const howToReadContent = pages
        .filter(p => p.pageNum >= source.howToReadPages.start && p.pageNum <= source.howToReadPages.end)
        .map(p => p.content)
        .join('')

      if (howToReadContent) {
        const howToReadPath = join(POKEDEX_DIR, 'how-to-read.md')
        writeFileSync(howToReadPath, howToReadContent, 'utf-8')
        sourceStats.howToReadLines = howToReadContent.split('\n').length
        console.log(`  Wrote how-to-read.md (${sourceStats.howToReadLines} lines, pages ${source.howToReadPages.start}-${source.howToReadPages.end})`)
      }
    }

    // Process each page
    for (const page of pages) {
      // Skip pages before first entry
      if (page.pageNum < source.firstEntryPage) {
        // Check if it's a how-to-read page (already handled)
        if (source.howToReadPages &&
            page.pageNum >= source.howToReadPages.start &&
            page.pageNum <= source.howToReadPages.end) {
          // Already saved
        } else {
          sourceStats.skipped.push({ page: page.pageNum, reason: 'pre-entry (TOC/intro)' })
        }
        continue
      }

      // Check for Base Stats: to confirm it's an entry page
      if (!page.content.includes('Base Stats:')) {
        sourceStats.skipped.push({ page: page.pageNum, reason: 'no Base Stats:' })
        continue
      }

      // Extract Pokemon name
      // Skip the ## Page line and page number line to find the name
      const afterMarker = page.content.replace(/^## Page \d+\n?/, '')
      const rawName = extractPokemonName(afterMarker)

      if (!rawName) {
        sourceStats.skipped.push({ page: page.pageNum, reason: 'no name found' })
        stats.orphans.push({ source: source.file, page: page.pageNum, reason: 'no name found' })
        continue
      }

      // Determine output directory
      let targetGenDir
      if (source.genDir) {
        // Fixed directory for regional dexes
        targetGenDir = source.genDir
      } else {
        // Look up generation for Playtest entries
        const baseName = normalizeToBaseName(rawName)
        targetGenDir = getGenDir(baseName, genLookup)

        if (!targetGenDir) {
          console.error(`  ORPHAN: No gen mapping for "${rawName}" (base: "${baseName}") on page ${page.pageNum}`)
          stats.orphans.push({ source: source.file, page: page.pageNum, name: rawName, baseName })
          continue
        }
      }

      // Generate filename
      const filename = nameToFilename(rawName)
      const dirPath = join(POKEDEX_DIR, targetGenDir)
      mkdirSync(dirPath, { recursive: true })

      const outputPath = join(dirPath, filename)

      // Handle duplicate filenames (shouldn't happen, but be safe)
      if (existsSync(outputPath)) {
        console.warn(`  WARNING: Duplicate file ${targetGenDir}/${filename} (page ${page.pageNum}), appending page number`)
        const altFilename = filename.replace('.md', `-p${page.pageNum}.md`)
        writeFileSync(join(dirPath, altFilename), page.content, 'utf-8')
      } else {
        writeFileSync(outputPath, page.content, 'utf-8')
      }

      sourceStats.entries++
      sourceStats.entryLines += page.content.split('\n').length
      stats.totalEntries++
      stats.totalFiles++
    }

    // Log skipped pages
    if (sourceStats.skipped.length > 0) {
      console.log(`  Skipped ${sourceStats.skipped.length} non-entry pages:`)
      for (const s of sourceStats.skipped) {
        console.log(`    Page ${s.page}: ${s.reason}`)
      }
    }

    console.log(`  Wrote ${sourceStats.entries} entry files`)
    console.log(`  Lines: ${sourceStats.preambleLines} preamble + ${sourceStats.howToReadLines} how-to-read + ${sourceStats.entryLines} entries + skipped pages`)
    stats.bySource[source.file] = sourceStats
  }

  // Verification
  console.log('\n--- Verification ---')

  // Count Base Stats: in all output files
  let totalBaseStats = 0
  let totalOutputFiles = 0
  const genDirs = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5', 'gen6', 'gen7', 'gen8', 'hisui']
  const genCounts = {}

  for (const dir of genDirs) {
    const dirPath = join(POKEDEX_DIR, dir)
    if (!existsSync(dirPath)) continue

    const files = readdirSync(dirPath).filter(f => f.endsWith('.md'))
    genCounts[dir] = files.length
    totalOutputFiles += files.length

    for (const file of files) {
      const fileContent = readFileSync(join(dirPath, file), 'utf-8')
      const baseStatsCount = (fileContent.match(/Base Stats:/g) || []).length
      totalBaseStats += baseStatsCount
    }
  }

  // Include how-to-read.md in the Base Stats count (it has a sample entry)
  const howToReadPath = join(POKEDEX_DIR, 'how-to-read.md')
  if (existsSync(howToReadPath)) {
    const howToReadContent = readFileSync(howToReadPath, 'utf-8')
    const howToReadBaseStats = (howToReadContent.match(/Base Stats:/g) || []).length
    totalBaseStats += howToReadBaseStats
    if (howToReadBaseStats > 0) {
      console.log(`  how-to-read.md: ${howToReadBaseStats} Base Stats: (sample entry in format guide)`)
    }
  }

  // Count Base Stats in originals
  let originalBaseStats = 0
  for (const source of SOURCES) {
    const filePath = join(POKEDEX_DIR, source.file)
    const content = readFileSync(filePath, 'utf-8')
    const count = (content.match(/Base Stats:/g) || []).length
    originalBaseStats += count
    console.log(`  ${source.file}: ${count} Base Stats:`)
  }

  console.log(`\nOutput files: ${totalOutputFiles}`)
  console.log(`Base Stats: in output: ${totalBaseStats}`)
  console.log(`Base Stats: in originals: ${originalBaseStats}`)
  console.log(`Gen counts:`, JSON.stringify(genCounts))

  if (totalBaseStats === originalBaseStats) {
    console.log('PASS: Base Stats count matches')
  } else {
    console.error(`FAIL: Base Stats mismatch! Output: ${totalBaseStats}, Original: ${originalBaseStats}`)
    process.exit(1)
  }

  if (stats.orphans.length === 0) {
    console.log('PASS: No orphan pages')
  } else {
    console.error(`FAIL: ${stats.orphans.length} orphan pages:`)
    stats.orphans.forEach(o => console.error(`  ${o.source} page ${o.page}: ${o.name || o.reason}`))
    process.exit(1)
  }

  // Spot checks
  const spotChecks = [
    ['gen1', 'bulbasaur.md'],
    ['gen1', 'pikachu.md'],
    ['gen1', 'eevee.md'],
    ['gen4', 'lucario.md'],
    ['gen7', 'rowlet.md'],
    ['gen8', 'grookey.md'],
  ]

  let spotChecksFailed = false
  for (const [dir, file] of spotChecks) {
    const path = join(POKEDEX_DIR, dir, file)
    if (existsSync(path)) {
      console.log(`PASS: ${dir}/${file} exists`)
    } else {
      console.error(`FAIL: ${dir}/${file} NOT FOUND`)
      spotChecksFailed = true
    }
  }

  if (spotChecksFailed) {
    process.exit(1)
  }

  console.log(`\nDone. ${stats.totalFiles} files written across ${Object.keys(genCounts).length} directories.`)
}

splitPokedex()
