---
name: verify-ptu-mechanics
enabled: false
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

**Run `/verify-ptu`** (or `/verify-game-logic`) to do a full verification using the Game Logic Reviewer skill (`game-logic-reviewer.md`).

Key references:
- Rulebook lookup: `.claude/skills/references/ptu-chapter-index.md`
- Core rules: `books/markdown/core/` (12 chapter files, e.g. `07-combat.md`)
- Errata: `books/markdown/errata-2.md`

This app must accurately replicate PTU 1.05 mechanics.
