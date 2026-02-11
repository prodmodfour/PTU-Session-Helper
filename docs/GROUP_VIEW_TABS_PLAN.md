# Implementation Plan: Group View Tabs & Scene System

## Branch: `feature/group-view-tabs`

**Created:** 2026-02-01
**Status:** In Progress

---

## Overview

This update adds a tabbed interface to Group View with four tabs:
- **Lobby** - Existing PlayerLobbyView showing PC teams
- **Scene** - NEW narrative view with floating sprites, weather, terrain
- **Encounter** - Existing combat view
- **Map** - Existing map overlay

The GM controls which tab is shown via a selector in the GM header.

---

## Phase 1: Database Schema & Infrastructure

### 1.1 Prisma Schema Changes

```prisma
model Scene {
  id          String   @id @default(cuid())
  name        String
  description String?

  // Location
  locationName  String?
  locationImage String?  // Background image URL

  // Content (JSON arrays)
  pokemon     Json     @default("[]")  // { id, speciesId, species, level, nickname, position: {x,y}, groupId? }[]
  characters  Json     @default("[]")  // { id, characterId, name, avatarUrl, position: {x,y}, groupId? }[]
  groups      Json     @default("[]")  // { id, name, position: {x,y}, width, height }[]

  // Environment
  weather     String?  // sunny, rain, sandstorm, hail, snow, fog, harsh_sunlight, heavy_rain, strong_winds
  terrains    Json     @default("[]")  // string[] - grassy, electric, psychic, misty, etc.
  modifiers   Json     @default("[]")  // { name, description, effect }[]

  // Habitat link for wild spawns
  habitatId   String?

  // State
  isActive    Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model GroupViewState {
  id          String   @id @default("singleton")
  activeTab   String   @default("lobby")  // encounter | scene | map | lobby
  activeSceneId String?
  updatedAt   DateTime @updatedAt
}
```

### 1.2 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/group/tab` | Get current active tab |
| PUT | `/api/group/tab` | Set active tab (GM only) |
| GET | `/api/scenes` | List all scenes |
| POST | `/api/scenes` | Create new scene |
| GET | `/api/scenes/[id]` | Get scene by ID |
| PUT | `/api/scenes/[id]` | Update scene |
| DELETE | `/api/scenes/[id]` | Delete scene |
| POST | `/api/scenes/[id]/activate` | Set scene as active |
| POST | `/api/scenes/[id]/deactivate` | Deactivate scene |
| GET | `/api/scenes/active` | Get currently active scene |
| POST | `/api/scenes/[id]/pokemon` | Add Pokemon to scene |
| DELETE | `/api/scenes/[id]/pokemon/[pokemonId]` | Remove Pokemon from scene |
| POST | `/api/scenes/[id]/characters` | Add character to scene |
| DELETE | `/api/scenes/[id]/characters/[charId]` | Remove character from scene |
| POST | `/api/scenes/[id]/groups` | Create group in scene |
| PUT | `/api/scenes/[id]/groups/[groupId]` | Update group (name, position, size) |
| DELETE | `/api/scenes/[id]/groups/[groupId]` | Delete group |
| PUT | `/api/scenes/[id]/positions` | Batch update positions (drag-drop) |

### 1.3 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `tab_change` | Server → Group | `{ tab: string, sceneId?: string }` |
| `scene_update` | Server → Group | `{ scene: Scene }` |
| `scene_pokemon_added` | Server → Group | `{ sceneId, pokemon }` |
| `scene_pokemon_removed` | Server → Group | `{ sceneId, pokemonId }` |
| `scene_character_added` | Server → Group | `{ sceneId, character }` |
| `scene_character_removed` | Server → Group | `{ sceneId, characterId }` |
| `scene_positions_updated` | Server → Group | `{ sceneId, positions }` |
| `scene_group_created` | Server → Group | `{ sceneId, group }` |
| `scene_group_updated` | Server → Group | `{ sceneId, group }` |
| `scene_group_deleted` | Server → Group | `{ sceneId, groupId }` |

### 1.4 Pinia Store

```typescript
// stores/groupViewTabs.ts
interface GroupViewTabsState {
  activeTab: 'encounter' | 'scene' | 'map' | 'lobby'
  activeScene: Scene | null
  scenes: Scene[]  // For GM scene list
}
```

---

## Phase 2: Group View Tab System

### 2.1 Refactor Group View Pages

**Current:** Single `/group/index.vue` with conditional rendering

