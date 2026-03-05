# Browser Audit: Player View — Scenes Domain

## Route: `/player`

### scenes-C071 — Player SceneView

- **Route checked:** `/player` (after selecting character "Hassan", then clicking "Scene" nav tab)
- **Expected element:** Scene info display with scene name, weather badge, description, character list, Pokemon list, group list
- **Found:** Yes
- **Classification:** Present
- **Evidence:**
  ```yaml
  - heading "Test Scene" [level=2] [ref=e199]
  - generic [ref=e200]:
    - img [ref=e201]
    - text: Clear
  - paragraph: A test scene for browser audit
  ```
  The PlayerSceneView component at `components/player/PlayerSceneView.vue` renders the active scene data:
  - Scene name: "Test Scene" (heading level 2)
  - Weather badge: "Clear" with weather icon
  - Description: "A test scene for browser audit"
  - Group View status: "Current Tab: Scene"
  - "Request Lobby" button for player interaction

  The player view correctly receives scene data via the `usePlayerScene` composable (which fetches via the active scene API endpoint), unlike the group view which relies on WebSocket push. The "Scene" navigation tab in the player bottom nav bar (`button "Scene" [active]`) confirms the tab routing works.

  Additional scene sections (Characters, Pokemon, Groups) are conditionally rendered but not present in this snapshot because the test scene has no characters, Pokemon, or groups added to it. These sections use `v-if` guards on array length — correct conditional rendering, not absence.
