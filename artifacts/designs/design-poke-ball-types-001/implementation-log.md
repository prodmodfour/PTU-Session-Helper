# Implementation Log: design-poke-ball-types-001

## P0: Poke Ball Catalog and Base Modifier Integration

**Status:** Implemented
**Date:** 2026-03-02
**Branch:** slave/2-dev-feature-017-p0-20260302

### Commits

| Commit | Section | Files Changed | Description |
|--------|---------|---------------|-------------|
| `3ae59073` | A | app/constants/pokeBalls.ts (new) | Poke Ball catalog with all 25 PTU ball types, types, helper functions |
| `9de31f89` | B | app/utils/captureRate.ts | Added ballModifier parameter to attemptCapture() |
| `bb0acb53` | C | app/server/api/capture/rate.post.ts, attempt.post.ts | ballType param, validation, ball breakdown in response |
| `2efb67d8` | D | app/composables/useCapture.ts | ballType support on all functions, getAvailableBalls(), updated interfaces |

### Section Details

**A. Poke Ball Catalog Constants** — `app/constants/pokeBalls.ts`
- Defined `PokeBallCategory`, `BallConditionContext`, `PokeBallDef` types
- Created `POKE_BALL_CATALOG` with all 25 ball entries (base modifiers, categories, costs, descriptions)
- Helper functions: `getBallsByCategory()`, `getBallDef()`, `calculateBallModifier()`, `getAvailableBallNames()`
- `DEFAULT_BALL_TYPE = 'Basic Ball'`
- P0 returns base modifier only; condition functions are undefined (P1)

**B. Base Modifier Integration** — `app/utils/captureRate.ts`
- Added optional `ballModifier` parameter (default 0) to `attemptCapture()`
- Roll calculation: `modifiedRoll = roll - trainerLevel + modifiers + ballModifier`
- Return type now includes `ballModifier` for breakdown visibility
- Fully backward compatible

**C. Ball Type Parameter in Capture API**
- `rate.post.ts`: Added optional `ballType` field, validates against catalog, returns `ballType`, `ballModifier`, `ballBreakdown`
- `attempt.post.ts`: Added optional `ballType` field, computes ball modifier, passes to `attemptCapture()`, returns ball breakdown
- Unknown ball types return HTTP 400

**D. Updated useCapture Composable**
- `getCaptureRate()` gains `ballType` parameter
- `calculateCaptureRateLocal()` gains `ballType` in params, returns ball breakdown
- `attemptCapture()` gains `ballType` in params, sends to API
- New `getAvailableBalls()` returns `PokeBallDef[]` for UI (P2)
- New `BallBreakdown` interface, updated `CaptureRateData` and `CaptureAttemptResult`

### Backward Compatibility

All changes are backward compatible. New parameters default to 'Basic Ball' (+0 modifier). Existing callers (CombatantCard.vue, tests) continue to work without modification.

### Deferred to P1

- Conditional ball logic (condition functions on ball definitions)
- Round-dependent balls (Timer Ball, Quick Ball)
- Stat-comparison balls (Level Ball, Heavy Ball, Fast Ball)
- Context-dependent balls (Love, Net, Dusk, Moon, Lure, Repeat, Nest, Dive)

### Deferred to P2

- Ball type selection UI
- Post-capture effects (Heal Ball, Friend Ball, Luxury Ball)
- Capture result display with ball-specific messaging
