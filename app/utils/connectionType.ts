/**
 * Determine the connection type based on the current hostname.
 * Used by WebSocket reconnection logic and ConnectionStatus UI.
 *
 * - 'localhost': loopback addresses (localhost, 127.0.0.1, ::1)
 * - 'lan': private/LAN IP ranges (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
 * - 'tunnel': everything else (Cloudflare Tunnel, ngrok, etc.)
 */
export function getConnectionType(): 'localhost' | 'lan' | 'tunnel' {
  if (typeof window === 'undefined') return 'lan'
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'localhost'
  }

  if (/^(192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01]))/.test(hostname)) {
    return 'lan'
  }

  return 'tunnel'
}
