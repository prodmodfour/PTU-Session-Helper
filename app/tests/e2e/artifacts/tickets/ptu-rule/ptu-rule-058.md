---
ticket_id: ptu-rule-058
priority: P3
status: in-progress
design_spec: designs/design-density-significance-001.md
domain: encounter-tables
matrix_source:
  rule_ids:
    - encounter-tables-R025
    - encounter-tables-R009
  audit_file: matrix/encounter-tables-audit.md
created_at: 2026-02-19
created_by: orchestrator
---

## Summary

Two conceptual mismatches between app and PTU encounter system: (1) VTT terrain/fog systems are generic tactical tools, not PTU-specific environmental modifier implementations. (2) Density multiplier scales spawn count, but PTU density affects encounter significance/XP reward, not spawn count.

## Expected Behavior (PTU Rules)

Density affects the significance and XP value of encounters. Environmental modifiers affect terrain and encounter difficulty per habitat.

## Actual Behavior

Density is used as a spawn count multiplier. Environmental effects are generic VTT features unconnected to PTU habitat rules.

## Fix Log

### P0 (Density Separation) -- 2026-02-20

Density tier is now a descriptive label only. Spawn count is an explicit parameter in the generation flow. `DENSITY_RANGES` replaced with `DENSITY_SUGGESTIONS` (informational hints). `calculateSpawnCount` removed. `densityMultiplier` removed from TypeScript interface and UI (DB column preserved for backward compat). All unit tests updated and passing (65 tests across 2 files).

**Commits:** `a5434db`, `c2d3b4d`, `1343265`, `c44853f`, `04c4a72`, `dd41e1d`, `e98b8e9`, `68be10d`
