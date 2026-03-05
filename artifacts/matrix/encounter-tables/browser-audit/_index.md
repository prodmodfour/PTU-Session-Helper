---
domain: encounter-tables
type: browser-audit
browser_audited_at: 2026-03-05T21:11:00Z
browser_audited_by: browser-auditor
total_checked: 31
present: 14
absent: 7
error: 5
unreachable: 0
untestable: 9
---

# Browser Audit: encounter-tables

## Summary

Audited all 31 capabilities in the encounter-tables domain across GM, group, and player views. Found **two critical root-cause defects** that cascade into most of the failures:

1. **Missing icon file** (`/icons/phosphor/upload-simple.svg`) -- causes `/gm/encounter-tables` to return HTTP 500
2. **Component name mismatch** (`EncounterTableTableEditor` vs `TableEditor`) -- causes both editor pages (`/gm/habitats/:id` and `/gm/encounter-tables/:id`) to render with empty `<main>` content

These two defects block access to the table editor, which is the core UI for entry management, modification management, generation, and settings. Only the habitats list page (`/gm/habitats`) and its Create Table modal work correctly.

## Classification Summary

| Classification | Count | Percentage |
|---------------|-------|-----------|
| Present | 14 | 45% |
| Absent | 7 | 23% |
| Error | 5 | 16% |
| Unreachable | 0 | 0% |
| Untestable | 9 | 29% |

Note: Absent + Error items overlap significantly. Of the 12 non-present items, 10 are caused by the same 2 root-cause defects.

## Action Items

| # | Severity | Type | Capability IDs | Description | Fix |
|---|----------|------|---------------|-------------|-----|
| 1 | HIGH | Error | C004, C016, C017, C020, C021, C022, C026, C027 | Editor pages render empty -- `EncounterTableTableEditor` component not resolved due to `pathPrefix: false` in nuxt.config.ts | Rename `<EncounterTableTableEditor>` to `<TableEditor>` in `app/pages/gm/habitats/[id].vue` and `app/pages/gm/encounter-tables/[id].vue` |
| 2 | HIGH | Error | C023, C024, C047 | `/gm/encounter-tables` page returns 500 -- missing `/icons/phosphor/upload-simple.svg` | Add the `upload-simple.svg` icon file to `app/public/icons/phosphor/` |
| 3 | MEDIUM | Absent | C011 | Rarity presets (RARITY_WEIGHTS) not accessible -- only surfaced on editor page entry-add modal which is broken | Dependent on fix #1 |
| 4 | MEDIUM | Absent | C047 | Import/Export actions not accessible -- only on `/gm/encounter-tables` page which is broken | Dependent on fix #2 |

### Re-test After Fixes

After fixing action items 1 and 2, the following capabilities should be re-tested:
- C004, C010, C011, C013, C016, C017, C020, C021, C022, C023, C024, C026, C027, C030, C031, C045, C046, C047

## Decree Compliance

### decree-030 (Cap significance presets at x5)
- **Status:** Cannot verify -- GenerateEncounterModal (which shows significance presets) is inaccessible due to editor page error
- **Recommendation:** Re-test after editor page fix

### decree-031 (Replace bogus encounter budget formula)
- **Status:** Cannot verify -- BudgetGuide and BudgetIndicator components are within GenerateEncounterModal, inaccessible
- **Recommendation:** Re-test after editor page fix

### decree-048 (Dark cave blindness penalties)
- **Status:** Not applicable -- this decree affects environment presets, not encounter tables

## View Files

- [GM View](view-gm.md) -- All 31 capabilities checked (14 present, 7 absent, 5 error, 9 untestable)
- [Group View](view-group.md) -- 0 capabilities (domain is GM-only, correct)
- [Player View](view-player.md) -- 0 capabilities (domain is GM-only, correct)
- [Untestable Items](untestable-items.md) -- 9 items (2 purely server-side, 7 blocked by page errors)

## Routes Tested

| Route | Status | Notes |
|-------|--------|-------|
| `/gm/habitats` | Working | List page with table cards, search, sort, create modal |
| `/gm/habitats/:id` | Error | Empty main -- EncounterTableTableEditor not resolved |
| `/gm/encounter-tables` | 500 Error | Missing upload-simple.svg icon |
| `/gm/encounter-tables/:id` | Error | Same EncounterTableTableEditor issue + inherits parent 500 |
| `/group` | N/A | No encounter-table elements (correct) |
| `/player` | N/A | No encounter-table elements (correct) |

## Working Features (Present)

The habitats list page (`/gm/habitats`) correctly displays:
- Table listing with cards showing name, description, level range, density badge, species count
- Pokemon sprite previews (sorted by weight, up to 8 per card)
- Sub-habitat/modification tags on cards
- Search textbox for filtering tables
- Sort combobox (Name, Created, Updated)
- Create Table modal with all fields: name, description, min/max level, population density (4 tiers with descriptions), image URL
- Density tier descriptions correctly note "informational -- does not control spawn count"
