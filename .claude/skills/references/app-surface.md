# App Surface Map

Testable features, routes, and API endpoints for the PTU Session Helper.

## Dev Server

- **Port:** 3001 (configurable via `TEST_PORT` env var)
- **Start:** `cd app && npm run dev`
- **Seed DB:** `cd app && npx prisma db seed`
- **Reset DB:** `cd app && npx prisma migrate reset` (destructive — drops all data)

## Page Routes by View

### GM View (`/gm`) — Full control interface

| Route | Page File | Purpose |
|-------|-----------|---------|
| `/gm` | `pages/gm/index.vue` | Encounter management — create, run, control encounters (VTT grid + list) |
| `/gm/sheets` | `pages/gm/sheets.vue` | Character/Pokemon library — browse, filter, search, grouped by location |
| `/gm/create` | `pages/gm/create.vue` | Create Human Character or Pokemon |
| `/gm/characters/:id` | `pages/gm/characters/[id].vue` | Human character sheet — Stats, Classes, Skills, Equipment, Pokemon, Healing, Notes tabs |
| `/gm/pokemon/:id` | `pages/gm/pokemon/[id].vue` | Pokemon sheet — Stats, Moves, Abilities, Capabilities, Skills, Healing, Notes tabs |
| `/gm/encounters` | `pages/gm/encounters.vue` | Encounter template library — CRUD templates |
| `/gm/encounter-tables` | `pages/gm/encounter-tables.vue` | Encounter tables list — create, import/export, generate |
| `/gm/encounter-tables/:id` | `pages/gm/encounter-tables/[id].vue` | Encounter table editor — entries, sub-habitats, generation |
| `/gm/habitats` | `pages/gm/habitats/index.vue` | Alternate encounter table list |
| `/gm/habitats/:id` | `pages/gm/habitats/[id].vue` | Alternate encounter table editor |
| `/gm/scenes` | `pages/gm/scenes/index.vue` | Scene manager — list, activate/deactivate |
| `/gm/scenes/:id` | `pages/gm/scenes/[id].vue` | Scene editor — drag-and-drop canvas, groups, weather, habitats |
| `/gm/map` | `pages/gm/map.vue` | Region map — display and serve to Group View |

### Group View (`/group`) — TV/projector display

| Route | Component | Purpose |
|-------|-----------|---------|
| `/group` | `pages/group/index.vue` | Dynamic tab shell — lobby/scene/encounter/map |
| (tab) | `LobbyView.vue` | Waiting screen when nothing served |
| (tab) | `SceneView.vue` | Active scene with positioned sprites |
| (tab) | `EncounterView.vue` | Served encounter — health bars, turn indicator, VTT grid |
| (tab) | `MapView.vue` | Served region map |

### Player View (`/player`) — Individual player interface

| Route | Purpose |
|-------|---------|
| `/player` | Character picker, character sheet, Pokemon team, encounter with combat actions |

**Key player components:** `PlayerIdentityPicker.vue` (character selection overlay), `PlayerNavBar.vue` (bottom tab navigation — Character/Team/Encounter), `PlayerCharacterSheet.vue` (read-only stats, skills, features, equipment, inventory), `PlayerPokemonTeam.vue` + `PlayerPokemonCard.vue` + `PlayerMoveList.vue` (team display), `PlayerEncounterView.vue` (encounter state with combatant cards by side), `PlayerCombatantInfo.vue` (visibility-aware combatant display — exact HP for own, percentage for enemies), `PlayerCombatActions.vue` (full PTU combat action panel — moves, shift, struggle, pass, item/switch/maneuver requests).

**Key player composables:** `usePlayerIdentity.ts` (localStorage persistence, character data fetching), `usePlayerCombat.ts` (turn detection, action execution, move availability, target helpers, league battle phase awareness, canBeCommanded check).

**Player stores:** `playerIdentity` (characterId, character, pokemon, loading, error).

**Player types:** `types/player.ts` (PlayerTab), `types/api.ts` (PlayerActionRequest).

## API Endpoint Groups

### Characters (`/api/characters`)
CRUD + healing/rest + equipment actions.
- `GET/POST /api/characters` — list, create
- `GET/PUT/DELETE /api/characters/:id` — read, update, delete
- `GET /api/characters/:id/equipment` — current equipment slots + aggregate bonuses
- `PUT /api/characters/:id/equipment` — equip/unequip items (Zod-validated)
- `POST /api/characters/:id/rest` — 30-min rest
- `POST /api/characters/:id/extended-rest` — 4h+ rest
- `POST /api/characters/:id/pokemon-center` — full heal
- `POST /api/characters/:id/heal-injury` — heal injury
- `POST /api/characters/:id/new-day` — reset daily limits
- `GET /api/characters/players` — player characters only
- `POST /api/characters/import-csv` — CSV import

