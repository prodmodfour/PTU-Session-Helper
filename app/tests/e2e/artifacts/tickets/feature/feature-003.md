---
ticket_id: feature-003
priority: P1
status: in-progress  # P0 implemented, P1/P2 pending
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

### Track A: Core Player View (P0 Implementation)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-23 | ce124f4 | Pinia store: `playerIdentity.ts` — characterId, character, pokemon, loading, error state |
| 2026-02-23 | a70fcc5 | API endpoint: `GET /api/characters/:id/player-view` — full character + Pokemon join |
| 2026-02-23 | 31b5fb8 | Composable: `usePlayerIdentity.ts` — localStorage persistence, data fetching |
| 2026-02-23 | 9ac4838 | WebSocket: player role in ClientInfo, identify with characterId, player_action forwarding |
| 2026-02-23 | a4ec5ee | Component: `PlayerIdentityPicker.vue` — character selection overlay |
| 2026-02-23 | 82ef31b | Component: `PlayerNavBar.vue` — bottom tab navigation (Character/Team/Encounter) |
| 2026-02-23 | 78bb919 | Component: `PlayerCharacterSheet.vue` — read-only stats, skills, features, equipment, inventory |
| 2026-02-23 | 8829400 | Components: `PlayerPokemonTeam.vue`, `PlayerPokemonCard.vue`, `PlayerMoveList.vue` |
| 2026-02-23 | fde1abf | Components: `PlayerEncounterView.vue`, `PlayerCombatantInfo.vue` — visibility-aware |
| 2026-02-23 | 54549ca | Page rewrite: `player/index.vue` — identity, tabs, WS sync, encounter polling |

**Files created (11):**
- `app/stores/playerIdentity.ts`
- `app/composables/usePlayerIdentity.ts`
- `app/server/api/characters/[id]/player-view.get.ts`
- `app/components/player/PlayerIdentityPicker.vue`
- `app/components/player/PlayerNavBar.vue`
- `app/components/player/PlayerCharacterSheet.vue`
- `app/components/player/PlayerPokemonTeam.vue`
- `app/components/player/PlayerPokemonCard.vue`
- `app/components/player/PlayerMoveList.vue`
- `app/components/player/PlayerEncounterView.vue`
- `app/components/player/PlayerCombatantInfo.vue`

**Files modified (6):**
- `app/pages/player/index.vue` (complete rewrite)
- `app/layouts/player.vue` (removed 4K scaling)
- `app/server/utils/websocket.ts` (added 'player' to ClientInfo.role)
- `app/server/routes/ws.ts` (player role in identify, player_action handler)
- `app/composables/useWebSocket.ts` (characterId in identify())
- `app/types/api.ts` (PlayerActionRequest, characterId in identify)

### Track A: Core Player View (P0 Fix Cycle — code-review-139)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-23 | 2340554 | M1: Move `PlayerTab` type to `types/player.ts` — extracted from SFC export |
| 2026-02-23 | 818f479 | H1: Extract duplicated SCSS to shared `_player-view.scss` — type badges, stat cells, HP bar, status badges |
| 2026-02-23 | b8bc03c | M4: Extract `$player-nav-clearance` SCSS variable — replace hardcoded 72px in 3 components |
| 2026-02-23 | 41c25f8 | H2: Pass equipment evasion bonus to `calculateEvasion()` — uses `computeEquipmentBonuses()` |
| 2026-02-23 | 37f80d5 | C1: Wire `character_update` WebSocket listener — calls `refreshCharacterData()` on entity match |
| 2026-02-23 | 430f96a | H3: Add exponential backoff to encounter polling — 5 failures triggers 3s->6s->12s->cap 30s |
| 2026-02-23 | dc1f21e | M2: Add `aria-label="Switch character"` to icon-only button |
| 2026-02-23 | 698e479 | M3: Replace `alert()` with inline error for character selection failures |

**Files created (2):**
- `app/types/player.ts`
- `app/assets/scss/components/_player-view.scss`

**Files modified (10):**
- `app/types/index.ts` (added player.ts re-export)
- `app/nuxt.config.ts` (added _player-view.scss to css array)
- `app/assets/scss/_variables.scss` (added $player-nav-clearance)
- `app/pages/player/index.vue` (C1, H3, M2, M3 fixes)
- `app/components/player/PlayerNavBar.vue` (M1: import type from types/)
- `app/components/player/PlayerCharacterSheet.vue` (H1, H2, M4 fixes)
- `app/components/player/PlayerPokemonCard.vue` (H1: removed duplicated SCSS)
- `app/components/player/PlayerMoveList.vue` (H1: removed duplicated SCSS)
- `app/components/player/PlayerCombatantInfo.vue` (H1: removed duplicated SCSS)
- `app/components/player/PlayerPokemonTeam.vue` (M4: use SCSS variable)
- `app/components/player/PlayerEncounterView.vue` (M4: use SCSS variable)

**All 8 issues from code-review-139 resolved:** 1 CRITICAL, 3 HIGH, 4 MEDIUM.

