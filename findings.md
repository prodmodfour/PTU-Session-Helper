# Findings: Session Helper Codebase Analysis

## Session Info
- **Date:** 2026-01-22
- **Task:** Understand session_helper for full implementation

---

## Architecture Overview

### Tech Stack
| Component | Technology |
|-----------|------------|
| Frontend | Nuxt 3 (Vue 3) + TypeScript |
| Styling | SCSS (Pokemon Scarlet/Violet dark theme) |
| State | Pinia stores |
| Database | SQLite + Prisma ORM |
| Real-time | WebSocket (CrossWS) |
| Testing | Vitest (unit), Playwright (E2E) |

### Directory Structure
```
session_helper/app/
├── components/          # Vue components
│   ├── character/       # CharacterModal, HumanCard, PokemonCard
│   ├── encounter/       # CombatantCard, MoveTargetModal, etc.
│   ├── common/          # (empty - shared components)
│   └── library/         # (empty - library components)
├── composables/         # Reusable logic
│   ├── useCombat.ts     # PTU damage calc, stages, evasion
│   ├── useEncounterHistory.ts  # Undo/redo
│   ├── usePokemonSprite.ts     # Sprite URLs
│   └── useWebSocket.ts         # Real-time sync
├── pages/               # Route pages
│   ├── gm/              # GM interface (index, create, library)
│   ├── group/           # Player-facing 4K TV view
│   └── player/          # Individual player actions
├── stores/              # Pinia state
│   ├── encounter.ts     # Combat state & actions
│   └── library.ts       # Character/Pokemon library
├── types/index.ts       # TypeScript definitions
├── server/api/          # Nitro backend endpoints
└── prisma/              # Database schema & seed
```

---

## Database Schema (Current)

### Models Implemented
1. **HumanCharacter** - Trainers/NPCs with stats, skills, inventory
2. **Pokemon** - Team members with nature, moves, abilities
3. **Encounter** - Combat session with combatants, turn order
4. **MoveData** - PTU 1.05 moves (821 moves seeded)
5. **AbilityData** - Ability reference (exists in schema)
6. **SpeciesData** - Pokemon species (schema only, NOT seeded)

### Missing from Schema
- ❌ Habitat/SubHabitat models
- ❌ EncounterTemplate model
- ❌ Position coordinates on combatants
- ❌ Grid configuration on encounters
- ❌ Settings/preferences table

---

## Combat System (useCombat.ts)

### Implemented
- ✅ Combat stage multipliers (-6 to +6)
- ✅ HP formulas (Pokemon vs Trainer)
- ✅ Evasion calculation (Defense/5, max +6)
- ✅ Type effectiveness (18x18 chart)
- ✅ STAB bonus (+2 DB)
- ✅ Injury system (Massive Damage, HP markers)
- ✅ Status immunities by type

### Damage Calculation
```typescript
// Current: SET DAMAGE ONLY
const damageBaseChart = {
  1: { rolled: '1d6+1', set: [2, 5, 7] },  // [min, avg, max]
  // ... up to DB 28
}
getSetDamage(db) // Returns average value
getDamageRoll(db) // Returns dice string (unused)
```

### Missing
- ❌ Rolled damage implementation
- ❌ Toggle between set/rolled
- ❌ Critical hit dice doubling
- ❌ Accuracy roll integration

---

## Custom Habitat System (User Requirement Clarification)