**Key equipment components:** `HumanEquipmentTab.vue` (equipment slot management — equip/unequip/custom items, catalog dropdown, combat bonuses summary), `EquipmentCatalogBrowser.vue` (modal catalog browser with slot filtering, search, and direct equip-to-character). Constants in `constants/equipment.ts` (catalog, slot labels, stat labels). Bonuses utility in `utils/equipmentBonuses.ts`.

**Trainer sprites:** `constants/trainerSprites.ts` (180 curated B2W2 sprites organized into 9 categories), `composables/useTrainerSprite.ts` (avatar URL resolution from sprite key to Showdown CDN URL), `components/character/TrainerSpritePicker.vue` (modal grid picker with category filter tabs and search).

### Pokemon (`/api/pokemon`)
CRUD + link/unlink + healing/rest + bulk.
- `GET/POST /api/pokemon` — list, create
- `GET/PUT/DELETE /api/pokemon/:id` — read, update, delete
- `POST /api/pokemon/:id/link` — link to trainer
- `POST /api/pokemon/:id/unlink` — unlink from trainer
- `POST /api/pokemon/:id/rest` — 30-min rest
- `POST /api/pokemon/:id/extended-rest` — 4h+ rest
- `POST /api/pokemon/:id/pokemon-center` — full heal
- `POST /api/pokemon/:id/heal-injury` — heal injury
- `POST /api/pokemon/:id/new-day` — reset daily limits
- `POST /api/pokemon/:id/add-experience` — manual/training XP grant with level-up detection
- `POST /api/pokemon/bulk-action` — bulk archive/delete

### Encounters (`/api/encounters`)
CRUD + extensive combat actions.
- `GET/POST /api/encounters` — list, create
- `GET/PUT /api/encounters/:id` — read, update
- `POST /api/encounters/from-scene` — create from scene
- `GET /api/encounters/served` — get served encounter
- `POST /api/encounters/:id/start` — start combat
- `POST /api/encounters/:id/end` — end combat
- `POST /api/encounters/:id/next-turn` — advance turn
- `POST /api/encounters/:id/combatants` — add combatant
- `DELETE /api/encounters/:id/combatants/:combatantId` — remove combatant
- `POST /api/encounters/:id/damage` — apply damage
- `POST /api/encounters/:id/heal` — heal combatant
- `POST /api/encounters/:id/move` — execute move
- `POST /api/encounters/:id/stages` — combat stage modifiers
- `POST /api/encounters/:id/status` — add/remove status
- `POST /api/encounters/:id/serve` — serve to Group View
- `POST /api/encounters/:id/unserve` — unserve
- `POST /api/encounters/:id/position` — update grid position
- `PUT /api/encounters/:id/grid-config` — grid settings
- `POST/DELETE /api/encounters/:id/background` — grid background
- `GET/PUT /api/encounters/:id/fog` — fog of war
- `GET/PUT /api/encounters/:id/terrain` — terrain state
- `POST /api/encounters/:id/breather` — mid-combat rest
- `POST /api/encounters/:id/wild-spawn` — spawn wild Pokemon
- `PUT /api/encounters/:id/significance` — set GM significance multiplier + tier
- `POST /api/encounters/:id/xp-calculate` — preview XP calculation (read-only breakdown + participating Pokemon)
- `POST /api/encounters/:id/xp-distribute` — apply XP to Pokemon (updates experience, level, tutorPoints)

**Key encounter components:** `SignificancePanel.vue` (significance preset selector, difficulty adjustment, XP breakdown), `XpDistributionModal.vue` (post-combat XP allocation per player/Pokemon), `LevelUpNotification.vue` (aggregated level-up details shown after XP distribution), `BudgetIndicator.vue` (encounter difficulty bar/label based on level budget ratio).

**Budget system:** `utils/encounterBudget.ts` (pure PTU level budget calculator — budget formula, difficulty assessment, XP calculation, SIGNIFICANCE_PRESETS), `composables/useEncounterBudget.ts` (reactive wrapper for active encounter budget analysis).

**Significance on Encounter model:** `significanceMultiplier` (Float, default 1.0) + `significanceTier` (String, default "insignificant"). Set at encounter creation via StartEncounterModal/GenerateEncounterModal. Editable mid-encounter via significance.put endpoint.

### Encounter Templates (`/api/encounter-templates`)
Full CRUD + save-from/load-to encounter.
- `GET/POST /api/encounter-templates` — list, create
- `GET/PUT/DELETE /api/encounter-templates/:id` — read, update, delete
- `POST /api/encounter-templates/from-encounter` — save current as template
- `POST /api/encounter-templates/:id/load` — load into new encounter

