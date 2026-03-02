---
decree_id: decree-042
status: active
domain: capture
topic: pokeball-accuracy-modifiers
title: "Apply full accuracy system to Poke Ball throws"
ruled_at: 2026-03-02T22:00:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-041
implementation_tickets: [ptu-rule-131]
tags: [capture, accuracy, evasion, pokeball, attack-roll, combat-stages]
---

# decree-042: Apply full accuracy system to Poke Ball throws

## The Ambiguity

PTU describes Poke Ball throws as an "AC6 Status Attack Roll" (ch5 p.214, ch9 p.271). Ch9 says "Resolve the attack like you would any other." Ch7's general accuracy system (p.236) says accuracy rolls are "modified by the user's Accuracy and by certain Moves and other effects." However, ch7's evasion rules (p.234) say "Evasion helps Pokemon avoid being hit by **moves**" — and Poke Ball throws are item usage, not Moves.

The question: should Poke Ball accuracy checks apply the full accuracy system (thrower's accuracy stages, target's Speed Evasion, flanking, rough terrain) or be a flat d20 >= 6 check?

Source: decree-need-041, surfaced by code-review-281 M2 and rules-review-257 during bug-043 AC 6 enforcement fix.

## Options Considered

### Option A: Flat AC 6 check
No modifiers ever. Evasion text says "moves" and Poke Balls aren't moves. Simple to adjudicate. The Snag Machine -2 would be a specific item exception, not proof of general modifier application. This matches community convention and the current implementation.

### Option B: Full accuracy system
Apply all modifiers: thrower's accuracy stages, target's Speed Evasion, flanking penalties, rough terrain penalties. "Resolve the attack like you would any other" (ch9) means the FULL accuracy system. The Snag Machine's -2 penalty to "Poke Ball attack rolls" confirms that Poke Ball throws are attack rolls subject to modification. Consistent with how every other attack roll in the system works.

### Option C: Partial — accuracy stages yes, evasion no
Accuracy modifiers on the thrower apply (general accuracy system covers all "attacks"), but evasion does NOT (evasion text explicitly says "moves"). Splits the difference based on what each rule actually says.

### Option D: Only specific effects
Only effects that explicitly mention "Poke Ball attack rolls" or "capture attempts" apply. General accuracy/evasion don't apply because Poke Balls are items, not moves.

## Ruling

**The true master decrees: Poke Ball throws use the full accuracy system, including thrower accuracy stages, target Speed Evasion, flanking, and rough terrain modifiers.**

Rationale:
- Ch9 p.271 explicitly says "Resolve the attack like you would any other." This is an unambiguous instruction to apply the standard accuracy system.
- PTU calls Poke Ball throws a "Status Attack Roll" — the word "Attack Roll" invokes the general accuracy system defined in ch7 p.236.
- The Snag Machine entry (ch9 p.1810) applies a "-2 penalty on all Poke Ball attack rolls," confirming that PTU's rules engine treats Poke Ball throws as modifiable attack rolls.
- While evasion text says "moves," the broader accuracy system text (p.236) says "whenever you attempt to make an attack" — Poke Ball throws ARE attacks. The evasion text's use of "moves" is a drafting shorthand, not a deliberate exclusion of item-based attacks.
- Speed Evasion applies because it "may be applied to any Move with an accuracy check" (p.642) — and since the ruling treats Poke Ball throws as equivalent to attacks for accuracy purposes, Speed Evasion is the appropriate evasion type (Poke Balls don't target Defense or Special Defense stats).

## Precedent

Poke Ball throws are "Status Attack Rolls" and follow the full accuracy system. Any effect described as an "attack roll" or "accuracy check" in PTU uses the general accuracy framework from ch7 p.236, including accuracy stages, evasion, flanking, and terrain modifiers — regardless of whether the source is a Move or an item. Evasion text saying "moves" is treated as shorthand for "attacks with accuracy checks," not a deliberate exclusion of item-based attacks.

## Implementation Impact

- Tickets created: ptu-rule-131 (already exists, now unblocked) — refactor `rollAccuracyCheck()` to use `calculateAccuracyThreshold(6, trainerAccuracyStage, targetSpeedEvasion)` with real modifier values
- Files affected: `app/composables/useCapture.ts`, `app/server/api/capture/attempt.post.ts`
- Skills affected: reviewers should cite this decree when reviewing capture accuracy code; Developer should pass real accuracy/evasion values when integrating with the central accuracy utility
