---
decree_id: decree-018
status: active
domain: rest
topic: extended-rest-duration
title: "Extended rest accepts a duration parameter for scalable healing"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-018
implementation_tickets:
  - ptu-rule-106
tags: [rest, extended-rest, duration, healing]
---

# decree-018: Extended rest accepts a duration parameter for scalable healing

## The Ambiguity

Should extended rest always apply exactly 4 hours of healing, or scale with actual rest duration? PTU says extended rests are "at least 4 continuous hours long" and the daily rest cap is 8 hours. Surfaced by decree-need-018.

## Options Considered

### Option A: Fixed 4 hours (current)
Simple button that always gives exactly 4h (8 rest periods). GM manually adds more if needed.

### Option B: Accept duration parameter
Let the GM specify how long the rest is. Apply proportional healing up to 8h daily cap. Most flexible and accurate.

### Option C: Always apply full 8 hours
Most extended rests are overnight. Give the full daily allotment. Simplest for typical use.

## Ruling

**The true master decrees: extended rest accepts a duration parameter for scalable healing.**

The extended rest endpoint should accept an optional duration (in hours, minimum 4, maximum 8) from the GM. Healing is calculated as: `floor(duration / 0.5)` rest periods, each healing 1/16th of max HP, capped by the 8h daily limit and accounting for any 30-minute rests already taken that day via `restMinutesToday`. Default duration if not specified: 4 hours (preserving current behavior as fallback).

## Precedent

When PTU specifies a minimum duration for a mechanic, the app should accept the actual duration rather than assuming the minimum. GM-specified durations are preferred over fixed defaults for time-based mechanics.

## Implementation Impact

- Tickets created: ptu-rule-106
- Files affected: `app/server/api/characters/[id]/extended-rest.post.ts`, `app/server/api/pokemon/[id]/extended-rest.post.ts`, client UI for extended rest button
- Skills affected: Rest/healing reviewers must verify duration parameter and daily cap interaction
