---
review_id: code-review-331
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-025
domain: encounter-tables
commits_reviewed:
  - 2742e4cd
  - 084a53e2
  - 3349716d
  - abc84973
  - 10806dbf
  - 3f6d1e18
  - acf5a4dd
files_reviewed:
  - app/utils/visionRules.ts
  - app/types/encounter.ts
  - app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts
  - app/stores/encounter.ts
  - app/composables/useMoveCalculation.ts
  - app/components/encounter/VisionCapabilityToggle.vue
  - app/components/encounter/CombatantCard.vue
verdict: CHANGES_REQUIRED
issues_found:
  critical: 1
  high: 2
  medium: 2
reviewed_at: 2026-03-05T00:15:00Z
follows_up: null
---

## Review Scope

P0 implementation of feature-025: per-combatant Darkvision/Blindsense tracking to auto-negate darkness penalties, per decree-048. Seven commits adding a pure utility module (`visionRules.ts`), type extension on `Combatant`, an API endpoint for toggling vision capabilities, an encounter store action, attacker-aware environment penalty logic in `useMoveCalculation`, and CombatantCard UI integration with a new `VisionCapabilityToggle` component.

Decree-048 checked: implementation correctly uses RAW flat penalties (Blindness -6, Total Blindness -10), correctly scopes negation to the canonical `dim-cave` and `dark-cave` preset IDs, and treats both Darkvision and Blindsense as fully negating all darkness accuracy penalties. This is consistent with the decree ruling and the PTU rule references cited in `visionRules.ts`.

## Issues

### CRITICAL

**CRIT-1: `updateFromWebSocket` does not propagate `visionState` on combatants**

File: `app/stores/encounter.ts`, lines 870-898

The surgical `updateFromWebSocket` method patches combatant fields individually to preserve reactivity. It handles `outOfTurnUsage`, `disengaged`, `holdAction`, `skipNextRound`, `mountState`, `wieldingWeaponId`, and `wieldedByTrainerId` -- but does NOT include `visionState`. When one GM client toggles Darkvision on a combatant, any connected Group View or other GM tab receiving the WebSocket update will not reflect the change. The combatant's vision state will be silently dropped during the surgical update.

This is a correctness bug: the Group View (and any Player View observing the encounter) will show stale vision indicators and, more critically, the accuracy penalty calculation in `useMoveCalculation` on those clients will use stale attacker vision state.

**Fix:** Add `existing.visionState = incomingCombatant.visionState` in the surgical combatant update block (around line 891, alongside the other combat-scoped fields).

### HIGH

**HIGH-1: Vision toggle endpoint does not broadcast via WebSocket**

File: `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts`

Every other encounter mutation endpoint that modifies combatant state (`damage.post.ts`, `status.post.ts`, `dismount.post.ts`, etc.) calls `broadcastToEncounter()` after persisting the change. The vision toggle endpoint does not. Without the broadcast, the Group View and Player View will not receive the updated encounter state in real-time. The GM would need to perform another action to trigger a sync.

Even once CRIT-1 is fixed, without the broadcast there is no WebSocket event to deliver the updated data.

**Fix:** Import `broadcastToEncounter` from `~/server/utils/websocket` and call it after the successful `prisma.encounter.update`, passing an `encounter_update` event with the updated encounter data.

**HIGH-2: Store action uses `alert()` for error handling**

File: `app/stores/encounter.ts`, line 1654

The `toggleVisionCapability` action uses `alert()` on failure:
```typescript
alert(`Failed to toggle vision capability: ${e?.message || e}`)
```

The codebase recently completed a refactoring (commits `be601ee1`, `7aa773ff`) to replace all `alert()` calls with the `useGmToast` composable for non-blocking notifications. This new code reintroduces the pattern that was just cleaned up. The store cannot call `useGmToast` directly (composables require a setup context), but the pattern used by other store actions is to set `this.error` and let the caller handle display, or to throw the error for the calling component to catch.

