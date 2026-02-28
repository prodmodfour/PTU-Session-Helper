---
decree_id: decree-036
status: active
domain: pokemon-lifecycle
topic: stone-evolution-move-learning
title: "Stone evolutions learn new-form moves at or below current level"
ruled_at: 2026-02-28T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-036
implementation_tickets: []
tags: [pokemon-lifecycle, evolution, stone-evolution, move-learning, learnset]
---

# decree-036: Stone evolutions learn new-form moves at or below current level

## The Ambiguity

PTU p.203 says upon evolution, Pokemon learn moves "at a Level lower than their minimum Level for Evolution but that their previous form could not learn." For stone-based evolutions (e.g., Eevee -> Vaporeon with Water Stone), there is no minimum level — the stone can be used at any level. What does the formula return when `minimumEvolutionLevel` is undefined?

Source: decree-need-036, surfaced by design-pokemon-evolution-001/spec-p1.md (section 2.2).

## Options Considered

### Option A: All moves at or below current level
Since there's no minimum level, offer all moves from the new form's learnset that are at or below the Pokemon's current level AND weren't in the old form's learnset. Higher-level stone evolutions get more moves — a sensible scaling behavior.

### Option B: No automatic moves
Since there's no "minimum level for evolution," the formula `level < minimumLevel` returns nothing (undefined comparison yields empty set). Stone-evolved Pokemon must learn new moves via TM, tutor, or future leveling.

### Option C: All new-form moves regardless of level
Stone evolutions have no level gate, so the Pokemon gets access to ALL new-form moves not in the old form's learnset. Most generous but potentially overpowered (Level 5 Vaporeon with Hydro Pump).

## Ruling

**The true master decrees: stone evolutions learn new-form moves at or below the Pokemon's current level, excluding moves already available to the old form.**

The formula for stone evolutions is: `newFormMoves WHERE moveLevel <= currentLevel AND NOT IN oldFormLearnset`. This is the natural interpretation when there is no minimum evolution level — the Pokemon's current level serves as the upper bound. This scales intuitively: a Level 5 Eevee evolving into Vaporeon gets only low-level Vaporeon moves, while a Level 30 Eevee gets more. The "no moves" interpretation is too punishing and contradicts the spirit of the rule (evolution should grant new capabilities). The "all moves" interpretation is too generous and creates balance issues.

## Precedent

When a PTU evolution has no minimum level requirement (stone, trade, or other non-level triggers), substitute the Pokemon's current level as the upper bound for the evolution move learning formula. The formula becomes: new-form moves at or below current level, excluding moves the old form could learn. This applies to all evolution triggers that lack a level gate.

## Implementation Impact

- Tickets created: none — confirms the design-pokemon-evolution-001 default interpretation
- Files affected: evolution move learning logic in feature-006
- Skills affected: pokemon-lifecycle reviewers, evolution developer
