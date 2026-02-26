---
decree_id: decree-019
status: active
domain: rest
topic: new-day-extended-rest
title: "New Day is a pure counter reset, no implicit extended rest"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-019
implementation_tickets: []
tags: [rest, new-day, extended-rest, counter-reset]
---

# decree-019: New Day is a pure counter reset, no implicit extended rest

## The Ambiguity

Should the "New Day" action include an implicit extended rest, or remain a pure counter reset? In most campaigns a new day implies overnight sleep, but PTU treats them as separate concepts. Surfaced by decree-need-019.

## Options Considered

### Option A: Counter reset only (current)
GM triggers extended rest separately. Keeps the two concepts separate as PTU intends. More explicit control.

### Option B: Bundle with extended rest
New day automatically includes full extended rest effects. Convenient but conflates two distinct mechanics.

### Option C: Configurable checkbox
Toggle in the new day dialog. Most flexible but adds UI complexity.

## Ruling

**The true master decrees: New Day is a pure counter reset with no implicit extended rest.**

PTU treats resting and daily resets as separate mechanics. New Day resets daily counters (restMinutesToday, injuriesHealedToday, daily moves, AP). Extended rest heals HP, clears persistent conditions, and restores AP. The GM must trigger extended rest separately. This preserves scenarios where a new day occurs without rest (forced march, captured, etc.) and keeps the game mechanics modular.

## Precedent

Game mechanics that PTU describes as separate concepts remain separate in the app. The GM explicitly invokes each mechanic. No implicit bundling of distinct actions, even when they commonly co-occur in typical play.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none
- Skills affected: Rest/healing reviewers should verify New Day and Extended Rest remain independent actions
