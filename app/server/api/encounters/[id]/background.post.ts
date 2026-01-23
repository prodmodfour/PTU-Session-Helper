import { defineEventHandler, readMultipartFormData, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Encounter ID is required'
    })
  }

  // Verify encounter exists
  const encounter = await prisma.encounter.findUnique({
    where: { id }
  })

  if (!encounter) {
    throw createError({
      statusCode: 404,
      message: 'Encounter not found'
    })
  }

  // Read multipart form data
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No file uploaded'
    })
  }

  const file = formData.find(f => f.name === 'file')

  if (!file) {
    throw createError({
      statusCode: 400,
      message: 'File field is required'
    })
  }

  // Validate file type
  if (!file.type || !ALLOWED_TYPES.includes(file.type)) {
    throw createError({
      statusCode: 400,
      message: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`
    })
  }

  // Validate file size
  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    })
  }

  // Convert to data URL for storage in SQLite
  const base64 = file.data.toString('base64')
  const dataUrl = `data:${file.type};base64,${base64}`

  // Update encounter with background image
  const updated = await prisma.encounter.update({
    where: { id },
    data: {
      gridBackground: dataUrl
    }
  })

  return {
    success: true,
    data: {
      background: updated.gridBackground
    }
  }
})
