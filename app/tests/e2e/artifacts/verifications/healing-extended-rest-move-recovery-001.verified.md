---
scenario_id: healing-extended-rest-move-recovery-001
verified_at: 2026-02-18T12:00:00Z
status: PASS
assertions_checked: 3
assertions_correct: 3
---

## Assertion Verification

1. **restoredMoves list**: Sleep Powder and Solar Beam both had usedToday > 0 → both included in restoredMoves. PASS
2. **usedToday reset**: All 4 moves (Tackle, Leech Seed, Sleep Powder, Solar Beam) have usedToday = 0 after extended rest. PASS
3. **usedThisScene selective reset**: Daily moves (Sleep Powder, Solar Beam) → usedThisScene = 0. Non-daily moves (Tackle at-will, Leech Seed EOT) → usedThisScene unchanged. PASS

## Data Validity

- [x] Move frequencies: Tackle (at-will), Leech Seed (EOT), Sleep Powder (Daily x2), Solar Beam (Daily x1)
- [x] Extended rest resets usedToday for ALL moves, usedThisScene only for Daily-frequency moves

## Completeness Check

- [x] Daily move recovery (usedToday + usedThisScene reset)
- [x] Non-daily move partial recovery (usedToday only)
- [x] restoredMoves list accuracy

## Errata Check

- No errata affects move recovery mechanics

## Issues Found

(none)
