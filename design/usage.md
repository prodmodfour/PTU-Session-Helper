# Dual-Display Setup

## GM View (`/gm`)
- Used on GM's 1080p laptop monitor
- Full control over encounters, characters, and combat

## Group View (`/group`)
- Displayed on 4K smart TV via Google TV Streamer
- Read-only display optimized for 4K resolution
- Auto-connects when GM serves an encounter
- Chrome tab casting from laptop to TV

## Serve/Unserve System
- GM clicks "Serve to Group" to display encounter on TV
- Group View auto-polls for served encounters
- WebSocket keeps views synchronized in real-time

## Local Use Only
- Designed for in-person tabletop sessions
- Both views run on same local network
- No authentication required (trusted local environment)
