# Scene Editor Fixes Plan

**Status:** COMPLETE (2026-02-11)

## Context

The `feature/group-view-tabs` branch has a senior dev review identifying 2 CRITICAL and 4 HIGH issues in the Scene Editor (`[id].vue`) and SceneView. The editor was prototyped as a single 1102-line file with mutation bugs, silent error swallowing, redundant polling, and fragile WebSocket access. These must be fixed before continuing to Phase 3/4/5 of the feature plan.

**Ordering rationale:** Fixes happen first (small surgical diffs), then extractions move already-correct code. This keeps git bisect clean and avoids touching the same files twice.

## Completion Summary

All 9 steps executed. Key results:
- `[id].vue`: 1102 → 464 lines (thin orchestration shell wiring 3 child components)
- New components: `SceneCanvas.vue` (335), `ScenePropertiesPanel.vue` (255), `SceneAddPanel.vue` (230)
- New composable: `useGroupViewWebSocket.ts` (56) + `onMessage()` support added to `useWebSocket.ts`
- New store actions: `updatePositions`, `handleScenePositionsUpdated`
- Zero `(window as any).__ptuWebSocket` references remain
- Bonus fixes: caught additional mutations in `toggleTerrain` and `addWildPokemon`

---

## Step 1: Fix drag immutability in `[id].vue`

**File:** `app/pages/gm/scenes/[id].vue` (lines 571-645)

**Problem:** `startDragSprite` and `startDragGroup` directly mutate reactive objects via `find()` results:
```typescript
pokemon.position = { x: clampedX, y: clampedY }  // MUTATION
```

**Fix:** Use a non-reactive drag offset during mousemove, apply CSS transform for visual feedback, then commit immutably on mouseup.

- Track `dragOffset: { x, y }` as a plain variable (not reactive)
- Track the dragged element ref to apply `style.transform` directly during drag (bypasses reactivity)
- The sprite's `:style` binding reads from `pokemon.position` — since we stop updating that reactively, the transform offset must visually move the element via `transform: translate()` during drag
- On mouseup, commit the final position immutably:
  ```typescript
  scene.value = {
    ...scene.value,
    pokemon: scene.value.pokemon.map(p =>
      p.id === targetId ? { ...p, position: { x: finalX, y: finalY } } : p
    )
  }
  ```
- Reset the element's inline transform after commit so the `:style` binding takes over

Same pattern for character and group drag handlers.

---

## Step 2: Add error feedback in `[id].vue`

**File:** `app/pages/gm/scenes/[id].vue`

**Problem:** ~10 empty catch blocks with just `// Failed to X` comments.

**Fix:** Add `alert()` with specific messages per operation (matches existing pattern in `gm/pokemon/[id].vue:838`, `gm/characters/[id].vue:502`). Each message must be distinct:

- `'Failed to load scene data'` (onMounted fetch)
- `'Failed to save scene'` (saveScene)
- `'Failed to activate scene'` (activateScene)
- `'Failed to deactivate scene'` (deactivateScene)
- `'Failed to create group'` (createGroup)
- `'Failed to delete group'` (deleteGroup)
- `'Failed to add character to scene'` (addCharacter)
- `'Failed to remove character from scene'` (removeCharacter)
- `'Failed to add Pokemon to scene'` (addWildPokemon)
- `'Failed to remove Pokemon from scene'` (removePokemon)

---

## Step 3: Add `updatePositions` store action

**File:** `app/stores/groupViewTabs.ts`

Add action:
```typescript
async updatePositions(sceneId: string, positions: {
  pokemon?: Array<{ id: string; position: ScenePosition }>
  characters?: Array<{ id: string; position: ScenePosition }>
  groups?: Array<{ id: string; position: ScenePosition }>
}) {
  await $fetch(`/api/scenes/${sceneId}/positions`, {
    method: 'PUT',
    body: positions
  })
}
```

Also add WebSocket handler for position updates received by Group View.

**IMPORTANT — selective merge only.** Only update positions of items present in the payload. Do not replace the entire array:
```typescript
handleScenePositionsUpdated(data: {
  pokemon?: Array<{ id: string; position: ScenePosition }>,
  characters?: Array<{ id: string; position: ScenePosition }>,
  groups?: Array<{ id: string; position: ScenePosition }>
}) {
  if (!this.activeScene) return

  let updated = { ...this.activeScene }

  if (data.pokemon) {
    updated = {
      ...updated,
      pokemon: updated.pokemon.map(p => {
        const update = data.pokemon!.find(u => u.id === p.id)
        return update ? { ...p, position: update.position } : p
      })
    }
  }

  if (data.characters) {
    updated = {
      ...updated,
      characters: updated.characters.map(c => {
        const update = data.characters!.find(u => u.id === c.id)
        return update ? { ...c, position: update.position } : c
      })
    }
  }

  if (data.groups) {
    updated = {
      ...updated,
      groups: updated.groups.map(g => {
        const update = data.groups!.find(u => u.id === g.id)
        return update ? { ...g, position: update.position } : g
      })
    }
  }

  this.activeScene = updated
}
```

---

## Step 4: Use positions endpoint for drag-drop saves

**File:** `app/pages/gm/scenes/[id].vue`

**Problem:** `saveScene()` sends the entire scene object on every drag end. The plan designed `PUT /api/scenes/[id]/positions` specifically for this.

**Fix:** In the mouseup handler, call `groupViewTabsStore.updatePositions()` instead of `saveScene()`, passing only the moved item's new position:
```typescript
await groupViewTabsStore.updatePositions(scene.value.id, {
  pokemon: [{ id: targetId, position: { x: finalX, y: finalY } }]
})
```

---

## Step 5: Extract `SceneCanvas.vue`

