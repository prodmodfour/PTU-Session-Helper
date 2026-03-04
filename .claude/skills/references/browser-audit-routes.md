# Browser Audit Routes

Maps component file paths and page routes to browser URLs for the Browser Auditor. Used to determine which routes to navigate and what test data each route requires to render meaningfully.

## Page Routes

| Page File | Browser Route | Requires Data | Notes |
|-----------|--------------|---------------|-------|
| `pages/index.vue` | `/` | None | Landing/role selection page |
| `pages/gm/index.vue` | `/gm` | Active encounter (optional) | GM dashboard; encounter panel renders if encounter is active |
| `pages/gm/sheets.vue` | `/gm/sheets` | Characters + Pokemon | Sheets library listing |
| `pages/gm/characters/[id].vue` | `/gm/characters/:id` | Character | Character detail sheet |
| `pages/gm/pokemon/[id].vue` | `/gm/pokemon/:id` | Pokemon | Pokemon detail sheet |
| `pages/gm/scenes/index.vue` | `/gm/scenes` | None (lists scenes) | Scene listing page |
| `pages/gm/scenes/[id].vue` | `/gm/scenes/:id` | Scene with entities | Scene editor with entity management |
| `pages/gm/encounters.vue` | `/gm/encounters` | None (lists encounters) | Encounter listing/management |
| `pages/gm/encounter-tables.vue` | `/gm/encounter-tables` | None (lists tables) | Encounter table listing |
| `pages/gm/encounter-tables/[id].vue` | `/gm/encounter-tables/:id` | Encounter table with entries | Table detail editor |
| `pages/gm/habitats/index.vue` | `/gm/habitats` | None (lists habitats) | Habitat listing |
| `pages/gm/habitats/[id].vue` | `/gm/habitats/:id` | Habitat | Habitat detail editor |
| `pages/gm/create.vue` | `/gm/create` | None | Character/Pokemon creation wizard |
| `pages/gm/map.vue` | `/gm/map` | Active encounter + VTT | Map/VTT view |
| `pages/group/index.vue` | `/group` | Served content (encounter/scene/map) | Group view; content depends on what GM is serving |
| `pages/player/index.vue` | `/player` | Character assignment | Player view; requires character to be assigned |

## Component-to-Route Mapping

Components render on specific routes. Use this to determine where to verify UI-facing capabilities.

| Component Directory | Primary Route(s) | Requires Data |
|-------------------|-----------------|---------------|
| `components/encounter/*` | `/gm` (with active encounter) | Encounter + combatants |
| `components/scene/*` | `/gm/scenes/:id` | Scene with entities |
| `components/vtt/*` | `/gm/map`, `/gm` (VTT mode) | Active encounter + VTT grid |
| `components/character/*` | `/gm/characters/:id`, `/gm/sheets` | Character |
| `components/pokemon/*` | `/gm/pokemon/:id`, `/gm/sheets` | Pokemon |
| `components/encounter-table/*` | `/gm/encounter-tables/:id` | Encounter table |
| `components/habitat/*` | `/gm/habitats/:id` | Habitat |
| `components/common/*` | Multiple routes | Varies by component |
| `components/layout/*` | All routes (via layouts) | None |
| `components/group/*` | `/group` | Served content |
| `components/player/*` | `/player` | Character assignment |

## Minimal Seed Data Requirements

To render views meaningfully, the browser auditor seeds this test data via API before navigating:

| Data Item | API Endpoint | Used By Routes |
|-----------|-------------|----------------|
| Character | `POST /api/characters` | `/gm/characters/:id`, `/gm/sheets`, `/player` |
| Pokemon | `POST /api/pokemon` | `/gm/pokemon/:id`, `/gm/sheets`, `/gm` (encounter) |
| Encounter | `POST /api/encounters` | `/gm` (active encounter), `/group` (served) |
| Scene | `POST /api/scenes` | `/gm/scenes/:id` |
| Encounter Table | `POST /api/encounter-tables` | `/gm/encounter-tables/:id` |
| Combatant | `POST /api/encounters/:id/combatants` | `/gm` (encounter panel) |

## Actor-to-Route Mapping

Each actor sees different views. Cross-verify that capabilities are accessible to the intended actor.

| Actor | Routes | Layout |
|-------|--------|--------|
| GM | `/gm`, `/gm/*` | `gm` layout |
| Group | `/group` | `group` layout |
| Player | `/player` | `player` layout |

## Navigation Batching Strategy

Routes are batched to minimize navigation. Process in this order:

1. **GM routes** (most capabilities live here):
   - `/gm` → snapshot (dashboard, encounter if active)
   - `/gm/sheets` → snapshot
   - `/gm/characters/:id` → snapshot
   - `/gm/pokemon/:id` → snapshot
   - `/gm/scenes/:id` → snapshot
   - `/gm/encounters` → snapshot
   - `/gm/encounter-tables/:id` → snapshot
   - `/gm/habitats/:id` → snapshot
   - `/gm/map` → snapshot (if VTT capabilities in scope)
2. **Group route**: `/group` → snapshot
3. **Player route**: `/player` → snapshot
