## Tier 4: Core Workflow

### 20. capture-R027 — Full Capture Workflow

- **Rule:** Two-step process: 1) Throw Poke Ball (AC 6 accuracy check, d20), 2) Capture roll (1d100 - trainerLevel + modifiers vs captureRate). On success, Pokemon is captured and linked to the trainer.
- **Expected behavior:** Accuracy check → if hit, capture roll → if successful, Pokemon auto-linked to trainer (ownerId set, origin = 'captured').
- **Actual behavior:** Chain: `rollAccuracyCheck()` in `app/composables/useCapture.ts:185-192` → `attemptCapture()` in composable (lines 129-179) calls `POST /api/capture/attempt` → server calculates rate via `calculateCaptureRate()`, rolls via `attemptCapture()` utility → on success: `prisma.pokemon.update({ ownerId: body.trainerId, origin: 'captured' })` at `attempt.post.ts:97-103`.
- **Classification:** Correct (logic verified; GM-only access acknowledged)
- **Note:** The workflow is complete and correct. The accuracy check, capture roll, and auto-link chain all function as intended. The only gap is that the entire flow is GM-initiated (player view has no capture UI), but the logic itself is correct.

### 21. capture-R032 — Capture Is Standard Action

- **Rule:** "Poke Balls can be thrown as a Standard Action" (05-pokemon.md:1704)
- **Expected behavior:** Capture attempt consumes a Standard Action in encounter context.
- **Actual behavior:** `app/composables/useCapture.ts:155-168` — After a capture attempt (success or failure), if `encounterContext` is provided, calls `POST /api/encounters/:id/action` with `{ combatantId: trainerCombatantId, actionType: 'standard' }`. If the action consumption fails, a warning is set but the capture result is not rolled back.
- **Classification:** Correct (logic verified; GM-only access acknowledged)
- **Note:** The action is consumed AFTER the capture roll, which is the correct sequence (you don't consume the action until the ball is thrown). The graceful degradation (warning on failure) prevents the capture from being lost due to an action-tracking error.

---
