import { prisma } from '~/server/utils/prisma'

/**
 * PUT /api/settings/tunnel
 *
 * Updates the Cloudflare Tunnel URL in AppSettings.
 * Accepts { tunnelUrl: string | null }.
 * Validates that the URL is a valid HTTPS URL when provided.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const tunnelUrl = body?.tunnelUrl ?? null

  // Validate URL format when provided
  if (tunnelUrl !== null && tunnelUrl !== '') {
    const trimmed = typeof tunnelUrl === 'string' ? tunnelUrl.trim() : ''

    if (!trimmed) {
      throw createError({
        statusCode: 400,
        message: 'Tunnel URL must be a non-empty string or null'
      })
    }

    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        throw new Error('Invalid protocol')
      }
    } catch {
      throw createError({
        statusCode: 400,
        message: 'Tunnel URL must be a valid HTTP or HTTPS URL (e.g. https://ptu.example.com)'
      })
    }

    // Store the validated URL (strip trailing slash for consistency)
    const normalizedUrl = trimmed.replace(/\/+$/, '')

    const settings = await prisma.appSettings.upsert({
      where: { id: 'default' },
      update: { tunnelUrl: normalizedUrl },
      create: { id: 'default', tunnelUrl: normalizedUrl }
    })

    return {
      success: true,
      data: { tunnelUrl: settings.tunnelUrl }
    }
  }

  // Clear the tunnel URL
  const settings = await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: { tunnelUrl: null },
    create: { id: 'default' }
  })

  return {
    success: true,
    data: { tunnelUrl: settings.tunnelUrl }
  }
})