**Fix:** Replace the `alert()` call. Either set `this.error = e?.message || 'Failed to toggle vision capability'` (matching the pattern in `setSignificance`), or throw the error and handle it in the calling component via toast.

### MEDIUM

**MED-1: `source` parameter not validated in API endpoint**

File: `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts`, line 25

The `source` parameter is destructured with a default of `'manual'` but is not validated against the `VisionCapabilitySource` type (`'manual' | 'species' | 'equipment'`). A caller could pass `source: 'foo'` and it would be stored in the combatant's vision state. While only the GM client currently calls this endpoint with `'manual'`, the lack of validation could cause confusion when P1 adds `'species'` auto-detection.

**Fix:** Add a validation check:
```typescript
const validSources = ['manual', 'species', 'equipment']
if (!validSources.includes(source)) {
  throw createError({ statusCode: 400, message: `Invalid vision source: ${source}` })
}
```

**MED-2: `app-surface.md` not updated with new endpoint and component**

File: `.claude/skills/references/app-surface.md`

The implementation adds a new API endpoint (`vision.post.ts`) and a new component (`VisionCapabilityToggle.vue`), plus a new store action and a new utility module. The app surface reference document was not updated to reflect these additions. Per project conventions, new endpoints/components/routes/stores should be reflected in the surface doc.

**Fix:** Update `app-surface.md` with entries for the new vision toggle endpoint, VisionCapabilityToggle component, and visionRules utility.

## What Looks Good

1. **Clean separation of concerns.** The pure utility module (`visionRules.ts`) with types, constants, and side-effect-free functions is the exact pattern established by `captureRate.ts` and `damageCalculation.ts`. Well-structured and testable.

2. **Correct decree-048 compliance.** The `DARKNESS_PRESET_IDS` constant correctly scopes negation to only the canonical dim-cave and dark-cave presets. Custom presets with accuracy penalties are not auto-negated, which is the right behavior.

3. **Attacker-aware penalty in `useMoveCalculation`.** The `environmentAccuracyPenalty` computed correctly reads the actor's (attacker's) `visionState`, not the target's. The penalty is applied with correct sign convention (positive = harder to hit) and integrates cleanly into `getAccuracyThreshold`.

4. **VisionCapabilityToggle component is well-scoped.** Clean props/emits contract, no direct store access (delegates to parent via emit), conditional rendering via `showVisionToggles` prop, and uses Phosphor icons per project guidelines.

5. **CombatantCard integration is non-invasive.** Vision indicator shows only when capabilities are active. Toggle shows only for GM when a darkness preset is active. No existing functionality is disrupted.

6. **Type definitions are clean.** `CombatantVisionState` with `capabilities` array and `sources` record is well-designed. The optional `visionState?` on `Combatant` avoids breaking existing code that doesn't need vision awareness.

7. **Commit granularity is appropriate.** Each commit addresses a single layer (types, utility, API, store, composable, component, integration), making the changes easy to review and bisect.

## Verdict

**CHANGES_REQUIRED** -- CRIT-1 and HIGH-1 together mean vision state changes do not propagate to other connected clients via WebSocket. This is a real-time sync regression that must be fixed before merge. HIGH-2 reintroduces a pattern (`alert()`) that was just cleaned up in the same branch and should be addressed now while the developer is in the code.

## Required Changes

1. **CRIT-1:** Add `existing.visionState = incomingCombatant.visionState` to the surgical `updateFromWebSocket` combatant update block in `app/stores/encounter.ts`.
2. **HIGH-1:** Add `broadcastToEncounter()` call to `app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts` after successful persistence.
3. **HIGH-2:** Replace `alert()` with `this.error` assignment or throw pattern in `toggleVisionCapability` action (line 1654 of `app/stores/encounter.ts`).
4. **MED-1:** Add `source` validation in the vision toggle API endpoint.
5. **MED-2:** Update `app-surface.md` with the new endpoint, component, utility, and store action.
