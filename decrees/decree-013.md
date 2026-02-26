---
decree_id: decree-013
status: active
domain: capture
topic: capture-system-version
title: "Use the core 1d100 capture system, not the errata d20 playtest"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-013
implementation_tickets: []
tags: [capture, core-rules, errata]
---

# decree-013: Use the core 1d100 capture system, not the errata d20 playtest

## The Ambiguity

PTU has two capture systems: the core 1d100 system (p.214) and the errata d20 playtest system (errata-2.md p.8). Which should the app implement? Surfaced by decree-need-013.

## Options Considered

### Option A: Keep 1d100 system (current)
Core rules. Already fully implemented. More granular capture rates. The errata d20 system is labeled as a "playtest" so its canonical status is unclear.

### Option B: Switch to d20 system
Simpler. Aligns with errata/playtest direction. Would require rewriting capture logic entirely.

### Option C: Make configurable via AppSettings
Support both systems. GM chooses. Most flexible but doubles implementation and testing surface.

## Ruling

**The true master decrees: use the core 1d100 capture system exclusively.**

The errata d20 capture system is labeled as a "Sept 2015 Playtest" and does not represent a canonical replacement for the core rules. The 1d100 system is already fully implemented, provides more granular capture rates, and is the established standard in PTU 1.05. No changes needed.

## Precedent

When the errata contains "playtest" or experimental content, the core rulebook takes precedence. The errata is authoritative only for corrections and clarifications to existing rules, not for experimental replacements.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none
- Skills affected: Capture reviewers should verify against 1d100 system only
