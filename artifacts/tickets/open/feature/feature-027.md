---
id: feature-027
title: "Migrate edges from string[] to structured objects with metadata"
priority: P2
severity: MEDIUM
status: open
domain: character-lifecycle
source: decree-052
created_by: decree-facilitator
created_at: 2026-03-05
affected_files: []
---

## Summary

Migrate the edge data model from `string[]` to an array of structured objects (`{ name: string, metadata?: Record<string, any> }`), enabling the app to store and query edge-specific metadata like chosen categories, ranks, and specializations.

## Required Implementation

1. Update Prisma schema to support structured edge objects (likely JSON field or related model)
2. Create migration script to convert existing string edges to the new format
3. Update all API endpoints that read/write edges
4. Update edge selection UI to support metadata input where applicable
5. Update character sheet display to show edge metadata

## Notes

- Per decree-052: structured objects preferred over string conventions for multi-field metadata
- This is a different pattern than decree-022's suffix approach for branching classes (suffixes are for simple uniqueness; structured objects for richer metadata)
- Known edges with metadata: Categoric Inclination (category), potentially others — audit PTU edge list
- Backward compatibility: migration must handle existing string data gracefully
