---
decree_id: decree-052
status: active
domain: character-lifecycle
topic: structured-edge-metadata
title: "Store edges as structured objects with type-specific metadata fields"
ruled_at: 2026-03-05T12:05:00Z
supersedes: null
superseded_by: null
source_ticket: decree-need-051
implementation_tickets:
  - feature-027
tags: [character-lifecycle, edges, metadata, data-model, structured-data]
---

# decree-052: Store edges as structured objects with type-specific metadata fields

## The Ambiguity

Edges like Categoric Inclination have metadata (e.g., chosen category: Dark, Fire) that affects game mechanics. Currently edges are stored as plain strings in the database (`string[]`). This means edge-dependent mechanics cannot be automated because the app has no structured way to query edge metadata. Surfaced by character-lifecycle-audit.md (session 121, R066), filed as decree-need-051.

## Options Considered

### Option A: Plain strings only
Keep current behavior. Edges are just string names. GM tracks metadata externally.

**Pros:** Simplest, no migration needed.
**Cons:** Cannot automate edge-dependent mechanics. Metadata is invisible to the app.

### Option B: Structured edge objects
Each edge becomes `{ name, metadata: {...} }` with type-specific fields (e.g., `{ name: "Categoric Inclination", metadata: { category: "Dark" } }`).

**Pros:** Full automation potential. Type-safe metadata. Queryable by the app for mechanical effects.
**Cons:** Requires data model migration from `string[]` to `object[]`. More complex schema.

### Option C: Tag-based (suffix pattern)
Edge string includes parseable tags like `"Categoric Inclination [Dark]"`. Consistent with decree-022's suffix pattern for branching classes.

**Pros:** No schema change needed. Familiar suffix pattern.
**Cons:** Requires string parsing for every metadata access. Fragile. Different metadata shapes per edge type make a single tag pattern awkward.

## Ruling

**The true master decrees: edges shall be stored as structured objects with type-specific metadata fields.**

The edge data model should migrate from `string[]` to an array of objects, where each object has at minimum a `name` field and an optional `metadata` field for type-specific data. This enables the app to query and automate edge-dependent mechanics without fragile string parsing.

Note: This is a different approach than decree-022's suffix pattern for branching classes. Branching classes use suffixes because the specialization is part of the class identity (uniqueness constraint). Edge metadata is richer and more varied, justifying a structured approach.

## Precedent

When game data has associated metadata that affects mechanics, prefer structured objects over string conventions. String suffixes (decree-022) are acceptable for simple single-field specializations where uniqueness is the goal, but structured objects are preferred when metadata is multi-field or type-specific.

## Implementation Impact

- Tickets created: feature-027
- Files affected: Prisma schema (edges field), edge-related API endpoints, character sheet components, edge selection UI
- Skills affected: Developer (schema migration), senior-reviewer (data model review), game-logic-reviewer (edge mechanics validation)
