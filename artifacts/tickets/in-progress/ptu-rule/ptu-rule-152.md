---
id: ptu-rule-152
title: "No distinction between natural weather and game Weather Conditions"
priority: P3
severity: MEDIUM
status: in-progress
domain: scenes
source: scenes-audit.md (session 121, R010 approximation)
created_by: slave-collector (plan-matrix-1772722531)
created_at: 2026-03-05
---

## Summary

PTU distinguishes natural weather (narrative, affects travel and daily life) from game Weather Conditions (mechanical, affects combat rolls and type effectiveness). The app treats all weather as narrative with no mechanical combat effects.

## Impact

Weather-dependent combat mechanics (Rain Dance boosting Water, Sun boosting Fire, etc.) not automated.

## Notes

The ticket summary was partially stale. Game Weather Conditions with full mechanical combat effects were already implemented by design-weather-001 (P0-P2, fully implemented). The actual remaining gap was that scene-level natural weather was being auto-promoted to game Weather Conditions when converting scenes to encounters, violating PTU p.341: "a bright and sunny day does not count as Sunny Weather."

## Resolution Log

**Branch:** `slave/7-dev-ptu-rule-152-1772814666`

| Commit | File | Action | Description |
|--------|------|--------|-------------|
| `1c3501d3` | `app/server/api/encounters/from-scene.post.ts` | EDIT | Stop copying scene natural weather to encounter as game Weather Condition |
| `0ebb9b1b` | `app/components/scene/ScenePropertiesPanel.vue` | EDIT | Rename label to "Natural Weather", add hint text explaining distinction |
| `b01b993b` | `app/components/gm/EncounterHeader.vue` | EDIT | Clarify encounter weather dropdown is for game Weather Conditions |
| `b3df60e7` | `app/utils/weatherRules.ts` | EDIT | Document natural weather vs game Weather Condition distinction in header |

**PTU Reference:** p.341 - "Note that despite their names, Weather Conditions are not usually found as natural occurrences. A bright and sunny day does not count as Sunny Weather, nor does rain count as Rainy Weather. However, particularly severe examples of the corresponding weather can count."

**Approach:** Scene weather remains narrative-only (visual overlays on group/player views). Encounter weather retains full mechanical effects (already implemented by design-weather-001). The GM manually promotes natural weather to a game Weather Condition via the encounter header dropdown when PTU rules warrant it (e.g., "a tropical rainstorm could count as Rainy weather").
