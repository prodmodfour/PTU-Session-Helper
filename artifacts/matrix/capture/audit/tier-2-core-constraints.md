## Tier 2: Core Constraints

### 14. capture-R017 — Fainted Cannot Be Captured

- **Rule:** "Pokemon reduced to 0 Hit Points or less cannot be captured. Poke Balls will simply fail to attempt to energize them." (05-pokemon.md:1725-1726)
- **Expected behavior:** `canBeCaptured = false` when currentHp <= 0.
- **Actual behavior:** `app/utils/captureRate.ts:67` — `canBeCaptured = currentHp > 0`. `app/server/api/capture/attempt.post.ts:72-82` — checks `rateResult.canBeCaptured` before proceeding; returns failure with reason if false.
- **Classification:** Correct

### 15. capture-R019 — Fainted Pokemon Capture Failsafe

- **Rule:** Redundant PTU emphasis that fainted Pokemon cannot be captured. Same constraint as R017.
- **Expected behavior:** Same as R017 — redundant rule, same check.
- **Actual behavior:** Same `canBeCaptured` check at `attempt.post.ts:72`.
- **Classification:** Correct

### 16. capture-R018 — Owned Pokemon Cannot Be Captured

- **Rule:** PTU: You can only capture wild Pokemon. Owned Pokemon (those with a trainer) cannot be captured by another trainer's Poke Ball. (Implicit in PTU capture rules — Poke Balls target "wild Pokemon" specifically, p.214)
- **Expected behavior:** The attempt endpoint should reject capture attempts on Pokemon that already have a non-null `ownerId`.
- **Actual behavior:** `app/server/api/capture/attempt.post.ts:24-33` — Fetches the Pokemon record but does NOT check `pokemon.ownerId`. The only validation is: Pokemon exists (404 check), and `canBeCaptured` (HP > 0 check at line 72). An already-owned Pokemon with HP > 0 will proceed through the capture roll and could be "captured" again — overwriting its `ownerId` to the new trainer (line 100).
- **Classification:** Incorrect
- **Severity:** HIGH
- **Issue:** No ownership validation on the capture attempt endpoint. An already-owned Pokemon can be captured by another trainer, which overwrites the existing `ownerId`. PTU capture rules explicitly target "wild Pokemon" — Poke Balls should not work on owned Pokemon.
- **Fix location:** `app/server/api/capture/attempt.post.ts` — After fetching the Pokemon (line 33), add: `if (pokemon.ownerId) { return { success: false, data: { captured: false, reason: 'Cannot capture an owned Pokemon' } } }`

---
