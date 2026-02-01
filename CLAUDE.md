# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.



## Core Architecture Concepts

### Tech Stack
- **Framework**: Nuxt 3 (SPA mode, `ssr: false`)
- **Backend**: Nitro server with 86+ REST API endpoints
- **Database**: SQLite with Prisma ORM
- **State**: 12 Pinia stores (auto-registered via `@pinia/nuxt`)
- **Real-time**: WebSocket for GM-Player synchronization
- **Styling**: SCSS with global variables

### Project Structure
```
app/
├── pages/           # File-based routing (gm/, group/, player/)
├── layouts/         # Role-based layouts (gm, group, player, default)
├── components/      # 66 auto-imported components by domain
├── composables/     # 18 auto-imported composables for shared logic
├── stores/          # 12 Pinia stores for state management
├── server/
│   ├── api/         # REST endpoints (characters, pokemon, encounters, etc.)
│   ├── services/    # Business logic (combatant, encounter, entity-update)
│   ├── routes/      # WebSocket handler (ws.ts)
│   └── utils/       # Prisma client, shared state
└── assets/scss/     # Global styles and variables
```

### Dual-View System
- **GM View** (`/gm`): Full control - spawn characters, edit stats, manage NPC turns, all information visible
- **Group View** (`/group`): TV/projector display for players - shows map, health percentages, active turn
- **Player View** (`/player`): Individual player interface - clickable actions, Pokemon sprites

### Data Model Hierarchy
- **Human Characters**: Players or NPCs with stats, linked to their Pokemon
- **Pokemon**: Separate sheets with own stats, moves, abilities - linked to owning character
- **Encounters**: Three-sided combat (Players, Allies, Enemies) with initiative tracking

### Combat Automation
- Initiative sorting: Speed + bonuses
- Turn progression with action tracking
- Set damage application (no dice rolling in app)
- Move history and effect logging
- Trainer vs Full Contact battle modes

### Real-time Sync
WebSocket (`/ws`) handles GM-to-Group synchronization:
- Combat events: `turn_change`, `damage_applied`, `heal_applied`, `move_executed`
- State sync: `encounter_update`, `serve_encounter`, `unserve_encounter`
- Role-based broadcasting (GM sees everything, Group sees filtered data)

### Sprite Sources
- Gen 5 and below: Pokemon Black 2/White 2 sprites
- Gen 6+: Latest 3D game sprites

### Icons
- **Use Phosphor Icons** instead of emojis for UI elements
- Phosphor Icons are installed at the project root level
- Import and use icon components rather than emoji characters

## Git & Attribution Rules

- **Never push commits as Claude** - Do not use Claude or any AI identity as the commit author
- **Never include AI attribution** - Do not add "Co-Authored-By: Claude" or similar AI attribution lines
- **No AI-generated mentions** - Do not mention that code was AI-generated in commits, comments, or documentation
- Commits should appear as if written by the human developer

## Commit Guidelines

### CRITICAL: Small, Frequent Commits

**Commit early and often. Do NOT batch multiple changes into one commit.**

- After completing ANY single logical change, commit immediately
- One file changed? Commit it
- One function added? Commit it
- One bug fixed? Commit it
- Do NOT wait until "everything is done" to commit
- Do NOT combine unrelated changes in one commit

**Examples of correct granularity:**
- `fix: correct damage calculation for steel types` (1 file)
- `refactor: extract useGridMovement composable` (2-3 files)
- `feat: add fog of war toggle button` (1 component)

**Examples of commits that are TOO LARGE:**
- "feat: add fog of war system" (10+ files - should be 3-5 commits)
- "refactor: improve encounter system" (vague, too broad)

### Other Guidelines

- **Conventional commits** - Use prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Descriptive messages** - Include what changed and why
- **Only commit relevant files** - Don't include unrelated changes, test artifacts, or logs
- **Don't wait to be asked** - Proactively commit after completing meaningful work

## PTU Rules Reference

The `books/markdown/` directory contains the complete PTU 1.05 ruleset. When implementing game logic, reference:
- `Pokemon Tabletop United 1.05 Core.md` for mechanics and rules
- `Combined_Pokedex.md` for Pokemon stats and data
- `errata_2.md` for rule corrections
