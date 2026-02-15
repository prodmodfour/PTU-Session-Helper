---
skill: developer
last_analyzed: 2026-02-16T00:30:00
analyzed_by: retrospective-analyst
total_lessons: 2
domains_covered:
  - combat
---

# Lessons: Developer

## Summary
Two lessons from the Tier 1 cycle, both stemming from a single bug report (bug-001). The faint handler omitted status clearing per PTU p248 — a missing-check error. The fix exposed a second issue: `move.post.ts` performed inline HP subtraction that bypassed the damage pipeline entirely, meaning even after fixing `combatant.service.ts`, moves could still produce incorrect faint behavior. Both code paths now route through the unified damage pipeline.

---

## Lesson 1: Implement all PTU rule consequences for state transitions

- **Category:** missing-check
- **Severity:** high
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
When a Pokemon's HP reached 0, the faint handler in `applyDamageToEntity()` only appended "Fainted" to the existing `statusConditions` array without clearing pre-existing persistent and volatile statuses. PTU p248 explicitly states that fainting clears all Persistent and Volatile status conditions. The fix was a one-line change: replace `push('Fainted')` with assignment of `['Fainted']`.

### Evidence
- `artifacts/reports/bug-001.md`: Caterpie fainted with `["Burned", "Fainted"]` instead of `["Fainted"]`
- `git diff 72df77b`: `entity.statusConditions = ['Fainted']` replaced `entity.statusConditions.push('Fainted')`
- `git diff 84b9f6c`: Removed redundant `!includes('Fainted')` guard — assignment is idempotent
- PTU p248: "automatically cured of all Persistent and Volatile Status Conditions" on faint

### Recommendation
When implementing a state transition (faint, evolution, capture, etc.), check the PTU rulebook for all side effects of that transition. Fainting clears statuses. Capture changes ownership. Evolution may change type, stats, and abilities. Each side effect must be explicitly implemented, not just the primary effect. Create a checklist of PTU-mandated side effects before coding.

---

## Lesson 2: Identify and update all code paths that perform the same operation

- **Category:** fix-pattern
- **Severity:** high
- **Domain:** combat
- **Frequency:** observed
- **First observed:** 2026-02-15 (Tier 1)
- **Status:** active

### Pattern
After fixing the faint handler in `combatant.service.ts`, the Senior Reviewer discovered that `move.post.ts` performed raw inline HP subtraction (`Math.max(0, hp - damage)`) instead of routing through the damage pipeline (`calculateDamage` + `applyDamageToEntity` + `syncDamageToDatabase`). This meant moves reducing HP to 0 would not trigger the newly-fixed faint status clearing, temp HP absorption, or injury checks. The initial bug fix was incomplete because it only addressed one of two code paths performing the same operation.

### Evidence
- `git diff b9dfed7`: `move.post.ts` replaced `Math.max(0, target.entity.currentHp - targetDamage)` with full pipeline call chain
- `artifacts/reports/bug-001.md` Fix Log: Three commits required — 72df77b (fix), 84b9f6c (simplify guard), b9dfed7 (fix duplicate path)
- Senior Reviewer catch: The bypass was found during first-pass code review of bug-001 fix

### Recommendation
When fixing a bug in a service function, search the codebase for all callers and all parallel implementations of the same operation. Use grep for the operation's key terms (e.g., `currentHp`, `fainted`, `statusConditions`) to find duplicate code paths. If any code path performs the same operation differently (inline vs service call), unify it to use the single canonical implementation. The fix is not complete until all paths route through the same code.
