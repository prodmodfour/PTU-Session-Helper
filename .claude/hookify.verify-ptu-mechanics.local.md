---
name: verify-ptu-mechanics
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: (useCombat|useCapture|useRestHealing|useMoveCalculation|useEntityStats|combatant\.service|encounter\.service|combatManeuvers|damage\.post|heal\.post|capture/)
---

## PTU Mechanics Change Detected

You just edited a file containing **PTU game mechanics**.

**IMPORTANT**: Verify this change follows PTU 1.05 rules.

**Quick check:**
1. Does this change affect damage, healing, capture, stats, or combat?
2. If yes, cross-reference with the rulebooks in `/books/markdown/`

**Run `/verify-ptu`** to do a full verification, or manually check:
- Core rules: `books/markdown/Pokemon Tabletop United 1.05 Core.md`
- Errata: `books/markdown/errata_2.md`

This app must accurately replicate PTU 1.05 mechanics.
