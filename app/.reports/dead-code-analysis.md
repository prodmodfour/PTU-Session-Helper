# Dead Code Analysis Report

**Generated:** 2026-02-01
**Tools Used:** knip, depcheck, ts-prune
**Status:** COMPLETED

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Unused Dependencies | 0 | N/A (false positives) |
| Unused Dev Dependencies | 0 | N/A (false positives) |
| Unused Type Exports | 6 | **REMOVED** |
| Unused Function Exports | 0 | N/A (false positives) |
| Standalone Scripts | 3 | KEPT (utility scripts) |

### Removed Dead Code

| Type | File | Lines Removed |
|------|------|---------------|
| `SkillName` | types/index.ts | 6 lines |
| `CombatStats` | types/index.ts | 4 lines |
| `TrainerClass` | types/index.ts | 5 lines |
| `AppState` | types/index.ts | 14 lines |
| `WildEncounterOptions` | types/index.ts | 8 lines |
| `WildEncounterResult` | types/index.ts | 6 lines |

**Total Lines Removed:** ~43 lines

---

## 1. Unused Dependencies

### CAUTION - Review Before Removing

| Package | Notes |
|---------|-------|
| `@pinia/nuxt` | Flagged by depcheck but **likely a false positive** - Nuxt uses this via module system |

**Recommendation:** Do NOT remove `@pinia/nuxt` - it's used by Nuxt's module system for Pinia integration.

---

## 2. Unused Dev Dependencies

### SAFE - Can Be Removed

| Package | Line | Reason |
|---------|------|--------|
| `@nuxt/devtools` | package.json:32 | Dev tooling, may be loaded by Nuxt config |
| `@nuxt/test-utils` | package.json:33 | Test utilities - verify not used in test setup |
| `sass` | package.json:40 | SCSS compilation - check if .scss files exist |

**Note:** These may be used indirectly by Nuxt's build system or test configuration. Verify before removing.

---

## 3. Unused Type Exports

### CAUTION - From types/index.ts

These types are defined but never imported elsewhere:

| Type | Line | Severity |
|------|------|----------|
| `SkillName` | 42 | SAFE - Unused |
| `CombatStats` | 75 | SAFE - Unused |
| `TrainerClass` | 184 | SAFE - Unused |
| `AppState` | 400 | SAFE - Unused |
| `ApiResponse` | 418 | CAUTION - Used in composables (false positive) |
| `WebSocketEvent` | 425 | CAUTION - Used in ws.ts (false positive) |
| `EncounterSnapshot` | 459 | CAUTION - Used in useEncounterHistory (false positive) |
| `SpeciesData` | 470 | DANGER - Used in components (false positive) |
| `TemplateCombatant` | 583 | CAUTION - Re-exported, may be used |
| `EncounterTemplate` | 593 | CAUTION - Re-exported, may be used |
| `WildEncounterOptions` | 634 | SAFE - Unused |
| `GeneratedPokemon` | 643 | CAUTION - Used in API (false positive) |
| `WildEncounterResult` | 652 | SAFE - Unused |

### SAFE - From types/spatial.ts (False Positives)

All types in `types/spatial.ts` are **actively used** across the codebase (20 files reference them).

### CAUTION - From stores

| Type | File | Notes |
|------|------|-------|
| `FogState` | stores/fogOfWar.ts:4 | Internal interface |
| `FogOfWarState` | stores/fogOfWar.ts:6 | Internal interface |
| `TerrainState` | stores/terrain.ts:4 | Internal interface |

---

## 4. Unused Function Exports

### SAFE - From utils/restHealing.ts

| Export | Line | Notes |
|--------|------|-------|
| `PERSISTENT_STATUS_CONDITIONS` | 13 | Constant, only defined here |
| `getRestHealingInfo` | 149 | Only used in the same file's composable |

**Note:** `getRestHealingInfo` IS used in `composables/useRestHealing.ts` which imports from the same `utils/restHealing.ts` file - this is a false positive.

---

## 5. Standalone Script Files (NOT DEAD CODE)

These are utility scripts meant to be run manually, not imported:

| File | Purpose |
|------|---------|
| `prisma/seed-encounter-tables.ts` | Seeds encounter tables data |
| `prisma/seed-hassan-chompy.ts` | Seeds character: Hassan + Chompy |
| `prisma/seed-ilaria-iris.ts` | Seeds character: Ilaria + Iris |
| `scripts/import-characters.ts` | CSV character importer |

**Recommendation:** Keep these - they're standalone utilities run via `tsx`.

---

## 6. Knip False Positives (DO NOT REMOVE)

Knip flagged these as unused, but they ARE used via Nuxt's auto-import system:

### Composables (auto-imported by Nuxt)
- `composables/useCapture.ts`
- `composables/useCombat.ts`
- `composables/useEncounterHistory.ts`
- `composables/useFogPersistence.ts`
- `composables/usePokemonSprite.ts`
- `composables/useRestHealing.ts`
- `composables/useTerrainPersistence.ts`
- `composables/useWebSocket.ts`

### Stores (auto-imported by Nuxt)
- `stores/groupView.ts`
- `stores/measurement.ts`
- `stores/selection.ts`

### Vue Components (auto-imported by Nuxt)
All Vue components in `components/` directory are auto-imported.

### SCSS Files (processed by Nuxt/Sass)
- `assets/scss/_variables.scss`
- `assets/scss/main.scss`

---

## Recommended Safe Deletions

### Types to Remove from types/index.ts

```typescript
// Line 42 - SkillName (unused)
// Line 75 - CombatStats (unused)
// Line 184 - TrainerClass (unused)
// Line 400 - AppState (unused)
// Line 634 - WildEncounterOptions (unused)
// Line 652 - WildEncounterResult (unused)
```

### Procedure

1. Run tests before changes: `npm test -- --run`
2. Remove unused types one at a time
3. Run tests after each removal
4. If tests fail, rollback that change

---

## Final Recommendations

### DO NOT REMOVE
- Any dependency from `package.json` without further investigation
- Any composable, store, or component (Nuxt auto-imports)
- Standalone script files (they're utilities)
- SCSS files (processed by build system)

### COMPLETED

All safe dead code has been removed. The following types were deleted from `types/index.ts`:
- `SkillName` (line 42-46)
- `CombatStats` (line 75-78)
- `TrainerClass` (line 184-188)
- `AppState` (line 400-415)
- `WildEncounterOptions` (line 634-640)
- `WildEncounterResult` (line 652-657)

### Verification

- **Build:** PASSED
- **Unit Tests:** 446 passed (1 pre-existing failure unrelated to changes)
- **Risk level:** LOW
- **Lines removed:** ~43 lines of unused type definitions
