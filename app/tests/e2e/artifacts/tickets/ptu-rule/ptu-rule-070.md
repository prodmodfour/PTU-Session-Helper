---
ticket_id: ptu-rule-070
priority: P2
status: open
domain: combat
source: rules-review-070
created_at: 2026-02-20
created_by: orchestrator
severity: MEDIUM
affected_files:
  - app/utils/moveFrequency.ts
---

## Summary

Scene x2/x3 moves missing implicit EOT restriction, and Daily x2/x3 moves missing per-scene cap.

## PTU Rule Reference

PTU 1.05 p.337: "Moves that can be used multiple times a Scene can still only be used Every Other Turn within a Scene and not on consecutive turns."
PTU 1.05 p.337: "Moves that can be used multiple times Daily can still only be used once a Scene and not multiple times within the same Scene."

## Issues

1. Scene x2/x3 moves can be used on consecutive turns (e.g., round 1 and round 2). Should enforce EOT between uses.
2. Daily x2/x3 moves can be used multiple times in the same scene. Should cap at 1 use per scene.

## Fix

1. Apply `lastTurnUsed` validation to scene-frequency moves with limit > 1
2. Add `usedThisScene >= 1` check for daily-frequency moves with limit > 1

Note: Scene x1 and Daily x1 are already implicitly correct (capped at 1 use total).
