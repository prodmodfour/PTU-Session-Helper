---
last_updated: 2026-02-19T23:45:00
updated_by: orchestrator
---

# Matrix Ecosystem State

## Domain Progress

| Domain | Rules | Capabilities | Matrix | Audit | Tickets | Coverage |
|--------|-------|-------------|--------|-------|---------|----------|
| combat | done (135) | done (210) | done | done | created | 83.0% (73/88) |
| capture | done (33) | done | done | done | created | 75.0% (18/24) |
| healing | done (42) | done | done | done | created | 80.0% (24/30) |
| pokemon-lifecycle | done (68) | done | done | done | created | 75.0% (33/44) |
| character-lifecycle | done (68) | done | done | done | created | 68.3% (28/41) |
| encounter-tables | done (27) | done | done | done | created | 64.3% (9/14) |
| scenes | done (42) | done | done | done | created | 55.6% (10/18) |
| vtt-grid | done (42) | done | done | done | created | 46.7% (7/15) |

**Overall: 202/274 correct (73.7%)**

## Active Work

All 8 domains fully processed through M2 ticket creation. Matrix pipeline is **complete** (M7).

## Ambiguous Items — Resolved

All 9 ambiguous items ruled on in rules-review-047:

| Rule ID | Domain | Verdict | Action Taken |
|---------|--------|---------|-------------|
| combat-R011 | combat | DESIGN_CHOICE | No change — threshold approach is mathematically equivalent |
| combat-R012 | combat | INCORRECT | bug-023 filed — Speed Evasion auto-selection |
| combat-R104 | combat | CORRECT | No change — post-temp-HP damage is correct |
| capture-R027 | capture | CORRECT | No change — sign convention documented |
| healing-R007 | healing | CORRECT | No change — real maxHp for 1/16th is correct |
| character-lifecycle-R042 | character-lifecycle | CORRECT | Drain persistence correct; scene refresh is separate gap |
| character-lifecycle-R020 | character-lifecycle | DESIGN_CHOICE | Store kg, convert to lbs for weight class derivation |
| scenes-R018 | scenes | INCORRECT | Covered by bug-017 (Missing Earth and Rough terrain types) |
| vtt-grid-R029 | vtt-grid | DESIGN_CHOICE | Manual GM repositioning is acceptable |

## Staleness Status

Multiple domains have had Developer fixes since last capability mapping:
- **combat:** bug-008 (temp HP), affects `combatant.service.ts`
- **pokemon-lifecycle:** bug-009 (nature adjustments), affects `pokemon-generator.service.ts`
- **character-lifecycle:** bug-010, bug-024, bug-025, affects character endpoints
- **encounter-tables:** bug-011 (weight column), affects schema + endpoints
- **capture:** bug-013 (Trapped bonus), affects `captureRate.ts` + `useCapture.ts`
- **vtt-grid:** bug-012 (terrain-aware movement), affects grid composables
- **healing:** bug-006 (injury max HP), affects `restHealing.ts` + `combatant.service.ts`

All fixes are correctness improvements (bugs → fixed). Capability mappings would show higher coverage after re-mapping, but no new incorrect items expected. Re-mapping is **optional** — recommend deferring until the P2 bug batch is complete.

## Recommended Next Steps

1. **Dev ecosystem focus:** Work through P2 MEDIUM bugs (bug-014 through bug-019, bug-023, bug-026)
2. **Re-map after P2 batch:** Once P2 bugs are resolved, re-run Capability Mapper + Coverage Analyzer for affected domains to update coverage scores
3. **Staleness is low-risk:** All changes were bug fixes that INCREASE correctness, so re-mapping will only improve scores
