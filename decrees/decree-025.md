---
decree_id: decree-025
status: active
domain: vtt-grid
topic: rough-terrain-penalty-endpoint-exclusion
title: "Exclude endpoint cells from rough terrain accuracy penalty check"
ruled_at: 2026-02-27T19:30:00
supersedes: null
superseded_by: null
source_ticket: decree-need-025
implementation_tickets: []
tags: [vtt-grid, rough-terrain, accuracy, targeting, endpoints]
---

# decree-025: Exclude endpoint cells from rough terrain accuracy penalty check

## The Ambiguity
PTU p.231 states "When targeting through Rough Terrain, you take a -2 penalty to Accuracy Rolls." The word "through" is ambiguous — it could mean only terrain between attacker and target (intervening), or could include terrain at the target's or attacker's position (endpoints). Surfaced by rules-review-172 MED-2.

## Options Considered
### Option A: Intervening only (endpoints excluded)
Only rough terrain between the attacker and target triggers the -2 penalty. The attacker's and target's own cells are excluded from the check. Supported by the Stealth capability text (p.450-451) which explicitly separates "through Rough Terrain" and "on Rough Terrain" as distinct clauses, indicating PTU treats them as different conditions. The flavor text describes rough terrain as things that "obscure attacks" — terrain at a combatant's feet does not obscure the attack path.

### Option B: Include target cell
The target's cell is included in the rough terrain check — if the target stands on rough terrain, the penalty applies. The Groundsource keyword's wording ("targeting into Rough Terrain") hints that the target position could matter. However, "into" is a different word than "through."

### Option C: Include both endpoints
Both attacker and target cells are included. Standing on rough terrain always affects accuracy. Weakest textual support, and would make rough terrain disproportionately punishing for melee combatants who must stand adjacent to targets on rough terrain.

## Ruling
**The true master decrees: only intervening rough terrain (between attacker and target) triggers the -2 accuracy penalty; endpoint cells are excluded.**

The Stealth capability text at p.450-451 is the strongest evidence: PTU explicitly writes "through Rough Terrain **or if** the Pokemon is on Rough Terrain" — using separate clauses for "through" and "on." This demonstrates PTU considers them distinct conditions. The rough terrain accuracy rule uses "through," meaning intervening terrain only. The flavor text about terrain that "obscures attacks" further supports this — terrain at a combatant's feet does not obscure the attack path between them.

## Precedent
When PTU says "targeting through" terrain, it means intervening terrain between combatants. Endpoint positions (attacker/target cells) are not considered part of the "through" path. PTU distinguishes "through" from "on" as separate conditions, as evidenced by the Stealth capability wording.

## Implementation Impact
- Tickets created: none — confirms current behavior
- Files affected: `app/composables/useMoveCalculation.ts` (no changes needed, lines 189-200 already exclude endpoints)
- Skills affected: Game Logic Reviewer should cite this decree when reviewing rough terrain accuracy checks
