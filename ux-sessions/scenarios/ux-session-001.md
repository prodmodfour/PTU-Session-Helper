---
scenario_id: ux-session-001
title: "First Contact: Basic Combat and Player Flow"
domains_exercised: [combat, capture, scenes, player-view]
estimated_duration_minutes: 30
priority: P1
status: pending
prerequisite: "Player View implementation complete"
---

# Scenario: First Contact — Basic Combat and Player Flow

## Session Goal (for GM)

Kaelen wants to run a quick training encounter for the party. He'll set up a scene in a forest clearing, add the party's characters, start an encounter with a few wild Pokemon, and let the players fight them. One player should attempt a capture. The goal is to exercise the core GM-to-player flow: scene setup, encounter start, combat turns, damage, and capture — all through the app with real browser interaction.

## GM Beats (loose)

1. **Setup** — Kaelen navigates to `/gm`, creates a scene titled "Forest Clearing," adds all 4 player characters to the scene, sets the weather and habitat.
2. **Encounter Start** — Kaelen starts an encounter from the scene. Adds 2-3 wild Pokemon (varying levels). Sets initiative. Verifies all combatants appear in the right order.
3. **Combat Rounds** — Run 2-3 full combat rounds. Each player takes a turn (attack with a move, use a maneuver, or take a breather). Kaelen manages NPC Pokemon turns (they attack back). Track damage, HP, status conditions.
4. **Capture Attempt** — One player attempts to capture a weakened wild Pokemon. Kaelen facilitates the capture roll through the app.
5. **Wrap Up** — End the encounter. Verify post-combat state (HP, injuries, captured Pokemon).

## Player Goals (per profile)

- **Mira:** Use her favorite Pokemon's strongest move. Try to capture the cutest wild Pokemon. Tap through combat quickly.
- **Dex:** Check all his Pokemon's stats before combat. Verify damage numbers match what he'd expect from PTU formulas. Note any discrepancies.
- **Spark:** Figure out whose turn it is. Pick an attack (any attack). Try not to faint. Ask "what do I do?" at least once by being confused.
- **Riven:** Use a combat maneuver (Push or Trip). Apply a status condition. Test what happens with strategic positioning.

## What to Observe

- Can players identify the app on first load? Is onboarding clear?
- Does the player view show whose turn it is with clear visual feedback?
- Can players select and use moves without confusion?
- Do damage numbers appear responsive and clear on both phone and laptop?
- Does WebSocket sync work — do player actions appear on the GM view? Do GM broadcasts update player views?
- Is the capture flow understandable without reading the rulebook?
- Are mobile viewports usable (especially Mira at 390x844 and Spark at 360x780)?
- How does Spark (no PTU knowledge) experience the combat flow?
- Do any actions result in unclear error states or silent failures?
- Is the post-combat state accurate (HP, injuries, status conditions cleared correctly)?