### What User Wants
**Habitat = Encounter Table** (not PTU's default habitat categories)

A habitat is a **custom encounter table** for a campaign location:
- GM creates encounter tables (e.g., "Glowlace Forest")
- Each table has weighted Pokemon entries (rarity determines roll chance)
- **Sub-habitats are modifications** of the parent table (overrides, additions)
- Generate wild encounters by rolling against the table

### Mental Model
```
Habitat (Encounter Table)
├── "Glowlace Forest" table
│   ├── Bulbasaur (Common, weight 10)
│   ├── Oddish (Common, weight 10)
│   ├── Pikachu (Uncommon, weight 5)
│   └── Scyther (Rare, weight 3)
│
└── SubHabitat (Table Modification)
    └── "Deep Canopy" modifies parent:
        ├── Scyther → Common (override weight)
        ├── Bulbasaur → removed (weight 0)
        └── Heracross (Rare) ← added
```

### Data Model
```
EncounterTable (Habitat)
├── id, name, description, imageUrl
├── defaultLevelRange: { min, max }
└── entries: [{ speciesId, weight, levelOverride? }]

TableModification (SubHabitat)
├── id, name, parentTableId
├── levelRangeOverride?: { min, max }
└── modifications: [{ speciesId, weight?, remove? }]
    (inherits parent entries, applies modifications)
```

### Rarity Weights
| Rarity | Weight | Approx % |
|--------|--------|----------|
| Common | 10 | ~50% |
| Uncommon | 5 | ~25% |
| Rare | 3 | ~15% |
| Very Rare | 1 | ~5% |
| Legendary | 0.1 | ~0.5% |

### Example Usage
```
Glowlace Forest (Habitat)
├── Bulbasaur (Common)
├── Oddish (Common)
├── Pikachu (Uncommon)
├── Scyther (Rare)
└── Celebi (Legendary)

  └── Deep Canopy (Sub-habitat)
      ├── Bulbasaur (Uncommon) ← override
      ├── Scyther (Common) ← override
      └── Heracross (Rare) ← added only here
```

### PTU Pokedex Habitats (Reference Only)
The Combined_Pokedex.md has default PTU habitats (Forest, Grassland, etc.)
but these are NOT used - they're just reference for GM when building custom lists.

---

## Encounter System

### Current Implementation
- ✅ Create/load encounters
- ✅ Add/remove combatants
- ✅ Turn tracking (round, current index)
- ✅ Initiative sorting
- ✅ Move execution & logging
- ✅ Damage/healing application
- ✅ Status condition management
- ✅ Serve to Group View
- ✅ Undo/redo (50-state history)

### Battle Types
- `trainer` - League battles (two-phase: trainer → Pokemon)
- `full_contact` - Single initiative order
- `wild` - Referenced in tests, not fully implemented

### Missing
- ❌ Encounter templates/library
- ❌ Wild encounter generation
- ❌ Difficulty scaling
- ❌ Auto-populate from habitat

---

## Virtual Tabletop Status

### Current: ZERO VTT Features
The app is a **combat ledger**, not a spatial VTT.

### What Exists
- Card-based combatant display
- HP bars, status badges
- Turn indicator
- Sectioned layout (players/allies/enemies)

### What's Missing
- ❌ Grid/map rendering
- ❌ Token positioning (no x,y coordinates)
- ❌ Drag-and-drop movement
- ❌ Range calculations
- ❌ Area of effect visualization
- ❌ Terrain/obstacles
- ❌ Line of sight
- ❌ Map backgrounds

### Move Range Data
Ranges stored as strings in MoveData:
- "Melee" - Adjacent only
- "6" - 6 meters
- "Burst 2" - 2-cell radius around user
- "Cone 2" - 2-cell cone
- "Line 3" - 3-cell line
- "Close Blast 3" - 3x3 adjacent

---

## WebSocket Events (Current)

```typescript
type WebSocketMessage =
  | { type: 'encounter_update'; data: Encounter }
  | { type: 'turn_change'; data: { combatantId, round } }
  | { type: 'move_executed'; data: MoveLogEntry }
  | { type: 'damage_applied'; data: { combatantId, damage, newHp } }
  | { type: 'serve_encounter'; data: { encounterId } }
  // ... more
```

### Needed for VTT
- `position_update` - Token moved
- `grid_config_update` - Grid resized
- `terrain_update` - Terrain changed

---

## API Endpoints (Current)

### Characters: `/api/characters/`
- GET, POST (list, create)
- GET, PUT, DELETE `[id]`

### Pokemon: `/api/pokemon/`
- GET, POST (list, create)
- GET, PUT, DELETE `[id]`
- POST `[id]/link`, `[id]/unlink`

### Encounters: `/api/encounters/`
- GET, POST (list, create)
- GET, PUT `[id]`
- POST `[id]/start`, `[id]/end`
- POST `[id]/combatants`, DELETE `[id]/combatants/[cid]`
- POST `[id]/move`, `[id]/damage`, `[id]/heal`
- POST `[id]/status`, `[id]/stages`, `[id]/breather`
- GET `served`, POST `[id]/serve`, `[id]/unserve`

### Missing Endpoints
- `/api/habitats/` - Habitat CRUD
- `/api/species/` - Species lookup with habitats
- `/api/encounter-templates/` - Template CRUD
- `/api/encounters/generate` - Wild generation
- `/api/encounters/[id]/position` - Token positions

---

## Key Files Reference

### Must Modify
| File | Changes Needed |
|------|----------------|
| `prisma/schema.prisma` | Add Habitat, EncounterTemplate, position fields |
| `types/index.ts` | Add spatial types, habitat types |
| `composables/useCombat.ts` | Add rolled damage support |
| `stores/encounter.ts` | Add position actions |

### Must Create
| File | Purpose |
|------|---------|
| `stores/habitat.ts` | Habitat state management |
| `stores/encounterLibrary.ts` | Template management |
| `stores/settings.ts` | App preferences |
| `composables/useBattleGrid.ts` | Grid logic |
| `composables/useDiceRoller.ts` | Dice simulation |
| `components/vtt/*.vue` | VTT components |
| `pages/gm/encounters.vue` | Encounter library page |

---

## PTU 1.05 Rules Notes

### Movement (for VTT)
- 1 square = 1 meter in PTU
- Overland speed in m/round (e.g., Overland 6 = 6 squares)
- Difficult terrain = 2x movement cost
- Swimming, Climbing, etc. are separate speeds

### Range Categories
- Melee: Adjacent (1 square)
- Numeric: Distance in meters/squares
- Self: User only
- Burst X: X-radius circle centered on user
- Cone X: X-length cone from user
- Line X: X-length line from user
- Close Blast X: XxX square adjacent to user

### Accuracy
- d20 + Accuracy vs Evasion
- If roll ≥ target, hit
- Natural 20 = auto-hit + crit
- Natural 1 = auto-miss

---

## Performance Considerations

- Current encounter state can be large (many combatants)
- WebSocket broadcasts full encounter on changes
- Consider delta updates for VTT position changes
- Canvas rendering may need optimization for many tokens
- Consider virtual scrolling for large encounter libraries
