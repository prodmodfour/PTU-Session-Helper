---
ticket_id: decree-need-039
category: AMBIGUOUS
priority: P2
severity: MEDIUM
status: open
domain: combat
source: rules-review-230 MED-2
created_by: slave-collector (plan-20260301-170000)
created_at: 2026-03-01
---

# Decree-Need-039: Flanking evasion penalty application order relative to evasion cap

## Ambiguity

PTU p.232 states flanked combatants "take a -2 penalty to their Evasion." The evasion cap is 9. Two valid interpretations exist:

### Option A: Penalty BEFORE cap (less impactful)
- evasion 11 → 11 - 2 = 9 → cap at 9 = **9** (flanking has no effect for high-evasion targets)
- evasion 7 → 7 - 2 = 5 → cap at 9 = **5** (flanking applies normally)

### Option B: Penalty AFTER cap (current implementation, more impactful)
- evasion 11 → cap at 9 → 9 - 2 = **7** (flanking always reduces by 2)
- evasion 7 → cap at 9 → 7 - 2 = **5** (same result)

## Current Implementation

Option B is currently implemented in `app/composables/useMoveCalculation.ts` (line 396-402):
```typescript
const effectiveEvasion = Math.min(9, evasion)
// ...
return Math.max(1, move.value.ac + effectiveEvasion - attackerAccuracyStage.value - flankingPenalty + roughPenalty)
```

## Impact

Affects all accuracy calculations against flanked targets with evasion > 9. If Option A is chosen, high-evasion targets would be immune to flanking penalty when at the cap.

## Affected Files

- `app/composables/useMoveCalculation.ts`

## Recommendation

Option B (current) is arguably more correct because flanking should always have a meaningful tactical effect. The rules-review-230 reviewer approved with this interpretation but flagged it as needing a decree if contested.
