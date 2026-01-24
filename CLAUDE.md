# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pokemon Tabletop United (PTU) 1.05 Session Helper - a Game Master aid application for in-person tabletop RPG sessions. Designed for dual-display use: GM laptop (1080p) and player TV (4K via Google TV Streamer).

**Current Status**: Design phase complete, implementation not yet started.

## Technology Stack (Planned)

- **Frontend**: Nuxt (Vue 3)
- **Backend**: TBD (flexible)
- **Game System**: Pokemon Tabletop United 1.05

## Repository Structure

```
design/           # Feature specifications and architecture decisions
  character_sheet.md   # Character/Pokemon sheet automation specs
  encounter_helper.md  # Combat system and initiative tracking specs
  library.md           # Character collection system specs
  system.md            # Tech stack definition
  usage.md             # Deployment context (GM laptop + player TV)
  visual.md            # Theme (black/red/white), sprite sources

books/markdown/   # PTU rulebooks and reference material
  Pokemon Tabletop United 1.05 Core.md  # Complete system rules
  Combined_Pokedex.md                    # All Pokemon data
  pokedexes/                             # Regional references
```

## Core Architecture Concepts

### Dual-View System
- **GM View**: Full control - spawn characters, edit stats, manage NPC turns, all information visible
- **Player View**: Simplified - health percentages, active turn, clickable actions, Pokemon sprites

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

## PTU Rules Reference

The `books/markdown/` directory contains the complete PTU 1.05 ruleset. When implementing game logic, reference:
- `Pokemon Tabletop United 1.05 Core.md` for mechanics and rules
- `Combined_Pokedex.md` for Pokemon stats and data
- `errata_2.md` for rule corrections
