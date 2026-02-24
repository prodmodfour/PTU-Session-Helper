import { networkInterfaces } from 'os'

/**
 * GET /api/settings/server-info
 *
 * Returns the server's network addresses (LAN IP + port) so the GM
 * can share connection info with players.
 *
 * Only returns non-internal IPv4 addresses from active interfaces.
 */
export default defineEventHandler(() => {
  const interfaces = networkInterfaces()
  const addresses: Array<{ interface: string; address: string; url: string }> = []

  const port = process.env.PORT || process.env.NITRO_PORT || '3000'

  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue

    for (const net of nets) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (net.internal) continue
      if (net.family !== 'IPv4') continue

      addresses.push({
        interface: name,
        address: net.address,
        url: `http://${net.address}:${port}`
      })
    }
  }

  // Sort: prefer common LAN interfaces (eth, wlan, en) first
  const sortedAddresses = [...addresses].sort((a, b) => {
    const priority = (name: string): number => {
      const lower = name.toLowerCase()
      if (lower.startsWith('eth') || lower.startsWith('en')) return 0
      if (lower.startsWith('wlan') || lower.startsWith('wi-fi') || lower.startsWith('wifi')) return 1
      return 2
    }
    return priority(a.interface) - priority(b.interface)
  })

  return {
    success: true,
    data: {
      port: Number(port),
      addresses: sortedAddresses,
      primaryUrl: sortedAddresses.length > 0 ? sortedAddresses[0].url : `http://localhost:${port}`
    }
  }
})
