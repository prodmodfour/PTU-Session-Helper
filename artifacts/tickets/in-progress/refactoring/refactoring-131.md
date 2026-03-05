---
id: refactoring-131
title: Replace remaining alert() calls with useGmToast across non-combat domains
category: UX-PATTERN
priority: P3
severity: MEDIUM
domain: cross-cutting
source: refactoring-097 resolution log (plan-1772661312 slave-1)
created_by: slave-collector (plan-1772661312)
created_at: 2026-03-04
affected_files:
  - app/pages/gm/scenes/[id].vue
  - app/pages/gm/scenes/index.vue
  - app/pages/gm/pokemon/[id].vue
  - app/composables/useEvolutionUndo.ts
  - app/components/character/EquipmentCatalogBrowser.vue
  - app/components/character/tabs/HumanEquipmentTab.vue
  - app/components/encounter/MountControls.vue
  - app/components/encounter/EnvironmentSelector.vue
  - app/components/encounter/DeclarationPanel.vue
  - app/components/encounter/XpDistributionModal.vue
  - app/components/evolution/EvolutionConfirmModal.vue
  - app/components/encounter/XpDistributionResults.vue
  - app/pages/gm/characters/[id].vue
  - app/components/character/TrainerXpPanel.vue
  - app/layouts/gm.vue
---

# refactoring-131: Replace remaining alert() calls with useGmToast across non-combat domains

## Summary

Slave-1 of plan-1772661312 replaced 9 `alert()` calls in the combat domain with the new `useGmToast` composable. However, ~46 `alert()` calls remain across non-combat domains (scenes, pokemon sheets, equipment, evolution, encounter sub-components, character pages, group views, GM layout).

These should all be converted to use `useGmToast` for consistency and to eliminate blocking UI popups.

## Affected Domains

- **Scenes** (~14 calls): `pages/gm/scenes/[id].vue`, `pages/gm/scenes/index.vue`
- **Pokemon sheets** (~6 calls): `pages/gm/pokemon/[id].vue`, `useEvolutionUndo.ts`
- **Equipment** (~3 calls): `EquipmentCatalogBrowser.vue`, `HumanEquipmentTab.vue`
- **Encounter sub-components** (~9 calls): `MountControls.vue`, `EnvironmentSelector.vue`, `DeclarationPanel.vue`, `XpDistributionModal.vue`
- **Evolution** (~2 calls): `EvolutionConfirmModal.vue`, `XpDistributionResults.vue`
- **Character** (~3 calls): `pages/gm/characters/[id].vue`, `TrainerXpPanel.vue`
- **Group views** (~2 calls): `EncounterView.vue`, `LobbyView.vue`
- **GM layout** (~2 calls): `layouts/gm.vue`

## Suggested Fix

Replace all `alert()` calls with `useGmToast`'s `showToast()` function, matching the pattern established in refactoring-097. Consider splitting into sub-tasks per domain given the breadth.

## Impact

- UX improvement: no more blocking popups anywhere in the app
- Consistency: all notifications use the same toast system

## Resolution Log

**Status: in-progress**

Replaced 49 `alert()` calls across 16 files with `useGmToast().showToast()`. Moved `GmToastContainer` from `gm/index.vue` to the GM layout so all GM pages can display toasts.

**Excluded:** 2 `alert()` calls in group views (`EncounterView.vue`, `LobbyView.vue`) — these use the `group` layout (TV/projector display) which has no `GmToastContainer` and is not GM-facing. Also found 3 additional files not in the original ticket (`QuestXpDialog.vue`, `sheets.vue`, `encounter.ts` store).

### Commits

| Hash | Files Changed | Description |
|------|--------------|-------------|
| ddd7c067 | `layouts/gm.vue`, `pages/gm/index.vue` | Move GmToastContainer to GM layout, replace 2 layout alerts |
| 064b44e5 | `pages/gm/scenes/[id].vue`, `pages/gm/scenes/index.vue` | Replace 18 scene page alerts |
| 22dff5ea | `pages/gm/pokemon/[id].vue`, `composables/useEvolutionUndo.ts` | Replace 7 Pokemon sheet alerts |
| d7e040e4 | `EquipmentCatalogBrowser.vue`, `HumanEquipmentTab.vue` | Replace 3 equipment alerts |
| bdcad8bc | `MountControls.vue`, `EnvironmentSelector.vue`, `DeclarationPanel.vue`, `XpDistributionModal.vue` | Replace 10 encounter sub-component alerts |
| e517d779 | `EvolutionConfirmModal.vue`, `XpDistributionResults.vue` | Replace 6 evolution/XP results alerts |
| cc31867b | `pages/gm/characters/[id].vue`, `TrainerXpPanel.vue` | Replace 2 character domain alerts |
| 36b27444 | `QuestXpDialog.vue`, `pages/gm/sheets.vue`, `stores/encounter.ts` | Replace 4 alerts in additional files not in original ticket |
