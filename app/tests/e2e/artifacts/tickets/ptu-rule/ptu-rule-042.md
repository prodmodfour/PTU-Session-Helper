---
ticket_id: ptu-rule-042
priority: P2
status: open
domain: character-lifecycle
matrix_source:
  rule_ids:
    - character-lifecycle-R013
    - character-lifecycle-R014
    - character-lifecycle-R015
    - character-lifecycle-R016
    - character-lifecycle-R017
    - character-lifecycle-R018
    - character-lifecycle-R020
  audit_file: matrix/character-lifecycle-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Seven derived trainer stats are not computed from skill ranks: Power (Athletics+Combat), High Jump (Acrobatics), Long Jump (Acrobatics), Overland Speed (Athletics+Acrobatics), Swimming Speed (depends on Overland), Throwing Range (Athletics), Weight Class (weight in lbs). These are stored as static values or not tracked at all.

## Expected Behavior (PTU Rules)

- Power = 1 + Athletics + Combat ranks
- High Jump = Acrobatics rank
- Long Jump = Acrobatics rank
- Overland = 3 + Athletics + Acrobatics (varies by formula)
- Swimming = Overland / 2
- Throwing Range = 4 + Athletics rank
- Weight Class = derived from weight in pounds via threshold table

## Actual Behavior

These values are either hardcoded, manually entered, or absent. Changing skill ranks does not update movement speeds or capabilities.
