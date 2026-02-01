# PTU Session Helper

A Game Master aid application for Pokemon Tabletop United (PTU) 1.05 in-person tabletop RPG sessions. Designed for dual-display use with a GM laptop and a player-facing TV.

## Features

### Core
- **Dual-View System**: GM View with full control, Group View for player-facing TV display
- **Real-time Sync**: WebSocket-based synchronization between GM and Group views
- **Undo/Redo**: Full history support for combat actions (Ctrl+Z / Ctrl+Shift+Z)
- **4K TV Support**: Optimized styling for large displays

### Encounter Management
- **Three-sided Combat**: Players, Allies, and Enemies with initiative tracking
- **Encounter Templates**: Save and load encounter setups
- **Encounter Tables**: Random encounter generation by habitat
- **Serve to Group**: Push encounters to the Group View TV display

### Combat Tracking
- HP with temporary HP support
- Status conditions (all PTU afflictions)
- Combat stages (+/-6 for each stat)
- Injuries and massive damage
- Trainer vs Full Contact battle modes

### Map & Grid
- **Fog of War**: Hide/reveal areas for players
- **Terrain System**: Mark terrain types on the grid
- **Movement Tracking**: Grid-based positioning

### Library Management
- **Character Library**: Create and manage Human characters and Pokemon
- **CSV Import**: Bulk import characters
- **Pokemon Linking**: Link Pokemon to their trainers

## Tech Stack

- **Framework**: Nuxt 3 (Vue 3) with TypeScript, SPA mode
- **Backend**: Nitro server with 86+ REST API endpoints
- **Database**: SQLite with Prisma ORM
- **State**: Pinia (12 stores)
- **Real-time**: WebSocket via CrossWS
- **Styling**: SCSS with Pokemon Scarlet/Violet dark theme

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

TV/projector display for players:
- Shows current encounter served by GM
- Displays combatant HP (percentages for enemies)
- Shows current turn indicator
- Fog of war respected (hidden areas not shown)
- Optimized for 4K TV display
- Auto-connects when GM serves an encounter

### Player View (`/player`) - Future Feature

Individual player interface with clickable actions (not yet implemented).

### Keyboard Shortcuts (GM View)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last action |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |

## Project Structure

```
app/
├── pages/           # File-based routing (gm/, group/, player/)
├── layouts/         # Role-based layouts (gm, group, player, default)
├── components/      # 66 auto-imported Vue components by domain
├── composables/     # 18 composables (combat, grid, WebSocket, etc.)
├── stores/          # 12 Pinia stores for state management
├── server/
│   ├── api/         # REST endpoints (characters, pokemon, encounters, etc.)
│   ├── services/    # Business logic (combatant, encounter, entity-update)
│   ├── routes/      # WebSocket handler
│   └── utils/       # Prisma client, shared state
├── types/           # TypeScript type definitions
└── assets/scss/     # Global styles and variables

books/markdown/      # PTU 1.05 rulebooks (reference material)
```

## Game System

This app is built for **Pokemon Tabletop United 1.05**. Reference materials in `books/markdown/` include:
- `Pokemon Tabletop United 1.05 Core.md` - Core rulebook
- `Combined_Pokedex.md` - Pokemon stats and data
- `errata_2.md` - Rule corrections

When implementing game mechanics, use `/verify-ptu` to check compliance with PTU 1.05 rules.

## License

Private project for personal use.
