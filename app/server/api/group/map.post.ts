import { setServedMap, type ServedMap } from '~/server/utils/servedMap'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body || !body.id || !body.name) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: id, name'
      })
    }

    const map: ServedMap = {
      id: String(body.id),
      name: String(body.name),
      locations: Array.isArray(body.locations) ? [...body.locations] : [],
      connections: Array.isArray(body.connections) ? [...body.connections] : [],
      timestamp: Date.now()
    }

    setServedMap(map)

    return {
      success: true,
      message: 'Map served to group view'
    }
  } catch (error: any) {
    console.error('Error serving map:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to serve map'
    })
  }
})
