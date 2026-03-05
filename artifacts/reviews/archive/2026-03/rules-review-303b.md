---
review_id: rules-review-303
review_type: rules
reviewer: game-logic-reviewer
trigger: design-implementation
target_report: feature-025
domain: encounter-tables
commits_reviewed:
  - 606aa351
  - baac7899
  - 18a34a03
  - de11e05a
  - 2af11b4f
  - 8d028a44
  - 886fb0d7
mechanics_verified:
  - darkvision-darkness-negation
  - blindsense-darkness-negation
  - environment-accuracy-penalty-vision-aware
  - vision-state-persistence
verdict: APPROVED
issues_found:
  critical: 0
  high: 0
  medium: 1
ptu_refs:
  - core/07-combat.md#Blindness (lines 1693-1701)
  - core/07-combat.md#Total-Blindness (lines 1702-1717)
  - core/10-indices-and-reference.md#Darkvision (lines 65-68)
  - core/10-indices-and-reference.md#Blindsense (lines 37-46)
reviewed_at: 2026-03-05T12:00:00Z
follows_up: null
---

## Mechanics Verified

### Darkvision Darkness Negation

- **Rule:** "A Pokemon with the Darkvision Capability never has their vision hampered by a loss of light. They can even see in total darkness and are never Blind or affected by Total Blindness due to low-light conditions." (`core/10-indices-and-reference.md` lines 65-68)
- **Implementation:** `getEffectiveEnvironmentPenalty()` in `app/utils/visionRules.ts` checks `attackerVisionState?.capabilities?.length` -- any vision capability (including Darkvision) negates the accuracy penalty for any darkness-based preset (`dim-cave` or `dark-cave`). This means Darkvision negates both Blindness (-6) and Total Blindness (-10) penalties.
- **Status:** CORRECT. Per RAW, Darkvision explicitly negates both Blindness and Total Blindness from low-light conditions. The implementation correctly treats Darkvision as a full negation of all darkness-based accuracy penalties.

### Blindsense Darkness Negation

- **Rule:** "Pokemon and Trainers with Blindsense can function even in complete darkness, as if they had Darkvision, and they can never be Blinded." (`core/10-indices-and-reference.md` lines 37-46). Separately, for Total Blindness: "Pokemon or Trainers with Blindsense cannot be Totally Blinded." (`core/07-combat.md` lines 1716-1717)
- **Implementation:** Same `getEffectiveEnvironmentPenalty()` path -- Blindsense is in the capabilities array, so any darkness penalty is negated. Both Blindness (-6) and Total Blindness (-10) are skipped.
- **Status:** CORRECT. Per RAW, Blindsense negates both Blindness (cannot be Blinded) and Total Blindness (cannot be Totally Blinded). The implementation correctly treats Blindsense identically to Darkvision for darkness penalty negation purposes.

### Environment Accuracy Penalty (Vision-Aware)

- **Rule:** Per decree-048, Dim Cave applies Blindness (-6 flat accuracy penalty) and Dark Cave applies Total Blindness (-10 flat accuracy penalty). Per-combatant Darkvision/Blindsense tracking should auto-negate these penalties for combatants with those capabilities.
- **Implementation:** `useMoveCalculation.ts` computes `environmentAccuracyPenalty` using `getEffectiveEnvironmentPenalty(preset, actor.value.visionState)`. The penalty is attacker-aware -- it checks the attacking combatant's vision state, not the target's. The penalty is added into the accuracy threshold formula at line 508: `move.ac + evasion - accuracyStage - flanking + roughPenalty - noGuardBonus + environmentPenalty`. The sign convention is correct: a positive penalty value increases the threshold, making it harder to hit.
- **Status:** CORRECT. The penalty correctly applies to the attacker (the one rolling accuracy), per decree-048. The formula integration is consistent with existing penalty/bonus conventions in the threshold calculation.

### Vision State Persistence