**New Structure:**
```
app/pages/group/
├── index.vue          # Tab router - fetches activeTab, renders correct view
├── _components/
│   ├── EncounterView.vue   # Extracted from current index.vue
│   ├── SceneView.vue       # NEW
│   ├── MapView.vue         # Extracted MapOverlay logic
│   └── LobbyView.vue       # Renamed PlayerLobbyView
```

### 2.2 GM Header Tab Selector

Add to `layouts/gm.vue`:
- Dropdown/segmented control to select active Group View tab
- Visual indicator of current tab
- Quick-action buttons (e.g., "Show Scene" when editing a scene)

### 2.3 Polling → WebSocket Migration

- Remove 2-second polling for tab detection
- Use WebSocket `tab_change` event for instant updates
- Keep polling as fallback for reconnection

---

## Phase 3: Scene System - GM Side

### 3.1 Scene Manager Page (`/gm/scenes/index.vue`)

**Features:**
- List all scenes with thumbnails
- Create new scene button
- Delete scene (with confirmation)
- "Activate" button to show on Group View
- Visual indicator for currently active scene
- Search/filter by name

### 3.2 Scene Editor Page (`/gm/scenes/[id].vue`)

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ Scene: [Name Input]                    [Save] [Activate]    │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────┐ ┌─────────────────────┐ │
│ │                                 │ │ Scene Properties    │ │
│ │                                 │ │ ─────────────────── │ │
│ │      Scene Canvas Preview       │ │ Location: [input]   │ │
│ │      (Drag sprites here)        │ │ Weather: [dropdown] │ │
│ │                                 │ │ Terrain: [multi]    │ │
│ │                                 │ │ Habitat: [dropdown] │ │
│ │                                 │ │ Modifiers: [list]   │ │
│ │                                 │ ├─────────────────────┤ │
│ │                                 │ │ Groups              │ │
│ │                                 │ │ ─────────────────── │ │
│ │                                 │ │ [+ Create Group]    │ │
│ │                                 │ │ • Group 1 (3)       │ │
│ │                                 │ │ • Group 2 (5)       │ │
│ └─────────────────────────────────┘ └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Available to Add:                                           │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│ │ Characters   │ │ Pokemon      │ │ Wild Pokemon │          │
│ │ [PC list]    │ │ [Party list] │ │ [Generate]   │          │
│ └──────────────┘ └──────────────┘ └──────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Scene Canvas Component (GM)

**Features:**
- Displays sprites/avatars at their positions
- Drag-and-drop to reposition
- Group boxes as droppable zones
- Right-click context menu (remove, edit, move to group)
- Zoom in/out
- Background image from location

### 3.4 Group Management

**Create Group:**
1. Click "Create Group" button
2. Group box appears on canvas with default name "New Group"
3. Inline edit name
4. Resize by dragging corners
5. Drag sprites into group box to assign

