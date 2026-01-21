# PTU Session Helper - Implementation Plan

## Current Status Assessment (~40% Complete)

### Already Implemented
- Nuxt 3 + Vue 3 frontend framework
- Prisma + SQLite database with schema
- Pinia stores (encounter.ts, library.ts) with core state management
- Basic page structure (GM view, Player view, Library)
- useCombat.ts composable with PTU calculations (stage multipliers, HP formulas, evasion, damage charts, type effectiveness, injury system)
- usePokemonSprite.ts for sprite resolution
- useWebSocket.ts client composable (connection handling)

### Needs Implementation
- WebSocket server (currently missing)
- Complete API endpoints
- UI components completion
- Combat flow integration
- Real-time sync between GM/Player views

---

## Phase 1: Foundation & Database Setup

### 1.1 Seed Data Import
- [ ] Create seed script for MoveData from PTU 1.05 moves CSV
- [ ] Create seed script for AbilityData
- [ ] Create seed script for SpeciesData from Combined_Pokedex.md
- [ ] Import type effectiveness chart as reference data

### 1.2 Database Migrations
- [ ] Verify Prisma schema matches current design needs
- [ ] Add any missing fields (injury count, volatile status, combat stages per stat)
- [ ] Run migrations and seed database

---

## Phase 2: WebSocket Server Implementation

### 2.1 Server Setup
- [ ] Create WebSocket server in `/server/` directory
- [ ] Implement connection management (GM vs Player clients)
- [ ] Add authentication/session handling

### 2.2 Event Types
```typescript
// Server -> Client
'encounter:updated'    // Full encounter state sync
'combatant:updated'    // Single combatant change
'turn:changed'         // Active turn indicator
'action:logged'        // Combat log entry

// Client -> Server
'encounter:create'     // GM creates encounter
'combatant:add'        // GM adds combatant
'combatant:update'     // GM/Player updates combatant
'turn:advance'         // GM advances turn
'action:submit'        // Player submits action
```

---

## Phase 3: Complete API Endpoints

### 3.1 Character Management
- [ ] GET/POST/PUT/DELETE `/api/characters` - CRUD for HumanCharacter
- [ ] GET/POST/PUT/DELETE `/api/pokemon` - CRUD for Pokemon
- [ ] POST `/api/characters/:id/pokemon` - Link Pokemon to trainer

### 3.2 Encounter Management
- [ ] POST `/api/encounters` - Create new encounter
- [ ] GET `/api/encounters/:id` - Get encounter state
- [ ] PUT `/api/encounters/:id` - Update encounter
- [ ] POST `/api/encounters/:id/combatants` - Add combatant
- [ ] DELETE `/api/encounters/:id/combatants/:combatantId` - Remove combatant

### 3.3 Combat Actions
- [ ] POST `/api/encounters/:id/turn/advance` - Advance turn
- [ ] POST `/api/encounters/:id/damage` - Apply damage (with injury calculation)
- [ ] POST `/api/encounters/:id/heal` - Apply healing
- [ ] POST `/api/encounters/:id/status` - Apply/remove status conditions
- [ ] POST `/api/encounters/:id/stages` - Modify combat stages

### 3.4 Data Lookup
- [ ] GET `/api/moves` - List/search moves
- [ ] GET `/api/abilities` - List/search abilities
- [ ] GET `/api/species` - List/search species
- [ ] GET `/api/types/effectiveness` - Type chart lookup

---

## Phase 4: UI Components Completion

### 4.1 Combat Stage Display
- [ ] Create `CombatStageIndicator.vue` - Visual -6 to +6 display
- [ ] Show multiplier (0.4x to 2.2x) on hover
- [ ] Color coding (red negative, green positive)

### 4.2 HP Bar Component
- [ ] Create `HPBar.vue` with percentage display
- [ ] Show injury markers at 50%, 0%, -50%, -100%
- [ ] Injury count indicator
- [ ] Heavily Injured warning (5+ injuries)
- [ ] Temporary HP overlay

### 4.3 Status Condition Display
- [ ] Create `StatusBadge.vue` for each condition type
- [ ] Persistent vs Volatile visual distinction
- [ ] Save check DC display where applicable

### 4.4 Initiative Tracker
- [ ] Create `InitiativeTracker.vue`
- [ ] Sortable by speed (League: Trainers low→high, then Pokemon high→low)
- [ ] Current turn highlight
- [ ] Round counter

### 4.5 Action Panel
- [ ] Create `ActionPanel.vue` for player turn actions
- [ ] Move selection with frequency tracking (At-Will, EOT, Scene, Daily)
- [ ] Target selection
- [ ] Damage preview (using set damage values)

### 4.6 Combat Log
- [ ] Create `CombatLog.vue`
- [ ] Scrollable history of actions
- [ ] Damage dealt, status applied, etc.

### 4.7 Pokemon Sprite Display
- [ ] Integrate `usePokemonSprite.ts` into combatant cards
- [ ] B2W2 sprites for Gen 1-5
- [ ] 3D sprites for Gen 6+

---

## Phase 5: Combat Logic Integration

### 5.1 Damage Calculation
```typescript
// Set Damage Implementation (from useCombat.ts)
function calculateSetDamage(
  db: number,           // Damage Base (with STAB +2 if applicable)
  attackStat: number,   // Attacker's Attack/SpAtk after stages
  defenseStat: number,  // Defender's Def/SpDef after stages
  mode: 'min' | 'avg' | 'max'
): number
```

