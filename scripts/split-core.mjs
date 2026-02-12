import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'
import { createHash } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = resolve(fileURLToPath(import.meta.url), '..')
const ROOT = resolve(__dirname, '..')
const SOURCE = join(ROOT, 'books/markdown/Pokemon Tabletop United 1.05 Core.md')
const OUTPUT_DIR = join(ROOT, 'books/markdown/core')

const CHAPTER_FILES = {
  0: '00-front-matter.md',
  1: '01-introduction.md',
  2: '02-character-creation.md',
  3: '03-skills-edges-and-features.md',
  4: '04-trainer-classes.md',
  5: '05-pokemon.md',
  6: '06-playing-the-game.md',
  7: '07-combat.md',
  8: '08-pokemon-contests.md',
  9: '09-gear-and-items.md',
  10: '10-indices-and-reference.md',
  11: '11-running-the-game.md',
}

function splitCore() {
  if (!existsSync(SOURCE)) {
    console.error(`Source file not found: ${SOURCE}`)
    process.exit(1)
  }

  const content = readFileSync(SOURCE, 'utf-8')
  const lines = content.split('\n')
  console.log(`Read ${lines.length} lines from source`)

  // Find chapter boundaries: lines matching /^Chapter \d+:\s*$/
  // Then look backwards for the nearest ## Page N line
  const chapterStarts = [] // { chapterNum, pageLineIdx }

  for (let i = 0; i < lines.length; i++) {
    if (/^Chapter \d+:\s*$/.test(lines[i])) {
      const match = lines[i].match(/^Chapter (\d+):/)
      const chapterNum = parseInt(match[1], 10)

      // Look backwards for the nearest ## Page N
      let pageLineIdx = i
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        if (/^## Page \d+/.test(lines[j])) {
          pageLineIdx = j
          break
        }
      }

      chapterStarts.push({ chapterNum, pageLineIdx })
      console.log(`  Chapter ${chapterNum}: line ${i + 1} (Chapter header), line ${pageLineIdx + 1} (## Page)`)
    }
  }

  if (chapterStarts.length !== 11) {
    console.error(`Expected 11 chapters, found ${chapterStarts.length}`)
    process.exit(1)
  }

  // Create output directory
  mkdirSync(OUTPUT_DIR, { recursive: true })

  // Split into chapter files
  const writtenFiles = []

  // Front matter: line 0 to just before Chapter 1's ## Page line
  const frontMatterEnd = chapterStarts[0].pageLineIdx
  const frontMatterContent = lines.slice(0, frontMatterEnd).join('\n')
  const frontMatterPath = join(OUTPUT_DIR, CHAPTER_FILES[0])
  writeFileSync(frontMatterPath, frontMatterContent, 'utf-8')
  writtenFiles.push({ file: CHAPTER_FILES[0], lines: frontMatterEnd })
  console.log(`  Wrote ${CHAPTER_FILES[0]} (${frontMatterEnd} lines)`)

  // Each chapter: from its ## Page line to just before the next chapter's ## Page line
  for (let i = 0; i < chapterStarts.length; i++) {
    const start = chapterStarts[i].pageLineIdx
    const end = i < chapterStarts.length - 1
      ? chapterStarts[i + 1].pageLineIdx
      : lines.length

    const chapterContent = lines.slice(start, end).join('\n')
    const chapterNum = chapterStarts[i].chapterNum
    const filename = CHAPTER_FILES[chapterNum]

    if (!filename) {
      console.error(`No filename mapping for chapter ${chapterNum}`)
      process.exit(1)
    }

    const filePath = join(OUTPUT_DIR, filename)
    writeFileSync(filePath, chapterContent, 'utf-8')
    writtenFiles.push({ file: filename, lines: end - start })
    console.log(`  Wrote ${filename} (${end - start} lines)`)
  }

  // Verification: concatenate all split files and compare with original
  console.log('\n--- Verification ---')
  const sortedFiles = Object.values(CHAPTER_FILES).sort()
  let concatenated = ''
  for (let i = 0; i < sortedFiles.length; i++) {
    const filePath = join(OUTPUT_DIR, sortedFiles[i])
    const fileContent = readFileSync(filePath, 'utf-8')
    if (i === 0) {
      concatenated = fileContent
    } else {
      concatenated += '\n' + fileContent
    }
  }

  const originalHash = createHash('sha256').update(content).digest('hex')
  const concatenatedHash = createHash('sha256').update(concatenated).digest('hex')

  const originalLineCount = lines.length
  const concatenatedLineCount = concatenated.split('\n').length

  console.log(`Original:     ${originalLineCount} lines, SHA-256: ${originalHash}`)
  console.log(`Concatenated: ${concatenatedLineCount} lines, SHA-256: ${concatenatedHash}`)

  if (originalHash === concatenatedHash) {
    console.log('PASS: Content hashes match — no data lost')
  } else {
    console.error('FAIL: Content hashes DO NOT match!')
    // Find first difference
    const origLines = content.split('\n')
    const concLines = concatenated.split('\n')
    for (let i = 0; i < Math.max(origLines.length, concLines.length); i++) {
      if (origLines[i] !== concLines[i]) {
        console.error(`  First difference at line ${i + 1}:`)
        console.error(`    Original:     ${JSON.stringify(origLines[i]?.slice(0, 100))}`)
        console.error(`    Concatenated: ${JSON.stringify(concLines[i]?.slice(0, 100))}`)
        break
      }
    }
    process.exit(1)
  }

  console.log(`\nDone. ${writtenFiles.length} files written to ${OUTPUT_DIR}`)
}

splitCore()
