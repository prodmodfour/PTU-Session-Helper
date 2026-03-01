---
ticket_id: ptu-rule-130
category: ptu-rule
priority: P4
severity: LOW
status: open
domain: combat
source: rules-review-225 MEDIUM-001
created_by: slave-collector (plan-20260301-143720)
created_at: 2026-03-01
---

# PTU-Rule-130: Fainted recall+release pair should not apply League switch restriction

## Summary

When a trainer uses standalone recall to recall a fainted Pokemon (Shift Action) then standalone release to release a replacement (Shift Action), the `checkRecallReleasePair()` function detects this as a "switch" and applies League restriction (`canBeCommanded = false`). However, per PTU p.229: "they cannot command the Pokemon that was Released as part of the Switch... unless... they were Recalling and replacing a Fainted Pokemon."

The pair detection hardcodes `isFaintedSwitch: false` and does not check whether any of the recalled Pokemon were fainted.

## PTU Reference

PTU Core p.229, lines 243-248: fainted switch exemption from League command restriction.

## Affected Files

- `app/server/api/encounters/[id]/release.post.ts` (line 255-269)
- `app/server/api/encounters/[id]/recall.post.ts` (line 207-218)

## Suggested Fix

In the pair detection logic (both endpoints), check whether any of the recalled entity IDs correspond to fainted Pokemon (HP <= 0 at time of recall). If so, pass `isFaintedSwitch: true` to `canSwitchedPokemonBeCommanded()`.

## Impact

Low — practical impact is minimal since fainted switches would normally use the full `switch.post.ts` endpoint. The standalone recall+release path for fainted Pokemon is an edge case.
