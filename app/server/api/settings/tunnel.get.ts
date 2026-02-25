import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/settings/tunnel
 *
 * Returns the configured Cloudflare Tunnel URL from AppSettings.
 * Returns null if no tunnel URL has been configured.
 */
export default defineEventHandler(async () => {
  const settings = await prisma.appSettings.findUnique({
    where: { id: 'default' },
    select: { tunnelUrl: true }
  })

  return {
    success: true,
    data: {
      tunnelUrl: settings?.tunnelUrl ?? null
    }
  }
})
