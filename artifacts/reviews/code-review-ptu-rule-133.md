---
review_id: code-review-ptu-rule-133
review_type: code
reviewer: senior-reviewer
trigger: bug-fix
target_report: ptu-rule-133
domain: scenes
commits_reviewed:
  - 6eefc16b
  - c3465c0f
files_reviewed:
  - app/utils/weatherRules.ts
  - app/server/services/weather-automation.service.ts
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
reviewed_at: 2026-03-05T14:30:00Z
follows_up: null
---

## Review Scope

Two commits implementing Permafrost ability weather damage reduction for ptu-rule-133:

1. **6eefc16b** — Added `WEATHER_DAMAGE_REDUCTION_ABILITIES` constant and `getWeatherDamageReduction()` helper to `app/utils/weatherRules.ts`. Removed stale TODO comment.
2. **c3465c0f** — Integrated damage reduction into `getWeatherTickForCombatant()` in `app/server/services/weather-automation.service.ts`. After computing raw tick damage, subtracts the reduction amount with a `Math.max(1, ...)` floor.

### PTU Rule Verified

PTU 10-indices-and-reference.md, lines 1991-1997:
> Ability: Permafrost — Static — "The user gains 5 Damage Reduction against Super-Effective Damage. Additionally, whenever the user would lose a Tick of Hit Points due to an effect such as Sandstorm or the Burn Status condition, subtract 5 from the amount of Hit Points lost. Defensive."

The implementation correctly captures the weather tick reduction portion. The Burn status reduction is explicitly out of scope per the ticket, which is appropriate scoping.

### Decree Compliance

- **decree-001** (minimum damage floor): Cited in the code for `Math.max(1, ...)`. See MEDIUM issue below regarding scope applicability.
- **decree-045** (Sun Blanket tick fraction): Not directly relevant but confirms the precedent that ability descriptions are authoritative. The Permafrost ability description is correctly used as the source for the 5 HP reduction value.

No decree violations found.

## Issues

### MEDIUM

**MED-001: `Math.max(1, ...)` floor cites decree-001, but decree-001 covers attack damage, not weather tick reduction by ability.**

File: `app/server/services/weather-automation.service.ts`, line 113.
Also: `app/utils/weatherRules.ts`, line 107 (comment).

The code applies `Math.max(1, rawTickDamage - reduction.reduction)` and cites "minimum 1 damage per decree-001." However, decree-001 specifically rules on the attack damage pipeline (post-defense and post-type-effectiveness floors). It does not explicitly cover ability-based reduction of weather tick damage.

The Permafrost PTU text says "subtract 5 from the amount of Hit Points lost" without stating a minimum. A Pokemon with 50 max HP has a tick of 5; Permafrost would subtract 5, yielding 0 — arguably full negation of weather damage for that specific HP range. Whether this should floor at 1 or 0 is a PTU rules question.

The minimum-1 floor is a reasonable defensive choice and may well be the correct interpretation (weather that is not immune should always deal something). But the decree citation is technically inaccurate. **Flag for Game Logic Reviewer**: should Permafrost reduction be allowed to reduce weather tick to 0, or is the min-1 floor correct? If the min-1 is intended, a new decree or expansion of decree-001 would properly cover this case.

**Action required**: The Game Logic Reviewer should verify whether the min-1 floor is PTU-correct for Permafrost reduction. If it is, update the comment to cite a more accurate source or file a decree-need. If not, change to `Math.max(0, ...)`.

## What Looks Good

1. **Correct immunity-then-reduction ordering.** The service checks full immunity first (lines 81-100), then only computes reduction for non-immune combatants (line 107). This means Ice-type Pokemon with Permafrost in Hail correctly get immunity (via type), not reduction. Permafrost reduction only triggers for Sandstorm on Ice-types without Ground/Rock/Steel typing — the only real-world scenario.

2. **Data-driven constant design.** `WEATHER_DAMAGE_REDUCTION_ABILITIES` is a `Record<string, number>` that maps ability name to reduction amount. This is extensible if other reduction abilities are ever added, without changing the logic in the service.

3. **Formula string includes full breakdown.** When Permafrost applies, the formula shows `Hail/Sandstorm: 1/10 max HP (X) - Permafrost (5) = Y`, giving the GM full transparency into the calculation. Good for debugging and session play.

4. **Case-insensitive ability matching.** Consistent with all other ability checks in weatherRules.ts — uses `.toLowerCase()` comparison.

5. **Clean commit granularity.** Two focused commits: one for the constant/helper, one for the service integration. Matches project commit guidelines.

6. **Scope discipline.** The ticket correctly scopes to weather damage only, deferring Burn status reduction to a separate ticket. The Permafrost ability also grants 5 DR against Super-Effective attacks — that is an entirely separate mechanic and correctly not addressed here.

7. **Correct species scope.** Despite the ticket claiming "Only affects the Aurorus evolutionary line," Permafrost is actually available on Cryogonal, Bergmite/Avalugg, Hisuian Avalugg, and Snom/Frosmoth (6 species across 4 evolutionary lines). The code uses ability name matching, not species checks, so it correctly handles all Permafrost holders regardless of the ticket's flavor text inaccuracy.

8. **No app-surface.md update needed.** No new endpoints, components, routes, or stores were added. This was purely a constant + helper addition and a modification to an existing service function.

9. **File sizes within limits.** `weatherRules.ts` is 578 lines, `weather-automation.service.ts` is 204 lines — both well under the 800-line threshold.

## Verdict

**APPROVED.** The implementation is correct, well-structured, and properly scoped. The single MEDIUM issue (decree citation accuracy for the min-1 floor) does not block the fix — it requires a Game Logic Reviewer to confirm the PTU interpretation and update the comment or file a decree-need. The code behavior is defensively correct either way (min-1 is safe; the alternative of min-0 would only matter for Pokemon with exactly 50 or fewer max HP under Sandstorm with Permafrost).

## Required Changes

None blocking. The MEDIUM issue should be routed to the Game Logic Reviewer for PTU rules verification of the min-1 floor on Permafrost-reduced weather tick damage.
