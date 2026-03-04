---
review_id: rules-review-308
review_type: rules
reviewer: game-logic-reviewer
trigger: refactoring
target_report: refactoring-097
domain: combat
commits_reviewed:
  - 531a6969
  - f246663d
  - be601ee1
  - 1c984251
  - 7aa773ff
  - 1e07ff90
mechanics_verified:
  - heavily-injured-penalty
  - death-and-faint
  - league-death-suppression
  - dismount-check
  - type-immunity-status-block
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 0
ptu_refs:
  - core/07-combat.md#Heavily Injured
  - core/07-combat.md#Hit Points
  - core/05-pokemon.md#Mounts
reviewed_at: 2026-03-04T22:00:00Z
follows_up: null
---

## Mechanics Verified

### Heavily Injured Penalty
- **Rule:** "Whenever a Heavily Injured Trainer or Pokemon takes a Standard Action during combat, or takes Damage from an attack, they lose Hit Points equal to the number of Injuries they currently have." (`core/07-combat.md#Heavily Injured`)
- **Implementation:** Three call sites produce heavily injured notifications: (1) `handleDamage` in `useEncounterActions.ts:53-55` fires when `result.heavilyInjured && result.heavilyInjuredHpLoss > 0`, (2) `handleExecuteMove` at line 170-171 fires per target with the same condition, (3) `nextTurn` in `gm/index.vue:540-541` fires when `penalty.hpLost > 0` for Standard Action triggers. All three paths report the actual HP lost and use `warning` severity.
- **Status:** CORRECT — The notification messages accurately describe the mechanic. The three trigger points (damage-caused, move-caused, standard-action-caused) cover all scenarios where heavily injured penalty applies per PTU rules. The refactoring preserves identical trigger conditions; only the notification mechanism changed from `alert()` to `showToast()`.

### Death and Faint
- **Rule:** "If a Trainer has 0 Hit Points or less, they are unable to carry out any actions and are unconscious." (`core/07-combat.md#Hit Points`). Death occurs at 0 HP or 10+ injuries.
- **Implementation:** Death notifications fire in three locations: (1) `handleDamage` at line 56-60, (2) `handleExecuteMove` at line 173-177, (3) `nextTurn` at line 543-548. All three correctly distinguish between injury-based death ("10+ injuries") and HP-based death ("HP below death threshold"). All use `critical` severity with 12-second auto-dismiss, appropriate for the highest-urgency combat event.
- **Status:** CORRECT — Death cause attribution matches the two PTU death pathways. The `critical` severity mapping ensures the GM cannot miss a death event.

### League Death Suppression
- **Rule:** Per decree-021, League Battles implement a two-phase trainer system. Death suppression in League mode is an established mechanic in the codebase.
- **Implementation:** League suppression notifications fire at `handleDamage` line 62-63 and `handleExecuteMove` line 178-179. Both use `info` severity (cyan, 5s) with the message "would have died from HP loss, but death is suppressed in League Battle mode."
- **Status:** CORRECT — `info` severity is appropriate for an informational notice (no action required from the GM). The message clearly communicates that the mechanic fired but was suppressed.

### Dismount Check
- **Rule:** "If either you or your Pokemon who is being used as a Mount are hit by a damaging attack that deals damage equal or greater to 1/4th of the target's Max Hit Points, or are hit by a move with a Push Effect, you must make an Acrobatics or Athletics Check" (`core/05-pokemon.md#Mounts`, p.218)
- **Implementation:** `handleDamage` line 66-77 fires when `result.dismountCheck?.triggered` is true. The message includes the DC value and Mounted Prowess bonus. Uses `warning` severity (amber, 8s).
- **Status:** CORRECT — The notification accurately reflects PTU p.218 dismount check rules. The 1/4 max HP threshold is evaluated server-side; this is purely the notification layer. The `warning` severity is appropriate as it requires GM action (prompting the rider's skill check).

### Type Immunity Status Block (decree-012)
- **Rule:** Per decree-012, "enforce type-based status immunities server-side with a GM override flag." The server rejects immune status applications with HTTP 409, and the client must inform the GM.
- **Implementation:** `handleStatus` catch block at line 122-128 checks for `statusCode === 409`, displays the server's rejection message, and reminds the GM about the "Force Apply (GM Override)" option. Uses `warning` severity.
- **Status:** CORRECT — Faithfully implements decree-012's client-side notification requirement. The toast message directs the GM to the override mechanism. The generic error fallback at line 129 uses `error` severity for unexpected failures, which is appropriate.

## Summary

This refactoring replaces 11 blocking `alert()` calls across two files (`useEncounterActions.ts`: 9 replacements, `gm/index.vue`: 2 replacements) with non-blocking `showToast()` calls from the new `useGmToast` singleton composable. The replacement is purely a notification transport change — no game logic, trigger conditions, or message content was altered beyond formatting (newlines replaced with spaces for single-line toast display).

**Severity mapping review:**

| Event | Severity | Duration | Assessment |
|-------|----------|----------|------------|
| Heavily injured penalty | warning | 8s | Correct — requires awareness, not urgent action |
| Death/kill | critical | 12s | Correct — highest urgency, longest visibility |
| League death suppressed | info | 5s | Correct — informational only |
| Dismount check | warning | 8s | Correct — requires GM to prompt a skill check |
| Status blocked (decree-012) | warning | 8s | Correct — actionable but not an error |
| Status update failure | error | 8s | Correct — unexpected failure |

**Singleton pattern:** Module-level `toasts` ref, `nextId` counter, and `timers` Map at file scope ensure all consumers share state. The `readonly(toasts)` return prevents external mutation. Timer cleanup in `dismissToast` and `dismissAll` prevents memory leaks.

**Component lifecycle:** `GmToastContainer` is mounted once in `gm/index.vue` at the top of the template, outside conditional blocks, ensuring it persists across encounter state changes. The `aria-live="polite"` and `role="alert"` attributes provide accessibility.

**Complete replacement verification:** Zero `alert()` calls remain in `useEncounterActions.ts` or `gm/index.vue`. Remaining `alert()` calls in other GM pages (sheets, pokemon, scenes) are explicitly out of scope per the ticket, with refactoring-131 tracking their replacement.

**SCSS BEM conventions:** The stylesheet follows BEM naming (`gm-toast`, `gm-toast__icon`, `gm-toast__message`, `gm-toast__dismiss`, `gm-toast--warning`, etc.) and uses project SCSS variables throughout.

**Decree compliance:**
- decree-012: Status immunity rejection toast correctly implemented with override guidance.
- decree-021: League death suppression notification correctly uses `info` severity.
- decree-033, decree-047: Not directly involved in this refactoring (no switching or faint-clearing logic changed).

## Rulings

No new PTU ambiguities discovered. No decree violations found. No pre-existing game logic issues surfaced by this refactoring.

## Verdict

**APPROVED** — All 11 alert-to-toast replacements preserve correct game logic. Severity mappings are well-chosen and align with PTU mechanic urgency levels. The singleton composable pattern is sound, timer cleanup prevents leaks, and the component is correctly positioned in the GM page lifecycle. No game rules were altered by this refactoring.

## Required Changes

None.
