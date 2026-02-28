---
decree_id: decree-031
status: active
domain: encounter
topic: encounter-budget-formula
title: "Replace bogus encounter budget formula with PTU-sourced guidance"
ruled_at: 2026-02-28T12:00:00
supersedes: null
superseded_by: null
source_ticket: decree-need-031
implementation_tickets:
  - ptu-rule-124
tags: [encounter, budget, encounter-design, ptu-compliance, citation]
---

# decree-031: Replace bogus encounter budget formula with PTU-sourced guidance

## The Ambiguity

The encounter budget calculation uses the formula `avgPokemonLevel * 2 * playerCount` and cites "Core p.473" as its source. This page does not exist in PTU 1.05. The formula has no verifiable PTU source. Surfaced by decree-need-031 from encounter-tables audit.

## Options Considered

### Option A: Keep the heuristic, fix the citation
The formula produces reasonable budgets. Remove the false citation and label it as an app heuristic.

### Option B: Remove the formula entirely
Since it has no PTU basis, remove auto-calculated budget and let GMs set budgets manually.

### Option C: Replace with PTU-sourced alternative
Research PTU Chapter 11 for encounter balancing guidance and implement that instead.

## Ruling

**The true master decrees: replace the bogus formula with PTU-sourced encounter design guidance.**

The false citation "Core p.473" must be removed immediately. The formula should be replaced with encounter design guidance actually found in the PTU ruleset (Chapter 11: Running the Game). The implementation ticket should research what PTU actually says about encounter balancing and implement accordingly.

## Precedent

The app must not claim PTU authority for mechanics that are not in the rules. Bogus citations are always removed. When a mechanic claims PTU basis but has none, it must either be replaced with an actual PTU-sourced implementation or clearly labeled as an app-specific tool with no RAW claim.

## Implementation Impact

- Tickets created: ptu-rule-124
- Files affected: encounter budget calculation, any UI showing "recommended budget"
- Skills affected: Encounter reviewers should verify PTU citations are accurate