### Track A: Core Player View (P1 Implementation)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-23 | (P1 Track A) | Composable: `usePlayerCombat.ts` — turn detection, action execution, move availability, league battle phases |
| 2026-02-23 | (P1 Track A) | Component: `PlayerCombatActions.vue` — full combat action panel with moves, shift, struggle, pass, item/switch/maneuver requests, target selection |

### Track A: Core Player View (P1 Fix Cycle — code-review-147)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-24 | af5ee4f | C1+MEDIUM-001: Add canBeCommanded check for league battles, fix Struggle comment |
| 2026-02-24 | 867e189 | H1: Extract PlayerCombatActions SCSS to `_player-combat-actions.scss` (1028→469 lines) |
| 2026-02-24 | 58673d8 | M2: Replace alert() with severity-aware toast notifications |
| 2026-02-24 | 7a512e7 | M1: Use usePlayerCombat composable for isMyTurn in PlayerEncounterView |
| 2026-02-24 | f8931ab | M3: Delete dead PlayerActionPanel.vue |
| 2026-02-24 | b7b81c5 | H2: Add player view components and composables to app-surface.md |

**Files created (1):**
- `app/assets/scss/components/_player-combat-actions.scss`

**Files modified (5):**
- `app/composables/usePlayerCombat.ts` (C1: canBeCommanded, MEDIUM-001: Struggle comment)
- `app/components/player/PlayerCombatActions.vue` (C1: disable moves/struggle, H1: SCSS extraction, M2: toast)
- `app/components/player/PlayerEncounterView.vue` (M1: use composable isMyTurn)
- `app/nuxt.config.ts` (H1: register _player-combat-actions.scss)
- `.claude/skills/references/app-surface.md` (H2: player view entries)

**Files deleted (1):**
- `app/components/encounter/PlayerActionPanel.vue` (M3: dead code)

**All 7 issues from code-review-147 + rules-review-137 resolved:** 1 CRITICAL, 2 HIGH, 3 MEDIUM, 1 rules MEDIUM.

### Track B: Infrastructure / Remote Access (Design Phase)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-22 | (infra slave) | Design spec: `design-player-view-infra-001.md` -- Cloudflare Tunnel for remote access, PWA offline cache, JSON export/import, data sync model, conflict resolution |

### Track B: Infrastructure / Remote Access (P0 Fix Cycle — code-review-152)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-24 | 689cb48 | C1: Remove `.passthrough()` from import Zod schemas — use default strip behavior for defense-in-depth |
| 2026-02-24 | aa25732 | H1: Add click-outside handler to ServerAddressDisplay panel — capture-phase listener with cleanup |
| 2026-02-24 | cb56759 | H2: Wrap character + Pokemon import updates in single `prisma.$transaction()` |
| 2026-02-24 | 4cfb11b | H3: Separate character fields and Pokemon counts in import response — clearer UI message |
| 2026-02-24 | b38c2e6 | M1: Rename `importResult` to `operationResult` in export/import composable |
| 2026-02-24 | 606d725 | M3: Read `appVersion` from package.json instead of hardcoded string |
| 2026-02-24 | 3e1f82d | M4: Refetch server addresses every time LAN panel is expanded |
| 2026-02-24 | 723ff37 | M2: Add Track B P0 endpoints, composable, and component to app-surface.md |

**Files modified (5):**
- `app/server/api/player/import/[characterId].post.ts` (C1, H2, H3)
- `app/server/api/player/export/[characterId].get.ts` (M3)
- `app/components/gm/ServerAddressDisplay.vue` (H1, M4)
- `app/composables/useCharacterExportImport.ts` (H3, M1)
- `app/components/player/PlayerCharacterSheet.vue` (M1)
- `.claude/skills/references/app-surface.md` (M2)

**All 8 issues from code-review-152 resolved:** 1 CRITICAL, 3 HIGH, 4 MEDIUM.

### Track C: Integration (Design Phase)

| Date | Commit | Description |
|------|--------|-------------|
| 2026-02-22 | fc2c7f2 | Design spec: `design-player-view-integration-001.md` -- WebSocket protocol expansion (10 new message types), Group View control (GM-approved tab changes), VTT grid for players (tap-to-request-move), scene view, state sync architecture, cross-track integration. 10 new files + 10 modified files across P0/P1/P2. |

**Design decisions made:**
- All player-to-GM communication uses `requestId` tracking for response routing via server-side `pendingRequests` map
- Group View tab changes require GM approval (except auto-switch on encounter serve / scene activate)
- VTT grid reuses `GridCanvas.vue` with `playerMode` prop -- no token drag, tap-to-request-move model
- Scene view is read-only, pushed to player on connect and on activation
- Server-authoritative eventual consistency -- no CRDTs, turn-based combat is inherently sequential
- 45-second keepalive prevents Cloudflare Tunnel 100-second idle timeout
- REST fallback endpoint for action requests during WS disconnection
- `pendingRequests` map entries auto-expire after 60 seconds
