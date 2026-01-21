# Character Library (`/gm/library`)

## Features (Implemented)
- Sortable collection of Pokemon and Human characters
- Filter by type (Pokemon/Human), search by name
- Create new Pokemon and Human characters
- Edit existing characters
- Link/unlink Pokemon to Human owners
- Add characters from library to active encounters

## Data Model
- **HumanCharacter**: Players and NPCs with stats, trainer classes, inventory
- **Pokemon**: Species, stats, moves, abilities, nature, held items
- **Ownership**: Pokemon linked to HumanCharacter via ownerId

## Storage
- SQLite database with Prisma ORM
- Persisted across sessions
- Characters marked with `isInLibrary: true` appear in library
