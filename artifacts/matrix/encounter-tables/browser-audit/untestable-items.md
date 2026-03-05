---
domain: encounter-tables
type: browser-audit-untestable
total_untestable: 9
browser_audited_at: 2026-03-05T21:11:00Z
browser_audited_by: browser-auditor
---

# Browser Audit: encounter-tables -- Untestable Items

Items classified as Untestable because they are server-side only (no UI terminus) or because their UI terminus is blocked by a page-level error that prevents reaching the element.

## Purely Server-Side (No UI Terminus)

### encounter-tables-C032: generateEncounterPokemon Service
- **Type:** service-function
- **Location:** `app/server/services/encounter-generation.service.ts`
- **Reason:** Pure server-side function called by the generate API endpoint. No direct UI element -- its output is consumed by the GenerateEncounterModal, but the function itself has no browser-testable surface.

### encounter-tables-C033: PoolEntry Type
- **Type:** service-function (type definition)
- **Location:** `app/server/services/encounter-generation.service.ts`
- **Reason:** Internal TypeScript type used by the generation service. Type definitions have no runtime UI representation.

## UI Terminus Blocked by Page Error

The following capabilities have UI elements that would surface them, but those elements are on the editor pages (`/gm/habitats/:id`, `/gm/encounter-tables/:id`) which fail to render due to the `EncounterTableTableEditor` component resolution error.

### encounter-tables-C010: GeneratedPokemon Type
- **Type:** constant (type definition)
- **Location:** `app/types/habitat.ts`
- **UI Terminus:** GenerateEncounterModal displays generated Pokemon using this type
- **Blocked by:** Editor page error (EncounterTableTableEditor not resolved)

### encounter-tables-C013: MAX_SPAWN_COUNT Constant
- **Type:** constant
- **Location:** `app/types/habitat.ts`
- **UI Terminus:** GenerateEncounterModal spawn count input enforces max=20
- **Blocked by:** Editor page error (EncounterTableTableEditor not resolved)

### encounter-tables-C030: Add Entry to Modification API
- **Type:** api-endpoint
- **Location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/index.post.ts`
- **UI Terminus:** ModificationCard "add change" modal (part of TableEditor)
- **Blocked by:** Editor page error

### encounter-tables-C031: Delete Entry from Modification API
- **Type:** api-endpoint
- **Location:** `app/server/api/encounter-tables/[id]/modifications/[modId]/entries/[entryId].delete.ts`
- **UI Terminus:** ModificationCard entry remove button (part of TableEditor)
- **Blocked by:** Editor page error

### encounter-tables-C045: addModificationEntry / removeModificationEntry Actions
- **Type:** store-action
- **Location:** `app/stores/encounterTables.ts`
- **UI Terminus:** ModificationCard add/remove controls (part of TableEditor)
- **Blocked by:** Editor page error

### encounter-tables-C046: generateFromTable Action
- **Type:** store-action
- **Location:** `app/stores/encounterTables.ts`
- **UI Terminus:** GenerateEncounterModal generate button
- **Blocked by:** Editor page error

## Notes

If the `EncounterTableTableEditor` component resolution error is fixed, many of these "blocked" items would become testable. Specifically, C010, C013, C030, C031, C045, and C046 would need re-testing after the fix. The editor page contains the TableEditor component which hosts EntryRow, ModificationCard, and is the gateway to the GenerateEncounterModal.
