---
ticket_id: feature-003
priority: P1
status: in-progress
domain: player-view
source: product-roadmap
created_by: user
created_at: 2026-02-22
design_complexity: multi-phase-parallel
---

# feature-003: Full Player View

## Summary

Build out the Player View as a complete third interface alongside GM and Group views. Players use this view as their remote control and database — they look at the Group View (TV/projector) and interact through their Player View (phone or laptop). It must work both in-session (LAN) and out-of-session (server not running) for character management.

## Requirements

### Identity
- Player selects their character on connect (no login/auth — just a character picker)
- Selection persists across page reloads (localStorage or similar)
- Multiple players can connect simultaneously, each controlling their own character

### In-Session (Server Running)
- **Combat:** Execute all PTU actions from their interface — use moves, shift, struggle, pass turn, use items, switch Pokemon. See their own full stats, limited info for enemies (HP percentage, visible status conditions)
- **Group View control:** Some control over the Group View — e.g., tab navigation, scene interaction. Players should be able to influence what's shown on the shared screen
- **Character sheet:** View and edit their own character and Pokemon stats
- **Pokemon management:** Switch active Pokemon, view team, manage moves/abilities
- **Real-time sync:** WebSocket integration (the `player` role currently falls through to `group` — needs proper handling)

### Out-of-Session (Server Not Running)
- Character management must work when players aren't at the GM's house
- **Challenge:** Home network has no static IP. Need a solution for remote access without requiring the GM to run the server 24/7
- Possible approaches: hosted relay/tunnel (Tailscale, Cloudflare Tunnel, ngrok), PWA with offline sync, hosted instance, export/import

### Platform
- Must work on phones (primary player device) and desktop browsers
- Mobile-first responsive design
- Touch-friendly interaction for all combat actions

## Design Questions

- Out-of-session architecture: tunnel vs hosted vs offline-first PWA vs hybrid?
- How much Group View control should players have? Full tab control or limited?
- WebSocket message protocol: what new message types are needed for player actions?
- State ownership: which player edits require GM approval vs direct writes?
- Encounter state: how much enemy information is visible to players? (PTU has knowledge checks)
- How does this interact with the existing scene system?

## Scope

Large. This is essentially a new product surface with mobile-first UX, real-time sync, and an unsolved infrastructure problem (remote access without static IP). **Design spec needs multi-phase delivery with parallel design tracks:**

- **Track A (core):** Player identity, character sheet, in-session combat actions
- **Track B (infrastructure):** Remote access architecture, out-of-session solution
- **Track C (integration):** Group View control, WebSocket protocol, real-time sync

Tracks A and B can be designed in parallel. Track C depends on decisions from both A and B.

## Existing Groundwork

Functional scaffolding exists at `/player` — encounter display with combatant cards and a basic action panel. The page polls for active encounters and connects via WebSocket. However: no character identification, no VTT grid, no character sheet access, no Pokemon management, incomplete WebSocket role handling, action buttons mostly unwired, no scene/lobby tabs, no tests, and not linked from the home page navigation.

## Resolution Log

### Track A: Core Player View (Design Phase)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-22 | 6c2f74c | Design spec: `design-player-view-core-001.md` — player identity, character sheet, Pokemon team, full PTU combat action set, information visibility, mobile-first component architecture, WebSocket updates, 3-phase plan (P0/P1/P2), 13 new files + 7 modified files |

**Design decisions made:**
- Read-only character sheet (no player editing — GM is source of truth)
- Direct actions (move, shift, struggle, pass) vs requested actions (items, switch, maneuvers) split
- Information asymmetry: exact HP for self/allies, percentage for enemies, status conditions always visible
- Mobile-first with 320px minimum width, bottom tab navigation
- `PlayerActionRequest` typed WebSocket message for player-to-GM action requests
- No authentication (localStorage character picker with `ptu_player_identity` key)