**Group Box Behavior:**
- Visual rectangle with name label
- Shows member count
- Members inside appear clustered
- Can be repositioned as a unit
- Deleting group ungroups members (doesn't delete them)

---

## Phase 4: Scene System - Group View

### 4.1 Scene View Component (`SceneView.vue`)

**Display:**
- Full-screen background (location image or gradient)
- Floating sprites/avatars at their positions
- Grouped items clustered together with group name label
- Weather overlay effect (rain particles, sun rays, fog, etc.)
- Terrain indicators (colored borders or icons)
- Ambient animations

### 4.2 Weather Visual Effects

| Weather | Effect |
|---------|--------|
| Sunny | Warm overlay, sun rays |
| Rain | Rain particles, darker tint |
| Sandstorm | Sand particles, sepia tint |
| Hail | Ice particles, blue tint |
| Snow | Snowflakes, white vignette |
| Fog | Reduced visibility, blur |
| Harsh Sunlight | Intense warm overlay |
| Heavy Rain | Dense rain, very dark |
| Strong Winds | Horizontal particles |

### 4.3 Terrain Indicators

Display as badges/icons on screen:
- Grassy Terrain: Green leaf icon
- Electric Terrain: Yellow lightning
- Psychic Terrain: Purple brain
- Misty Terrain: Pink cloud

---

## Phase 5: Integration

### 5.1 Habitat Manager Integration

**Current Flow:** Generate → Serve Pokemon to TV
**New Flow:** Generate → Add to Scene (with option to show on Group View)

Changes to `/gm/habitats/` pages:
- "Add to Scene" button alongside current "Serve to TV"
- Scene selector dropdown
- Option to create new scene from generation

### 5.2 Weather → Encounter Integration

When creating encounter from scene context:
- Prompt: "Apply scene weather to encounter?"
- If yes, store weather in encounter (new field) for combat modifier reference
- Weather modifiers applied per PTU rules:
  - Rain: +2 Water, -2 Fire
  - Sandstorm: Rock/Ground/Steel immunity, others take damage
  - Etc.

### 5.3 Scene → Encounter Flow

From Scene Editor:
- "Start Encounter" button
- Creates new encounter with:
  - Pokemon from scene (as combatants)
  - Characters from scene (as combatants)
  - Weather pre-set
  - Terrain pre-set
- Doesn't auto-switch tab (GM controls this)

---

## File Changes Summary

### New Files

```
app/
├── pages/
│   ├── gm/
│   │   └── scenes/
│   │       ├── index.vue           # Scene Manager
│   │       └── [id].vue            # Scene Editor
│   └── group/
│       └── _components/
│           ├── EncounterView.vue   # Extracted
│           ├── SceneView.vue       # NEW
│           ├── MapView.vue         # Extracted
│           └── LobbyView.vue       # Renamed
├── components/
│   └── scene/
│       ├── SceneCanvas.vue         # GM canvas with drag-drop
│       ├── SceneCanvasDisplay.vue  # Group view display
│       ├── SceneGroupBox.vue       # Draggable group container
│       ├── SceneSpriteToken.vue    # Pokemon/character token
│       ├── WeatherOverlay.vue      # Weather visual effects
│       └── TerrainIndicators.vue   # Terrain badges
├── stores/
│   └── groupViewTabs.ts            # Tab + scene state
├── composables/
│   └── useSceneWebSocket.ts        # Scene-specific WS handling
└── server/
    └── api/
        ├── group/
        │   └── tab.ts              # GET/PUT active tab
        └── scenes/
            ├── index.get.ts        # List scenes
            ├── index.post.ts       # Create scene
            ├── active.get.ts       # Get active scene
            ├── [id].get.ts         # Get scene
            ├── [id].put.ts         # Update scene
            ├── [id].delete.ts      # Delete scene
            ├── [id]/
            │   ├── activate.post.ts
            │   ├── deactivate.post.ts
            │   ├── pokemon.post.ts
            │   ├── pokemon/[pokemonId].delete.ts
            │   ├── characters.post.ts
            │   ├── characters/[charId].delete.ts
            │   ├── groups.post.ts
            │   ├── groups/[groupId].put.ts
            │   ├── groups/[groupId].delete.ts
            │   └── positions.put.ts

prisma/
└── schema.prisma                   # Add Scene, GroupViewState models
```

### Modified Files

```
app/
├── layouts/
│   └── gm.vue                      # Add tab selector
├── pages/
│   └── group/
│       └── index.vue               # Refactor to tab router
├── server/
│   └── routes/
│       └── ws.ts                   # Add scene events
├── stores/
│   └── groupView.ts                # Extend with tab state
└── components/
    └── group/
        └── PlayerLobbyView.vue     # Minor adjustments
```

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large PR scope | HIGH | Split into 3 PRs: (1) Infrastructure + Tabs, (2) Scene CRUD, (3) Integration |
| Drag-drop complexity | MEDIUM | Use existing proven library (vue-draggable-plus or similar) |
| Weather effects performance | LOW | Use CSS animations, canvas fallback only if needed |
| Breaking existing Group View | MEDIUM | Keep current behavior as "Encounter" tab, feature flag if needed |

---

## Commit Sequence

1. `feat: add Scene and GroupViewState models to schema`
2. `feat: add group view tab API endpoints`
3. `feat: create groupViewTabs Pinia store`
4. `refactor: extract group view into tab components`
5. `feat: add tab selector to GM header`
6. `feat: add tab_change WebSocket event`
7. `feat: create Scene CRUD API endpoints`
8. `feat: add Scene Manager page`
9. `feat: add Scene Editor page with canvas`
10. `feat: implement drag-drop positioning`
11. `feat: add group creation and management`
12. `feat: create SceneView for group display`
13. `feat: add weather visual effects`
14. `feat: integrate habitat manager with scenes`
15. `feat: add scene weather to encounter creation`
16. `test: add scene system tests`
17. `docs: update CLAUDE.md with scene system`

---

## Progress Tracking

- [x] Phase 1: Database Schema & Infrastructure (5 commits)
- [x] Phase 2: Group View Tab System (4 commits)
- [x] Phase 3: Scene System - GM Side (editor decomposed, group resize handles, sprite-to-group drag-drop, modifiers UI, habitat selector — all complete)
- [x] Phase 4: Scene System - Group View (SceneView with WS sync, all 9 weather effects, terrain indicators, modifiers panel)
- [ ] Phase 5: Integration
