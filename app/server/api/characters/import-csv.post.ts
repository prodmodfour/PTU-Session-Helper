import { parseCSV } from '~/server/utils/csv-parser'
import {
  detectSheetType,
  parseTrainerSheet,
  parsePokemonSheet,
  createTrainerFromCSV,
  createPokemonFromCSV
} from '~/server/services/csv-import.service'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.csvContent || typeof body.csvContent !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'csvContent is required'
    })
  }

  const rows = parseCSV(body.csvContent)
  const sheetType = detectSheetType(rows)

  if (sheetType === 'unknown') {
    throw createError({
      statusCode: 400,
      message: 'Could not determine sheet type (trainer or pokemon)'
    })
  }

  try {
    if (sheetType === 'trainer') {
      const trainer = parseTrainerSheet(rows)
      const data = await createTrainerFromCSV(trainer)
      return { success: true, type: 'trainer', data }
    } else {
      const pokemon = parsePokemonSheet(rows)
      const data = await createPokemonFromCSV(pokemon)
      return { success: true, type: 'pokemon', data }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to import character'
    throw createError({
      statusCode: 500,
      message
    })
  }
})
