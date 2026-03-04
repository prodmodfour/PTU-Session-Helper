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