**New file:** `app/components/scene/SceneCanvas.vue`

Move from `[id].vue`:
- Canvas template (background, groups, sprites with drag handles) — lines 57-131
- Canvas styles (`.canvas-panel` through `.canvas-sprite`) — lines 729-866
- Drag logic (`startDragSprite`, `startDragGroup`, `canvasContainer` ref, `isDragging`, `dragTarget`)
- `getPokemonSprite()` helper

**Props:** `scene: Scene`, `selectedGroupId: string | null`
**Emits:** `update:positions(type, id, position)`, `select-group(id)`, `delete-group(id)`, `remove-pokemon(id)`, `remove-character(id)`

---

## Step 6: Extract `ScenePropertiesPanel.vue`

**New file:** `app/components/scene/ScenePropertiesPanel.vue`

Move from `[id].vue`:
- Properties sidebar template (scene properties + groups section) — lines 135-229
- Properties styles (`.properties-panel` through `.group-item`) — lines 868-990
- `terrainOptions`, `toggleTerrain()`, `selectGroup()`, `getGroupMemberCount()`

**Props:** `scene: Scene`, `selectedGroupId: string | null`
**Emits:** `update:scene(field, value)`, `toggle-terrain(terrain)`, `create-group`, `delete-group(id)`, `select-group(id)`

---

## Step 7: Extract `SceneAddPanel.vue`

**New file:** `app/components/scene/SceneAddPanel.vue`

Move from `[id].vue`:
- Add panel template (tabs, character list, pokemon form) — lines 232-297
- Add panel styles (`.add-tabs` through `.add-pokemon-form`) — lines 992-1101
- `addTab`, `newPokemonSpecies`, `newPokemonLevel` state

**Props:** `scene: Scene`, `availableCharacters: Character[]`
**Emits:** `add-character(char)`, `add-pokemon(species, level)`

---

## Step 8: Create `useGroupViewWebSocket.ts`

**New file:** `app/composables/useGroupViewWebSocket.ts`

Replaces the raw `(window as any).__ptuWebSocket` access in `group/index.vue:53`. Handles **all** group view WebSocket events (both tab and scene — no split responsibility):

- `tab_change` / `tab_state` → `groupViewTabsStore.handleTabChange()`
- `scene_activated` → `groupViewTabsStore.handleSceneActivated()`
- `scene_deactivated` → `groupViewTabsStore.handleSceneDeactivated()`
- `scene_update` → `groupViewTabsStore.handleSceneUpdate()`
- `scene_positions_updated` → `groupViewTabsStore.handleScenePositionsUpdated()`

Uses `useWebSocket()` composable's `send()` for `tab_sync_request`.

Follows `useEncounterActions.ts` pattern: accepts options, returns handler methods + cleanup.

**Modify:** `app/pages/group/index.vue` — replace `setupWebSocketListener()` and the `watch(isConnected)` block with `useGroupViewWebSocket()`.

---

## Step 9: Remove SceneView polling

**File:** `app/pages/group/_components/SceneView.vue`

**Pre-commit verification required:** Before committing, grep the API endpoint files to confirm `broadcastToGroup` is actually called. Do not trust from memory. Specifically verify:
- `app/server/api/scenes/[id]/activate.post.ts` calls `broadcastToGroup('scene_activated', ...)`
- `app/server/api/scenes/[id]/deactivate.post.ts` calls `broadcastToGroup('scene_deactivated', ...)`
- `app/server/api/scenes/[id]/positions.put.ts` calls `notifyScenePositionsUpdated(...)` which calls `broadcastToGroup`

Include the grep output or file:line references in the commit message to document that this was verified.

**Fix:** Remove `pollInterval`, `checkForActiveScene()`, `onMounted`, `onUnmounted` lifecycle hooks. The `computed(() => groupViewTabsStore.activeScene)` is sufficient — the parent (`group/index.vue`) already syncs via WebSocket (step 8) + its own 5-second fallback poll.

---

## Files Modified

| Step | File | Action |
|------|------|--------|
| 1 | `app/pages/gm/scenes/[id].vue` | Fix drag mutations |
| 2 | `app/pages/gm/scenes/[id].vue` | Add alert() to catch blocks |
| 3 | `app/stores/groupViewTabs.ts` | Add updatePositions + WS handler |
| 4 | `app/pages/gm/scenes/[id].vue` | Use positions endpoint |
| 5 | `app/components/scene/SceneCanvas.vue` | New — extract canvas |
| 5 | `app/pages/gm/scenes/[id].vue` | Remove extracted code |
| 6 | `app/components/scene/ScenePropertiesPanel.vue` | New — extract properties |
| 6 | `app/pages/gm/scenes/[id].vue` | Remove extracted code |
| 7 | `app/components/scene/SceneAddPanel.vue` | New — extract add panel |
| 7 | `app/pages/gm/scenes/[id].vue` | Remove extracted code |
| 8 | `app/composables/useGroupViewWebSocket.ts` | New — WS composable |
| 8 | `app/pages/group/index.vue` | Use new composable |
| 9 | `app/pages/group/_components/SceneView.vue` | Remove polling |

## Verification

1. Open Scene Editor (`/gm/scenes/[id]`) — verify canvas renders, drag-drop works, properties save
2. Drag a sprite — confirm only positions endpoint is called (network tab), not full scene PUT
3. Trigger an API error (e.g., bad scene ID) — verify specific alert appears
4. Open Group View (`/group`) while scene is active — verify it updates via WebSocket without polling
5. Activate/deactivate scene from editor — verify Group View updates in real-time
6. Check `[id].vue` is under 300 lines, no new file exceeds 400 lines
7. Confirm no `(window as any).__ptuWebSocket` usage remains
