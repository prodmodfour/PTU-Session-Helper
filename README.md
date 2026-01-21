# PTU Session Helper

A Game Master aid application for Pokemon Tabletop United (PTU) 1.05 in-person tabletop RPG sessions. Designed for dual-display use with a GM laptop and a player-facing TV.

## Features

- **Dual-View System**: GM View with full control, Group View for player-facing display
- **Encounter Management**: Three-sided combat (Players, Allies, Enemies) with initiative tracking
- **Serve to Group**: GM can serve encounters to the Group View displayed on a TV
- **Undo/Redo**: Full undo/redo support for combat actions (Ctrl+Z / Ctrl+Shift+Z)
- **Real-time Sync**: WebSocket-based synchronization between GM and Group views
- **4K TV Support**: Optimized styling for 4K displays
- **Character Library**: Manage Pokemon and Human characters
- **Combat Tracking**: HP, status conditions, combat stages, injuries

## Tech Stack

- **Frontend**: Nuxt 3 (Vue 3) with TypeScript
- **Styling**: SCSS with Pokemon Scarlet/Violet dark theme
- **Database**: SQLite with Prisma ORM
- **Real-time**: WebSocket (CrossWS)

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
cd app
npm install
```

### Database Setup

```bash
npx prisma db push
npx prisma db seed
```

This creates the database and seeds it with all PTU 1.05 moves from the included CSV data.

### Development

```bash
npm run dev
```

The app will be available at:
- GM View: `http://localhost:3000/gm`
- Group View: `http://localhost:3000/group`

### Production Build

```bash
npm run build
node .output/server/index.mjs
```

## Usage

### GM View (`/gm`)

The GM has full control over encounters:
- Create and manage encounters
- Add/remove combatants from the library
- Apply damage, healing, status conditions
- Manage combat stages
- Advance turns and rounds
- Serve encounters to the Group View
- Undo/redo any combat action

### Group View (`/group`)

Read-only display for players:
- Shows current encounter state
- Displays combatant HP (percentages for enemies)
- Shows current turn indicator
- Optimized for 4K TV display
- Auto-connects when GM serves an encounter

### Keyboard Shortcuts (GM View)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last action |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |

## Project Structure

```
app/
  components/       # Vue components
  composables/      # Vue composables (useEncounterHistory, useWebSocket, etc.)
  layouts/          # Page layouts (gm, group)
  pages/            # Route pages
  server/           # API routes and WebSocket handler
  stores/           # Pinia stores
  types/            # TypeScript type definitions
  assets/scss/      # Global styles and variables

design/             # Feature specifications
books/              # PTU rulebooks (reference material)
```

## Game System

This app is built for **Pokemon Tabletop United 1.05**. Reference materials in `books/markdown/` include the core rulebook and Pokedex data.

## License

Private project for personal use.
