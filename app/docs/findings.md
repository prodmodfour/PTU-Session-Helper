# Implementation Findings

## Architecture Decisions

### Encounter Tables (Habitats)
- **Decision**: Use separate tables for EncounterTable, TableModification, and entries
- **Rationale**: Allows flexible modification stacking and reuse
- **Pattern**: Parent table + modifications = resolved encounter pool

### Table Modifications (Sub-habitats)
- **Design**: Modifications can add, remove, or override parent entries
- **Implementation**: `remove: boolean` flag on ModificationEntry
- **Usage**: "Forest at Night" modification removes diurnal Pokemon, adds nocturnal ones

### Resolved Entry Algorithm
```
1. Start with all parent table entries
2. For each modification entry:
   - If remove=true: delete from pool
   - If remove=false: add/override weight
3. Return final pool for weighted random selection
```

---

## Technical Findings

### Prisma Schema
- TableModification uses `parentTableId` (not `tableId`)
- Cascade delete configured for all child relations
- EncounterTableEntry has unique constraint on (tableId, speciesId)

### API Response Format
All endpoints follow pattern:
```typescript
{ success: true, data: <parsed_object> }
{ success: false, error: <message> }  // on error
```

### TypeScript Quirks
- Nuxt $fetch has typing issues with `method: 'PUT'`
- Workaround: Use `as any` cast or ignore (runtime works correctly)
- Pre-existing in encounter.ts lines 378, 402

### Test Fixtures
- Combatant.entity contains full Pokemon/HumanCharacter data
- Must match full interface including nested objects
- TrainerClass requires { name, skills, features } structure

---

## E2E Testing Strategy

### Playwright Configuration
- Test port: 3001 (configurable via TEST_PORT)
- Base URL: http://localhost:3001
- Screenshots on failure
- Trace on first retry

### Existing E2E Tests
- `home.spec.ts` - Home page navigation
- `gm-view.spec.ts` - GM encounter management
- `group-view.spec.ts` - Player group view

### New E2E Tests Needed
Each phase includes specific E2E test file:
- Phase 2: `habitats.spec.ts`
- Phase 3: `encounter-generation.spec.ts`
- Phase 4: `vtt-grid.spec.ts`
- Phase 5: `vtt-advanced.spec.ts`
- Phase 6: `encounter-library.spec.ts`
- Phase 7: `damage-modes.spec.ts`
- Phase 8: `integration.spec.ts`

### Puppeteer MCP for Development Testing
Use MCP tools for interactive testing:
```
1. mcp__puppeteer__puppeteer_navigate - Go to page
2. mcp__puppeteer__puppeteer_click - Click elements
3. mcp__puppeteer__puppeteer_fill - Fill inputs
4. mcp__puppeteer__puppeteer_screenshot - Capture state
```

---

## Performance Considerations

### Large Encounter Tables
- Pagination not implemented yet
- Consider lazy loading for tables with 100+ entries
- Index on speciesName for modification entries

### Grid Rendering (Phase 4)
- Use HTML5 Canvas for performance
- Debounce pan/zoom events
- Virtualize token rendering for 50+ tokens

---

## Known Issues

1. **$fetch typing**: Pre-existing TypeScript error with PUT method
   - Status: Won't fix (runtime works)
   - Location: stores/encounter.ts:378, 402

2. **Test timeouts**: Some E2E tests timeout on slow machines
   - Mitigation: Increased timeout to 60s in playwright.config.ts

---

## Dependencies

### Required for Implementation
- Prisma (database ORM) ✅
- Pinia (state management) ✅
- Vue 3 + Nuxt 3 ✅
- Playwright (E2E testing) ✅
- WebSocket (real-time sync) ✅

### Optional Enhancements
- Canvas API for VTT grid
- Web Workers for heavy calculations
- Service Worker for offline support