### Encounter Tables (`/api/encounter-tables`)
Full CRUD + nested entries + sub-habitats + import/export + generate.
- `GET/POST /api/encounter-tables` — list, create
- `GET/PUT/DELETE /api/encounter-tables/:id` — read, update, delete
- `POST /api/encounter-tables/import` — import JSON
- `GET /api/encounter-tables/:id/export` — export JSON
- `POST /api/encounter-tables/:id/generate` — generate wild Pokemon
- `POST /api/encounter-tables/:id/entries` — add entry
- `PUT/DELETE /api/encounter-tables/:id/entries/:entryId` — update, remove
- Sub-habitats: `GET/POST /api/encounter-tables/:id/modifications`, nested entries

### Scenes (`/api/scenes`)
Full CRUD + activate/deactivate + nested entities.
- `GET/POST /api/scenes` — list, create
- `GET/PUT/DELETE /api/scenes/:id` — read, update, delete
- `GET /api/scenes/active` — active scene
- `POST /api/scenes/:id/activate` — serve to Group View
- `POST /api/scenes/:id/deactivate` — unserve
- `POST/DELETE /api/scenes/:id/characters/:charId` — add/remove character
- `POST/DELETE /api/scenes/:id/pokemon/:pokemonId` — add/remove Pokemon
- `POST /api/scenes/:id/groups` — create group
- `PUT/DELETE /api/scenes/:id/groups/:groupId` — update/delete group
- `PUT /api/scenes/:id/positions` — batch update positions

### Damage Calculation (`/api/encounters/:id/calculate-damage`)
Read-only combat math endpoint.
- `POST /api/encounters/:id/calculate-damage` — compute full PTU 9-step damage formula (STAB, type effectiveness, stages, crit) with detailed breakdown. Also computes dynamic evasion (physical, special, speed) from stage-modified stats and accuracy threshold. Does not modify encounter state.

### Capture (`/api/capture`)
Action-only.
- `POST /api/capture/rate` — calculate capture rate
- `POST /api/capture/attempt` — execute capture

### Group View State (`/api/group`)
Get/set/clear pattern.
- `GET/PUT /api/group/tab` — active tab state
- `GET/POST/DELETE /api/group/map` — served map
- `GET/POST/DELETE /api/group/wild-spawn` — wild spawn preview

### Utilities
- `GET /api/species` — species list (search/autocomplete)
- `POST /api/game/new-day` — global daily reset

## Store-to-Domain Mapping

| Store | Domain | Key API Groups |
|-------|--------|---------------|
| `encounter` | Active encounter | encounters (combat actions) |
| `encounterCombat` | Status/stages | encounters (status, stages) |
| `encounterGrid` | VTT grid | encounters (position, grid-config, background) |
| `encounterLibrary` | Templates | encounter-templates |
| `encounterTables` | Encounter tables | encounter-tables |
| `library` | Characters + Pokemon | characters, pokemon |
| `groupView` | Group TV display | group (map, wild-spawn) |
| `groupViewTabs` | Tab routing + scenes | group (tab), scenes |
| `fogOfWar` | Fog of war grid | encounters (fog) |
| `terrain` | Terrain grid | encounters (terrain) |
| `measurement` | Range measurement | (client-only) |
| `selection` | Grid selection | (client-only) |
| `settings` | User preferences | (localStorage only) |

## Server Services & Utilities

| File | Purpose |
|------|---------|
| `server/services/pokemon-generator.service.ts` | Canonical Pokemon creation — generatePokemonData, createPokemonRecord, buildPokemonCombatant |
| `server/services/csv-import.service.ts` | CSV import parsing (trainer/pokemon sheets) and DB creation |
| `server/services/combatant.service.ts` | Combatant builder and damage pipeline |
| `server/services/entity-update.service.ts` | Entity update broadcasting |
| `server/services/grid-placement.service.ts` | VTT grid placement and size-to-token mapping |
| `server/utils/csv-parser.ts` | Reusable CSV parser (parseCSV, getCell, parseNumber) |
| `server/utils/prisma.ts` | Prisma client singleton |
| `server/utils/websocket.ts` | WebSocket broadcast utilities |
| `server/utils/pokemon-nickname.ts` | Nickname resolution |

## Selector Guidance

Prefer `data-testid` attributes for Playwright selectors. The app does not currently have widespread `data-testid` usage — add them as needed when writing spec files, or fall back to:

1. `getByRole()` — buttons, links, headings
2. `getByLabel()` — form inputs
3. `getByText()` — visible text content
4. `.locator('css-selector')` — last resort
