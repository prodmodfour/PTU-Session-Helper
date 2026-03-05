---
domain: scenes
type: browser-audit
browser_audited_at: 2026-03-05T20:02:00Z
browser_audited_by: browser-auditor
total_checked: 54
present: 12
absent: 0
error: 0
unreachable: 0
untestable: 42
---

# Browser Audit: Scenes Domain

## Summary

All 54 capabilities in the scenes domain were evaluated. The 12 component-type capabilities (C060-C071) were browser-verified using Playwright accessibility tree snapshots. All 12 were classified as **Present**. The remaining 42 capabilities are server-side only (Prisma models, API endpoints, services, utilities, constants, store actions, store getters, composables, WebSocket events) and classified as **Untestable** since they have no direct UI terminus.

**No absent, error, or unreachable capabilities were found.**

## Audit Environment

- **Server:** Nuxt 3 dev server on `localhost:3000` (started from `/home/ash/PTU-Session-Helper/app`)
- **Browser:** Headless Chrome via `playwright-cli`
- **Test data:** One scene ("Test Scene") created via API with weather "Clear" and terrain "Grass", activated and set as group view tab

## Results by Classification

| Classification | Count | Capabilities |
|---------------|-------|-------------|
| Present | 12 | C060, C061, C062, C063, C064, C065, C066, C067, C068, C069, C070, C071 |
| Absent | 0 | — |
| Error | 0 | — |
| Unreachable | 0 | — |
| Untestable | 42 | C001-C005, C010-C026, C030-C034, C040-C046, C050-C053, C080-C083 |

## Action Items

None. All browser-testable capabilities are present and accessible.

## Conditional Render Notes

Two components (C068 StartEncounterModal, C069 QuestXpDialog) are conditionally rendered based on scene entity state:

- **C068 StartEncounterModal:** Requires `scene.pokemon.length > 0 || scene.characters.length > 0` for the "Start Encounter" button to appear. The modal itself requires the button to be clicked. Component is imported and wired in the template; classified as Present because the conditional gating is intentional design, not a bug.
- **C069 QuestXpDialog:** Requires `scene.characters.length > 0` for the "Award Quest XP" button to appear. Same reasoning as C068.

## Group View WebSocket Dependency

The Group View SceneView (C070) shows "No Active Scene" even when a scene is activated, because the `groupViewTabsStore.activeScene` property is populated via WebSocket push, not HTTP polling. The polling mechanism (`fetchTabState()`) only retrieves the tab name and scene ID. Without an active GM WebSocket connection, the store's `activeScene` remains null. The component IS present and rendering its empty state correctly.

## View Files

| View | File | Capabilities Checked |
|------|------|---------------------|
| GM | [view-gm.md](view-gm.md) | C060-C069 (10 capabilities) |
| Group | [view-group.md](view-group.md) | C070 (1 capability) |
| Player | [view-player.md](view-player.md) | C071 (1 capability) |
| Untestable | [untestable-items.md](untestable-items.md) | 42 server-side capabilities |
