---
review_id: code-review-339
review_type: code
reviewer: senior-reviewer
trigger: design-implementation
target_report: feature-025
domain: encounter-tables
commits_reviewed:
  - e003b034
  - 96744537
  - 29ef767e
  - c96ebb8f
  - 2282b37c
files_reviewed:
  - app/stores/encounter.ts
  - app/server/api/encounters/[id]/combatants/[combatantId]/vision.post.ts
  - .claude/skills/references/app-surface.md
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
reviewed_at: 2026-03-05T09:30:00Z
follows_up: code-review-331
---

## Review Scope

Re-review of 5 fix commits addressing all issues raised in code-review-331 for feature-025 (per-combatant Darkvision/Blindsense tracking). The original review found 1 CRITICAL, 2 HIGH, and 2 MEDIUM issues. This review verifies each fix is correct and complete.

Decree-048 compliance re-confirmed: the implementation uses RAW flat penalties, scopes negation to canonical `dim-cave`/`dark-cave` preset IDs, and treats both Darkvision and Blindsense as fully negating darkness accuracy penalties.

## Issue Resolution Verification

### CRIT-1: `updateFromWebSocket` does not propagate `visionState` (RESOLVED)

Commit `e003b034` adds `existing.visionState = incomingCombatant.visionState` at line 491 of `app/stores/encounter.ts`, placed correctly within the surgical combatant update block alongside `mountState`, `wieldingWeaponId`, `wieldedByTrainerId`, and the other combat-scoped fields. The assignment is a direct reference copy, which is the same pattern used for all other fields in that block. Verified that `visionState` is typed as optional on `Combatant` (line 115 of `app/types/encounter.ts`), so `undefined` propagation when no vision state exists is safe.

### HIGH-1: Vision toggle endpoint does not broadcast via WebSocket (RESOLVED)

Commit `96744537` adds `import { notifyEncounterUpdate }` and calls `notifyEncounterUpdate(encounterId, response)` at line 102 of the vision endpoint. This uses the `notifyEncounterUpdate` helper from `~/server/utils/websocket`, which broadcasts a `type: 'encounter_update'` event — the same event type used by `dismount.post.ts`, `mount.post.ts`, `disengage.post.ts`, and `living-weapon/*.post.ts`. The call is placed after `buildEncounterResponse` and before the return statement, which is the correct position (matches the pattern in the other endpoints). Combined with the CRIT-1 fix, the full round-trip is now complete: GM toggles vision -> API persists -> WebSocket broadcasts -> `updateFromWebSocket` patches `visionState` on connected clients.

### HIGH-2: Store action uses composable for error handling (RESOLVED)

Commit `29ef767e` replaces `useGmToast().showToast(...)` with `this.error = e?.message || 'Failed to toggle vision capability'` followed by `throw e`. This matches the pattern used by every other action in the encounter store (verified: `setWeather`, `addWildPokemon`, `updateEnvironmentPreset`, `setSignificance`, etc. all use `this.error` + `throw e`). The composable-in-store anti-pattern is eliminated. Note: the original code-review-331 described this as `alert()` but the actual code was `useGmToast()` — either way, the fix correctly moves to the `this.error` pattern.

### MED-1: `source` parameter not validated (RESOLVED)

Commit `c96ebb8f` adds validation of the `source` parameter against `['manual', 'species', 'equipment']` at lines 37-43 of the vision endpoint. The array matches the `VisionCapabilitySource` type definition in `visionRules.ts` (line 48: `'manual' | 'species' | 'equipment'`). Invalid sources now receive a 400 error with a descriptive message. The validation is placed after the existing `capability` validation and before the try block, which is the correct location.

### MED-2: `app-surface.md` not updated (RESOLVED)

Commit `2282b37c` adds three lines to `app-surface.md`: the endpoint entry for `POST /api/encounters/:id/combatants/:combatantId/vision`, and a comprehensive "Vision capability system" paragraph documenting `visionRules.ts` (types, constants, functions), `VisionCapabilityToggle.vue`, `CombatantCard.vue` integration, the `toggleVisionCapability` store action, and the `visionState` WebSocket sync. The entries are thorough and match the actual implementation.

## What Looks Good

1. **Each fix is surgically scoped.** One commit per issue, one file per commit (except the endpoint which needed both broadcast and validation). No unrelated changes mixed in.

2. **Pattern conformance is exact.** The `this.error` + `throw e` pattern, the `notifyEncounterUpdate` broadcast call, and the validation guard all follow established conventions proven by other encounter subsystems.

3. **Full WebSocket round-trip is now complete.** The combination of CRIT-1 + HIGH-1 fixes ensures that vision state changes propagate end-to-end: GM toggle -> API persist -> WS broadcast -> client surgical update. This was the core deficiency in the original implementation.

4. **Source validation is forward-compatible.** The `validSources` array matches the current `VisionCapabilitySource` type. When P1 adds auto-detection via `'species'` source, the validation will already accept it without changes.

## Verdict

**APPROVED** -- All 5 issues from code-review-331 are resolved correctly. No new issues introduced. The implementation is now complete for P0 scope with proper real-time sync, consistent error handling, input validation, and surface documentation.
