---
decree_id: decree-015
status: active
domain: capture
topic: capture-hp-percentage-base
title: "Use real max HP for capture rate HP percentage calculations"
ruled_at: 2026-02-26T18:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-015
implementation_tickets: []
tags: [capture, hp-percentage, injuries, real-max-hp]
---

# decree-015: Use real max HP for capture rate HP percentage calculations

## The Ambiguity

Should the capture rate HP percentage thresholds (75%, 50%, 25%) use the real max HP or the injury-reduced effective max HP? Surfaced by decree-need-015.

## Options Considered

### Option A: Real max HP (current)
Consistent with p.250 injury rule: "All Effects that normally go off the Pokemon's Max Hit Points still use the real maximum." More generous to capturers — an injured Pokemon at full effective health still counts as below 100%.

### Option B: Effective max HP
A Pokemon at full effective health (given injuries) counts as 100%. Harder to capture at full effective health.

## Ruling

**The true master decrees: use real max HP for capture rate HP percentage calculations.**

PTU p.250 explicitly states that effects based on Max HP use the real maximum. The capture rate HP thresholds are such an effect. A Pokemon with 50 real max HP at 35 current HP (even if effective max is 35 due to injuries) is at 70% for capture purposes, not 100%. This is consistent with how injury mechanics interact with all HP-based calculations throughout the system.

## Precedent

All HP percentage calculations throughout the app use real max HP, per PTU p.250. This applies universally: capture rate thresholds, massive damage checks (decree-004), and any future HP-percentage-based mechanics.

## Implementation Impact

- Tickets created: none — confirms current behavior
- Files affected: none (`captureRate.ts` already uses real max HP)
- Skills affected: Capture and combat reviewers should verify real max HP is used in all percentage calculations
