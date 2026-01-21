# Tabletop System
- Pokemon Tabletop United 1.05

# Tech Stack (Implemented)
- **Frontend**: Nuxt 3 (Vue 3) with TypeScript
- **Backend**: Nitro (Nuxt server)
- **Database**: SQLite with Prisma ORM
- **Real-time**: WebSocket (CrossWS)
- **Styling**: SCSS with Pokemon Scarlet/Violet theme
- **State**: Pinia stores

# Data Flow
- Prisma models for persistence (Encounter, Pokemon, HumanCharacter, MoveData)
- Pinia stores for reactive state management
- WebSocket for real-time sync between GM and Group views
- REST API for CRUD operations