### 5.2 Injury System
- [ ] Implement Massive Damage detection (50%+ of max HP)
- [ ] Track HP marker crossings (50%, 0%, -50%, -100%...)
- [ ] Calculate injury penalties (max HP reduced by 1/10 per injury)
- [ ] Heavily Injured condition (5+ injuries)
- [ ] Death threshold (10 injuries OR -50 HP/-200% HP)

### 5.3 Status Effect Processing
- [ ] Burn: -2 CS Defense, 1 Tick damage on Standard Action
- [ ] Poison: -2 CS SpDef, 1 Tick damage on Standard Action
- [ ] Badly Poisoned: 5 HP, doubles each round
- [ ] Paralysis: -4 CS Speed, DC 5 save to act
- [ ] Frozen: No action, DC 16 save to thaw (DC 11 for Fire-types)
- [ ] Sleep: No action except cure-self, DC 16 save to wake
- [ ] Confusion: 1-8 self-hit, 9-15 act, 16+ cured
- [ ] Rage: Must use damaging move, DC 15 save to cure
- [ ] Cursed: 2 Ticks on Standard Action

### 5.4 Take a Breather
- [ ] Full Action implementation
- [ ] Reset combat stages to 0
- [ ] Remove Temporary HP
- [ ] Cure volatile status (Confused, Cursed, Rage, etc.)
- [ ] Apply Tripped + Vulnerable until next turn

### 5.5 Critical Hits
- [ ] +1 DB to attack
- [ ] Final damage x1.5
- [ ] Special handling for Sniper ability (+2.25x instead)

---

## Phase 6: Polish & Testing

### 6.1 GM View Enhancements
- [ ] Quick-add NPCs from library
- [ ] Batch damage application
- [ ] Turn skip/reorder
- [ ] Encounter save/load

### 6.2 Player View Enhancements
- [ ] Responsive 4K layout
- [ ] Large touch-friendly buttons
- [ ] Simplified health percentages (not exact numbers)
- [ ] Turn notification sound/visual

### 6.3 Testing
- [ ] Unit tests for damage calculation
- [ ] Unit tests for injury system
- [ ] Integration tests for WebSocket sync
- [ ] E2E tests for full combat flow

### 6.4 Performance
- [ ] Optimize sprite loading
- [ ] Lazy load non-visible combatants
- [ ] Debounce rapid state updates

---

## PTU 1.05 Quick Reference (Implemented in useCombat.ts)

### Combat Stage Multipliers
| Stage | Multiplier |
|-------|------------|
| -6    | 0.4x       |
| -5    | 0.45x      |
| -4    | 0.5x       |
| -3    | 0.6x       |
| -2    | 0.7x       |
| -1    | 0.85x      |
| 0     | 1.0x       |
| +1    | 1.2x       |
| +2    | 1.4x       |
| +3    | 1.6x       |
| +4    | 1.8x       |
| +5    | 2.0x       |
| +6    | 2.2x       |

### HP Formulas
- **Pokemon HP** = Level + (HP Stat × 3) + 10
- **Trainer HP** = (Level × 2) + (HP Stat × 3) + 10
- **Tick** = 1/10 of Maximum HP

### Evasion
- Physical Evasion = floor(Defense / 5), max +6
- Special Evasion = floor(SpDef / 5), max +6
- Speed Evasion = floor(Speed / 5), max +6

### Type Effectiveness
- Super Effective: 1.5x damage (stacks: 2.25x for double SE)
- Resisted: 0.5x damage (stacks: 0.25x for double resist)
- Immune: 0x damage

### STAB
- +2 to Damage Base when using same-type move

---

## File Structure

```
app/
├── components/
│   ├── combat/
│   │   ├── HPBar.vue
│   │   ├── CombatStageIndicator.vue
│   │   ├── StatusBadge.vue
│   │   ├── InitiativeTracker.vue
│   │   ├── ActionPanel.vue
│   │   └── CombatLog.vue
│   ├── library/
│   │   ├── CharacterCard.vue
│   │   └── PokemonCard.vue
│   └── shared/
│       └── PokemonSprite.vue
├── composables/
│   ├── useCombat.ts      ✓ (exists)
│   ├── useWebSocket.ts   ✓ (exists, needs server)
│   └── usePokemonSprite.ts ✓ (exists)
├── pages/
│   ├── gm/
│   │   └── index.vue     ✓ (exists, needs completion)
│   ├── player/
│   │   └── index.vue     ✓ (exists, needs completion)
│   └── library/
│       └── index.vue     ✓ (exists)
├── server/
│   ├── api/
│   │   ├── characters/
│   │   ├── pokemon/
│   │   ├── encounters/
│   │   ├── moves/
│   │   └── types/
│   └── websocket/
│       └── index.ts      (needs creation)
├── stores/
│   ├── encounter.ts      ✓ (exists)
│   └── library.ts        ✓ (exists)
└── prisma/
    ├── schema.prisma     ✓ (exists)
    └── seed.ts           (needs creation)
```

---

## Estimated Effort by Phase

1. **Phase 1 - Foundation**: Seed scripts, migrations
2. **Phase 2 - WebSocket**: Server implementation, event handling
3. **Phase 3 - API**: CRUD endpoints, combat actions
4. **Phase 4 - UI**: Component library completion
5. **Phase 5 - Combat Logic**: Full PTU rules integration
6. **Phase 6 - Polish**: Testing, optimization

---

## Next Steps

Ready to begin implementation. Start with **Phase 1** (seed data) or **Phase 2** (WebSocket server)?
