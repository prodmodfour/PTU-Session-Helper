---
id: feature-018
title: Weather Effect Automation
priority: P2
severity: MEDIUM
status: open
domain: scenes
source: matrix-gap (Scenes SG-1)
matrix_source: scenes R011, R012, R013, R014, R015
created_by: master-planner
created_at: 2026-02-28
---

# feature-018: Weather Effect Automation

## Summary

Weather can be set on scenes but is display-only. No weather damage, no type damage modifiers, no ability interactions. 5 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R011 | Hail Weather Effects | Missing — no auto weather damage |
| R012 | Rainy Weather Effects | Missing — no fire -5/water +5, no Swift Swim/Rain Dish |
| R013 | Sandstorm Weather Effects | Missing — no auto damage to non-Ground/Rock/Steel |
| R014 | Sunny Weather Effects | Missing — no fire +5/water -5, no Chlorophyll |
| R015 | Weather-Dependent Ability Interactions | Missing — no Forecast/Weather Ball type change |

## PTU Rules

- Chapter 7/10: Weather effects
- Hail/Sandstorm: 1/16 max HP damage at end of turn (with type immunities)
- Rain: Fire -5 DB, Water +5 DB, Swift Swim doubles speed
- Sun: Fire +5 DB, Water -5 DB, Chlorophyll doubles speed
- Weather Ball changes type based on active weather
- Forecast (Castform) changes form based on weather

## Implementation Scope

FULL-scope feature requiring design spec. Affects damage calculation, turn end processing, and ability system.
