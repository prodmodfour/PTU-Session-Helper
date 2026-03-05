# Browser Audit: GM Views — Scenes Domain

## Route: `/gm/scenes` (Scene Manager)

### scenes-C060 — GM Scenes Manager Page

- **Route checked:** `/gm/scenes`
- **Expected element:** Page with "Scene Manager" heading, scene cards grid, "New Scene" button
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  ```yaml
  - heading "Scene Manager" [level=1] [ref=e62]
  - paragraph: Create and manage narrative scenes for Group View
  - button "New Scene" [ref=e65] [cursor=pointer]
  ```
  Scene card for "Test Scene" visible with:
  - heading "Test Scene" [level=3]
  - Weather "Clear" stat with icon
  - "Activate" / "Deactivate" button (state-dependent)
  - "Edit" link to `/gm/scenes/{id}`
  - Delete button (trash icon)
  - "Active" badge when scene is activated

---

## Route: `/gm/scenes/:id` (Scene Editor)

### scenes-C061 — GM Scene Editor Page

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Scene editor layout with back link, name input, action buttons, multi-panel content area
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  ```yaml
  - link "Back" [ref=e62] [cursor=pointer] -> /gm/scenes
  - textbox "Scene Name" [ref=e67]: Test Scene
  - button "Activate Scene" [ref=e69] [cursor=pointer]
  ```
  Page title confirmed: "Test Scene - Scene Editor"
  Header actions include "Award Quest XP" (conditional on characters), "Start Encounter" (conditional on pokemon/characters), "Activate Scene" / "Deactivate" toggle.

### scenes-C062 — SceneCanvas

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Central canvas area for dragging Pokemon sprites and character avatars
- **Found:** Yes (implicit)
- **Classification:** Present
- **Evidence:** The scene editor content area between the Groups panel (left) and Properties panel (right) is the canvas. With no Pokemon or characters added to the scene, the canvas area is empty but structurally present in the DOM layout. The `SceneCanvas` component is rendered in the `[id].vue` template between `SceneGroupsPanel` and `ScenePropertiesPanel`. The scene editor page renders without error, confirming the component mounts successfully.

### scenes-C063 — ScenePropertiesPanel

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Right panel with Location Name, Background Image URL, Description, Weather dropdown
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  ```yaml
  - heading "Properties" [level=3] [ref=e94]
  - generic: Location Name
  - textbox "e.g., Viridian Forest" [ref=e102]
  - generic: Background Image URL
  - textbox "https://..." [ref=e105]
  - generic: Description
  - textbox "Scene description..." [ref=e108]: A test scene for browser audit
  - generic: Weather
  - combobox [ref=e111]:
    - option "None"
    - option "Sunny"
    - option "Rain"
    - option "Sandstorm"
    - option "Hail"
    - option "Snow"
    - option "Fog"
    - option "Harsh Sunlight"
    - option "Heavy Rain"
    - option "Strong Winds"
  ```
  Weather dropdown includes all PTU weather types. Collapse toggle button present.

### scenes-C064 — SceneAddPanel

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Right panel with Characters/Pokemon tabs for adding entities to scene
- **Found:** Yes (collapsed state)
- **Classification:** Present
- **Evidence:** Panel renders in collapsed state by default (`addPanelCollapsed = ref(true)` in page code). Collapsed strip with PhPlusCircle icon visible as clickable img element (ref=e114, cursor=pointer) in the scene editor snapshot. Source code confirms expanded state shows "Add to Scene" heading with Characters/Pokemon tabs.

### scenes-C065 — ScenePokemonList

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Sub-component of SceneAddPanel showing per-character Pokemon lists
- **Found:** Yes (component exists within SceneAddPanel)
- **Classification:** Present
- **Evidence:** ScenePokemonList is a sub-component of SceneAddPanel. The AddPanel is present (C064 verified). ScenePokemonList renders within the Pokemon tab of SceneAddPanel. Source code at `components/scene/SceneAddPanel.vue` imports and uses `ScenePokemonList` in the Pokemon tab section. The panel must be expanded and the Pokemon tab selected to see the list; with no test data Pokemon, the list would be empty but the component still mounts.

### scenes-C066 — SceneGroupsPanel

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Left panel with "Groups" heading, add/collapse buttons, group list
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  ```yaml
  - heading "Groups" [level=3] [ref=e77]
  - button [ref=e79] [cursor=pointer] (add group)
  - button [ref=e83] [cursor=pointer] (collapse toggle)
  - generic: No groups. Click + to create one.
  ```
  Empty state text confirms panel is functional and awaiting group creation.

### scenes-C067 — SceneHabitatPanel

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Right panel with habitat selector dropdown and encounter generation button
- **Found:** Yes (collapsed state)
- **Classification:** Present
- **Evidence:** Panel renders in collapsed state by default (`habitatPanelCollapsed = ref(true)` in page code). Collapsed strip with PhTree icon visible as clickable img element (ref=e119, cursor=pointer) in the scene editor snapshot. Source code confirms expanded state shows "Habitat" heading with encounter table selector dropdown and "Generate Encounter" button.

### scenes-C068 — StartEncounterModal

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Modal dialog for scene-to-encounter conversion with battle type and significance tier selection
- **Found:** Not rendered (conditionally rendered, requires pokemon/characters in scene)
- **Classification:** Present
- **Evidence:** The modal is gated by `v-if="showStartEncounterModal"` and the "Start Encounter" button is gated by `v-if="scene.pokemon.length > 0 || scene.characters.length > 0"`. Since the test scene has no pokemon or characters, neither the button nor the modal appear. However, the component IS imported and wired in the scene editor template. The `StartEncounterModal.vue` component exists at `components/scene/StartEncounterModal.vue` (238 lines) and is referenced in the `[id].vue` template at line 138. This is a conditional render, not absence.

### scenes-C069 — QuestXpDialog

- **Route checked:** `/gm/scenes/cmmdvgv4n0002rw48vechxy6c`
- **Expected element:** Inline dialog for awarding trainer XP to scene characters
- **Found:** Not rendered (conditionally rendered, requires characters in scene)
- **Classification:** Present
- **Evidence:** The "Award Quest XP" button is gated by `v-if="scene.characters.length > 0"` and the dialog is gated by `v-if="showQuestXpDialog"`. Since the test scene has no characters, neither appears. The component IS imported and wired: `QuestXpDialog` at line 72 of `[id].vue`. The `QuestXpDialog.vue` component exists at `components/scene/QuestXpDialog.vue` (212 lines). This is a conditional render based on scene state, not absence.
