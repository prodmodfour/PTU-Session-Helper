---
id: feature-022
title: Pokemon Loyalty System
priority: P2
severity: MEDIUM
status: open
domain: pokemon-lifecycle
source: matrix-gap (GAP-PLC-3)
matrix_source: pokemon-lifecycle R048, R049, R050
created_by: master-planner
created_at: 2026-02-28
---

# feature-022: Pokemon Loyalty System

## Summary

No loyalty tracking exists. PTU loyalty is a 7-rank system (0-6) that affects command checks, disobedience, and evolution for some species. 3 matrix rules classified as Missing.

## Gap Analysis

| Rule | Title | Status |
|------|-------|--------|
| R048 | Loyalty System — Ranks | Missing — no loyalty field on Pokemon model |
| R049 | Loyalty — Command Checks | Missing — no DC enforcement based on loyalty rank |
| R050 | Loyalty — Starting Values | Missing — no loyalty assigned at capture or creation |

## PTU Rules

- Chapter 10: Pokemon Loyalty
- 7 ranks (0 = hostile, 3 = neutral, 6 = devoted)
- Captured wild Pokemon start at rank 2
- Traded Pokemon start at rank 1
- Bred Pokemon start at rank 4
- Low loyalty requires Command checks (Charm/Intimidate vs DC)
- Some evolutions require minimum loyalty

## Implementation Scope

PARTIAL-scope — can be implemented as a simple integer field with minimal UI. Design spec optional.

## Affected Areas

- `app/prisma/schema.prisma` — Pokemon: loyalty field
- `app/server/services/pokemon-generator.service.ts` — set starting loyalty
- `app/components/pokemon/` — loyalty display
