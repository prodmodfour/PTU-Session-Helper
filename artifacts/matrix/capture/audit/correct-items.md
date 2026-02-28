# Verified Correct Items: capture

| # | Rule ID | Name | Tier | Notes |
|---|---------|------|------|-------|
| 1 | capture-R001 | Capture Rate Base Formula (100 - level*2) | Tier 1: Core Formulas | |
| 2 | capture-R005 | Capture Roll Mechanic (1d100, per decree-013) | Tier 1: Core Formulas | Sign convention correct |
| 3 | capture-R006 | HP Modifier — Above 75% (-30) | Tier 1: Core Formulas | decree-015: real max HP |
| 4 | capture-R007 | HP Modifier — 51-75% (-15) | Tier 1: Core Formulas | |
| 5 | capture-R008 | HP Modifier — 26-50% (0) | Tier 1: Core Formulas | |
| 6 | capture-R009 | HP Modifier — 1-25% (+15) | Tier 1: Core Formulas | |
| 7 | capture-R010 | HP Modifier — Exactly 1 HP (+30) | Tier 1: Core Formulas | |
| 8 | capture-R011 | Evolution Stage — 2 Remaining (+10) | Tier 1: Core Formulas | |
| 9 | capture-R012 | Evolution Stage — 1 Remaining (0) | Tier 1: Core Formulas | |
| 10 | capture-R013 | Evolution Stage — 0 Remaining (-10) | Tier 1: Core Formulas | |
| 11 | capture-R014 | Persistent Status (+10 each, Poison dedup) | Tier 1: Core Formulas | |
| 12 | capture-R015 | Volatile/Injury/Stuck/Slow Modifiers | Tier 1: Core Formulas | per decree-014 |
| 13 | capture-R016 | Rarity Modifier (Shiny -10, Legendary -30) | Tier 1: Core Formulas | legendarySpecies.ts lookup |
| 14 | capture-R017 | Fainted Cannot Be Captured | Tier 2: Core Constraints | |
| 15 | capture-R019 | Fainted Capture Failsafe (redundant with R017) | Tier 2: Core Constraints | |
| 16 | capture-R028 | Natural 20 Accuracy Bonus (+10 to rate) | Tier 3: Edge Cases | |
| 17 | capture-R029 | Natural 100 Auto-Capture (raw roll) | Tier 3: Edge Cases | |
| 18 | capture-R027 | Full Capture Workflow | Tier 4: Workflow | GM-only |
| 19 | capture-R032 | Capture as Standard Action | Tier 4: Workflow | GM-only |
| 20 | capture-R002 | Persistent Condition Enumeration | Tier 5: Data Model | |
| 21 | capture-R003 | Volatile Condition Enumeration | Tier 5: Data Model | |
| 22 | capture-R004 | Accuracy Check (AC 6, d20) | Tier 6: Impl-Unreachable | GM-only |

**Total correct: 22 of 26 audited items**
