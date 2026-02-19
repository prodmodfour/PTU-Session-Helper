---
scenario_id: healing-workflow-global-new-day-reset-001
verified_at: 2026-02-20T00:10:00Z
status: PASS
assertions_checked: 6
assertions_correct: 6
---

## Assertion Verification

### Assertion 1: Global reset succeeds
- **Scenario says:** response.success = true; pokemonReset >= 1; charactersReset >= 1; timestamp is valid ISO
- **Independent derivation:** POST /api/game/new-day calls prisma.pokemon.updateMany() and prisma.humanCharacter.updateMany() with no filter. Returns counts and server timestamp.
- **Status:** CORRECT
- **Implementation check:** Confirmed in `server/api/game/new-day.post.ts`. Both updateMany calls return count of affected rows.

### Assertion 2: Character daily counters reset
- **Scenario says:** restMinutesToday = 0; injuriesHealedToday = 0; drainedAp = 0
- **Independent derivation:** New-day resets: restMinutesToday -> 0, injuriesHealedToday -> 0, drainedAp -> 0 (characters), lastRestReset -> now.
- **Status:** CORRECT
- **Implementation check:** Confirmed in global new-day endpoint — character updateMany sets all three counters to 0.

### Assertion 3: Character non-daily state preserved
- **Scenario says:** currentHp = 25; injuries = 2; statusConditions includes "Burned"; lastInjuryTime is not null
- **Independent derivation:** New-day does NOT touch: currentHp, injuries, statusConditions, lastInjuryTime. These fields are absent from the updateMany data payload.
- **Status:** CORRECT
- **Implementation check:** Confirmed — updateMany only sets restMinutesToday, injuriesHealedToday, drainedAp, lastRestReset. No other fields modified.

### Assertion 4: Pokemon daily counters reset
- **Scenario says:** restMinutesToday = 0; injuriesHealedToday = 0
- **Independent derivation:** Pokemon updateMany resets: restMinutesToday -> 0, injuriesHealedToday -> 0, lastRestReset -> now. Pokemon has no drainedAp field.
- **Status:** CORRECT

### Assertion 5: Pokemon non-daily state preserved
- **Scenario says:** currentHp = 20; injuries = 1; lastInjuryTime is not null
- **Independent derivation:** Same logic as Assertion 3 — new-day only touches daily counters. HP, injuries, lastInjuryTime untouched.
- **Status:** CORRECT

### Assertion 6: Rest now available after daily reset
- **Scenario says:** restMinutesToday was 480 (blocked) -> now 0 (available); healPerRest = max(1, floor(32/16)) = 2; hpHealed = 2
- **Independent derivation:** After new-day reset, restMinutesToday = 0 (< 480 cap). calculateRestHealing: floor(32/16) = floor(2) = 2; max(1, 2) = 2. Pokemon currentHp = 20, maxHp = 32, so heal is not capped. hpHealed = 2.
- **Status:** CORRECT
- **Implementation check:** Rest endpoint checks restMinutesToday < 480 before allowing rest. After reset, 0 < 480 passes.

## Data Validity
- [x] Character uses `characterType: "player"` (correction-006 fix applied)
- [x] Character uses `hp: 4` (correction-006 fix applied)
- [x] Character has explicit `maxHp: 32` and `currentHp: 32` (correction-006 fix applied)
- [x] Character maxHp formula: (5 x 2) + (4 x 3) + 10 = 32 matches explicit value
- [x] Pikachu base HP: 4 matches gen1/pikachu.md
- [x] Pokemon maxHp formula: 10 + (4 x 3) + 10 = 32 matches scenario comment

## Completeness Check
- [x] All steps from loop healing-workflow-global-new-day-reset (W5) covered
- [x] Global endpoint tested (Phase 1)
- [x] Character counter reset verified (Phase 2)
- [x] Character non-daily state preservation verified (Phase 2)
- [x] Pokemon counter reset verified (Phase 3)
- [x] Pokemon non-daily state preservation verified (Phase 3)
- [x] Post-reset functional test (Phase 4 — rest now works after reset)

## Errata Check
- No errata in errata-2.md affects the new-day reset mechanic

## Issues Found
<!-- None -->
