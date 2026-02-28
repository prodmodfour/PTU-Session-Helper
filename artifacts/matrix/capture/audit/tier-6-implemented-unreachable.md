## Tier 6: Implemented-Unreachable (Logic Correct, Accessibility Gap Flagged)

### 24. capture-R004 — Throwing Accuracy Check (AC 6)

- **Rule:** "Poke Balls can be thrown as a Standard Action, as an AC6 Status Attack Roll, with a range equal to 4 plus your Athletics Rank." (05-pokemon.md:1704-1706)
- **Expected behavior:** d20 roll, hit if roll >= 6 (with nat 1 always miss, nat 20 always hit).
- **Actual behavior:** `app/composables/useCapture.ts:185-192` — `rollAccuracyCheck()` rolls 1d20, returns `{ roll, isNat20, total }`. AC 6 threshold documented in comment at line 183. The threshold comparison is handled in the GM workflow (GM sees the roll and determines hit/miss), not enforced in the composable itself.
- **Classification:** Correct (logic correct; player view inaccessible)
- **Accessibility flag:** Only the GM can initiate this roll. Players must verbally request a capture attempt. In PTU, throwing a Poke Ball is a player Standard Action (p.214, p.227).

### 25. capture-R027 — Full Capture Workflow (Implemented-Unreachable duplicate)

- **Rule:** Same as Tier 4 item #20.
- **Classification:** Correct (logic correct; player view inaccessible)
- **Accessibility flag:** The complete accuracy → capture roll → auto-link chain works correctly but is only accessible from the GM encounter view. Players cannot initiate capture from the player view.

### 26. capture-R032 — Capture as Standard Action (Implemented-Unreachable duplicate)

- **Rule:** Same as Tier 4 item #21.
- **Classification:** Correct (logic correct; player view inaccessible)
- **Accessibility flag:** Standard Action consumption works correctly but is only triggered by the GM. Player view has no encounter action economy interface.

---
