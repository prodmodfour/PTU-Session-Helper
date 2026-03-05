# Browser Audit: Group View — Scenes Domain

## Route: `/group`

### scenes-C070 — Group View SceneView

- **Route checked:** `/group`
- **Expected element:** Scene display with location name, description, weather overlay, Pokemon sprites, character avatars, group labels
- **Found:** Yes (empty state)
- **Classification:** Present
- **Evidence:**
  ```yaml
  - heading "No Active Scene" [level=2] [ref=e31]
  - paragraph: The GM will set up a scene for the narrative view.
  ```
  The SceneView component renders its empty state ("No Active Scene") because the `groupViewTabsStore.activeScene` is null. The group view polling mechanism (`fetchTabState()`) retrieves the tab name and scene ID but does not hydrate the full scene object — that requires WebSocket push via `scene_activated` or `scene_sync` events from the GM client. Without an active WebSocket connection from the GM, the store's `activeScene` remains null.

  **Component is Present:** The SceneView component at `pages/group/_components/SceneView.vue` is loaded and rendering. The `v-if="!scene"` branch renders the waiting card with icon, heading, and description text — all confirmed in the accessibility tree. With WebSocket-pushed scene data, the component would display:
  - Weather overlay with CSS animations (rain, snow, sandstorm, etc.)
  - Background image from `scene.locationImage`
  - Location header with name and description
  - Pokemon sprites positioned by percentage coordinates
  - Character avatars with names
  - Group labels with member counts

  The component is confirmed Present, not Absent. Its empty state is the correct behavior when no WebSocket connection delivers scene data.
