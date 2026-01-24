import { setWildSpawnPreview } from '~/server/utils/wildSpawnState'
import type { WildSpawnPreview } from '~/server/utils/wildSpawnState'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      pokemon: Array<{
        speciesId: string
        speciesName: string
        level: number
      }>
      tableName: string
    }>(event)

    if (!body.pokemon || !Array.isArray(body.pokemon) || body.pokemon.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Pokemon array is required and must not be empty'
      })
    }

    if (!body.tableName) {
      throw createError({
        statusCode: 400,
        message: 'Table name is required'
      })
    }

    const preview: WildSpawnPreview = {
      id: crypto.randomUUID(),
      pokemon: body.pokemon,
      tableName: body.tableName,
      timestamp: Date.now()
    }

    setWildSpawnPreview(preview)

    return { success: true, data: preview }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to set wild spawn preview'
    })
  }
})