- **Rule:** Per feature-025 spec, vision state is combat-scoped (stored in the combatants JSON blob on the encounter record, not persisted to entity DB records).
- **Implementation:** The `visionState` field is declared as an optional property on the `Combatant` interface (`app/types/encounter.ts` line 115). The API endpoint (`vision.post.ts`) reads the combatants JSON from the encounter record, modifies the target combatant's `visionState`, and writes it back. It correctly initializes `visionState` when absent (line 59-61), cleans up by deleting the entire `visionState` object when capabilities are empty (lines 78-79), and validates the capability value against the allowed set (line 28).
- **Status:** CORRECT. Vision state is correctly scoped to the encounter's combatant blob, not the entity record. The cleanup logic prevents stale empty objects.

## Summary

The P0 implementation of per-combatant Darkvision/Blindsense tracking is rules-correct. All four verified mechanics match PTU 1.05 RAW and decree-048.

Key findings:

1. **Both Darkvision and Blindsense fully negate both Blindness and Total Blindness** from darkness. The code correctly implements this by checking for the presence of ANY vision capability against ANY darkness-based preset, rather than mapping specific capabilities to specific preset tiers. This matches RAW: Darkvision explicitly says "never Blind or affected by Total Blindness due to low-light conditions" and Blindsense says "as if they had Darkvision, and they can never be Blinded" plus the separate Total Blindness rule "Blindsense cannot be Totally Blinded."

2. **Penalty is attacker-aware.** The accuracy penalty reduction is calculated from the attacker's vision state, which is correct -- it is the attacker who is Blinded (unable to see targets) and thus penalized on accuracy rolls. Targets' vision state does not affect the attacker's accuracy.

3. **Accuracy threshold formula integration is correct.** The environment penalty is added as a positive value to the threshold (higher threshold = harder to hit), consistent with the existing convention for rough terrain penalty (+2) and opposite to the bonus convention for No Guard (-3) and flanking (-2 evasion).

4. **Preset ID matching is correctly constrained.** Only the canonical `dim-cave` and `dark-cave` presets are recognized as darkness-based. Custom presets with accuracy penalties are not auto-negated, which is the correct conservative behavior -- a custom preset's penalty could represent non-darkness effects (e.g., fog, smoke) that vision capabilities would not negate.

## Rulings

**RULING-1: Both vision capabilities negate both darkness tiers.** Per RAW, Darkvision and Blindsense are functionally equivalent for darkness penalty negation. The code's approach of checking `capabilities.length > 0` (any capability negates any darkness penalty) is correct. This could be confusing to GMs who expect Darkvision to only negate Blindness and Blindsense to only negate Total Blindness, but RAW is clear that both negate both.

## Issues

### MED-1: Preset description text implies tier-specific negation

**Severity:** MEDIUM (documentation/UX, not a game logic error)

**Location:** `app/constants/environmentPresets.ts` lines 27 and 55

**Description:** The Dim Cave preset description says "Negated by Darkvision" and the Dark Cave preset description says "Negated by Blindsense." While these statements are true, they are misleadingly narrow. Per RAW, Darkvision also negates Total Blindness (Dark Cave) and Blindsense also negates Blindness (Dim Cave). A GM reading only the preset description might incorrectly believe Darkvision is insufficient for Dark Cave.

**Suggested fix:** Update descriptions to mention both capabilities. For example:
- Dim Cave: "Negated by Darkvision or Blindsense"
- Dark Cave: "Negated by Darkvision or Blindsense"

**Game impact:** Low. The code correctly negates penalties regardless of which capability is active. This is a cosmetic text issue that could cause GM confusion but does not produce incorrect game values.

## Verdict

**APPROVED.** The implementation correctly applies PTU 1.05 Darkvision and Blindsense rules per decree-048. All accuracy penalty values, negation logic, and attacker-aware penalty application match RAW. One medium-severity documentation issue (MED-1) is noted but does not affect game logic correctness.

## Required Changes

None required for game logic approval. MED-1 (preset description text) is recommended but not blocking.
